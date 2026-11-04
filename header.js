/* MIB Terminal: the one menu bar of every page (2026-11-03, owner: "when clicking on a page a different menu is
   changing, not looking good at all"). The homepage, the week, the archive, the about pages and the arcade all load
   this file, so the bar is the same everywhere: Today · News · Money · Calendar · Deep dive · The Week · Archive ·
   Arcade, and the gold Lounge. On the homepage the section links scroll; elsewhere they open the homepage there.
   <script src="/header.js" data-active="today|week|archive|arcade|page"></script>, first thing in <body>.
   2026-11-04 (owner's list): the bar stays on screen (fixed, not sticky), light/dark switch, Français (the browser's
   own translation through Google's page translator), your name and a funny avatar (shared with the arcade and the
   chat), who is online right now, install on the home screen, share with a friend, privacy. */
(function () {
  "use strict";
  var me = document.currentScript, active = (me && me.dataset.active) || "page";
  var home = location.pathname === "/" || location.pathname === "/index.html";
  var API = window.MIB_CHAT_API || "https://mib-arcade.terminalmib.workers.dev";
  var ls = function (k, v) { try { if (v === undefined) return localStorage.getItem(k) || ""; if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return ""; } };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var AV = ["🦊", "🐸", "🐼", "🦁", "🐙", "🤖", "👽", "🦄", "🐵", "🐯", "🐧", "🦖", "🐻", "🐷", "🦉", "🐳", "🦈", "🐲", "🥷", "🧙", "🤠", "🧛", "🦸", "💀"];
  window.MIB_AV = AV;
  // the theme: the viewer's choice wins over the phone's setting, kept in this browser
  var th = ls("mib-theme"); if (th) document.documentElement.setAttribute("data-theme", th);
  if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Archivo"]')) {
    var f = document.createElement("link"); f.rel = "stylesheet";
    f.href = "https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Source+Sans+3:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap";
    document.head.appendChild(f);
  }
  if (!document.querySelector('link[rel="manifest"]')) { var mf = document.createElement("link"); mf.rel = "manifest"; mf.href = "/site.webmanifest"; document.head.appendChild(mf); }
  var css = document.createElement("style");
  css.textContent = [
    ".mibbar{--mb-bg:#ffffff;--mb-ink:#0f172a;--mb-muted:#5b6474;--mb-raised:#eef1f6;--mb-line:#e1e5ec;--mb-brand:#e8a317;--mb-up:#0e9f5a;position:fixed;left:0;right:0;top:0;z-index:1000;background:var(--mb-bg);border-bottom:1px solid var(--mb-line);font:600 15px 'Source Sans 3','Segoe UI',system-ui,sans-serif;padding-top:env(safe-area-inset-top,0px)}",
    "@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .mibbar{--mb-bg:#121826;--mb-ink:#e8ecf3;--mb-muted:#95a0b4;--mb-raised:#182033;--mb-line:#232c40;--mb-brand:#f5b53b;--mb-up:#3ecf8e}}",
    ":root[data-theme=dark] .mibbar{--mb-bg:#121826;--mb-ink:#e8ecf3;--mb-muted:#95a0b4;--mb-raised:#182033;--mb-line:#232c40;--mb-brand:#f5b53b;--mb-up:#3ecf8e}",
    "body{padding-top:calc(57px + env(safe-area-inset-top,0px)) !important}body.playing{padding-top:0 !important}",
    "html{scroll-padding-top:calc(70px + env(safe-area-inset-top,0px))}",
    ".mibbar .mb-in{max-width:1180px;margin:0 auto;display:flex;align-items:center;gap:12px;height:56px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));box-sizing:content-box}",
    ".mibbar .mb-logo{font:800 20px Archivo,'Segoe UI',sans-serif;letter-spacing:.02em;color:var(--mb-ink);text-decoration:none;white-space:nowrap}",
    ".mibbar .mb-logo i{display:inline-block;width:10px;height:16px;background:var(--mb-brand);margin-left:3px;vertical-align:-1px}",
    ".mibbar nav{display:flex;gap:2px;overflow-x:auto;scrollbar-width:none;min-width:0;flex:1}.mibbar nav::-webkit-scrollbar{display:none}",
    ".mibbar nav a{color:var(--mb-muted);padding:8px 10px;border-radius:8px;white-space:nowrap;text-decoration:none}",
    ".mibbar nav a:hover{background:var(--mb-raised);color:var(--mb-ink)}.mibbar nav a.on{color:var(--mb-ink);background:var(--mb-raised)}",
    ".mibbar nav a.go{color:#1a1205;background:var(--mb-brand);margin-left:4px}",
    ".mibbar .mb-me{display:flex;align-items:center;gap:6px;border:1px solid var(--mb-line);background:var(--mb-raised);color:var(--mb-ink);border-radius:999px;padding:4px 10px 4px 4px;cursor:pointer;font:600 14px 'Source Sans 3',sans-serif;white-space:nowrap;max-width:170px}",
    ".mibbar .mb-me b{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--mb-bg);font-size:17px;flex:none}",
    ".mibbar .mb-me span{overflow:hidden;text-overflow:ellipsis}.mibbar .mb-me i{font-style:normal;font:600 12px 'JetBrains Mono',monospace;color:var(--mb-up)}",
    ".mibbar a:focus-visible,.mibbar button:focus-visible{outline:2px solid var(--mb-brand);outline-offset:2px}",
    ".mb-pane{position:fixed;z-index:1001;top:calc(62px + env(safe-area-inset-top,0px));right:max(12px,env(safe-area-inset-right,0px));width:min(360px,calc(100vw - 24px));max-height:calc(100vh - 90px);overflow:auto;background:var(--mb-bg);color:var(--mb-ink);border:1px solid var(--mb-line);border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.25);padding:14px;font:15px/1.45 'Source Sans 3',sans-serif;display:grid;gap:12px}",
    ".mb-pane[hidden]{display:none}.mb-pane h4{margin:0;font:700 12px 'JetBrains Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--mb-muted)}",
    ".mb-pane input{width:100%;box-sizing:border-box;font:16px 'Source Sans 3',sans-serif;padding:9px 11px;border-radius:10px;border:1px solid var(--mb-line);background:var(--mb-raised);color:var(--mb-ink)}",
    ".mb-av{display:grid;grid-template-columns:repeat(8,1fr);gap:4px}.mb-av button{font-size:22px;padding:4px 0;border-radius:8px;border:2px solid transparent;background:var(--mb-raised);cursor:pointer}.mb-av button.on{border-color:var(--mb-brand)}",
    ".mb-row{display:flex;gap:8px;flex-wrap:wrap}.mb-btn{font:700 14px 'Source Sans 3',sans-serif;padding:8px 12px;border-radius:10px;border:1px solid var(--mb-line);background:var(--mb-raised);color:var(--mb-ink);cursor:pointer;text-decoration:none}",
    ".mb-btn.pri{background:var(--mb-brand);border-color:var(--mb-brand);color:#1a1205}",
    ".mb-who{display:grid;gap:6px;max-height:220px;overflow:auto}.mb-who div{display:flex;align-items:center;gap:8px}.mb-who b{font-size:18px}.mb-who small{color:var(--mb-muted);margin-left:auto}",
    ".mb-note{font-size:13px;color:var(--mb-muted)}",
    "body.playing .mibbar,body.playing .mb-pane{display:none}",
    "@media (max-width:640px){.mibbar .mb-me span{display:none}.mibbar .mb-me{padding-right:8px}}",
  ].join("\n");
  document.head.appendChild(css);
  var H = home ? "" : "/";
  var links = [["today", "Today", H + (home ? "#today" : "")], ["news", "News", H + "#news"], ["money", "Money", H + "#money"], ["calendar", "Calendar", H + "#calendar"],
    ["dives", "Deep dive", H + "#dives"], ["week", "The Week", "/weekly.html"], ["archive", "Archive", "/archive/"], ["arcade", "Arcade", "/arcade/"], ["lounge", "Lounge · chat & play", H + "#lounge"]];
  var bar = document.createElement("div"); bar.className = "mibbar";
  bar.innerHTML = '<div class="mb-in"><a class="mb-logo" href="/" aria-label="MIB Terminal, home">MIB<i></i></a><nav aria-label="Site">'
    + links.map(function (l) { return '<a href="' + (l[2] || "/") + '" data-k="' + l[0] + '"' + (l[0] === "lounge" ? ' class="go"' : l[0] === active ? ' class="on"' : "") + ">" + l[1] + "</a>"; }).join("")
    + '</nav><button class="mb-me" type="button" aria-haspopup="dialog" aria-label="Your name, who is online, settings"><b></b><span></span><i></i></button></div>';
  if (me && me.parentNode) me.parentNode.insertBefore(bar, me); else document.body.insertBefore(bar, document.body.firstChild);

  // ---- you: name, avatar; settings; who is online
  var pane = document.createElement("div"); pane.className = "mb-pane"; pane.hidden = true; pane.setAttribute("role", "dialog"); pane.setAttribute("aria-label", "You and who is online");
  document.body.appendChild(pane);
  var name = function () { return ls("arcade-name"); }, av = function () { var i = +ls("mib-avatar"); return isNaN(i) || i < 0 || i >= AV.length ? -1 : i; };
  var cid = ls("arcade-cid"); if (!cid) { cid = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); ls("arcade-cid", cid); }
  var who = [], online = 0, deferred = null;
  var meBtn = bar.querySelector(".mb-me");
  var paintMe = function () { meBtn.querySelector("b").textContent = av() >= 0 ? AV[av()] : "👤"; meBtn.querySelector("span").textContent = name() || "Pick a name"; meBtn.querySelector("i").textContent = online ? "● " + online : ""; };
  var dark = function () { var t = document.documentElement.getAttribute("data-theme"); return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; };
  var paintPane = function () {
    var a = av();
    pane.innerHTML = '<h4>You</h4><input id="mbName" maxlength="16" placeholder="Pick a name (a nickname, not your real name)" value="' + esc(name()) + '">'
      + '<div class="mb-av">' + AV.map(function (e, i) { return '<button type="button" data-av="' + i + '"' + (i === a ? ' class="on"' : "") + ' aria-label="avatar ' + e + '">' + e + "</button>"; }).join("") + "</div>"
      + '<div class="mb-note">Your name and avatar are used in the chat, the arcade and the scoreboards. Kept in this browser only.</div>'
      + "<h4>Online now · " + online + "</h4>"
      + '<div class="mb-who">' + (who.length ? who.map(function (w) { return "<div><b>" + esc(AV[w.a] || "👤") + "</b><span>" + esc(w.n) + "</span><small>" + esc(w.p || "") + "</small></div>"; }).join("") : '<span class="mb-note">Just you for now.</span>') + "</div>"
      + '<div class="mb-row"><a class="mb-btn pri" href="/arcade/">Play</a><a class="mb-btn" href="/#lounge">Chat</a></div>'
      + "<h4>Settings</h4>"
      + '<div class="mb-row"><button class="mb-btn" type="button" data-act="theme">' + (dark() ? "☀ Light mode" : "☾ Dark mode") + '</button>'
      + '<a class="mb-btn" href="https://translate.google.com/translate?sl=en&tl=fr&u=' + encodeURIComponent(location.href) + '" rel="noopener">🇫🇷 Français</a></div>'
      + '<div class="mb-row"><button class="mb-btn" type="button" data-act="install">📲 Add to home screen</button><button class="mb-btn" type="button" data-act="share">↗ Share with a friend</button></div>'
      + '<div class="mb-note" id="mbMsg"></div>'
      + '<div class="mb-row"><a class="mb-btn" href="/privacy.html">Privacy</a></div>';
  };
  meBtn.addEventListener("click", function (e) { e.stopPropagation(); pane.hidden = !pane.hidden; if (!pane.hidden) { paintPane(); var n = pane.querySelector("#mbName"); if (!name()) n.focus(); } });
  document.addEventListener("click", function (e) { if (!pane.hidden && !pane.contains(e.target) && e.target !== meBtn) pane.hidden = true; });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") pane.hidden = true; });
  var say = function (t) { var m = pane.querySelector("#mbMsg"); if (m) m.textContent = t; };
  pane.addEventListener("change", function (e) {
    if (e.target.id !== "mbName") return;
    var n = e.target.value.replace(/[^\p{L}\p{N} _.\-]/gu, "").trim().slice(0, 16);
    ls("arcade-name", n || null); e.target.value = n; paintMe(); hello(); say(n ? "Saved." : "Name removed.");
    window.dispatchEvent(new CustomEvent("mib-me"));
  });
  pane.addEventListener("click", function (e) {
    var b = e.target.closest("[data-av],[data-act]"); if (!b) return;
    if (b.dataset.av !== undefined) { ls("mib-avatar", b.dataset.av); paintMe(); paintPane(); hello(); window.dispatchEvent(new CustomEvent("mib-me")); return; }
    var act = b.dataset.act;
    if (act === "theme") { var t = dark() ? "light" : "dark"; document.documentElement.setAttribute("data-theme", t); ls("mib-theme", t); paintPane(); }
    if (act === "install") {
      if (deferred) { deferred.prompt(); deferred = null; return; }
      say(/iPhone|iPad/.test(navigator.userAgent) ? "On iPhone: tap Share ⬆︎ at the bottom of Safari, then “Add to Home Screen”." : "In your browser's menu (⋮), choose “Install app” or “Add to Home screen”.");
    }
    if (act === "share") {
      var d = { title: "MIB Terminal", text: "The market in 3 minutes, then chat and play together", url: "https://mibterminal.com/" };
      if (navigator.share) navigator.share(d).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(d.url).then(function () { say("Link copied: send it to a friend."); }, function () { say(d.url); });
      else say(d.url);
    }
  });
  addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; });

  // ---- presence: one light line to the chat server; it counts this visit (no cookie, nothing personal) and
  // says who is online. Your place shows only your chosen name, avatar and the page you are on.
  var ws = null, tries = 0;
  var hello = function () { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ t: "me", n: name(), a: av(), p: active })); };
  var connect = function () {
    try { ws = new WebSocket(API.replace(/^http/, "ws") + "/chat?" + new URLSearchParams({ room: "here", name: name() || "", cid: cid, a: String(av()), p: active })); } catch (e) { return; }
    ws.onopen = function () { tries = 0; };
    ws.onmessage = function (e) { var d; try { d = JSON.parse(e.data); } catch (x) { return; } if (d.t === "here") { who = d.who || []; online = d.n || who.length; paintMe(); if (!pane.hidden && !pane.contains(document.activeElement)) paintPane(); window.MIB_HERE = { n: online, who: who }; window.dispatchEvent(new CustomEvent("mib-here")); } };
    ws.onclose = function () { setTimeout(connect, Math.min(30000, 2000 * ++tries)); };
  };
  setInterval(function () { if (ws && ws.readyState === 1) ws.send("#ping"); }, 25000);
  paintMe(); connect();

  if (!home) return;
  // on the homepage the bar shows the section on screen
  var keys = ["today", "news", "money", "calendar", "dives"];
  var mark = function () {
    var y = scrollY + 120, on = "today";
    keys.forEach(function (k) { var s = document.getElementById(k); if (s && s.getBoundingClientRect().top + scrollY <= y) on = k; });
    [].forEach.call(bar.querySelectorAll("nav a"), function (a) { if (a.dataset.k !== "lounge") a.classList.toggle("on", a.dataset.k === on); });
  };
  addEventListener("scroll", mark, { passive: true }); addEventListener("load", mark);
})();
