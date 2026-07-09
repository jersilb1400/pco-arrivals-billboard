using System.ComponentModel;
using Rock;
using Rock.Web.UI;

namespace com.gracefellowship.Arrivals.Blocks
{
    /// <summary>
    /// Public kiosk block: a volunteer types a parent's security code, the plugin
    /// looks up which checked-in child(ren) it belongs to via Rock Check-in data,
    /// and adds them to the pickup queue. Public (no login) — runs on a dedicated
    /// kiosk device.
    /// </summary>
    [DisplayName( "Security Code Entry" )]
    [Category( "Grace Fellowship > Arrivals" )]
    [Description( "Public kiosk: enter a parent's security code to add children to the pickup billboard." )]

    [Rock.SystemGuid.BlockTypeGuid( SystemGuid.BlockType.SECURITY_CODE_ENTRY )]
    public partial class SecurityCodeEntry : RockBlock
    {
        /// <summary>Stub: real logic arrives in Phase 3. Raises the base init.</summary>
        protected override void OnInit( System.EventArgs e )
        {
            base.OnInit( e );
        }

        /// <summary>Stub: real logic arrives in Phase 3. First-load wiring only.</summary>
        protected override void OnLoad( System.EventArgs e )
        {
            base.OnLoad( e );

            if ( !Page.IsPostBack )
            {
                // Phase 3 will add the code-entry form, autofocus, and the lookup +
                // queue-add call to IPickupQueueService here.
            }
        }
    }
}
