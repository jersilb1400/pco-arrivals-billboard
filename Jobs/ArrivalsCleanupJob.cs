using System;
using com.gracefellowship.Arrivals.Model;
using com.gracefellowship.Arrivals.Services;
using Quartz;
using Rock;
using Rock.Data;

namespace com.gracefellowship.Arrivals.Jobs
{
    /// <summary>
    /// Scheduled cleanup job for the pickup queue. Runs on Rock's job scheduler (Admin Tools
    /// → System Settings → Jobs → add a job pointing at this class, ~every 1-2 minutes during
    /// services). It:
    ///   1. Sweeps notifications older than the TTL (default 30 min) for the active session.
    ///   2. Removes notifications whose attendance has been checked out in Rock.
    ///
    /// This is the BACKSTOP. The billboard's poll endpoint already does both on every fetch,
    /// so the display stays live in real time; this job guarantees cleanup even if no one is
    /// watching the billboard (e.g. between services, or if the TV is off).
    ///
    /// Mirrors the source Node app's 60s setInterval cleanup (server.js:2066).
    /// </summary>
    [DisallowConcurrentExecution]
    public class ArrivalsCleanupJob : IJob
    {
        // How long a notification stays in the queue before being swept.
        private static readonly TimeSpan NotificationTtl = TimeSpan.FromMinutes( 30 );

        /// <summary>Runs the cleanup for the active session (if any).</summary>
        public void Execute( IJobExecutionContext context )
        {
            try
            {
                var repo = new ArrivalsRepository();
                var sessionService = new SessionService( repo );
                var queueService = new PickupQueueService( repo );
                var checkInQuery = new RockCheckInQueryService();

                var session = sessionService.GetActiveSession();
                if ( session == null || !session.IsActive )
                {
                    // Nothing to clean when no session is active.
                    context.Result = "No active session; nothing to clean.";
                    return;
                }

                int swept = queueService.SweepStale( session.Id, NotificationTtl );
                int checkedOutRemoved = queueService.RemoveCheckedOut( session.Id, checkInQuery );

                context.Result = string.Format( "Swept {0} stale, removed {1} checked-out (session {2}).",
                    swept, checkedOutRemoved, session.Id );
            }
            catch ( Exception ex )
            {
                // Log to Rock's exception log so failures are visible to admins.
                context.Result = "Failed: " + ex.Message;
                Rock.Model.ExceptionLogService.LogException( ex, System.Web.HttpContext.Current );
            }
        }
    }
}
