using System;
using System.Collections.Generic;
using System.Linq;
using com.gracefellowship.Arrivals.Model;
using com.gracefellowship.Arrivals.Services.Dto;

namespace com.gracefellowship.Arrivals.Services
{
    /// <summary>
    /// Implements <see cref="IPickupQueueService"/> on top of <see cref="ArrivalsRepository"/>.
    /// The billboard polls <see cref="GetActiveNotifications"/>; the kiosk writes via
    /// <see cref="AddNotification"/>; checkout removal and stale-sweep run on each poll and
    /// via the cleanup job.
    ///
    /// This is the polling/SignalR-shared service (.context/LESSONS.md L9): both the current
    /// polling endpoint and a future SignalR topic call these same methods.
    /// </summary>
    public class PickupQueueService : IPickupQueueService
    {
        private readonly ArrivalsRepository _repo;

        public PickupQueueService( ArrivalsRepository repo )
        {
            _repo = repo;
        }

        /// <summary>Returns active notifications for a session as minimal DTOs (poll payload — L8).</summary>
        public List<PickupNotificationDto> GetActiveNotifications( int sessionId )
        {
            return _repo.GetNotificationsForSession( sessionId )
                .Select( ToDto )
                .ToList();
        }

        /// <summary>
        /// Adds a child to the queue (deduped by AttendanceId within the session). Returns
        /// true if added, false if already present.
        /// </summary>
        public bool AddNotification( int sessionId, CheckInChildDto child, int? addedByPersonAliasId )
        {
            if ( child == null )
            {
                return false;
            }

            var id = _repo.TryAddNotification(
                sessionId: sessionId,
                attendanceId: child.AttendanceId,
                securityCode: child.SecurityCode,
                childName: child.ChildName,
                locationId: child.LocationId,
                locationName: child.LocationName,
                groupId: child.GroupId,
                deviceId: child.DeviceId,
                stationName: child.StationName,
                checkInTime: child.CheckInTime,
                addedByPersonAliasId: addedByPersonAliasId );

            return id > 0;
        }

        /// <summary>Removes a single notification by id.</summary>
        public bool RemoveNotification( int notificationId )
        {
            return _repo.RemoveNotification( notificationId );
        }

        /// <summary>
        /// Removes notifications whose attendance has been checked out in Rock. Asks the
        /// query service which queued attendance ids are still active, computes the
        /// complement (checked out), and deletes those. Returns the count removed.
        /// </summary>
        public int RemoveCheckedOut( int sessionId, IRockCheckInQueryService checkInQuery )
        {
            var queuedAttendanceIds = _repo.GetAttendanceIdsForSession( sessionId );
            if ( queuedAttendanceIds.Count == 0 )
            {
                return 0;
            }

            var stillIn = checkInQuery.GetStillCheckedInAttendanceIds( queuedAttendanceIds );
            var checkedOut = queuedAttendanceIds.Except( stillIn ).ToList();

            if ( checkedOut.Count == 0 )
            {
                return 0;
            }

            return _repo.RemoveByAttendanceIds( sessionId, checkedOut );
        }

        /// <summary>Removes notifications older than the TTL for a session. Returns count.</summary>
        public int SweepStale( int sessionId, TimeSpan ttl )
        {
            var cutoff = RockDateTime.Now.Subtract( ttl );
            return _repo.SweepOlderThan( sessionId, cutoff );
        }

        /// <summary>Clears all notifications for a session.</summary>
        public void ClearForSession( int sessionId )
        {
            _repo.ClearForSession( sessionId );
        }

        // ─── Mapping ───────────────────────────────────────────────────────

        /// <summary>Maps a _Notification row to the lightweight DTO for the polling endpoint.</summary>
        private static PickupNotificationDto ToDto( ArrivalsNotification n )
        {
            return new PickupNotificationDto
            {
                Id = n.Id,
                AttendanceId = n.AttendanceId,
                SecurityCode = n.SecurityCode,
                ChildName = n.ChildName,
                LocationName = n.LocationName,
                LocationId = n.LocationId,
                StationName = n.StationName,
                DeviceId = n.DeviceId,
                NotifiedAt = n.NotifiedAt,
                CheckInTime = n.CheckInTime
            };
        }
    }
}
