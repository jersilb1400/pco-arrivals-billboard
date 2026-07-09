# LESSONS — Grace Arrivals Billboard (Rock RMS Plugin)

> Append-only. Unit of a lesson = RULE + TRIGGER (not a story). Each prevents a specific repeat.

---

## L1 — Plugin DLL goes in `Rock\bin\`, NEVER `Rock\Plugins\`. `.ascx` go under `Rock\Plugins\`.
**Trigger:** Any deployment, packaging, `build-plugin.bat`/`build-package.bat` edit, or copy-target
change. Also: diagnosing "An item with the same key has already been added" (OData collision).
**Rule:** The DLL in `Plugins\` causes Rock's OData model builder to scan plugin types and throw
the key-collision error. The `.ascx` block files go under `Plugins\com_gracefellowship_Arrivals\Blocks\`;
the compiled DLL goes in `bin\` only. Verify after every deploy. Inherited from the PCO Migration plugin.

## L2 — `GroupId`/`LocationId`/`ScheduleId` live on `AttendanceOccurrence`, NOT on `Attendance`
**Trigger:** Writing ANY LINQ/EF query against check-in data, or reading any tutorial/blog that
shows these as `Attendance` properties. They aren't there — `Attendance` holds only `OccurrenceId`.
**Rule:** Always navigate via `a.Occurrence.Group`, `a.Occurrence.Location`, `a.Occurrence.Schedule`,
`a.Occurrence.OccurrenceDate`, `a.Occurrence.RootGroupTypeId`. Use `.Queryable("Occurrence.Group,...")`
to eager-load. The old migration plan's OData examples got this right (via `$expand=Occurrence($expand=Group)`);
don't "simplify" by assuming flat fields. Source-verified from `Rock/Model/Event/Attendance/Attendance.cs`.
The one field you DO read straight off `Attendance` for the station: `Attendance.DeviceId`.

## L3 — "Still checked in" = `DidAttend == true && EndDateTime == null` (Rock's canonical predicate)
**Trigger:** Any query for active/checked-in children, or any confusion between `DidAttend`,
`EndDateTime`, `PresentDateTime`, and `CheckInStatus`.
**Rule:** `EndDateTime == null` is necessary and is what Rock's own capacity code uses. `DidAttend`
is about whether they came at all (not check-out). Checkout sets `EndDateTime` and
`CheckedOutByPersonAliasId`; it does NOT touch `DidAttend`. For a stricter "live right now" test,
`Attendance.IsCurrentlyCheckedIn` also checks schedule-active + start-within-2-days + timezone —
use it in memory after materializing, or just rely on `EndDateTime == null` for the queue. Code
recycles daily, so always pair a security-code lookup with the occurrence date. Source-verified.

## L4 — `git add` hangs in this iCloud-synced folder; disable fsmonitor + guard with a timeout
**Trigger:** Any `git add` in this project (folder is under `~/Documents` = iCloud Drive).
**Rule:** (1) `git config core.fsmonitor false && git config core.untrackedcache false`.
(2) Wrap every add: `perl -e 'alarm 60; exec @ARGV' git add <paths>`. If `index.lock` is stale,
`rm -f .git/index.lock`; kill orphan PIDs with `kill -9`. Root cause: iCloud file-provider locks.
Inherited from the PCO Migration plugin (its L6).

## L5 — One `AttendanceCode` covers ALL kids in a family — that's the pickup lookup, not a bug
**Trigger:** Seeing a security-code query return multiple children and assuming a duplicate bug.
**Rule:** Rock creates ONE `AttendanceCode` per family check-in session and assigns it to every
child's `Attendance.AttendanceCodeId` (verified in `SaveAttendance.cs`). So querying
`AttendanceCode.Code == X` naturally returns siblings. The source PCO app relied on the same
semantics (a code maps to household children). Do not "deduplicate" this away.

## L6 — Don't trust the rendered Rock community docs site; verify against the GitHub source
**Trigger:** Looking up a Rock entity field, API signature, or "how feature X works."
**Rule:** `community.rockrms.com` is a JS SPA (often uncrawlable, sometimes stale). The
authoritative spec is the source: `github.com/SparkDevNetwork/Rock`, branch **`develop`** (NOT
`main` — `main` doesn't exist; raw `main` URLs 404). Entity files live under
`Rock/Model/<category>/<Entity>/<Entity>.cs` (reorganized ~v15, NOT flat `Rock.Model/`). When this
project's web tools are rate-limited, fall back to GitHub raw + the reference plugin's verified notes.
Keep a citation when a non-obvious fact is load-bearing.

## L7 — iCloud can wipe this folder at any time; GitHub is the source of truth
**Trigger:** Project directory looks empty / files missing / `.git` disappears.
**Rule:** Re-clone to a temp dir and copy back: `git clone <remote> /tmp/restore && cp -R
/tmp/restore/. <project-dir>/`. Uncommitted work is one sync conflict from loss — commit+push
frequently. The entire PCO Migration project vanished mid-session once. Inherited.

## L8 — Polling endpoint must return a DIFF, not a full payload, and be cheap
**Trigger:** Writing the billboard `[BlockAction]` polling endpoint, or noticing the TV display
slowing down / fan spinning during a service.
**Rule:** Every 5–10s, multiple screens poll. Return only the active-notification list (ids + child
name + code + room + time + station) for the current session — JSON, no HTML re-render. Use
`[BlockAction]` (Rock's lightweight AJAX action), not a full postback. Re-query Rock with a short
TTL cache so 5 billboards polling don't fan out to 5× the DB load. GLM-5.2 flagged this explicitly.

## L9 — Keep ALL check-in data access behind `IPickupQueueService` / `IRockCheckInQueryService`
**Trigger:** Temptation to inline an EF query directly in a block's `.ascx.cs` or the polling action.
**Rule:** Both the WebForms block and the polling endpoint (and a future SignalR topic) must consume
the same service interface. This is what makes "polling now → SignalR later" a small change instead
of a rewrite. Inline queries couple rendering to data access and block the upgrade path. GLM-5.2 advice.
