using System;

namespace com.gracefellowship.Arrivals.Model
{
    /// <summary>
    /// POCO mirroring the _com_gracefellowship_Arrivals_Appearance table (one row per
    /// GroupType; UNIQUE on GroupTypeId). Property names MUST match the SQL column
    /// names for EF6 Database.SqlQuery&lt;T&gt; mapping.
    /// LocationColors / StationColors / StationIcons are JSON blobs (keyed by
    /// location/device id → hex color or icon name) stored as strings and parsed by
    /// the AppearanceService. Kept as raw JSON in the table so the schema doesn't
    /// need a migration when the appearance model evolves.
    /// </summary>
    public class ArrivalsAppearance
    {
        public int Id { get; set; }
        public int GroupTypeId { get; set; }
        public string LocationColors { get; set; }
        public string StationColors { get; set; }
        public string StationIcons { get; set; }
        public Guid Guid { get; set; }
        public DateTime? CreatedDateTime { get; set; }
        public DateTime? ModifiedDateTime { get; set; }
        public int? CreatedByPersonAliasId { get; set; }
        public int? ModifiedByPersonAliasId { get; set; }
        public string ForeignKey { get; set; }
        public Guid? ForeignGuid { get; set; }
        public int? ForeignId { get; set; }
    }
}
