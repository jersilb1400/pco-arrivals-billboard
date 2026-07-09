using System;
using System.Collections.Generic;
using System.Web.Http;
using com.gracefellowship.Arrivals.Model;
using com.gracefellowship.Arrivals.Services;
using com.gracefellowship.Arrivals.Services.Dto;
using Rock.Data;
using Rock.Rest;

namespace com.gracefellowship.Arrivals.Rest.Controllers
{
    /// <summary>
    /// Lightweight polling endpoint for the billboard display. The billboard's client JS
    /// fetches <c>~/api/GraceArrivals/Billboard</c> every ~10 seconds and re-renders the
    /// card grid from the JSON response.
    ///
    /// ROUTING: Rock auto-discovers ApiController classes from plugin assemblies that
    /// reference Rock.dll (verified against SparkDevNetwork/Rock source —
    /// RockAssembliesResolver + MapHttpAttributeRoutes). No manual registration needed.
    /// Derives from Rock.Rest.ApiControllerBase (the non-entity controller base Rock uses
    /// for utility endpoints like LavaController).
    ///
    /// PUBLIC/ANONYMOUS: the billboard runs on a dedicated TV/kiosk device with no login
    /// (.context/DECISIONS.md D6). This controller does NOT require authentication — it
    /// serves only "who is currently awaiting pickup" (names + codes + rooms), which is the
    /// whole point of the public display. Do NOT add secrets or PII beyond what the billboard
    /// already shows.
    /// </summary>
    [Rock.SystemGuid.RestControllerGuid( "F1A2B3C4-D5E6-7890-ABCD-EF1234567890" )]
    public class ArrivalsController : ApiControllerBase
    {
        // Notifications older than this are swept on each poll (mirrors the source app's TTL).
        private static readonly TimeSpan NotificationTtl = TimeSpan.FromMinutes( 30 );

        /// <summary>
        /// Returns the active session + its current pickup notifications as a lightweight JSON
        /// payload. Also sweeps stale entries and removes checked-out children so the display
        /// stays live. This is the heartbeat of the billboard.
        /// </summary>
        /// <remarks>Route: GET ~/api/GraceArrivals/Billboard</remarks>
        [HttpGet]
        [System.Web.Http.Route( "api/GraceArrivals/Billboard" )]
        public IHttpActionResult GetBillboardPayload()
        {
            var repo = new ArrivalsRepository();
            var sessionService = new SessionService( repo );
            var queueService = new PickupQueueService( repo );
            var checkInQuery = new RockCheckInQueryService();

            var session = sessionService.GetActiveSession();

            if ( session == null || !session.IsActive )
            {
                return Ok( new BillboardPayload
                {
                    Session = null,
                    Notifications = new List<PickupNotificationDto>()
                } );
            }

            // On each poll: sweep stale entries, then remove kids checked out in Rock.
            // These keep the display live; the cleanup job is the backstop.
            queueService.SweepStale( session.Id, NotificationTtl );
            queueService.RemoveCheckedOut( session.Id, checkInQuery );

            var notifications = queueService.GetActiveNotifications( session.Id );

            return Ok( new BillboardPayload
            {
                Session = session,
                Notifications = notifications
            } );
        }
    }

    /// <summary>Payload returned by the billboard poll endpoint. PascalCase matches the JS client.</summary>
    public class BillboardPayload
    {
        public SessionDto Session { get; set; }
        public List<PickupNotificationDto> Notifications { get; set; }
    }
}
