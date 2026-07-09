using System;
using System.Collections.Generic;
using com.gracefellowship.Arrivals.Model;
using Newtonsoft.Json;

namespace com.gracefellowship.Arrivals.Services
{
    /// <summary>
    /// Implements <see cref="IAppearanceService"/>. Persists room/station colors and station
    /// icons as JSON blobs (Dictionary&lt;int,string&gt; serialized) in the _Appearance table,
    /// one row per GroupType. The JSON-as-string approach means the appearance model can grow
    /// (new keys, new maps) without a schema migration — the dictionary just gets richer.
    /// </summary>
    public class AppearanceService : IAppearanceService
    {
        private readonly ArrivalsRepository _repo;

        public AppearanceService( ArrivalsRepository repo )
        {
            _repo = repo;
        }

        /// <summary>Gets the location→hex color map for a GroupType.</summary>
        public Dictionary<int, string> GetLocationColors( int groupTypeId )
        {
            return Deserialize( _repo.GetAppearance( groupTypeId )?.LocationColors );
        }

        /// <summary>Gets the device→hex color map for a GroupType.</summary>
        public Dictionary<int, string> GetStationColors( int groupTypeId )
        {
            return Deserialize( _repo.GetAppearance( groupTypeId )?.StationColors );
        }

        /// <summary>Gets the device→icon-name map for a GroupType.</summary>
        public Dictionary<int, string> GetStationIcons( int groupTypeId )
        {
            return Deserialize( _repo.GetAppearance( groupTypeId )?.StationIcons );
        }

        /// <summary>Saves all three maps for a GroupType in one upsert.</summary>
        public void SaveAppearance( int groupTypeId, Dictionary<int, string> locationColors, Dictionary<int, string> stationColors, Dictionary<int, string> stationIcons )
        {
            _repo.SaveAppearance(
                groupTypeId,
                Serialize( locationColors ),
                Serialize( stationColors ),
                Serialize( stationIcons ) );
        }

        // ─── JSON helpers ──────────────────────────────────────────────────

        /// <summary>
        /// Deserializes a JSON blob to Dictionary&lt;int,string&gt;. Returns an empty
        /// dictionary (never null) if the blob is null/empty/malformed — appearance is
        /// always best-effort, never a hard failure (a bad color config must not break the
        /// billboard display).
        /// </summary>
        private static Dictionary<int, string> Deserialize( string json )
        {
            if ( string.IsNullOrWhiteSpace( json ) )
            {
                return new Dictionary<int, string>();
            }
            try
            {
                return JsonConvert.DeserializeObject<Dictionary<int, string>>( json )
                       ?? new Dictionary<int, string>();
            }
            catch
            {
                // Malformed JSON in the column — degrade gracefully to empty (default colors).
                return new Dictionary<int, string>();
            }
        }

        /// <summary>Serializes a map to JSON; null/empty → "{}" (compact, never null).</summary>
        private static string Serialize( Dictionary<int, string> map )
        {
            if ( map == null || map.Count == 0 )
            {
                return "{}";
            }
            return JsonConvert.SerializeObject( map );
        }
    }
}
