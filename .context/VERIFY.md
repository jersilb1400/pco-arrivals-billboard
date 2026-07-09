# Verification — How We Know Work Is Correct

> No task is "done" until its check tier has been run. Checks live in `.context/checks/`.
> This plugin builds on a **Windows 11 ARM VM** on the Mac (Rock + MSBuild + IIS), not on
> macOS directly. (The Azure Windows Server VM was decommissioned 2026-07-09 for cost; see
> `WINDOWS_VM_SETUP.md`.) So the "fast tier" is split: a Mac-runnable source check, and a
> Windows-only build/deploy run.

## Fast tier — run before declaring ANY task done

### On this Mac (source-level, seconds)
```bash
bash .context/checks/source_sanity.sh
```
What it catches: forbidden references (DotLiquid/Rock.Lava.Shared), `<Private>true</Private>`
regressions, lowercase/non-canonical GUIDs, version drift between csproj and build scripts,
DLL-into-Plugins packaging mistakes. It can't prove correctness, but blocks known scar-tissue.

### On the Windows ARM VM (build + smoke)
```powershell
build-plugin.bat
```
Must end with a `.plugin` file in `PluginStaging\` and zero build errors. (First build after a
PackageReference change, run `msbuild <csproj> /t:Restore` first.) If MSBuild isn't found, ensure
VS Build Tools are installed, or pass the path manually.

## v19.1 compatibility tier — the primary goal
Verify live against Rock RMS 19.1 on the Windows VM / Azure SQL, once the plugin renders:

- [ ] Build succeeds against Rock v19.1 `bin\` — zero errors, zero warnings
- [ ] No new compile warnings about deprecated Rock APIs
- [ ] DLL loads in Rock 19.1 runtime; block UI renders; no "Server Error" / OData collision (L1)
- [ ] `RockMigrationHelper.AddBlockType/AddPage/AddBlock` resolve (pages/blocks appear in Rock)
- [ ] EF6 `RockContext` queries against `Attendance`/`AttendanceCode`/`AttendanceOccurrence` work
- [ ] Raw-SQL `RockContext.Database.SqlQuery<T>` works for the plugin's own tables (D4)
- [ ] Rock security on the admin block correctly gates non-admins (D6)

## Task-type map
| Task type | Required checks |
|---|---|
| Trivial (comment, typo, doc) | Fast tier (Mac) only |
| Code change (query, block logic, DTO) | Fast tier (Mac) + Windows build + manual Rock smoke |
| Anything in `Migrations/` | Release tier: migration checklist — near-irreversible on installed instances |
| Packaging / version bump | Release tier: release verification checklist |
| Anything touching the pickup loop or security-code lookup | Full end-to-end pickup simulation (below) |

## Checklists (for what can't be scripted)

### Manual Rock smoke (after a code change)
Run on the Windows ARM VM with a Rock v19 instance that has check-in data (or create test check-ins):
- [ ] `build-plugin.bat` succeeds, no errors
- [ ] `.plugin` installs via Rock UI (or DLL→`Rock\bin\`, `.ascx`→`Plugins\...\Blocks\`), app pool recycled
- [ ] Admin page loads without "Server Error"; GroupType/date selectors populate from Rock
- [ ] Billboard page loads; shows empty state ("No children waiting")
- [ ] Kiosk page loads; security-code field accepts input

### End-to-end pickup simulation (the core loop — the MUST-PASS)
This is the single most important verification. Requires a Rock instance with Rock Check-in active
and at least one family checked in.
- [ ] **Setup:** Admin selects the check-in GroupType + today's date → "Launch Billboard"
- [ ] **Lookup:** At the kiosk, enter a valid security code from a checked-in family's tag
  → the correct child(ren) appear; response confirms child name + room
- [ ] **Multi-child:** A code covering siblings returns ALL of them (L5), not just one
- [ ] **Push to billboard:** Within ~10s, the child's card appears on the Billboard display
- [ ] **Chime:** A chime sounds on the billboard when a NEW card appears (not on initial load)
- [ ] **Sync:** Open the billboard in a 2nd browser window → the card appears there too within poll interval
- [ ] **Wrong code:** Entering a bogus code shows a clear "no match" message, no crash
- [ ] **Already-checked-out:** Entering a code whose attendance has `EndDateTime` set → no match (L3)
- [ ] **Checkout removal:** Check the child OUT in Rock (or set `EndDateTime`) → card auto-removes from
      the billboard within ~1 poll cycle
- [ ] **Stale sweep:** Notifications older than the configured TTL are swept by the cleanup job
- [ ] **Recycle survival:** Recycle the app pool mid-session → the active session + queue persist (D5)

### Location-status / colors (phase 2)
- [ ] Location Status page lists all rooms with child counts, sorted descending
- [ ] Admin-assigned room colors drive the card border color on the billboard
- [ ] Admin-assigned station icons/colors appear as the badge on the card

### Migration checklist (anything in `Migrations/`)
- [ ] `[MigrationNumber( N, "1.19.0" )]` set and N is the next unused integer (never renumber — L5 in PCO plugin)
- [ ] `Up()` is idempotent (`IF NOT EXISTS` guards) so re-applies are safe
- [ ] `Down()` reverses `Up()` cleanly (`DropTable`, `RockMigrationHelper.DeleteBlock/DeletePage/DeleteBlockType`)
- [ ] Tested on a Rock instance with prior migrations applied (upgrade path) AND on a fresh install
- [ ] Table includes Rock-standard columns: `Guid`, `CreatedDateTime`, `ModifiedDateTime`,
      `CreatedByPersonAliasId`, `ModifiedByPersonAliasId`, `ForeignKey`, `ForeignGuid`, `ForeignId`
      + named `DEFAULT` constraints (`DF_<table>_<col>`) + clustered PK

### Release verification checklist (before shipping a `.plugin`)
- [ ] Version bumped in BOTH `com.gracefellowship.Arrivals.csproj` AND `build-plugin.bat` (they drift)
- [ ] README/USER_GUIDE version strings match the csproj version
- [ ] `build-plugin.bat` produces `PluginStaging\com.gracefellowship.Arrivals-v<ver>.plugin`
- [ ] `.plugin` contents verified: `bin\com.gracefellowship.Arrivals.dll` + `Plugins\com_gracefellowship_Arrivals\Blocks\*.ascx(+.cs+.designer.cs)`
- [ ] DLL is in `bin\` inside the `.plugin`, NOT under `Plugins\` (L1)
- [ ] Fresh-install smoke: install `.plugin` on a clean Rock v19, migrations run, page loads
- [ ] `SystemGuid/Guids.cs` unchanged from prior release (immutable — CONTEXT hard constraint)

## Check script index
| Script | Verifies | When to run | Origin |
|---|---|---|---|
| `checks/source_sanity.sh` | Forbidden refs, GUID format, copy-local, version drift, DLL-in-Plugins | Fast tier, every task | L1, release-prep |

## Plausible-but-wrong watchlist
> Failure modes most likely to slip past casual review in this project.
- **"Build succeeded" but change never took effect** — stale DLL still in `Rock\bin\` because the app
  pool wasn't recycled, or files copied to the wrong path. Always recycle after deploy.
- **Query returns 0 kids for a valid code** — (a) date mismatch (codes recycle daily — compare
  against `OccurrenceDate`); (b) `EndDateTime` already set (already checked out); (c) code compared
  case-sensitively (codes are uppercase — `.ToUpper()` the input); (d) queried `Attendance.GroupId`
  instead of `Attendance.Occurrence.GroupId` (L2) and got nothing.
- **"Duplicate" children for one code** — NOT a bug; one code covers siblings (L5). Don't dedupe.
- **Card never disappears after checkout** — the poll's checkout re-check isn't firing, or the cleanup
  job isn't registered. Verify the `[BlockAction]` poll re-queries `EndDateTime`.
- **Queue wiped on app-pool recycle** — state was in RAM, not the DB (D5 violated). Persist it.
- **OData "same key" error on install** — DLL landed in `Plugins\` instead of `bin\` (L1).
