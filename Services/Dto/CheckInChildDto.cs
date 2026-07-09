using System;
using System.Collections.Generic;

namespace com.gracefellowship.Arrivals.Services.Dto
{
    /// <summary>
    /// A child matched by a security-code lookup at the kiosk, before being added to the
    /// pickup queue. This is the return shape of IRockCheckInQueryService.FindActiveBySecurityCode.
    /// Carries everything needed to (a) display a confirmation to the volunteer at the kiosk and
    /// (b) populate a PickupNotificationDto / notification row.
    /// </summary>
    [Serializable]
    public class CheckInChildDto
    {
        /// <summary>The Rock Attendance id (used to detect checkout later).</summary>
        public int AttendanceId { get; set; }

        /// <summary>The person's id (for potential future photo/display features).</summary>
        public int? PersonId { get; set; }

        /// <summary>Child's full name.</summary>
        public string ChildName { get; set; }

        /// <summary>The security code on their family's check-in tag.</summary>
        public string SecurityCode { get; set; }

        /// <summary>Room/location id.</summary>
        public int? LocationId { get; set; }

        /// <summary>Room/location display name.</summary>
        public string LocationName { get; set; }

        /// <summary>Group (classroom/roster) id.</summary>
        public int? GroupId { get; set; }

        /// <summary>The kiosk/station (Rock Device) that performed the check-in.</summary>
        public int? DeviceId { get; set; }

        /// <summary>Kiosk/station display name.</summary>
        public string StationName { get; set; }

        /// <summary>When they checked in.</summary>
        public DateTime? CheckInTime { get; set; }
    }

    /// <summary>
    /// Result of a security-code lookup: the matched children (may be siblings — one code
    /// covers the family, .context/LESSONS.md L5) plus a message describing the outcome
    /// for the volunteer.
    /// </summary>
    [Serializable]
    public class SecurityCodeLookupResult
    {
        /// <summary>True if at least one active (not-yet-checked-out) child matched.</summary>
        public bool Success { get; set; }

        /// <summary>The matched children (may be multiple — siblings on the same code).</summary>
        public List<CheckInChildDto> Children { get; set; } = new List<CheckInChildDto>();

        /// <summary>Human-readable result for the volunteer (e.g. "Added: Emma — Room 4").</summary>
        public string Message { get; set; }
    }
}
