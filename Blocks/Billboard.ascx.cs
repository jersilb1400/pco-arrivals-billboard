using System.ComponentModel;
using Rock;
using Rock.Web.UI;

namespace com.gracefellowship.Arrivals.Blocks
{
    /// <summary>
    /// Public TV/billboard display: shows children awaiting pickup as cards, polls
    /// the active pickup queue every ~10 seconds, plays a chime on each new arrival,
    /// and auto-removes cards when a child is checked out in Rock. Public (no login).
    /// Tuned for a landscape iPad / wall-mounted TV.
    /// </summary>
    [DisplayName( "Arrivals Billboard" )]
    [Category( "Grace Fellowship > Arrivals" )]
    [Description( "Public TV display of children awaiting pickup, with auto-refresh and a chime." )]

    [Rock.SystemGuid.BlockTypeGuid( SystemGuid.BlockType.BILLBOARD )]
    public partial class Billboard : RockBlock
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
                // Phase 3 will add the poll timer / fetch endpoint, card grid binding,
                // and the Web Audio chime client script here.
            }
        }
    }
}
