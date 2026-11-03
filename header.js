/* MIB Terminal: the one menu bar of every page (2026-11-03, owner: "when clicking on a page a different menu is
   changing, not looking good at all"). The homepage, the week, the archive, the about pages and the arcade all load
   this file, so the bar is the same everywhere: Today · News · Money · Calendar · Deep dive · The Week · Archive ·
   Arcade, and the gold Lounge. On the homepage the section links scroll; elsewhere they open the homepage there.
   <script src="/header.js" data-active="today|week|archive|arcade|page"></script>, first thing in <body>. */
(function () {
  "use strict";
  var me = document.currentScript, active = (me && me.dataset.active) || "page";
  var home = location.pathname === "/" || /\/index\.html$/.test(location.pathname) && location.pathname.split("/").length <= 2;
  if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Archivo"]')) {
    var f = document.createElement("link"); f.rel = "stylesheet";
    f.href = "https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Source+Sans+3:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap";
    document.head.appendChild(f);
  }
  var css = document.createElement("style");
  css.textContent = [
    ".mibbar{--mb-bg:#ffffff;--mb-ink:#0f172a;--mb-muted:#5b6474;--mb-raised:#eef1f6;--mb-line:#e1e5ec;--mb-brand:#e8a317;position:sticky;top:0;z-index:1000;background:var(--mb-bg);border-bottom:1px solid var(--mb-line);font:600 15px 'Source Sans 3','Segoe UI',system-ui,sans-serif;padding-top:env(safe-area-inset-top,0px)}",
    "@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .mibbar{--mb-bg:#121826;--mb-ink:#e8ecf3;--mb-muted:#95a0b4;--mb-raised:#182033;--mb-line:#232c40;--mb-brand:#f5b53b}}",
    ":root[data-theme=dark] .mibbar{--mb-bg:#121826;--mb-ink:#e8ecf3;--mb-muted:#95a0b4;--mb-raised:#182033;--mb-line:#232c40;--mb-brand:#f5b53b}",
    ".mibbar .mb-in{max-width:1120px;margin:0 auto;display:flex;align-items:center;gap:16px;height:56px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));box-sizing:content-box}",
    ".mibbar .mb-logo{font:800 20px Archivo,'Segoe UI',sans-serif;letter-spacing:.02em;color:var(--mb-ink);text-decoration:none;white-space:nowrap}",
    ".mibbar .mb-logo i{display:inline-block;width:10px;height:16px;background:var(--mb-brand);margin-left:3px;vertical-align:-1px}",
    ".mibbar nav{display:flex;gap:2px;overflow-x:auto;scrollbar-width:none;min-width:0;flex:1}.mibbar nav::-webkit-scrollbar{display:none}",
    ".mibbar nav a{color:var(--mb-muted);padding:8px 11px;border-radius:8px;white-space:nowrap;text-decoration:none}",
    ".mibbar nav a:hover{background:var(--mb-raised);color:var(--mb-ink)}.mibbar nav a.on{color:var(--mb-ink);background:var(--mb-raised)}",
    ".mibbar nav a.go{color:#1a1205;background:var(--mb-brand);margin-left:6px}",
    ".mibbar a:focus-visible{outline:2px solid var(--mb-brand);outline-offset:2px}",
    "body.playing .mibbar{display:none}",                 // the arcade, a game being played full screen on a phone
  ].join("\n");
  document.head.appendChild(css);
  var H = home ? "" : "/";
  var links = [["today", "Today", H + (home ? "#today" : "")], ["news", "News", H + "#news"], ["money", "Money", H + "#money"], ["calendar", "Calendar", H + "#calendar"],
    ["dives", "Deep dive", H + "#dives"], ["week", "The Week", "/weekly.html"], ["archive", "Archive", "/archive/"], ["arcade", "Arcade", "/arcade/"], ["lounge", "Lounge · chat & play", H + "#lounge"]];
  var bar = document.createElement("div"); bar.className = "mibbar";
  bar.innerHTML = '<div class="mb-in"><a class="mb-logo" href="/" aria-label="MIB Terminal, home">MIB<i></i></a><nav aria-label="Site">'
    + links.map(function (l) { return '<a href="' + (l[2] || "/") + '" data-k="' + l[0] + '"' + (l[0] === "lounge" ? ' class="go"' : l[0] === active ? ' class="on"' : "") + ">" + l[1] + "</a>"; }).join("") + "</nav></div>";
  if (me && me.parentNode) me.parentNode.insertBefore(bar, me); else document.body.insertBefore(bar, document.body.firstChild);
  if (!home) return;
  // on the homepage the bar shows the section on screen
  var keys = ["today", "news", "money", "calendar", "dives"];
  var mark = function () {
    var y = scrollY + 110, on = "today";
    keys.forEach(function (k) { var s = document.getElementById(k); if (s && s.getBoundingClientRect().top + scrollY <= y) on = k; });
    [].forEach.call(bar.querySelectorAll("nav a"), function (a) { if (a.dataset.k !== "lounge") a.classList.toggle("on", a.dataset.k === on); });
  };
  addEventListener("scroll", mark, { passive: true }); addEventListener("load", mark);
})();
