using System.ComponentModel;
using Rock;
using Rock.Web.UI;

namespace com.gracefellowship.Arrivals.Blocks
{
    /// <summary>
    /// Staff/volunteer overview of every room (Group/Location) for the active
    /// check-in area, each with its child count and the list of children currently
    /// checked in. Sorted by child count descending; auto-refreshes ~every 10s.
    /// Typically role-gated (staff), unlike the public billboard.
    /// </summary>
    [DisplayName( "Arrivals Location Status" )]
    [Category( "Grace Fellowship > Arrivals" )]
    [Description( "Per-room overview of checked-in children for the active check-in area." )]

    [Rock.SystemGuid.BlockTypeGuid( SystemGuid.BlockType.LOCATION_STATUS )]
    public partial class LocationStatus : RockBlock
    {
        /// <summary>Stub: real logic arrives in Phase 4. Raises the base init.</summary>
        protected override void OnInit( System.EventArgs e )
        {
            base.OnInit( e );
        }

        /// <summary>Stub: real logic arrives in Phase 4. First-load wiring only.</summary>
        protected override void OnLoad( System.EventArgs e )
        {
            base.OnLoad( e );

            if ( !Page.IsPostBack )
            {
                // Phase 4 will bind the rooms grid here.
            }
        }
    }
}
