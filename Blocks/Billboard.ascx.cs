using System;
using System.ComponentModel;
using com.gracefellowship.Arrivals.Model;
using com.gracefellowship.Arrivals.Services;
using Rock;
using Rock.Model;
using Rock.Web.UI;
using Rock.Web.UI.Controls;

namespace com.gracefellowship.Arrivals.Blocks
{
    /// <summary>
    /// Public TV/billboard display: shows children awaiting pickup as cards, polls a JSON
    /// endpoint every ~10 seconds (client-side fetch in the .ascx), plays a chime on each
    /// new arrival, and auto-removes cards when a child is checked out in Rock. Public
    /// (no login). Tuned for a landscape iPad / wall-mounted TV (3-column card grid).
    ///
    /// POLLING ARCHITECTURE (.context/DECISIONS.md D3, LESSONS.md L8/L9):
    ///   - Client JS fetches ~/api/GraceArrivals/Billboard every 10s (served by
    ///     ArrivalsController, a Rock.Rest.ApiControllerBase auto-discovered from this DLL).
    ///   - That endpoint returns a lightweight JSON diff (session + notifications), NOT a
    ///     full HTML re-render, and runs RemoveCheckedOut so checkouts propagate on the next
    ///     poll. All data access goes through IPickupQueueService / IRockCheckInQueryService
    ///     — the same seam a future SignalR topic will use.
    ///   - NOTE: we do NOT use [BlockAction] (that's Obsidian-only and won't compile in
    ///     WebForms). A plugin ApiController is the proven, upgrade-safe path.
    ///     (GLM-5.2 + source-verified.)
    /// </summary>
    [DisplayName( "Arrivals Billboard" )]
    [Category( "Grace Fellowship > Arrivals" )]
    [Description( "Public TV display of children awaiting pickup, with auto-refresh and a chime." )]

    [Rock.SystemGuid.BlockTypeGuid( SystemGuid.BlockType.BILLBOARD )]
    public partial class Billboard : RockBlock
    {
        private ISessionService _sessionService;

        protected override void OnInit( EventArgs e )
        {
            base.OnInit( e );
            _sessionService = new SessionService( new ArrivalsRepository() );

            // Load the billboard stylesheet (shipped alongside the .ascx in the .plugin).
            RockPage.AddCSSLink( ResolveRockUrl( "~/Plugins/com_gracefellowship_Arrivals/Blocks/Billboard.css" ) );
        }

        protected override void OnLoad( EventArgs e )
        {
            base.OnLoad( e );

            if ( !Page.IsPostBack )
            {
                // Point the client-side fetch at the polling API controller route.
                hfPollUrl.Value = ResolveUrl( "~/api/GraceArrivals/Billboard" );

                // Tell the client whether a session is active so it knows whether to start
                // polling or show the "no session" state immediately.
                var session = _sessionService.GetActiveSession();
                hfHasSession.Value = ( session != null && session.IsActive ).ToString().ToLowerInvariant();
            }
        }
    }
}
