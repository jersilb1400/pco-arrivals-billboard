using System;
using System.Collections.Generic;
using com.gracefellowship.Arrivals.Services.Dto;

namespace com.gracefellowship.Arrivals.Services
{
    /// <summary>
    /// Read side: queries live Rock Check-in data (Attendance, AttendanceCode,
    /// AttendanceOccurrence, Device, Group, GroupType) via EF/RockContext.
    ///
    /// This is the ONLY place that touches Rock's check-in entities directly.
    /// Everything else (blocks, polling endpoint, future SignalR topic) goes through
    /// this interface so the data-access pattern stays consistent and swappable
    /// (.context/LESSONS.md L9).
    ///
    /// Data-model facts baked in here (.context/LESSONS.md L2/L3/L5):
    ///   - GroupId/LocationId/ScheduleId live on AttendanceOccurrence, not Attendance.
    ///     Always navigate via a.Occurrence.*.
    ///   - "Still checked in" = DidAttend == true &amp;&amp; EndDateTime == null.
    ///   - One AttendanceCode covers all siblings in a family's check-in session.
    /// </summary>
    public interface IRockCheckInQueryService
    {
        /// <summary>
        /// Lists check-in areas (GroupTypes that take attendance) for the admin dropdown.
        /// Typically filtered to active GroupTypes where TakesAttendance is true.
        /// </summary>
        List<GroupTypeOption> GetCheckInGroupTypes();

        /// <summary>
        /// THE PICKUP LOOKUP. Given a security code and date, returns the active
        /// (DidAttend &amp;&amp; EndDateTime == null) attendance records whose
        /// AttendanceCode.Code matches (uppercase). One code may return multiple
        /// children (siblings — L5). Eager-loads Occurrence.Group/Location, Person,
        /// and Device so the result is display-ready.
        /// </summary>
        /// <param name="securityCode">The code typed at the kiosk (uppercased internally).</param>
        /// <param name="occurrenceDate">The session date (codes recycle daily — always pair with date).</param>
        List<CheckInChildDto> FindActiveBySecurityCode( string securityCode, DateTime occurrenceDate );

        /// <summary>
        /// All children currently checked in for a check-in area + date (for the
        /// LocationStatus overview). Filters: RootGroupTypeId match, OccurrenceDate
        /// match, DidAttend, EndDateTime == null.
        /// </summary>
        List<CheckInChildDto> GetActiveAttendancesForGroupType( int rootGroupTypeId, DateTime occurrenceDate );

        /// <summary>
        /// Batch re-check: given attendance ids currently in the queue, returns the
        /// subset that are STILL checked in (EndDateTime == null). The complement
        /// (those that now have EndDateTime set) should be removed from the queue.
        /// Drives the auto-remove-on-checkout behavior.
        /// </summary>
        List<int> GetStillCheckedInAttendanceIds( IList<int> attendanceIds );
    }

    /// <summary>A check-in area option for the admin dropdown.</summary>
    [Serializable]
    public class GroupTypeOption
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }
}
