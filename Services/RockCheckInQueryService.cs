using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using com.gracefellowship.Arrivals.Services.Dto;
using Rock.Data;
using Rock.Model;

// Note: System.Data.Entity is imported for the .Include(lambda) eager-load extension,
// which is compile-time-checked (unlike the string includes overload that silently no-ops
// on a typo). GLM-5.2 advisor flagged this as the safer pattern.

namespace com.gracefellowship.Arrivals.Services
{
    /// <summary>
    /// EF/RockContext implementation of <see cref="IRockCheckInQueryService"/>. This is the
    /// ONLY class that directly reads Rock's check-in entities (Attendance, AttendanceCode,
    /// AttendanceOccurrence, Device, Group, GroupType). Everything else goes through the
    /// interface (.context/LESSONS.md L9).
    ///
    /// DATA-MODEL NOTES (source-verified from SparkDevNetwork/Rock, .context/LESSONS.md):
    ///   L2 — GroupId/LocationId/ScheduleId live on AttendanceOccurrence, NOT on Attendance.
    ///        Attendance holds only OccurrenceId. Always navigate via a.Occurrence.* and
    ///        eager-load with .Queryable("Occurrence.Group,Occurrence.Location,...").
    ///   L3 — "Still checked in" = a.DidAttend == true &amp;&amp; a.EndDateTime == null.
    ///        EndDateTime is set on checkout; DidAttend is unchanged by checkout.
    ///   L5 — One AttendanceCode covers ALL siblings in a family's check-in session, so
    ///        a security-code lookup legitimately returns multiple children.
    /// </summary>
    public class RockCheckInQueryService : IRockCheckInQueryService
    {
        // ─── GroupType dropdown ─────────────────────────────────────────────

        /// <summary>
        /// Lists active GroupTypes that take attendance (the check-in areas). These populate
        /// the admin's "select check-in area" dropdown. We include any GroupType flagged to
        /// take attendance; the admin picks the one that represents their children's check-in.
        /// </summary>
        public List<GroupTypeOption> GetCheckInGroupTypes()
        {
            using ( var rockContext = new RockContext() )
            {
                return new GroupTypeService( rockContext )
                    .Queryable().AsNoTracking()
                    .Where( gt => gt.IsActive == true && gt.TakesAttendance == true )
                    .OrderBy( gt => gt.Name )
                    .Select( gt => new GroupTypeOption { Id = gt.Id, Name = gt.Name } )
                    .ToList();
            }
        }

        // ─── THE PICKUP LOOKUP ──────────────────────────────────────────────

        /// <summary>
        /// Given a security code + date, returns the active attendance records whose code matches.
        /// This is the heart of the kiosk: a volunteer types the parent's code, we find the kids.
        ///
        /// Query shape (see L2/L3/L5):
        ///   AttendanceCode.Code == code.ToUpper()           (codes are uppercase)
        ///   AND Occurrence.OccurrenceDate == date           (codes recycle daily)
        ///   AND DidAttend == true                           (they came)
        ///   AND EndDateTime == null                         (not yet checked out — L3)
        /// Eager-loads Occurrence.Group/Location, AttendanceCode, PersonAlias.Person, Device.
        /// </summary>
        public List<CheckInChildDto> FindActiveBySecurityCode( string securityCode, DateTime occurrenceDate )
        {
            if ( string.IsNullOrWhiteSpace( securityCode ) )
            {
                return new List<CheckInChildDto>();
            }

            // Codes are stored uppercase (the code-generation pool has no lowercase).
            var code = securityCode.Trim().ToUpper();
            var date = occurrenceDate.Date;

            using ( var rockContext = new RockContext() )
            {
                var attendanceService = new AttendanceService( rockContext );

                // Eager-load the navigation paths we read below via compile-time-checked
                // lambda Includes (safer than the string-overload, which silently no-ops
                // on a navigation-name typo — GLM-5.2 advice). PersonAlias/Person guarded
                // in the Where so the mapper never NREs on a soft-deleted person.
                var matches = attendanceService
                    .Queryable()
                    .Include( a => a.AttendanceCode )
                    .Include( a => a.Occurrence.Group )
                    .Include( a => a.Occurrence.Location )
                    .Include( a => a.PersonAlias.Person )
                    .Include( a => a.Device )
                    .AsNoTracking()
                    .Where( a => a.AttendanceCode.Code == code )
                    .Where( a => a.Occurrence.OccurrenceDate == date )
                    .Where( a => a.DidAttend == true )
                    .Where( a => a.EndDateTime == null )
                    .Where( a => a.PersonAlias != null && a.PersonAlias.Person != null )
                    .OrderByDescending( a => a.StartDateTime )
                    .ToList();

                return matches.Select( MapToCheckInChild ).ToList();
            }
        }

        // ─── Location Status (all kids in for an area) ─────────────────────

        /// <summary>
        /// All children currently checked in for a check-in area + date. Filters by
        /// Occurrence.RootGroupTypeId (the check-in configuration GroupType — see L2) and the
        /// same DidAttend/EndDateTime predicates. Used by the LocationStatus block.
        /// </summary>
        public List<CheckInChildDto> GetActiveAttendancesForGroupType( int rootGroupTypeId, DateTime occurrenceDate )
        {
            var date = occurrenceDate.Date;

            using ( var rockContext = new RockContext() )
            {
                var attendanceService = new AttendanceService( rockContext );

                var active = attendanceService
                    .Queryable()
                    .Include( a => a.AttendanceCode )
                    .Include( a => a.Occurrence.Group )
                    .Include( a => a.Occurrence.Location )
                    .Include( a => a.PersonAlias.Person )
                    .Include( a => a.Device )
                    .AsNoTracking()
                    .Where( a => a.Occurrence.RootGroupTypeId == rootGroupTypeId )
                    .Where( a => a.Occurrence.OccurrenceDate == date )
                    .Where( a => a.DidAttend == true )
                    .Where( a => a.EndDateTime == null )
                    .Where( a => a.PersonAlias != null && a.PersonAlias.Person != null )
                    .OrderByDescending( a => a.StartDateTime )
                    .ToList();

                return active.Select( MapToCheckInChild ).ToList();
            }
        }

        // ─── Checkout re-check ─────────────────────────────────────────────

        /// <summary>
        /// Given a set of attendance ids currently in the queue, returns the subset that are
        /// STILL checked in (EndDateTime == null). The complement should be removed from the
        /// queue — that's the auto-remove-on-checkout behavior. Batched in a single query.
        /// </summary>
        public List<int> GetStillCheckedInAttendanceIds( IList<int> attendanceIds )
        {
            if ( attendanceIds == null || attendanceIds.Count == 0 )
            {
                return new List<int>();
            }

            // SQL Server has a ~2100-parameter limit; a Contains with >~1000 ids can blow
            // that up. In practice the pickup queue is tiny (tens of kids), but guard
            // defensively so a runaway queue can't crash the poll. If this ever fires,
            // something upstream is wrong (the queue should never have thousands of kids).
            if ( attendanceIds.Count > 1000 )
            {
                attendanceIds = attendanceIds.Take( 1000 ).ToList();
            }

            using ( var rockContext = new RockContext() )
            {
                var attendanceService = new AttendanceService( rockContext );

                return attendanceService
                    .Queryable().AsNoTracking()
                    .Where( a => attendanceIds.Contains( a.Id ) )
                    .Where( a => a.EndDateTime == null )
                    .Select( a => a.Id )
                    .ToList();
            }
        }

        // ─── Mapping helper ────────────────────────────────────────────────

        /// <summary>
        /// Maps a Rock Attendance entity to the lightweight CheckInChildDto. Null-safe on
        /// every navigation — a check-in may legitimately lack a Location, Group, or Device
        /// (e.g. if check-in config didn't set one). Person name is built from first+last.
        /// </summary>
        private static CheckInChildDto MapToCheckInChild( Attendance a )
        {
            var person = a.PersonAlias?.Person;
            var occurrence = a.Occurrence;
            var location = occurrence?.Location;
            var group = occurrence?.Group;
            var device = a.Device;

            return new CheckInChildDto
            {
                AttendanceId = a.Id,
                PersonId = person?.Id,
                ChildName = BuildChildName( person ),
                SecurityCode = a.AttendanceCode?.Code,
                LocationId = location?.Id,
                LocationName = location?.Name,
                GroupId = group?.Id,
                DeviceId = device?.Id,
                StationName = device?.Name,
                CheckInTime = a.StartDateTime
            };
        }

        /// <summary>
        /// Builds a display name. Falls back gracefully if the person record is missing
        /// fields. (Phase 4 may refine to "First L." for child privacy on the public billboard.)
        /// </summary>
        private static string BuildChildName( Person person )
        {
            if ( person == null )
            {
                return "Unknown";
            }

            var first = person.NickName ?? person.FirstName;
            var last = person.LastName;

            if ( !string.IsNullOrWhiteSpace( first ) && !string.IsNullOrWhiteSpace( last ) )
            {
                return $"{first} {last}";
            }
            if ( !string.IsNullOrWhiteSpace( first ) )
            {
                return first;
            }
            if ( !string.IsNullOrWhiteSpace( last ) )
            {
                return last;
            }
            return "Unknown";
        }
    }
}
