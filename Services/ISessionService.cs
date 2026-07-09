using System;
using com.gracefellowship.Arrivals.Services.Dto;

namespace com.gracefellowship.Arrivals.Services
{
    /// <summary>
    /// Manages the "active billboard" session: which check-in area (GroupType) + date
    /// the kiosk, billboard, and location-status screens are all sharing right now.
    /// Persisted to the _Session table (NOT in-process RAM) so it survives app-pool
    /// recycles (.context/DECISIONS.md D5). At most one session is active at a time.
    /// </summary>
    public interface ISessionService
    {
        /// <summary>
        /// Returns the currently-active session, or null if none is active. This is
        /// what every screen polls to know "what's on."
        /// </summary>
        SessionDto GetActiveSession();

        /// <summary>
        /// Launches a new active session for the given GroupType + date, started by the
        /// given person alias. Deactivates any prior active session and clears its
        /// notifications (cascades via the FK on the Notification table). Returns the
        /// new session.
        /// </summary>
        SessionDto StartSession( int groupTypeId, string groupTypeName, DateTime occurrenceDate, int? startedByPersonAliasId );

        /// <summary>
        /// Ends the active session (sets IsActive = 0). Notifications are cleared by
        /// the queue service or the CASCADE on the next session start.
        /// </summary>
        void EndSession();

        /// <summary>True if a session is currently active.</summary>
        bool HasActiveSession();
    }
}
