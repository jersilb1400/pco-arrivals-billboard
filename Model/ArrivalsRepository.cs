using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Data;
using System.Linq;
using com.gracefellowship.Arrivals.Model;
using Rock.Data;

namespace com.gracefellowship.Arrivals.Model
{
    /// <summary>
    /// Raw-SQL data access for the plugin's three tables. Uses RockContext.Database
    /// directly (no EF model registration) — the proven pattern from the sibling
    /// com.gracefellowship.PCOMigration plugin, verified on Rock 19.1.8
    /// (.context/DECISIONS.md D4).
    ///
    /// Every method opens its own short-lived RockContext (the Rock convention). POCO
    /// property names must match SQL column names for SqlQuery&lt;T&gt; mapping.
    /// All writes use parameterized SQL (SqlParameter) — never string-interpolate values.
    /// </summary>
    public class ArrivalsRepository
    {
        // ─── Table + column constants ──────────────────────────────────────
        private const string SessionTable = "[dbo].[_com_gracefellowship_Arrivals_Session]";
        private const string NotificationTable = "[dbo].[_com_gracefellowship_Arrivals_Notification]";
        private const string AppearanceTable = "[dbo].[_com_gracefellowship_Arrivals_Appearance]";

        private const string SessionColumns = @"
            Id, GroupTypeId, GroupTypeName, OccurrenceDate, StartedByPersonAliasId,
            StartedDateTime, IsActive, Guid, CreatedDateTime, ModifiedDateTime,
            CreatedByPersonAliasId, ModifiedByPersonAliasId, ForeignKey, ForeignGuid, ForeignId";

        private const string NotificationColumns = @"
            Id, SessionId, AttendanceId, SecurityCode, ChildName, LocationId, LocationName,
            GroupId, DeviceId, StationName, NotifiedAt, CheckInTime, Guid, CreatedDateTime,
            ModifiedDateTime, CreatedByPersonAliasId, ModifiedByPersonAliasId, ForeignKey, ForeignGuid, ForeignId";

        private const string AppearanceColumns = @"
            Id, GroupTypeId, LocationColors, StationColors, StationIcons, Guid, CreatedDateTime,
            ModifiedDateTime, CreatedByPersonAliasId, ModifiedByPersonAliasId, ForeignKey, ForeignGuid, ForeignId";

        // ════════════════════════════════════════════════════════════════════
        //  SESSION
        // ════════════════════════════════════════════════════════════════════

        /// <summary>Returns the single active session (IsActive = 1), or null.</summary>
        public ArrivalsSession GetActiveSession()
        {
            using ( var ctx = new RockContext() )
            {
                return ctx.Database.SqlQuery<ArrivalsSession>(
                    $"SELECT TOP 1 {SessionColumns} FROM {SessionTable} WHERE [IsActive] = 1 ORDER BY [StartedDateTime] DESC"
                ).FirstOrDefault();
            }
        }

        /// <summary>
        /// Atomically: deactivates any active session, clears its notifications, and inserts
        /// a new active session. Returns the new session row. The CASCADE on the Notification
        /// FK would clear notifications when a session row is deleted, but we deactivate in
        /// place (not delete) to preserve history, so we clear notifications explicitly.
        /// </summary>
        public ArrivalsSession StartSession( int groupTypeId, string groupTypeName, DateTime occurrenceDate, int? startedByPersonAliasId )
        {
            using ( var ctx = new RockContext() )
            {
                // Wrap in a transaction so we never end up with two active sessions or
                // orphaned notifications if a step fails partway.
                using ( var tx = ctx.Database.BeginTransaction() )
                {
                    try
                    {
                        var now = RockDateTime.Now;

                        // Deactivate any currently-active sessions.
                        ctx.Database.ExecuteSqlCommand(
                            $"UPDATE {SessionTable} SET [IsActive] = 0, [ModifiedDateTime] = @now WHERE [IsActive] = 1",
                            new SqlParameter( "@now", now )
                        );

                        // Clear notifications from the (now-deactivated) prior sessions.
                        // New session's notifications start empty.
                        ctx.Database.ExecuteSqlCommand(
                            $"DELETE FROM {NotificationTable} WHERE [SessionId] IN (SELECT [Id] FROM {SessionTable} WHERE [IsActive] = 0)"
                        );

                        // Insert the new active session.
                        var id = ctx.Database.SqlQuery<int>(
                            $@"INSERT INTO {SessionTable}
                                   ([GroupTypeId], [GroupTypeName], [OccurrenceDate], [StartedByPersonAliasId],
                                    [StartedDateTime], [IsActive], [Guid], [CreatedDateTime], [CreatedByPersonAliasId])
                               OUTPUT INSERTED.[Id]
                               VALUES (@gtid, @gtname, @date, @by, @started, 1, NEWID(), @created, @by)",
                            new SqlParameter( "@gtid", groupTypeId ),
                            new SqlParameter( "@gtname", groupTypeName ),
                            new SqlParameter( "@date", occurrenceDate.Date ),
                            new SqlParameter( "@by", (object) startedByPersonAliasId ?? DBNull.Value ),
                            new SqlParameter( "@started", now ),
                            new SqlParameter( "@created", now )
                        ).First();

                        tx.Commit();

                        return GetActiveSession();
                    }
                    catch
                    {
                        tx.Rollback();
                        throw;
                    }
                }
            }
        }

        /// <summary>Deactivates the active session (IsActive = 0). Keeps history.</summary>
        public void EndSession()
        {
            using ( var ctx = new RockContext() )
            {
                ctx.Database.ExecuteSqlCommand(
                    $"UPDATE {SessionTable} SET [IsActive] = 0, [ModifiedDateTime] = @now WHERE [IsActive] = 1",
                    new SqlParameter( "@now", RockDateTime.Now )
                );
            }
        }

        // ════════════════════════════════════════════════════════════════════
        //  NOTIFICATIONS (the pickup queue)
        // ════════════════════════════════════════════════════════════════════

        /// <summary>Returns all active notifications for a session, newest-first.</summary>
        public List<ArrivalsNotification> GetNotificationsForSession( int sessionId )
        {
            using ( var ctx = new RockContext() )
            {
                return ctx.Database.SqlQuery<ArrivalsNotification>(
                    $"SELECT {NotificationColumns} FROM {NotificationTable} WHERE [SessionId] = @sid ORDER BY [NotifiedAt] DESC",
                    new SqlParameter( "@sid", sessionId )
                ).ToList();
            }
        }

        /// <summary>
        /// Returns the attendance ids currently in the queue for a session (for checkout re-check).
        /// </summary>
        public List<int> GetAttendanceIdsForSession( int sessionId )
        {
            using ( var ctx = new RockContext() )
            {
                return ctx.Database.SqlQuery<int>(
                    $"SELECT [AttendanceId] FROM {NotificationTable} WHERE [SessionId] = @sid",
                    new SqlParameter( "@sid", sessionId )
                ).ToList();
            }
        }

        /// <summary>
        /// Inserts a notification ONLY if this attendance isn't already queued for this
        /// session (dedupe by AttendanceId). Atomic via INSERT...WHERE NOT EXISTS + OUTPUT.
        /// Returns the new Id, or 0 if it was already present.
        /// </summary>
        public int TryAddNotification(
            int sessionId,
            int attendanceId,
            string securityCode,
            string childName,
            int? locationId,
            string locationName,
            int? groupId,
            int? deviceId,
            string stationName,
            DateTime? checkInTime,
            int? addedByPersonAliasId )
        {
            using ( var ctx = new RockContext() )
            {
                var now = RockDateTime.Now;
                var ids = ctx.Database.SqlQuery<int>(
                    $@"INSERT INTO {NotificationTable}
                           ([SessionId], [AttendanceId], [SecurityCode], [ChildName], [LocationId],
                            [LocationName], [GroupId], [DeviceId], [StationName], [NotifiedAt],
                            [CheckInTime], [Guid], [CreatedDateTime], [CreatedByPersonAliasId])
                       OUTPUT INSERTED.[Id]
                       SELECT @sid, @aid, @code, @name, @locId, @locName, @gid, @devId, @station,
                              @notified, @checkin, NEWID(), @created, @by
                       WHERE NOT EXISTS (
                           SELECT 1 FROM {NotificationTable}
                           WHERE [SessionId] = @sid AND [AttendanceId] = @aid
                       )",
                    new SqlParameter( "@sid", sessionId ),
                    new SqlParameter( "@aid", attendanceId ),
                    new SqlParameter( "@code", securityCode ?? string.Empty ),
                    new SqlParameter( "@name", childName ?? string.Empty ),
                    new SqlParameter( "@locId", (object) locationId ?? DBNull.Value ),
                    new SqlParameter( "@locName", (object) locationName ?? DBNull.Value ),
                    new SqlParameter( "@gid", (object) groupId ?? DBNull.Value ),
                    new SqlParameter( "@devId", (object) deviceId ?? DBNull.Value ),
                    new SqlParameter( "@station", (object) stationName ?? DBNull.Value ),
                    new SqlParameter( "@notified", now ),
                    new SqlParameter( "@checkin", (object) checkInTime ?? DBNull.Value ),
                    new SqlParameter( "@created", now ),
                    new SqlParameter( "@by", (object) addedByPersonAliasId ?? DBNull.Value )
                ).ToList();

                return ids.FirstOrDefault();
            }
        }

        /// <summary>Deletes a notification by its row id. Returns true if a row was deleted.</summary>
        public bool RemoveNotification( int notificationId )
        {
            using ( var ctx = new RockContext() )
            {
                var rows = ctx.Database.ExecuteSqlCommand(
                    $"DELETE FROM {NotificationTable} WHERE [Id] = @id",
                    new SqlParameter( "@id", notificationId )
                );
                return rows > 0;
            }
        }

        /// <summary>Deletes notifications by attendance id (used for checkout removal).</summary>
        public int RemoveByAttendanceIds( int sessionId, IList<int> attendanceIds )
        {
            if ( attendanceIds == null || attendanceIds.Count == 0 )
            {
                return 0;
            }

            using ( var ctx = new RockContext() )
            {
                // Build a parameterized IN list (never interpolate values).
                var parameters = new List<SqlParameter> { new SqlParameter( "@sid", sessionId ) };
                var inClauses = new List<string>();
                for ( int i = 0; i < attendanceIds.Count; i++ )
                {
                    var paramName = $"@aid{i}";
                    parameters.Add( new SqlParameter( paramName, attendanceIds[i] ) );
                    inClauses.Add( paramName );
                }
                var inList = string.Join( ",", inClauses );

                return ctx.Database.ExecuteSqlCommand(
                    $"DELETE FROM {NotificationTable} WHERE [SessionId] = @sid AND [AttendanceId] IN ({inList})",
                    parameters.ToArray()
                );
            }
        }

        /// <summary>Deletes notifications older than the cutoff for a session. Returns count.</summary>
        public int SweepOlderThan( int sessionId, DateTime cutoff )
        {
            using ( var ctx = new RockContext() )
            {
                return ctx.Database.ExecuteSqlCommand(
                    $"DELETE FROM {NotificationTable} WHERE [SessionId] = @sid AND [NotifiedAt] < @cutoff",
                    new SqlParameter( "@sid", sessionId ),
                    new SqlParameter( "@cutoff", cutoff )
                );
            }
        }

        /// <summary>Deletes all notifications for a session.</summary>
        public void ClearForSession( int sessionId )
        {
            using ( var ctx = new RockContext() )
            {
                ctx.Database.ExecuteSqlCommand(
                    $"DELETE FROM {NotificationTable} WHERE [SessionId] = @sid",
                    new SqlParameter( "@sid", sessionId )
                );
            }
        }

        // ════════════════════════════════════════════════════════════════════
        //  APPEARANCE (colors + icons per GroupType)
        // ════════════════════════════════════════════════════════════════════

        /// <summary>Returns the appearance row for a GroupType, or null.</summary>
        public ArrivalsAppearance GetAppearance( int groupTypeId )
        {
            using ( var ctx = new RockContext() )
            {
                return ctx.Database.SqlQuery<ArrivalsAppearance>(
                    $"SELECT TOP 1 {AppearanceColumns} FROM {AppearanceTable} WHERE [GroupTypeId] = @gtid",
                    new SqlParameter( "@gtid", groupTypeId )
                ).FirstOrDefault();
            }
        }

        /// <summary>
        /// Upserts the appearance row for a GroupType (one row per GroupType — UNIQUE).
        /// JSON strings are written as-is; parsed by AppearanceService.
        /// </summary>
        public void SaveAppearance( int groupTypeId, string locationColorsJson, string stationColorsJson, string stationIconsJson )
        {
            using ( var ctx = new RockContext() )
            {
                var now = RockDateTime.Now;
                ctx.Database.ExecuteSqlCommand(
                    $@"MERGE INTO {AppearanceTable} AS target
                       USING (SELECT @gtid AS [GroupTypeId]) AS source
                       ON (target.[GroupTypeId] = source.[GroupTypeId])
                       WHEN MATCHED THEN
                           UPDATE SET [LocationColors] = @locColors,
                                      [StationColors]  = @stnColors,
                                      [StationIcons]   = @stnIcons,
                                      [ModifiedDateTime] = @now
                       WHEN NOT MATCHED THEN
                           INSERT ([GroupTypeId], [LocationColors], [StationColors], [StationIcons],
                                   [Guid], [CreatedDateTime])
                           VALUES (@gtid, @locColors, @stnColors, @stnIcons, NEWID(), @now);",
                    new SqlParameter( "@gtid", groupTypeId ),
                    new SqlParameter( "@locColors", (object) locationColorsJson ?? DBNull.Value ),
                    new SqlParameter( "@stnColors", (object) stationColorsJson ?? DBNull.Value ),
                    new SqlParameter( "@stnIcons", (object) stationIconsJson ?? DBNull.Value ),
                    new SqlParameter( "@now", now )
                );
            }
        }
    }
}
