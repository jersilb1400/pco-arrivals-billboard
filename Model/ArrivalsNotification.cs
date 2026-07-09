using System;

namespace com.gracefellowship.Arrivals.Model
{
    /// <summary>
    /// POCO mirroring the _com_gracefellowship_Arrivals_Notification table. Property
    /// names MUST match the SQL column names for EF6 Database.SqlQuery&lt;T&gt; mapping
    /// (see .context/DECISIONS.md D4 — raw-SQL access, no EF model registration).
    /// Populated by ArrivalsRepository via SqlQuery; mapped to PickupNotificationDto
    /// for the polling endpoint.
    /// </summary>
    public class ArrivalsNotification
    {
        public int Id { get; set; }
        public int SessionId { get; set; }
        public int AttendanceId { get; set; }
        public string SecurityCode { get; set; }
        public string ChildName { get; set; }
        public int? LocationId { get; set; }
        public string LocationName { get; set; }
        public int? GroupId { get; set; }
        public int? DeviceId { get; set; }
        public string StationName { get; set; }
        public DateTime NotifiedAt { get; set; }
        public DateTime? CheckInTime { get; set; }
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
