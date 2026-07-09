using System;
using System.ComponentModel;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using com.gracefellowship.Arrivals.Model;
using com.gracefellowship.Arrivals.Services;
using Rock;
using Rock.Data;
using Rock.Model;
using Rock.Security;
using Rock.Web.UI;
using Rock.Web.UI.Controls;

namespace com.gracefellowship.Arrivals.Blocks
{
    /// <summary>
    /// Admin configuration block for the Grace Arrivals Billboard plugin.
    /// Lets an authorized staff member pick a service date + check-in area (GroupType)
    /// and launch (or clear) the active pickup-billboard session. Gated by Rock
    /// page/block security — set the block security to a staff role in the Rock UI.
    ///
    /// The session is persisted to the _Session table (not in RAM) so it survives
    /// app-pool recycles (.context/DECISIONS.md D5).
    /// </summary>
    [DisplayName( "Arrivals Admin" )]
    [Category( "Grace Fellowship > Arrivals" )]
    [Description( "Configure and launch the children's ministry pickup billboard session." )]

    [Rock.SystemGuid.BlockTypeGuid( SystemGuid.BlockType.ARRIVALS_ADMIN )]
    public partial class ArrivalsAdmin : RockBlock
    {
        // ─── Services (constructed per-request; cheap, no shared mutable state) ──
        private IRockCheckInQueryService _checkInQuery;
        private ISessionService _sessionService;
        private IPickupQueueService _queueService;

        /// <summary>
        /// Initialize the services. Done in OnInit so they're ready before OnLoad's
        /// dropdown binding. All three share the same ArrivalsRepository instance.
        /// </summary>
        protected override void OnInit( EventArgs e )
        {
            base.OnInit( e );

            var repo = new ArrivalsRepository();
            _checkInQuery = new RockCheckInQueryService();
            _sessionService = new SessionService( repo );
            _queueService = new PickupQueueService( repo );
        }

        /// <summary>First-load: default the date to today, bind the dropdown, refresh the view.</summary>
        protected override void OnLoad( EventArgs e )
        {
            base.OnLoad( e );

            if ( !Page.IsPostBack )
            {
                dpDate.SelectedDate = RockDateTime.Today;
                BindGroupTypes();
                RefreshView();
            }
        }

        // ─── Actions ───────────────────────────────────────────────────────

        /// <summary>Launches a new active session for the chosen date + GroupType.</summary>
        protected void lbLaunch_Click( object sender, EventArgs e )
        {
            var date = dpDate.SelectedDate;
            if ( !date.HasValue )
            {
                ShowError( "Please pick a service date." );
                return;
            }

            int groupTypeId;
            if ( !int.TryParse( ddlGroupType.SelectedValue, out groupTypeId ) || groupTypeId == 0 )
            {
                ShowError( "Please select a check-in area." );
                return;
            }

            var groupTypeName = ddlGroupType.SelectedItem.Text;
            var startedByAliasId = CurrentPerson?.PrimaryAliasId;

            try
            {
                _sessionService.StartSession( groupTypeId, groupTypeName, date.Value, startedByAliasId );
                ShowSuccess( "Billboard session launched. The kiosk and billboard are now live for "
                    + groupTypeName + " on " + date.Value.ToString( "dddd, MMMM d" ) + "." );
                RefreshView();
            }
            catch ( Exception ex )
            {
                ShowError( "Could not launch the session: " + ex.Message );
                // Use HttpContext.Current explicitly — this.Context can resolve to the wrong
                // LogException overload on some Rock versions (GLM-5.2 advice).
                ExceptionLogService.LogException( ex, HttpContext.Current );
            }
        }

        /// <summary>Clears the active session (deactivates + clears the queue).</summary>
        protected void lbClearSession_Click( object sender, EventArgs e )
        {
            try
            {
                var active = _sessionService.GetActiveSession();
                if ( active != null )
                {
                    _queueService.ClearForSession( active.Id );
                }
                _sessionService.EndSession();
                ShowSuccess( "Billboard session cleared." );
                RefreshView();
            }
            catch ( Exception ex )
            {
                ShowError( "Could not clear the session: " + ex.Message );
                ExceptionLogService.LogException( ex, HttpContext.Current );
            }
        }

        // ─── Helpers ───────────────────────────────────────────────────────

        /// <summary>
        /// Populates the check-in area dropdown from Rock's GroupTypes that take attendance.
        /// If none are returned, shows a helpful message (Rock Check-in may not be configured yet).
        /// </summary>
        private void BindGroupTypes()
        {
            ddlGroupType.Items.Clear();
            ddlGroupType.Items.Add( new ListItem( "-- Select a check-in area --", "0" ) );

            try
            {
                var groupTypes = _checkInQuery.GetCheckInGroupTypes();
                foreach ( var gt in groupTypes )
                {
                    ddlGroupType.Items.Add( new ListItem( gt.Name, gt.Id.ToString() ) );
                }

                if ( groupTypes.Count == 0 )
                {
                    // No GroupTypes take attendance — Rock Check-in likely isn't configured.
                    // Don't block the page; let the admin see the message and configure Rock first.
                    ShowWarning( "No check-in areas (GroupTypes that take attendance) were found. "
                        + "Configure Rock Check-in, then return here." );
                }
            }
            catch ( Exception ex )
            {
                ShowError( "Could not load check-in areas: " + ex.Message );
                ExceptionLogService.LogException( ex, this.Context );
            }
        }

        /// <summary>
        /// Refreshes the active-session banner + quick links to match current state.
        /// Called on first load and after every action.
        /// </summary>
        private void RefreshView()
        {
            var active = _sessionService.GetActiveSession();

            if ( active != null && active.IsActive )
            {
                pnlActiveSession.Visible = true;
                litActiveGroupType.Text = active.GroupTypeName;
                litActiveDate.Text = "Service date: " + active.OccurrenceDate.ToString( "dddd, MMMM d, yyyy" );
                litActiveStartedBy.Text = active.StartedDateTime.HasValue
                    ? "Started " + active.StartedDateTime.Value.ToString( "g" )
                        + ( string.IsNullOrWhiteSpace( active.StartedByName ) ? "" : " by " + active.StartedByName )
                    : "Started by a previous session";

                litPanelTitle.Text = "Start a Different Billboard Session";
            }
            else
            {
                pnlActiveSession.Visible = false;
                litPanelTitle.Text = "Start a Billboard Session";
            }

            // Quick links to the other plugin pages. Built from the page GUIDs so they
            // resolve regardless of where the admin moved the pages in the Rock sitemap.
            hlBillboard.NavigateUrl = PageReference( SystemGuid.Page.BILLBOARD ).BuildUrl();
            hlKiosk.NavigateUrl = PageReference( SystemGuid.Page.SECURITY_CODE_ENTRY ).BuildUrl();
            hlLocationStatus.NavigateUrl = PageReference( SystemGuid.Page.LOCATION_STATUS ).BuildUrl();
        }

        // ─── Notification helpers ─────────────────────────────────────────

        private void ShowSuccess( string message )
        {
            nbMessage.NotificationBoxType = NotificationBoxType.Success;
            nbMessage.Text = message;
            nbMessage.Visible = true;
        }

        private void ShowWarning( string message )
        {
            nbMessage.NotificationBoxType = NotificationBoxType.Warning;
            nbMessage.Text = message;
            nbMessage.Visible = true;
        }

        private void ShowError( string message )
        {
            nbMessage.NotificationBoxType = NotificationBoxType.Danger;
            nbMessage.Text = message;
            nbMessage.Visible = true;
        }

        // NOTE: Control fields (nbMessage, dpDate, ddlGroupType, etc.) are declared in the
        // .designer.cs partial — do NOT redeclare them here or WebForms throws a
        // "member already defined" compile error (GLM-5.2 flagged this).
    }
}
