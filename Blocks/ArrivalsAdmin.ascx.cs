using System.ComponentModel;
using Rock;
using Rock.Web.UI;

namespace com.gracefellowship.Arrivals.Blocks
{
    /// <summary>
    /// Admin configuration block for the Grace Arrivals Billboard plugin.
    /// Lets an authorized staff member pick a date + check-in area (GroupType),
    /// launch/clear the active pickup-billboard session, and (Phase 4) assign
    /// room/station colors and icons. Gated by Rock page/block security.
    /// </summary>
    [DisplayName( "Arrivals Admin" )]
    [Category( "Grace Fellowship > Arrivals" )]
    [Description( "Configure and launch the children's ministry pickup billboard session." )]

    // Tie this block to its immutable block-type GUID (SystemGuid/Guids.cs).
    [Rock.SystemGuid.BlockTypeGuid( SystemGuid.BlockType.ARRIVALS_ADMIN )]
    public partial class ArrivalsAdmin : RockBlock
    {
        /// <summary>Stub: real logic arrives in Phase 2. Raises the base init.</summary>
        protected override void OnInit( System.EventArgs e )
        {
            base.OnInit( e );
        }

        /// <summary>Stub: real logic arrives in Phase 2. First-load wiring only.</summary>
        protected override void OnLoad( System.EventArgs e )
        {
            base.OnLoad( e );

            if ( !Page.IsPostBack )
            {
                // Phase 2 will populate the date/check-in-area selectors and the
                // active-session banner here.
            }
        }
    }
}
