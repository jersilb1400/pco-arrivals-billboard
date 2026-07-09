using System;

namespace com.gracefellowship.Arrivals.Model
{
    /// <summary>
    /// POCO mirroring the _com_gracefellowship_Arrivals_Session table. Property names
    /// MUST match the SQL column names for EF6 Database.SqlQuery&lt;T&gt; mapping.
    /// At most one row has IsActive = 1 at a time (enforced in SessionService).
    /// </summary>
    public class ArrivalsSession
    {
        public int Id { get; set; }
        public int GroupTypeId { get; set; }
        public string GroupTypeName { get; set; }
        public DateTime OccurrenceDate { get; set; }
        public int? StartedByPersonAliasId { get; set; }
        public DateTime? StartedDateTime { get; set; }
        public bool IsActive { get; set; }
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
