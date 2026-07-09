using System;

namespace com.gracefellowship.Arrivals.Services.Dto
{
    /// <summary>
    /// Lightweight, serializable shape for one child awaiting pickup, sent to the
    /// billboard over the polling endpoint. Deliberately minimal: only what the
    /// display needs, nothing more (keeps the 10-second poll payload small —
    /// .context/LESSONS.md L8).
    /// </summary>
    [Serializable]
    public class PickupNotificationDto
    {
        /// <summary>Plugin notification row id (stable identity for diffing on the client).</summary>
        public int Id { get; set; }

        /// <summary>The Rock Attendance row this refers to (used for checkout re-check).</summary>
        public int AttendanceId { get; set; }

        /// <summary>The parent's security/pickup code (uppercase, as Rock stores it).</summary>
        public string SecurityCode { get; set; }

        /// <summary>Child's display name (first [+ last initial] — see name formatting in Phase 4).</summary>
        public string ChildName { get; set; }

        /// <summary>Room/location display name.</summary>
        public string LocationName { get; set; }

        /// <summary>Location id (for card border color lookup).</summary>
        public int? LocationId { get; set; }

        /// <summary>Check-in station display name (the kiosk that checked them in).</summary>
        public string StationName { get; set; }

        /// <summary>Device id for that station (for badge color/icon lookup).</summary>
        public int? DeviceId { get; set; }

        /// <summary>When the volunteer added them to the queue (billboard display + chime trigger).</summary>
        public DateTime? NotifiedAt { get; set; }

        /// <summary>When they originally checked in at the kiosk (display "checked in at").</summary>
        public DateTime? CheckInTime { get; set; }
    }
}
