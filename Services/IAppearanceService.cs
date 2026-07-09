using System.Collections.Generic;

namespace com.gracefellowship.Arrivals.Services
{
    /// <summary>
    /// Manages per-GroupType appearance config: room (location) colors, station
    /// (device) colors, and station icons. Stored as JSON blobs in the _Appearance
    /// table (one row per GroupType). Drives card border colors and station badges
    /// on the billboard (Phase 4). Exposed here so the billboard poll can bundle
    /// appearance data with the notification list in a single round-trip.
    /// </summary>
    public interface IAppearanceService
    {
        /// <summary>Gets the location→hex color map for a GroupType (empty if none configured).</summary>
        Dictionary<int, string> GetLocationColors( int groupTypeId );

        /// <summary>Gets the device→hex color map for a GroupType.</summary>
        Dictionary<int, string> GetStationColors( int groupTypeId );

        /// <summary>Gets the device→icon-name map for a GroupType.</summary>
        Dictionary<int, string> GetStationIcons( int groupTypeId );

        /// <summary>Saves all three maps for a GroupType in one write (upserts the row).</summary>
        void SaveAppearance( int groupTypeId, Dictionary<int, string> locationColors, Dictionary<int, string> stationColors, Dictionary<int, string> stationIcons );
    }
}
