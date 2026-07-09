<%@ Control Language="C#" AutoEventWireup="true"
    CodeFile="Billboard.ascx.cs"
    Inherits="com.gracefellowship.Arrivals.Blocks.Billboard" %>

<%@ Register Namespace="Rock.Web.UI.Controls" Assembly="Rock" TagPrefix="Rock" %>

<asp:HiddenField ID="hfPollUrl" runat="server" />
<asp:HiddenField ID="hfHasSession" runat="server" Value="false" />

<div class="arrivals-billboard">
    <!-- ─── Header (event name + date + sound controls) ─── -->
    <div class="arrivals-header">
        <div class="arrivals-header-title">
            <h1 id="billboardTitle">Loading&hellip;</h1>
            <p id="billboardSubtitle" class="arrivals-subtitle"></p>
        </div>
        <div class="arrivals-sound-controls">
            <button type="button" id="btnTestSound" class="btn btn-default arrivals-sound-btn" title="Test the chime">
                <i class="fa fa-volume-up"></i>
            </button>
            <button type="button" id="btnToggleSound" class="btn btn-default arrivals-sound-btn" title="Sound on/off">
                <i class="fa fa-volume-up" id="soundIcon"></i>
            </button>
        </div>
    </div>

    <!-- ─── Card grid (populated by JS from the polling endpoint) ─── -->
    <div id="billboardGrid" class="arrivals-grid">
        <div class="arrivals-empty" id="billboardEmpty">
            <i class="fa fa-spinner fa-pulse fa-3x"></i>
            <p>Loading pickup requests&hellip;</p>
        </div>
    </div>
</div>

<!-- ─── Client-side polling + chime + rendering ─── -->
<!-- The chime is Web-Audio-synthesized (ported from the original React app's
     SimpleBillboard.js: 3-note descending 800→1000→600Hz sine, gain envelope).
     Browser-native, works in any .ascx script block, no asset file needed. -->
<script>
(function () {
    var POLL_INTERVAL_MS = 10000;             // 10-second refresh
    var SOUND_PREF_KEY = 'billboardSoundEnabled';
    var previousCount = 0;                    // for chime-on-increment detection
    var audioCtx = null;
    var pollTimer = null;
    var grid = document.getElementById('billboardGrid');
    var emptyEl = document.getElementById('billboardEmpty');
    var titleEl = document.getElementById('billboardTitle');
    var subtitleEl = document.getElementById('billboardSubtitle');
    var pollUrl = document.getElementById('<%= hfPollUrl.ClientID %>').value;
    var hasSession = document.getElementById('<%= hfHasSession.ClientID %>').value === 'true';

    // ─── Sound (Web Audio API) ──────────────────────────────────────────
    function getAudioCtx() {
        if (!audioCtx) {
            var Ctx = window.AudioContext || window.webkitAudioContext;
            if (Ctx) audioCtx = new Ctx();
        }
        // Browsers suspend AudioContext until a user gesture; resume on demand.
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    function playChime() {
        if (!soundEnabled()) return;
        var ctx = getAudioCtx();
        if (!ctx) return;
        // 3-note descending sequence: 800 → 1000 → 600 Hz, sine, 0.1s steps.
        var notes = [800, 1000, 600];
        var now = ctx.currentTime;
        notes.forEach(function (freq, i) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            var start = now + (i * 0.1);
            // Gain envelope: 0.3 → 0.01 over 0.5s.
            gain.gain.setValueAtTime(0.3, start);
            gain.gain.exponentialRampToValueAtTime(0.01, start + 0.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.5);
        });
    }

    function soundEnabled() {
        var v = localStorage.getItem(SOUND_PREF_KEY);
        // Default ON; localStorage stores 'true'/'false' strings.
        return v === null ? true : v === 'true';
    }

    function setSoundEnabled(enabled) {
        localStorage.setItem(SOUND_PREF_KEY, enabled ? 'true' : 'false');
        updateSoundIcon();
    }

    function updateSoundIcon() {
        var icon = document.getElementById('soundIcon');
        if (icon) {
            icon.className = soundEnabled() ? 'fa fa-volume-up' : 'fa fa-volume-off';
        }
    }

    // ─── Animal emoji per child (deterministic by name — ported from the React app) ───
    var EMOJIS = ['🦄','🐻','🐼','🦊','🐨','🐸','🦁','🐯','🐰','🐶','🐱','🐵','🦉','🐙','🦋','🐝'];
    function emojiFor(name) {
        if (!name) return '⭐';
        var len = name.length;
        return EMOJIS[len % EMOJIS.length];
    }

    function escapeHtml(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function formatTime(iso) {
        if (!iso) return '';
        var d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        var h = d.getHours();
        var m = d.getMinutes();
        var ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12; if (h === 0) h = 12;
        return h + ':' + (m < 10 ? '0' + m : m) + ' ' + ampm;
    }

    // ─── Render the cards from the polling response ─────────────────────
    function renderNotifications(notifications) {
        grid.innerHTML = '';
        if (!notifications || notifications.length === 0) {
            grid.innerHTML = '<div class="arrivals-empty">'
                + '<i class="fa fa-child fa-3x" style="opacity:0.4;"></i>'
                + '<p>No children waiting for pickup</p>'
                + '<p class="arrivals-subtitle">Children will appear here when their security code is entered at the kiosk.</p>'
                + '</div>';
            return;
        }
        notifications.forEach(function (n) {
            var card = document.createElement('div');
            card.className = 'arrivals-card';
            var stationBadge = n.StationName
                ? '<div class="arrivals-station"><i class="fa fa-desktop"></i> ' + escapeHtml(n.StationName) + '</div>'
                : '';
            card.innerHTML =
                '<div class="arrivals-card-emoji">' + emojiFor(n.ChildName) + '</div>'
                + '<div class="arrivals-card-name">' + escapeHtml(n.ChildName) + '</div>'
                + '<div class="arrivals-card-code">' + escapeHtml(n.SecurityCode) + '</div>'
                + '<div class="arrivals-card-meta">'
                +   '<span>' + formatTime(n.NotifiedAt) + '</span>'
                +   (n.LocationName ? ' &nbsp;&bull;&nbsp; <span>' + escapeHtml(n.LocationName) + '</span>' : '')
                + '</div>'
                + stationBadge;
            grid.appendChild(card);
        });
    }

    // ─── Poll the block-served JSON endpoint ────────────────────────────
    function poll() {
        if (!pollUrl) return;
        fetch(pollUrl, { credentials: 'same-origin' })
            .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
            .then(function (data) {
                // Session header
                if (data.Session) {
                    titleEl.textContent = data.Session.GroupTypeName || 'Pickup Billboard';
                    var d = new Date(data.Session.OccurrenceDate);
                    subtitleEl.textContent = isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined,
                        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                }
                var notifications = data.Notifications || [];
                renderNotifications(notifications);

                // Chime when the count INCREASES (a new arrival) — but not on the very first
                // load (previousCount === 0), so reloading the page doesn't blast every card.
                if (previousCount > 0 && notifications.length > previousCount) {
                    playChime();
                }
                previousCount = notifications.length;
            })
            .catch(function () {
                // Network/app-pool recycle — show a transient empty state; next poll retries.
                if (previousCount === 0) {
                    grid.innerHTML = '<div class="arrivals-empty"><i class="fa fa-plug fa-3x" style="opacity:0.4;"></i><p>Reconnecting&hellip;</p></div>';
                }
            });
    }

    // ─── Wire up ────────────────────────────────────────────────────────
    document.getElementById('btnTestSound').addEventListener('click', function () {
        // Force-enable for this test (browsers require a gesture to start audio).
        var ctx = getAudioCtx();
        if (ctx) {
            var notes = [800, 1000, 600];
            var now = ctx.currentTime;
            notes.forEach(function (freq, i) {
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                var start = now + (i * 0.1);
                gain.gain.setValueAtTime(0.3, start);
                gain.gain.exponentialRampToValueAtTime(0.01, start + 0.5);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(start); osc.stop(start + 0.5);
            });
        }
    });
    document.getElementById('btnToggleSound').addEventListener('click', function () {
        setSoundEnabled(!soundEnabled());
    });
    updateSoundIcon();

    if (hasSession) {
        poll();                                     // immediate first render
        pollTimer = setInterval(poll, POLL_INTERVAL_MS);
    } else {
        titleEl.textContent = 'No Active Billboard';
        subtitleEl.textContent = 'An admin needs to start a session first.';
        grid.innerHTML = '<div class="arrivals-empty"><i class="fa fa-info-circle fa-3x" style="opacity:0.4;"></i><p>No active billboard session.</p></div>';
    }
})();
</script>
