using System;
using System.ComponentModel;
using System.Linq;
using System.Web;
using System.Web.UI.WebControls;
using com.gracefellowship.Arrivals.Model;
using com.gracefellowship.Arrivals.Services;
using Rock;
using Rock.Model;
using Rock.Security;
using Rock.Web.UI;
using Rock.Web.UI.Controls;

namespace com.gracefellowship.Arrivals.Blocks
{
    /// <summary>
    /// Public kiosk block: a volunteer types a parent's security code; the plugin looks
    /// up which checked-in child(ren) it belongs to via Rock Check-in data and adds them
    /// to the pickup queue (the active billboard session). Public (no login) — runs on a
    /// dedicated kiosk device.
    ///
    /// The lookup is the heart of the system. One security code may return multiple
    /// children (siblings — Rock creates one AttendanceCode per family check-in session,
    /// .context/LESSONS.md L5). Each match is added to the queue (deduped by AttendanceId).
    /// </summary>
    [DisplayName( "Security Code Entry" )]
    [Category( "Grace Fellowship > Arrivals" )]
    [Description( "Public kiosk: enter a parent's security code to add children to the pickup billboard." )]

    [Rock.SystemGuid.BlockTypeGuid( SystemGuid.BlockType.SECURITY_CODE_ENTRY )]
    public partial class SecurityCodeEntry : RockBlock
    {
        private IRockCheckInQueryService _checkInQuery;
        private ISessionService _sessionService;
        private IPickupQueueService _queueService;

        protected override void OnInit( EventArgs e )
        {
            base.OnInit( e );

            var repo = new ArrivalsRepository();
            _checkInQuery = new RockCheckInQueryService();
            _sessionService = new SessionService( repo );
            _queueService = new PickupQueueService( repo );
        }

        protected override void OnLoad( EventArgs e )
        {
            base.OnLoad( e );

            if ( !Page.IsPostBack )
            {
                RefreshView();
            }
        }

        // ─── Submit: the pickup lookup ─────────────────────────────────────

        /// <summary>
        /// On submit: look up the code against Rock check-in data for the active session's
        /// date, add each match to the queue, and confirm to the volunteer. Clear, friendly
        /// messages for no-match / already-checked-out / no-active-session.
        /// </summary>
        protected void btnSubmit_Click( object sender, EventArgs e )
        {
            var code = ( tbSecurityCode.Text ?? string.Empty ).Trim();

            if ( string.IsNullOrWhiteSpace( code ) )
            {
                ShowError( "Please enter a security code." );
                tbSecurityCode.Focus();
                return;
            }

            var session = _sessionService.GetActiveSession();
            if ( session == null || !session.IsActive )
            {
                ShowError( "No active billboard session. Ask a staff member to start one." );
                return;
            }

            try
            {
                // THE PICKUP LOOKUP — IRockCheckInQueryService.FindActiveBySecurityCode
                // (AttendanceCode.Code == code &amp;&amp; OccurrenceDate == session date
                //  &amp;&amp; DidAttend &amp;&amp; EndDateTime == null).
                var children = _checkInQuery.FindActiveBySecurityCode( code, session.OccurrenceDate );

                if ( children.Count == 0 )
                {
                    // No match: bad code, already checked out, or wrong day. Clear, non-alarming message.
                    ShowWarning( "No active check-in found for code \"" + code.ToUpper()
                        + "\". The family may have already been picked up, or check the code and try again." );
                    tbSecurityCode.Text = string.Empty;
                    tbSecurityCode.Focus();
                    return;
                }

                // Add each matched child to the queue (deduped by AttendanceId within the session).
                int added = 0;
                int alreadyThere = 0;
                foreach ( var child in children )
                {
                    var addedByAliasId = CurrentPerson?.PrimaryAliasId;
                    if ( _queueService.AddNotification( session.Id, child, addedByAliasId ) )
                    {
                        added++;
                    }
                    else
                    {
                        alreadyThere++;
                    }
                }

                // Build a confirmation message naming the children + their rooms.
                if ( added > 0 )
                {
                    var names = children.Select( c => c.ChildName + ( string.IsNullOrWhiteSpace( c.LocationName ) ? "" : " (" + c.LocationName + ")" ) );
                    var message = "Added to billboard: " + string.Join( ", ", names ) + ".";
                    if ( alreadyThere > 0 )
                    {
                        message += " (" + alreadyThere + " already on the billboard.)";
                    }
                    ShowSuccess( message );
                }
                else if ( alreadyThere > 0 )
                {
                    ShowInfo( children.Count + " child" + ( children.Count == 1 ? "" : "ren" )
                        + " already on the billboard for that code." );
                }

                tbSecurityCode.Text = string.Empty;
                tbSecurityCode.Focus();
            }
            catch ( Exception ex )
            {
                ShowError( "Something went wrong looking up that code. Please try again, or tell a staff member." );
                ExceptionLogService.LogException( ex, HttpContext.Current );
            }
        }

        // ─── View refresh ──────────────────────────────────────────────────

        /// <summary>
        /// Shows the kiosk form only if a session is active; otherwise shows the "no session"
        /// panel. The header/footer echo the active session so the volunteer knows which
        /// service they're serving.
        /// </summary>
        private void RefreshView()
        {
            var session = _sessionService.GetActiveSession();

            if ( session != null && session.IsActive )
            {
                pnlNoSession.Visible = false;
                pnlKiosk.Visible = true;
                litSessionHeader.Text = session.GroupTypeName + " &mdash; Pickup Check-In";
                litSessionFooter.Text = "Service date: " + session.OccurrenceDate.ToString( "dddd, MMMM d, yyyy" );
            }
            else
            {
                pnlNoSession.Visible = true;
                pnlKiosk.Visible = false;
            }
        }

        // ─── Notification helpers ─────────────────────────────────────────

        private void ShowSuccess( string message )
        {
            nbResult.NotificationBoxType = NotificationBoxType.Success;
            nbResult.Text = message;
            nbResult.Visible = true;
        }

        private void ShowInfo( string message )
        {
            nbResult.NotificationBoxType = NotificationBoxType.Info;
            nbResult.Text = message;
            nbResult.Visible = true;
        }

        private void ShowWarning( string message )
        {
            nbResult.NotificationBoxType = NotificationBoxType.Warning;
            nbResult.Text = message;
            nbResult.Visible = true;
        }

        private void ShowError( string message )
        {
            nbResult.NotificationBoxType = NotificationBoxType.Danger;
            nbResult.Text = message;
            nbResult.Visible = true;
        }
    }
}
