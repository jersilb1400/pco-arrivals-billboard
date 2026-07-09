#!/usr/bin/env bash
# source_sanity.sh — fast, Mac-runnable source guard for the Grace Arrivals Billboard plugin.
# What it checks: forbidden references (DotLiquid/Rock.Lava), immutable GUID format,
#   Copy Local regressions on Rock assemblies, version-string drift across csproj + build scripts,
#   and DLL-into-Plugins packaging mistakes.
# Why: encodes the scar tissue in LESSONS.md (L1, L4) and the release checklist in VERIFY.md.
#   Cannot build the plugin (needs Windows/MSBuild/Rock assemblies), but blocks the known
#   regressions before handing off to the Windows VM.
# Exit 0 = pass, non-zero = fail. Run: bash .context/checks/source_sanity.sh

set -u
cd "$(dirname "$0")/../.." || exit 2  # project root
fail=0
say() { printf '%s\n' "$*"; }
err() { printf 'FAIL: %s\n' "$*" >&2; fail=1; }

CSPROJ="com.gracefellowship.Arrivals.csproj"

# ── 0. Does the project skeleton exist yet? ────────────────────────────────
if [ ! -f "$CSPROJ" ]; then
  say "NOTE: $CSPROJ not found yet — plugin skeleton not created. Skipping build checks."
  say "      (Re-run once the csproj exists.)"
  # Still exit 0 so early scaffolding commits aren't blocked; the check grows teeth later.
  exit 0
fi

# ── 1. Forbidden references ─────────────────────────────────────────────────
# Rock v19 dropped DotLiquid + Rock.Lava.Shared; referencing them = plugin won't load (D1/D2).
# Match only actual reference declarations, NOT comments that mention them by name.
forbidden=$(grep -rnE '<(Reference|PackageReference)\s+Include="(DotLiquid|Rock\.Lava\.Shared)"' \
  --include="*.cs" --include="*.csproj" . || true)
if [ -n "$forbidden" ]; then
  say "$forbidden"
  err "Found a DotLiquid / Rock.Lava.Shared <Reference>/<PackageReference>. Must NOT be referenced on Rock v19."
else
  say "OK: no DotLiquid / Rock.Lava.Shared references (comments mentioning them are fine)."
fi

# ── 2. Rock assembly references must be Copy Local = false ──────────────────
# They live in Rock's bin\; shipping duplicates causes load conflicts (CONTEXT hard constraints).
# Assert the invariant: every <Private> in the csproj must be false.
priv_true=$(grep -cE "<Private>\s*[Tt]rue\s*</Private>" "$CSPROJ" || true)
if [ "${priv_true:-0}" -gt 0 ]; then
  err "Found <Private>true</Private> in $CSPROJ. Rock/Json refs must be Copy Local = false."
else
  say "OK: all <Private> settings are false (no duplicate-shipped deps)."
fi

# ── 3. Immutable GUIDs: format check ────────────────────────────────────────
# These must never change after first install. Enforce canonical uppercase 8-4-4-4-12 format.
if [ ! -f "SystemGuid/Guids.cs" ]; then
  say "NOTE: SystemGuid/Guids.cs not found yet — skipping GUID format check."
else
  guid_re='[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}'
  if ! grep -qE "\"$guid_re\"" SystemGuid/Guids.cs 2>/dev/null; then
    err "SystemGuid/Guids.cs is missing or GUIDs aren't uppercase canonical format."
  elif grep -qE "\"[0-9a-f]{8}-[0-9a-f]{4}-" SystemGuid/Guids.cs; then
    err "Found a lowercase GUID in SystemGuid/Guids.cs — must be uppercase."
  else
    say "OK: SystemGuid GUIDs are uppercase canonical format."
  fi
fi

# ── 4. Version consistency across csproj / build-plugin.bat / build-package.bat ─
csproj_ver=$(grep -oE '<Version>[^<]+</Version>' "$CSPROJ" | head -1 | sed -E 's/<\/?Version>//g')
bat_vers=""
for b in build-plugin.bat build-package.bat; do
  if [ -f "$b" ]; then
    v=$(grep -oE 'set VERSION=[0-9.]+' "$b" | head -1 | cut -d= -f2)
    [ -n "$v" ] && bat_vers="$bat_vers $b=$v"
  fi
done
if [ -z "$csproj_ver" ]; then
  err "Couldn't read <Version> from $CSPROJ."
elif [ -z "$(echo $bat_vers | tr -d ' ')" ]; then
  say "NOTE: no build-*.bat found yet — skipping version-consistency check (csproj=$csproj_ver)."
else
  mismatch=0
  for pair in $bat_vers; do
    f="${pair%=*}"; v="${pair#*=}"
    if [ "$v" != "$csproj_ver" ]; then
      err "Version drift: $f=$v but csproj=$csproj_ver (must match)."
      mismatch=1
    fi
  done
  [ "$mismatch" -eq 0 ] && say "OK: version consistent ($csproj_ver) in csproj and build scripts."
fi

# ── 5. No stray plugin DLL in a Plugins\ packaging target ───────────────────
# L1: the plugin DLL must end up in bin\, never Plugins\.
if grep -niE 'com\.gracefellowship\.Arrivals\.dll.*Plugins\\|Plugins\\.*com\.gracefellowship\.Arrivals\.dll' \
    build-plugin.bat build-package.bat install-to-rock.bat 2>/dev/null ; then
  err "A packaging script copies the plugin DLL into Plugins\ — it must go to bin\ only (L1)."
else
  say "OK: packaging scripts do not put the DLL in Plugins\."
fi

# ── Result ──────────────────────────────────────────────────────────────────
echo ""
if [ "$fail" -eq 0 ]; then
  say "PASS — source sanity checks clean. (This does NOT prove it builds/runs; do that on the Windows VM.)"
  exit 0
else
  say "FAIL — fix the issues above before building on the Windows VM."
  exit 1
fi
