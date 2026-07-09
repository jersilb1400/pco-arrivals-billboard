using System;
using System.Collections.Generic;
using com.gracefellowship.Arrivals.Services.Dto;

namespace com.gracefellowship.Arrivals.Services
{
    /// <summary>
    /// Manages the pickup-notification queue: the list of children currently awaiting
    /// pickup, shown on the billboard. This is the service the billboard polls and the
    /// kiosk writes to. Persisted to the _Notification table.
    ///
    /// IMPORTANT (.context/LESSONS.md L9): the WebForms Billboard block, the polling
    /// [BlockAction] endpoint, and a FUTURE SignalR RealTimeTopic must ALL consume
    /// this same interface — that's what makes the polling→SignalR transition a small
    /// change instead of a rewrite.
    /// </summary>
    public interface IPickupQueueService
    {
        /// <summary>
        /// Returns the active pickup notifications for a session, as lightweight DTOs
        /// ready for the polling endpoint (minimal payload — L8).
        /// </summary>
        List<PickupNotificationDto> GetActiveNotifications( int sessionId );

        /// <summary>
        /// Adds a child to the pickup queue (called by the kiosk after a successful
        /// security-code lookup). Dedupes by AttendanceId within the session so the
        /// same child isn't added twice. Returns true if added, false if already present.
        /// </summary>
        bool AddNotification( int sessionId, CheckInChildDto child, int? addedByPersonAliasId );

        /// <summary>
        /// Removes a single notification (e.g. manual dismissal). Returns true if removed.
        /// </summary>
        bool RemoveNotification( int notificationId );

        /// <summary>
        /// Removes notifications whose attendance has been checked out in Rock. Calls
        /// IRockCheckInQueryService.GetStillCheckedInAttendanceIds, then deletes the
        /// complement. Returns the count removed. This is the auto-remove-on-checkout
        /// behavior, run on each billboard poll and by the cleanup job.
        /// </summary>
        int RemoveCheckedOut( int sessionId, IRockCheckInQueryService checkInQuery );

        /// <summary>
        /// Sweeps notifications older than the TTL (default 30 minutes) for a session.
        /// Run by the cleanup job. Returns the count swept.
        /// </summary>
        int SweepStale( int sessionId, TimeSpan ttl );

        /// <summary>Removes all notifications for a session (on session end/clear).</summary>
        void ClearForSession( int sessionId );
    }
}
