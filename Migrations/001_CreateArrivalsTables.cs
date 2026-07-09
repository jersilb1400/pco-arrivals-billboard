using Rock.Plugin;

namespace com.gracefellowship.Arrivals.Migrations
{
    /// <summary>
    /// Migration 1 for the Grace Arrivals Billboard plugin.
    ///
    /// Creates the three plugin-owned tables and registers the four block types,
    /// their pages, and their block instances in Rock's CMS.
    ///
    /// Tables are created idempotently (IF NOT EXISTS) so re-applies are safe.
    /// They follow Rock entity conventions: Guid/Created/Modified columns +
    /// named DEFAULT constraints + clustered PK. Access is via raw SQL on
    /// RockContext.Database (see .context/DECISIONS.md D4), so no EF model
    /// registration is required.
    ///
    /// NOTE on data-model facts (source-verified, .context/LESSONS.md L2/L3):
    ///   - GroupId/LocationId/ScheduleId live on AttendanceOccurrence, not Attendance.
    ///   - "Still checked in" = DidAttend == true && EndDateTime == null.
    ///   - One AttendanceCode covers all children in a family's check-in session.
    /// These tables store the plugin's OWN state (the pickup queue + active
    /// session + appearance config); they do NOT duplicate Rock check-in data.
    /// </summary>
    [MigrationNumber( 1, "1.19.0" )]
    public class CreateArrivalsTables : Migration
    {
        /// <summary>Creates tables + registers the plugin's UI in Rock.</summary>
        public override void Up()
        {
            // ─── 1. Active session table ───────────────────────────────────
            // The admin-launched "active billboard": a chosen check-in GroupType +
            // date the kiosk and billboard share. Persisted (not RAM) so it
            // survives app-pool recycles (.context/DECISIONS.md D5). At most one
            // row has IsActive = 1 at a time (enforced in the service layer).
            Sql( @"
                IF NOT EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_NAME = '_com_gracefellowship_Arrivals_Session'
                )
                BEGIN
                    CREATE TABLE [dbo].[_com_gracefellowship_Arrivals_Session] (
                        [Id]                        INT             IDENTITY(1,1) NOT NULL,
                        [GroupTypeId]               INT             NOT NULL,
                        [GroupTypeName]             NVARCHAR(100)   NOT NULL,
                        [OccurrenceDate]            DATE            NOT NULL,
                        [StartedByPersonAliasId]    INT             NULL,
                        [StartedDateTime]           DATETIME        NULL,
                        [IsActive]                  BIT             NOT NULL CONSTRAINT [DF_Arrivals_Session_IsActive] DEFAULT (0),
                        [Guid]                      UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Arrivals_Session_Guid] DEFAULT NEWSEQUENTIALID(),
                        [CreatedDateTime]           DATETIME        NULL,
                        [ModifiedDateTime]          DATETIME        NULL,
                        [CreatedByPersonAliasId]    INT             NULL,
                        [ModifiedByPersonAliasId]   INT             NULL,
                        [ForeignKey]                NVARCHAR(100)   NULL,
                        [ForeignGuid]               UNIQUEIDENTIFIER NULL,
                        [ForeignId]                 INT             NULL,
                        CONSTRAINT [PK_Arrivals_Session] PRIMARY KEY CLUSTERED ([Id] ASC)
                    );
                END

                -- Index for the "find active session" hot path (admin/billboard/kiosk all query this).
                IF NOT EXISTS (
                    SELECT 1 FROM sys.indexes
                    WHERE name = 'IX_Arrivals_Session_GroupTypeDate'
                      AND object_id = OBJECT_ID('[dbo].[_com_gracefellowship_Arrivals_Session]')
                )
                BEGIN
                    CREATE NONCLUSTERED INDEX [IX_Arrivals_Session_GroupTypeDate]
                        ON [dbo].[_com_gracefellowship_Arrivals_Session] ([GroupTypeId], [OccurrenceDate]);
                END
            " );

            // ─── 2. Pickup-notification queue table ────────────────────────
            // One row per child added to the billboard. AttendanceId links back
            // to Rock's Attendance row (used to detect checkout via EndDateTime).
            // We do NOT hard-FK AttendanceId to Rock's Attendance table: if a Rock
            // admin deletes an attendance row, a hard FK would throw and break our
            // cleanup; instead the cleanup job detects a missing/checked-out row
            // and removes the notification gracefully. SessionId IS hard-FK'd with
            // CASCADE so ending a session cleans up its queue. SecurityCode is
            // denormalized for display; ChildName/LocationName/StationName are
            // snapshot at add time so the display is stable even if Rock's names
            // change mid-session.
            Sql( @"
                IF NOT EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_NAME = '_com_gracefellowship_Arrivals_Notification'
                )
                BEGIN
                    CREATE TABLE [dbo].[_com_gracefellowship_Arrivals_Notification] (
                        [Id]                        INT             IDENTITY(1,1) NOT NULL,
                        [SessionId]                 INT             NOT NULL,
                        [AttendanceId]              INT             NOT NULL,
                        [SecurityCode]              NVARCHAR(20)    NOT NULL,
                        [ChildName]                 NVARCHAR(200)   NOT NULL,
                        [LocationId]                INT             NULL,
                        [LocationName]              NVARCHAR(200)   NULL,
                        [GroupId]                   INT             NULL,
                        [DeviceId]                  INT             NULL,
                        [StationName]               NVARCHAR(200)   NULL,
                        [NotifiedAt]                DATETIME        NOT NULL,
                        [CheckInTime]               DATETIME        NULL,
                        [Guid]                      UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Arrivals_Notification_Guid] DEFAULT NEWSEQUENTIALID(),
                        [CreatedDateTime]           DATETIME        NULL,
                        [ModifiedDateTime]          DATETIME        NULL,
                        [CreatedByPersonAliasId]    INT             NULL,
                        [ModifiedByPersonAliasId]   INT             NULL,
                        [ForeignKey]                NVARCHAR(100)   NULL,
                        [ForeignGuid]               UNIQUEIDENTIFIER NULL,
                        [ForeignId]                 INT             NULL,
                        CONSTRAINT [PK_Arrivals_Notification] PRIMARY KEY CLUSTERED ([Id] ASC),
                        CONSTRAINT [FK_Arrivals_Notification_Session]
                            FOREIGN KEY ([SessionId])
                            REFERENCES [dbo].[_com_gracefellowship_Arrivals_Session] ([Id])
                            ON DELETE CASCADE
                    );
                END

                -- Hot path: the billboard polls active notifications by SessionId every ~10s.
                IF NOT EXISTS (
                    SELECT 1 FROM sys.indexes
                    WHERE name = 'IX_Arrivals_Notification_SessionId'
                      AND object_id = OBJECT_ID('[dbo].[_com_gracefellowship_Arrivals_Notification]')
                )
                BEGIN
                    CREATE NONCLUSTERED INDEX [IX_Arrivals_Notification_SessionId]
                        ON [dbo].[_com_gracefellowship_Arrivals_Notification] ([SessionId]);
                END
            " );

            // ─── 3. Appearance config table (colors + icons per GroupType) ─
            // One row per check-in GroupType (UNIQUE on GroupTypeId prevents dupes).
            // LocationColors / StationColors / StationIcons are JSON blobs keyed by
            // location/station id. Drives card border colors and station badges on
            // the billboard (Phase 4).
            Sql( @"
                IF NOT EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_NAME = '_com_gracefellowship_Arrivals_Appearance'
                )
                BEGIN
                    CREATE TABLE [dbo].[_com_gracefellowship_Arrivals_Appearance] (
                        [Id]                        INT             IDENTITY(1,1) NOT NULL,
                        [GroupTypeId]               INT             NOT NULL,
                        [LocationColors]            NVARCHAR(MAX)   NULL,
                        [StationColors]             NVARCHAR(MAX)   NULL,
                        [StationIcons]              NVARCHAR(MAX)   NULL,
                        [Guid]                      UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Arrivals_Appearance_Guid] DEFAULT NEWSEQUENTIALID(),
                        [CreatedDateTime]           DATETIME        NULL,
                        [ModifiedDateTime]          DATETIME        NULL,
                        [CreatedByPersonAliasId]    INT             NULL,
                        [ModifiedByPersonAliasId]   INT             NULL,
                        [ForeignKey]                NVARCHAR(100)   NULL,
                        [ForeignGuid]               UNIQUEIDENTIFIER NULL,
                        [ForeignId]                 INT             NULL,
                        CONSTRAINT [PK_Arrivals_Appearance] PRIMARY KEY CLUSTERED ([Id] ASC),
                        CONSTRAINT [UQ_Arrivals_Appearance_GroupTypeId] UNIQUE ([GroupTypeId])
                    );
                END
            " );

            // ─── 4. Register the four block types ──────────────────────────
            RockMigrationHelper.AddBlockType(
                name: "Arrivals Admin",
                description: "Configure and launch the children's ministry pickup billboard session.",
                path: "~/Plugins/com_gracefellowship_Arrivals/Blocks/ArrivalsAdmin.ascx",
                category: "Grace Fellowship",
                guid: SystemGuid.BlockType.ARRIVALS_ADMIN );

            RockMigrationHelper.AddBlockType(
                name: "Security Code Entry",
                description: "Public kiosk: enter a parent's security code to add children to the pickup billboard.",
                path: "~/Plugins/com_gracefellowship_Arrivals/Blocks/SecurityCodeEntry.ascx",
                category: "Grace Fellowship",
                guid: SystemGuid.BlockType.SECURITY_CODE_ENTRY );

            RockMigrationHelper.AddBlockType(
                name: "Arrivals Billboard",
                description: "Public TV display of children awaiting pickup, with auto-refresh and a chime.",
                path: "~/Plugins/com_gracefellowship_Arrivals/Blocks/Billboard.ascx",
                category: "Grace Fellowship",
                guid: SystemGuid.BlockType.BILLBOARD );

            RockMigrationHelper.AddBlockType(
                name: "Arrivals Location Status",
                description: "Per-room overview of checked-in children for the active check-in area.",
                path: "~/Plugins/com_gracefellowship_Arrivals/Blocks/LocationStatus.ascx",
                category: "Grace Fellowship",
                guid: SystemGuid.BlockType.LOCATION_STATUS );

            // ─── 5. Register pages + place blocks ─────────────────────────
            // All four pages are registered under Admin Tools > Power Tools (a
            // guaranteed-present parent in every Rock install). After install,
            // the admin can MOVE the public pages (kiosk/billboard/location-status)
            // to the desired navigation location in the Rock UI without touching
            // migrations — page identity is GUID-stable.

            // Admin page (role-gated via block security in the Rock UI).
            RockMigrationHelper.AddPage(
                parentPageGuid: Rock.SystemGuid.Page.POWER_TOOLS,
                layoutGuid: Rock.SystemGuid.Layout.FULL_WIDTH,
                name: "Arrivals Admin",
                description: "Configure and launch the Grace Arrivals pickup billboard.",
                iconCssClass: "fa fa-child",
                guid: SystemGuid.Page.ARRIVALS_ADMIN );
            RockMigrationHelper.AddBlock(
                pageGuid: SystemGuid.Page.ARRIVALS_ADMIN,
                layoutGuid: "",
                blockTypeGuid: SystemGuid.BlockType.ARRIVALS_ADMIN,
                name: "Arrivals Admin",
                zone: "Main",
                preHtml: "",
                postHtml: "",
                order: 0,
                guid: SystemGuid.Block.ARRIVALS_ADMIN_INSTANCE );

            // Public kiosk page.
            RockMigrationHelper.AddPage(
                parentPageGuid: Rock.SystemGuid.Page.POWER_TOOLS,
                layoutGuid: Rock.SystemGuid.Layout.FULL_WIDTH,
                name: "Arrivals Security Code Entry",
                description: "Public kiosk: enter a parent's security code.",
                iconCssClass: "fa fa-qrcode",
                guid: SystemGuid.Page.SECURITY_CODE_ENTRY );
            RockMigrationHelper.AddBlock(
                pageGuid: SystemGuid.Page.SECURITY_CODE_ENTRY,
                layoutGuid: "",
                blockTypeGuid: SystemGuid.BlockType.SECURITY_CODE_ENTRY,
                name: "Security Code Entry",
                zone: "Main",
                preHtml: "",
                postHtml: "",
                order: 0,
                guid: SystemGuid.Block.SECURITY_CODE_ENTRY_INSTANCE );

            // Public billboard display page.
            RockMigrationHelper.AddPage(
                parentPageGuid: Rock.SystemGuid.Page.POWER_TOOLS,
                layoutGuid: Rock.SystemGuid.Layout.FULL_WIDTH,
                name: "Arrivals Billboard",
                description: "Public TV display of children awaiting pickup.",
                iconCssClass: "fa fa-tv",
                guid: SystemGuid.Page.BILLBOARD );
            RockMigrationHelper.AddBlock(
                pageGuid: SystemGuid.Page.BILLBOARD,
                layoutGuid: "",
                blockTypeGuid: SystemGuid.BlockType.BILLBOARD,
                name: "Arrivals Billboard",
                zone: "Main",
                preHtml: "",
                postHtml: "",
                order: 0,
                guid: SystemGuid.Block.BILLBOARD_INSTANCE );

            // Location-status page (staff overview).
            RockMigrationHelper.AddPage(
                parentPageGuid: Rock.SystemGuid.Page.POWER_TOOLS,
                layoutGuid: Rock.SystemGuid.Layout.FULL_WIDTH,
                name: "Arrivals Location Status",
                description: "Per-room overview of checked-in children.",
                iconCssClass: "fa fa-building",
                guid: SystemGuid.Page.LOCATION_STATUS );
            RockMigrationHelper.AddBlock(
                pageGuid: SystemGuid.Page.LOCATION_STATUS,
                layoutGuid: "",
                blockTypeGuid: SystemGuid.BlockType.LOCATION_STATUS,
                name: "Arrivals Location Status",
                zone: "Main",
                preHtml: "",
                postHtml: "",
                order: 0,
                guid: SystemGuid.Block.LOCATION_STATUS_INSTANCE );
        }

        /// <summary>Reverses Up(): removes the UI registration then drops the tables.</summary>
        public override void Down()
        {
            // Remove blocks, pages, block types in reverse order of registration.
            RockMigrationHelper.DeleteBlock( SystemGuid.Block.LOCATION_STATUS_INSTANCE );
            RockMigrationHelper.DeletePage( SystemGuid.Page.LOCATION_STATUS );

            RockMigrationHelper.DeleteBlock( SystemGuid.Block.BILLBOARD_INSTANCE );
            RockMigrationHelper.DeletePage( SystemGuid.Page.BILLBOARD );

            RockMigrationHelper.DeleteBlock( SystemGuid.Block.SECURITY_CODE_ENTRY_INSTANCE );
            RockMigrationHelper.DeletePage( SystemGuid.Page.SECURITY_CODE_ENTRY );

            RockMigrationHelper.DeleteBlock( SystemGuid.Block.ARRIVALS_ADMIN_INSTANCE );
            RockMigrationHelper.DeletePage( SystemGuid.Page.ARRIVALS_ADMIN );

            RockMigrationHelper.DeleteBlockType( SystemGuid.BlockType.LOCATION_STATUS );
            RockMigrationHelper.DeleteBlockType( SystemGuid.BlockType.BILLBOARD );
            RockMigrationHelper.DeleteBlockType( SystemGuid.BlockType.SECURITY_CODE_ENTRY );
            RockMigrationHelper.DeleteBlockType( SystemGuid.BlockType.ARRIVALS_ADMIN );

            // Drop tables in reverse creation order.
            Sql( "DROP TABLE IF EXISTS [dbo].[_com_gracefellowship_Arrivals_Appearance];" );
            Sql( "DROP TABLE IF EXISTS [dbo].[_com_gracefellowship_Arrivals_Notification];" );
            Sql( "DROP TABLE IF EXISTS [dbo].[_com_gracefellowship_Arrivals_Session];" );
        }
    }
}
