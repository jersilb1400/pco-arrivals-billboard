using System;

namespace com.gracefellowship.Arrivals.Services.Dto
{
    /// <summary>
    /// Lightweight, serializable shape for the "active billboard" — the admin-launched
    /// session that the kiosk, billboard, and location-status screens all share.
    /// Returned by the polling endpoint so every screen knows which GroupType + date is live.
    /// </summary>
    [Serializable]
    public class SessionDto
    {
        /// <summary>Plugin session row id.</summary>
        public int Id { get; set; }

        /// <summary>The check-in area (Rock GroupType) this session covers.</summary>
        public int GroupTypeId { get; set; }

        /// <summary>Display name of that GroupType (e.g. "Weekend Kids").</summary>
        public string GroupTypeName { get; set; }

        /// <summary>The date the session applies to (date only; codes recycle daily).</summary>
        public DateTime OccurrenceDate { get; set; }

        /// <summary>Who started the session (display "Created by ... on ...").</summary>
        public string StartedByName { get; set; }

        /// <summary>When the session was started.</summary>
        public DateTime? StartedDateTime { get; set; }

        /// <summary>True if there's an active session (false/null = nothing launched yet).</summary>
        public bool IsActive { get; set; }
    }
}
