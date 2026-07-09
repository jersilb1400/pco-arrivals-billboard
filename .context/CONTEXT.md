# CONTEXT — Grace Arrivals Billboard (Rock RMS Plugin)

> The map. Read this first, every session. Every line should change how work gets done.
> Companion files: `DECISIONS.md` (why), `LESSONS.md` (landmines), `VERIFY.md` (how we know).

## What this is

A **Rock RMS plugin** that recreates, natively inside Rock, the children's-ministry
**pickup-notification system** previously built as a standalone Node/React/PCO app
(this repo's former life, preserved in git history). Three surfaces:

1. **Kiosk** (`SecurityCodeEntry` block) — a volunteer types a parent's security code;
   the plugin looks up which checked-in child(ren) it belongs to and adds them to the
   pickup queue. **Public, no login.**
2. **Billboard** (`Billboard` block) — a large TV display of children awaiting pickup.
   Each card shows name, security code, room, time, station badge; a chime sounds on
   each new arrival; cards auto-remove on checkout. **Public, no login.**
3. **Admin** (`ArrivalsAdmin` block) — pick the active check-in area (GroupType) + date,
   launch/clear the active session, assign room/station colors & icons, monitor the queue.
   **Gated by Rock security role.**

**Definition of done:** installs as a `.plugin` on Rock 19.1, all three screens render and
work against live Rock Check-in data, the pickup loop works end-to-end (code in → kid on
billboard → chime → card removed on checkout), and it survives an app-pool recycle.

## Hard constraints (never violate)

- **Rock-native data only.** No PCO dependency. Reads `Attendance` / `AttendanceCode` /
  `AttendanceOccurrence` / `Device` / `Group` / `GroupType` via EF/RockContext. The source
  PCO app code in this repo is a *requirements reference*, not a runtime dependency.
- **WebForms `.ascx` blocks** (`Rock.Web.UI.RockBlock`). NOT Obsidian — Obsidian's plugin
  interface is `[RockInternal("1.13", true)]` "internal forever," no SDK, no third-party
  precedent. WebForms is the only supported + most upgrade-safe plugin surface. (D2)
- **.NET Framework 4.7.2**, SDK-style csproj, Rock refs `<Private>false</Private>`.
- **Never reference DotLiquid / Rock.Lava.Shared** — gone in Rock v19.
- **Plugin DLL deploys to `Rock\bin\`, never `Rock\Plugins\`.** `.ascx` go under
  `Rock\Plugins\com_gracefellowship_Arrivals\Blocks\`. (Inherited landmine L2.)
- **`SystemGuid/Guids.cs` constants are immutable** after first install — never edit values.
- **Migration numbers never renumber/reuse** (Rock tracks by number). Gaps are fine.
- **Secrets in `EncryptedTextField` / `GetAttributeValue`**, never in source. (No secrets
  expected initially — kiosk/billboard are public — but admin config may grow them.)

## Stack & layout

- Target: **Rock RMS 19.1** (verified-on target; v19.1 changelog = "no breaking changes for
  developers"). Watch v20 (pre-alpha) for string/date/JSON/decimal handling changes.
- Language: C# on .NET Framework 4.7.2. UI: WebForms `.ascx` + Rock.Web.UI.Controls + Bootstrap.
- Data access: EF6 via `RockContext` (read Rock entities directly; no Slingshot needed here —
  this plugin *reads* live check-in data, it does not bulk-import).
- Persistence (plugin-owned): one custom table for pickup notifications/queue state, raw SQL
  via `RockContext.Database` (avoids EF model-registration fragility — pattern proven in the
  PCO Migration plugin). See D4.

```
com.gracefellowship.Arrivals/                  (project root — OUTSIDE iCloud ideally)
├── com.gracefellowship.Arrivals.csproj        (SDK-style, net472, Private=false Rock refs)
├── com.gracefellowship.Arrivals.sln
├── build-package.bat                          (→ manual-install ZIP)
├── build-plugin.bat                           (→ proper .plugin file — PREFERRED)
├── Blocks/
│   ├── SecurityCodeEntry.ascx{.cs,.designer.cs}   (public kiosk)
│   ├── Billboard.ascx{.cs,.designer.cs}           (TV display + chime)
│   ├── LocationStatus.ascx{.cs,.designer.cs}      (rooms overview — phase 2)
│   └── ArrivalsAdmin.ascx{.cs,.designer.cs}       (admin config)
├── Services/
│   ├── IPickupQueueService.cs                  (abstraction — polling + future SignalR share this)
│   ├── PickupQueueService.cs                   (EF/RockContext impl)
│   ├── RockCheckInQueryService.cs              (Attendance/Code/Device lookups)
│   └── Dto/                                    (lightweight JSON DTOs for the polling endpoint)
├── Model/
│   ├── ArrivalsNotification.cs                 (POCO matching the queue table)
│   └── ArrivalsNotificationService.cs          (raw-SQL data access)
├── Migrations/
│   └── 001_CreateArrivalsNotification.cs       (Rock.Plugin.Migration, [MigrationNumber])
├── SystemGuid/Guids.cs                         (immutable BlockType/Page/Block GUIDs)
├── Properties/AssemblyInfo.cs
└── .context/                                   (this system)
```

## Architecture (the key shapes)

### Real-time: HTTP polling now, SignalR-able later (D3, advisor-confirmed)
- Billboard + admin poll a `[BlockAction]` endpoint every **5–10s** that returns a lightweight
  **diff** (active notifications for the current session), not a full re-render.
- **All data access goes through `IPickupQueueService`** so the block, the polling endpoint,
  and a future SignalR `RealTimeTopic` share one implementation. Switching to SignalR later
  = add a topic class + wire `RealTimeHelper.GetTopicContext<T>()`; no rewrite. (GLM-5.2 advice.)
- Check-out removal: each poll also re-checkes `EndDateTime` on queued attendances; null it out
  of the queue when Rock shows checkout. Plus a Rock **Job** (or timer) sweeps stale entries.

### The pickup lookup (porting the core loop)
- Volunteer enters security code → `RockCheckInQueryService.FindActiveBySecurityCode(code, date)`:
  ```csharp
  attendanceService.Queryable("Occurrence.Group,Occurrence.Location,AttendanceCode,PersonAlias.Person")
    .Where(a => a.AttendanceCode.Code == code.ToUpper())
    .Where(a => a.Occurrence.OccurrenceDate == date)
    .Where(a => a.DidAttend == true)
    .Where(a => a.EndDateTime == null)   // still checked in
  ```
  One `AttendanceCode` covers all kids in a family (Rock creates one per session, shares across
  every child's `Attendance.AttendanceCodeId`), so one code naturally returns multiple kids.
- **Data-model correction (from source research):** `GroupId`/`LocationId`/`ScheduleId` live on
  `AttendanceOccurrence`, NOT on `Attendance` (which holds only `OccurrenceId`). Always navigate
  via `a.Occurrence.*`. `Attendance.DeviceId` = the kiosk/station. `RootGroupTypeId` on the
  occurrence = the check-in area (the "event").

### Session state (the "active billboard")
- The current PCO app holds this in process RAM (lost on restart). For Rock we **persist it**:
  an `ActiveSession` concept (active GroupType + date + who started it) stored either as block
  attributes or a single-row plugin table, so it survives app-pool recycles. (D5.)

## Conventions (match the PCO Migration plugin — proven)

- Allman braces, spaces inside parens (`Method( arg )`), `///` XML docs on public members.
- Box-drawing section dividers (`// ─── Section ───`).
- Comments explain **why**, especially defensive code.
- Namespace root `com.gracefellowship.Arrivals`, subfolders → sub-namespaces.
- `[BlockTypeGuid]` on block classes; `[TextField]/[IntegerField]/[EncryptedTextField]` for
  block attributes; keys in a private `AttributeKey` nested class (no magic strings).
- `ConfigureAwait(false)` on every `await` if any async is introduced (WebForms sync-over-async
  deadlocks otherwise — inherited lesson from PCO Migration D4).

## Build/deploy loop (Mac edits → Windows builds)

1. Mac: edit → `git commit && git push`
2. Windows VM: `git pull && build-plugin.bat` (or `build-package.bat` for manual deploys)
3. Windows: `.plugin` → Rock `App_Data\Packages\` → install via Rock UI (migrations auto-run);
   OR copy DLL→`Rock\bin\`, `.ascx`→`Rock\Plugins\com_gracefellowship_Arrivals\Blocks\`, recycle app pool.
4. Browser: load the page, watch for "Server Error".

## iCloud warning

This folder is under `~/Documents` (iCloud Drive) → **can be evicted/wiped without warning**.
**GitHub is the source of truth.** Commit+push after meaningful changes. If the folder is
empty, re-clone from `https://github.com/jersilb1400/pco-arrivals-billboard.git`. (Inherited L8.)
`git add` may hang — run `git config core.fsmonitor false && git config core.untrackedcache false`,
and guard adds with a timeout.

## Glossary

- **Session** (our sense) — the admin-launched "active billboard": a chosen check-in GroupType +
  date that the kiosk and billboard share. Not a Rock user session.
- **GroupType** — Rock's check-in area/type (the old PCO "Event"). e.g. "Weekend Kids."
- **Group** — a classroom/room/roster within a GroupType (old PCO "location/room").
- **AttendanceCode** — Rock's security/pickup code (old PCO "security code"). One per family
  check-in session, shared across kids. Alphanumeric, unique-per-day.
- **Device** — a Rock kiosk/station (old PCO "station"). `Attendance.DeviceId` links a check-in
  to the station that did it.
- **Active / currently checked in** — `DidAttend == true && EndDateTime == null` (Rock's own
  canonical "still in room" predicate). Codes recycle daily.

## Reference assets (reusable from prior research)

- `ROCK_RMS_MIGRATION_PLAN.html` (this repo, untracked) — its **PCO→Rock concept map** and
  **Rock OData gotchas** section are sound; its "keep the Node app" architecture is NOT what
  we're doing. Salvage the concept map, ignore the architecture.
- Sibling plugin `~/Documents/Grace Fellowship Info/pco-rock-migration` — the template. Its
  `.context/` has 8 decisions + 8 lessons; the csproj, build scripts, migration pattern, block
  pattern, and Guids.cs pattern are the gold standard to clone.
