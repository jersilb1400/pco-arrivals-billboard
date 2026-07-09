using System;
using System.Collections.Generic;

namespace com.gracefellowship.Arrivals.Services.Dto
{
    /// <summary>
    /// One room's status for the LocationStatus block: how many children are checked in
    /// there, and who they are. The block groups active attendances by location and
    /// sorts by ChildCount descending.
    /// </summary>
    [Serializable]
    public class RoomStatusDto
    {
        public int? LocationId { get; set; }
        public string LocationName { get; set; }
        public int? GroupId { get; set; }
        public int ChildCount { get; set; }
        public List<RoomChildDto> Children { get; set; } = new List<RoomChildDto>();
    }

    /// <summary>A child within a room, for the LocationStatus display.</summary>
    [Serializable]
    public class RoomChildDto
    {
        public int AttendanceId { get; set; }
        public string ChildName { get; set; }
        public string SecurityCode { get; set; }
        public DateTime? CheckInTime { get; set; }
    }
}
