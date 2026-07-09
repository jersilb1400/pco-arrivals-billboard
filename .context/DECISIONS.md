# DECISIONS — Grace Arrivals Billboard (Rock RMS Plugin)

> Append-only, numbered. Never delete — supersede with a new entry. Every decision records the
> rejected alternative and why, so it isn't relitigated. `[reconstructed]` = derived after the fact.

---

## D1 — Build as a native Rock RMS plugin, not a Rock-API-consuming Node app
Chosen: A C# WebForms Rock plugin (`.plugin` package) installed into Rock — blocks render
inside Rock, read Rock data directly via EF/RockContext, use Rock's auth/security.
Rejected: The existing `ROCK_RMS_MIGRATION_PLAN.html` approach (keep the Node/Express/React app
and just point it at Rock's REST API). That keeps a separate hosting stack (Render/Mongo/Node),
duplicates Rock's auth, and doesn't use any Rock UI/security features. The user explicitly wants
*this functionality as a Rock plugin, not PCO*. A native plugin is the only thing that satisfies
"accomplish all the same functions but in Rock RMS."
Revisit if: never — this is the founding decision.

## D2 — WebForms `.ascx` blocks, NOT Obsidian (Vue 3)
Chosen: WebForms `Rock.Web.UI.RockBlock` + `.ascx`, cloned from the proven PCO Migration plugin.
Rejected: Obsidian (Rock's v19 Vue 3 framework). Source-verified findings:
- `IRockObsidianBlockType` is decorated `[RockInternal("1.13", true)]` — the `true` means
  "keep internal forever... should not be used in plug-ins" (Rock's own words).
- No third-party Obsidian plugin exists on GitHub; no SDK, project template, or packaging path.
- `@Obsidian/*` webpack aliases live in Rock's private build pipeline (`package.json` `private:true`).
- Using Obsidian would violate Rock's compatibility contract and risk breakage on every upgrade —
  directly contradicting the user's "easy to update as new Rock versions are released" priority.
GLM-5.2 advisor independently agreed. WebForms is actually the *more* upgrade-safe choice for a
plugin (present in v20-pre; Obsidian is closed to us).
Revisit if: Rock publishes a public third-party Obsidian SDK and un-marks the interface internal.

## D3 — Real-time: HTTP polling first (5–10s), architect for SignalR later
Chosen: Billboard/admin poll a `[BlockAction]` endpoint every 5–10s returning a lightweight diff.
All data access behind `IPickupQueueService` so a future SignalR `RealTimeTopic` plugs in cleanly.
Rejected (for now): Building on Rock's RealTime Topic API from day one. Source-verified findings:
- The server-side API IS public and clean (`[RealTimeTopic]` + `Topic<TClient>`, auto-discovered
  by reflection over plugin assemblies, pushed via `RealTimeHelper.GetTopicContext<T>()`, routed
  through Rock's single `/rock-rt` hub — these are NOT marked internal).
- BUT the JS client for `/rock-rt` is Obsidian-oriented (TypeScript, bundled with the Vue framework).
  There is NO shipped WebForms/`.ascx` recipe for connecting to `/rock-rt`. Zero third-party precedent.
- Nearby classes (`AspNetEngineStartup`, `RealTimeHelper.SendMessageAsync`) ARE `[RockInternal]`.
- Latency tolerance for a pickup queue is *seconds*, not ms — polling is adequate.
GLM-5.2 advisor confirmed: "Ship with polling. The client is the bottleneck... don't let an AI
talk you into the SignalR route." Also flagged the `IPickupQueueService` abstraction as the key
enabler for a seamless later switch.
User chose "Polling first, SignalR later."
Revisit if: Rock ships a WebForms RealTime client recipe, or we genuinely need sub-second push.

## D4 — Persist plugin state via raw SQL on `RockContext.Database`, not EF entity registration
Chosen: Plugin-owned tables (notifications queue, active session, color/icon config) accessed via
`RockContext.Database.SqlQuery<T>` / `ExecuteSqlCommand` with `SqlParameter`s, matching POCOs.
Rejected: Registering plugin entities in Rock's EF model (`DbSet<>`). The PCO Migration plugin
deliberately avoided this ("plugin entities on some Rock versions") and used raw SQL successfully,
verified on 19.1.8. Raw SQL sidesteps model-registration fragility and Rock-version EF changes.
Revisit if: a future Rock version breaks `Database.SqlQuery` (none known through 19.1).

## D5 — Persist active-session + notification state to DB, not in-process RAM
Chosen: Store the "active billboard" (GroupType + date + started-by) and the pickup-notification
queue in plugin DB tables, so they survive app-pool recycles and IIS restarts.
Rejected: In-process RAM (`HttpRuntime.Cache` / static vars), which is how the source PCO app did it.
IIS recycles app pools on a schedule and during idle — a Sunday-morning recycle would wipe the
queue mid-service. The PCO Migration plugin hit exactly this class of bug ("frozen progress bar"
when cache cleared mid-migration) and fixed it by persisting to DB (its D5/L4). We learn from that.
Revisit if: never — recycling is inherent to IIS; RAM-only state is a known failure mode.

## D6 — Security model: public kiosk + billboard; admin gated by Rock role
Chosen: Kiosk and Billboard blocks render with no login (they run on dedicated devices in kiosk
mode). Admin block is gated by Rock security roles (the block's security settings / a configured
role like "Staff" or a custom role). No custom auth layer, no Turnstile (Rock handles bot
protection at the platform level; kiosk is a trusted device).
Rejected: (a) Everything behind Rock login (friction at the kiosk), (b) keeping the source app's
static-API-key + JSON-allowlist + Cloudflare-Turnstile model (redundant inside Rock — Rock has
native auth/roles/security). User chose "Public kiosk + billboard."
Revisit if: the kiosk is ever exposed on an untrusted network (then add Rock page security).

## D7 — No check-in data is written by this plugin (read-only against Rock Check-in)
Chosen: The plugin only READS `Attendance`/`AttendanceCode`/`Device`. It never creates or modifies
check-in records. Checkout is performed by Rock's own check-out flow (sets `EndDateTime`); the
plugin detects it and removes the kid from the pickup queue.
Rejected: Having the plugin perform check-out. That's Rock's job; duplicating it risks data
inconsistency and is out of scope for a "billboard." The source app also did not write check-ins.
Revisit if: a future requirement wants checkout from the billboard (then use Rock's check-out APIs).
