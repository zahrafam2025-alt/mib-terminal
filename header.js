/* MIB Terminal: the one menu bar of every page (2026-11-03, owner: "when clicking on a page a different menu is
   changing, not looking good at all"). The homepage, the week, the archive, the about pages and the arcade all load
   this file, so the bar is the same everywhere: Today · News · Money · Calendar · Deep dive · The Week · Archive ·
   Arcade, Sports (11 Nov), and the gold Lounge. On the homepage the section links scroll; elsewhere they open the homepage there.
   <script src="/header.js" data-active="today|week|archive|arcade|page"></script>, first thing in <body>.
   2026-11-04 (owner's list): the bar stays on screen (fixed, not sticky), light/dark switch, Français (the browser's
   own translation through Google's page translator), your name and a funny avatar (shared with the arcade and the
   chat), who is online right now, install on the home screen, share with a friend, privacy.
   2026-11-04 (owner: "dark mode by default"; "with the translator the Google bar or logo shows and lots breaks: dark
   mode lost, the avatar options dead, text left in English"): dark unless you chose light; Français no longer sends
   the page to Google's site (another address: your settings were not there and the scripts broke) but runs Google's
   translator inside this page, its bar and logo hidden, and keeps translating what the page adds later. */
(function () {
  "use strict";
  var me = document.currentScript, active = (me && me.dataset.active) || "page";
  var home = location.pathname === "/" || location.pathname === "/index.html";
  var API = window.MIB_CHAT_API || "https://mib-arcade.terminalmib.workers.dev";
  // 4 Nov (owner's second Cloudflare account): the server's address is published with the arcade (/arcade/api.json), so
  // when the arcade workflow moves to the other account the whole site follows without a code change. Used before any
  // connection is made; on any problem the built-in address stays.
  // 4 Nov (owner: "MIB must be one: main server always, the second account only while the main one is limited, and back as
  // soon as it answers"): /arcade/api.json lists both; the main one is used when it answers, else the backup. Asked on every
  // page load (kept 2 minutes); a chat line that keeps failing flips to the other one by itself.
  var SRV = /^https:\/\/[a-z0-9.-]+\.workers\.dev$/, MAIN = API, BACKUP = "";
  var alive = function (u) { var c = new AbortController(), t = setTimeout(function () { c.abort(); }, 4000); return fetch(u + "/api/chat/recent?room=markets", { cache: "no-store", signal: c.signal }).then(function (r) { clearTimeout(t); return r.ok; }, function () { return false; }); };
  window.MIB_API_READY = Promise.race([
    fetch("/arcade/api.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j) return;
      if (SRV.test(j.api || "")) MAIN = j.api; if (SRV.test(j.backup || "")) BACKUP = j.backup; API = MAIN;
      var c = null; try { c = JSON.parse(sessionStorage.getItem("mib-api-pick") || "null"); } catch (x) {}
      if (c && Date.now() - c.t < 120000 && (c.u === MAIN || c.u === BACKUP)) { API = c.u; return; }
      if (!BACKUP) return;
      return alive(MAIN).then(function (ok) { return ok ? true : alive(BACKUP).then(function (ok2) { if (ok2) API = BACKUP; return false; }); }).then(function () { try { sessionStorage.setItem("mib-api-pick", JSON.stringify({ u: API, t: Date.now() })); } catch (x) {} });
    }).then(function () { window.MIB_CHAT_API = API; }),
    new Promise(function (ok) { setTimeout(ok, 6000); })]).catch(function () {});
  window.MIB_FLIP = function () { if (!BACKUP) return; API = API === MAIN ? BACKUP : MAIN; window.MIB_CHAT_API = API; try { sessionStorage.setItem("mib-api-pick", JSON.stringify({ u: API, t: Date.now() })); } catch (x) {} };
  var ls = function (k, v) { try { if (v === undefined) return localStorage.getItem(k) || ""; if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return ""; } };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var AV = ["🦊", "🐸", "🐼", "🦁", "🐙", "🤖", "👽", "🦄", "🐵", "🐯", "🐧", "🦖", "🐻", "🐷", "🦉", "🐳", "🦈", "🐲", "🥷", "🧙", "🤠", "🧛", "🦸", "💀", "🐶"];   // 9 Nov (bug list: "add a dog avatar, unforgivable!"): added last so every saved choice keeps its picture
  window.MIB_AV = AV;
  // the theme: dark unless the viewer chose light (kept in this browser)
  document.documentElement.setAttribute("data-theme", ls("mib-theme") === "light" ? "light" : "dark");
  var fr = ls("mib-lang") === "fr", L = function (en, f) { return fr ? f : en; };   // the bar and the pane have their own French
  if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Archivo"]')) {
    var f = document.createElement("link"); f.rel = "stylesheet";
    f.href = "https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Source+Sans+3:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap";
    document.head.appendChild(f);
  }
  if (!document.querySelector('link[rel="manifest"]')) { var mf = document.createElement("link"); mf.rel = "manifest"; mf.href = "/site.webmanifest"; document.head.appendChild(mf); }
  var css = document.createElement("style");
  css.textContent = [
    ".mibbar,.mb-pane,.mb-add,.mb-invt{--mb-bg:#ffffff;--mb-ink:#0f172a;--mb-muted:#5b6474;--mb-raised:#eef1f6;--mb-line:#e1e5ec;--mb-brand:#e8a317;--mb-up:#0e9f5a}.mibbar{position:fixed;left:0;right:0;top:0;z-index:1000;background:var(--mb-bg);border-bottom:1px solid var(--mb-line);font:600 15px 'Source Sans 3','Segoe UI',system-ui,sans-serif;padding-top:env(safe-area-inset-top,0px)}",
    "@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .mibbar,:root:not([data-theme=light]) .mb-pane,:root:not([data-theme=light]) .mb-add,:root:not([data-theme=light]) .mb-invt{--mb-bg:#121826;--mb-ink:#e8ecf3;--mb-muted:#95a0b4;--mb-raised:#182033;--mb-line:#232c40;--mb-brand:#f5b53b;--mb-up:#3ecf8e}}",
    ":root[data-theme=dark] .mibbar,:root[data-theme=dark] .mb-pane,:root[data-theme=dark] .mb-add,:root[data-theme=dark] .mb-invt{--mb-bg:#121826;--mb-ink:#e8ecf3;--mb-muted:#95a0b4;--mb-raised:#182033;--mb-line:#232c40;--mb-brand:#f5b53b;--mb-up:#3ecf8e}",
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
    ".mb-who .mb-inv{margin-left:6px;padding:3px 8px;font-size:15px}.mb-games{display:flex;flex-wrap:wrap;gap:6px}.mb-games[hidden]{display:none}.mb-games .mb-btn{padding:6px 10px;font-size:13px}",
    ".mb-invt{position:fixed;z-index:1003;top:calc(66px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);width:min(380px,calc(100vw - 24px));background:var(--mb-bg);color:var(--mb-ink);border:2px solid var(--mb-brand);border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.4);padding:12px 14px;display:flex;gap:10px;align-items:center;font:600 15px/1.35 'Source Sans 3',sans-serif}",
    ".mb-invt b.av{font-size:26px}.mb-invt div{flex:1}.mb-invt .x{background:none;border:0;color:var(--mb-muted);font-size:20px;cursor:pointer}",
    ".mb-up{position:fixed;inset:0;z-index:1004;background:rgba(5,8,16,.92);color:#f8fafc;display:none;align-items:center;justify-content:center;text-align:center;font:700 20px 'Source Sans 3',sans-serif;padding:24px}",
    "@media (orientation:landscape) and (max-height:500px) and (pointer:coarse){.mb-up.on{display:flex}}",
    "body.playing .mibbar,body.playing .mb-pane{display:none}",
    // Google's translator, used inside the page: none of its own bars, logos, pop-ups or highlights
    "body{top:0 !important}.goog-te-banner-frame,iframe.skiptranslate,.skiptranslate>iframe,#goog-gt-tt,#goog-gt-vt,.goog-te-balloon-frame,.goog-tooltip,.goog-te-spinner-pos,.goog-te-gadget,#google_translate_element,.goog-logo-link,.VIpgJd-ZVi9od-ORHb-OEVmcd,.VIpgJd-ZVi9od-aZ2wEe-wOHMyf,.VIpgJd-ZVi9od-xl07Ob-OEVmcd,.VIpgJd-yAWNEb-L7lbkb{display:none !important;visibility:hidden !important}",
    "font{background:none !important;box-shadow:none !important}.VIpgJd-yAWNEb-VIpgJd-fmcmS-sn54Q{background:none !important;box-shadow:none !important}",
    "@media (max-width:640px){.mibbar .mb-me span{display:none}.mibbar .mb-me{padding-right:8px}}",
  ].join("\n");
  document.head.appendChild(css);
  var H = home ? "" : "/";
  var links = [["today", L("Today", "Aujourd'hui"), H + (home ? "#today" : "")], ["news", L("News", "Actus"), H + "#news"], ["money", L("Money", "Marchés"), H + "#money"], ["calendar", L("Calendar", "Agenda"), H + "#calendar"],
    ["dives", L("Deep dive", "Analyses"), H + "#dives"], ["week", L("The Week", "La semaine"), "/weekly.html"], ["archive", L("Archive", "Archives"), "/archive/"], ["arcade", "Arcade", "/arcade/"], ["sports", "Sports", "/sports/"], ["lounge", L("Lounge · chat & play", "Lounge · chat & jeux"), H + "#lounge"]];
  var bar = document.createElement("div"); bar.className = "mibbar notranslate"; bar.setAttribute("translate", "no");
  bar.innerHTML = '<div class="mb-in"><a class="mb-logo notranslate" translate="no" href="/" aria-label="MIB Terminal, home">MIB<i></i></a><nav aria-label="Site">'
    + links.map(function (l) { return '<a href="' + (l[2] || "/") + '" data-k="' + l[0] + '"' + (l[0] === "lounge" ? ' class="go"' : l[0] === active ? ' class="on"' : "") + ">" + l[1] + "</a>"; }).join("")
    + '</nav><button class="mb-me notranslate" translate="no" type="button" aria-haspopup="dialog" aria-label="Your name, who is online, settings"><b></b><span></span><i></i></button></div>';
  if (me && me.parentNode) me.parentNode.insertBefore(bar, me); else document.body.insertBefore(bar, document.body.firstChild);

  // ---- you: name, avatar; settings; who is online
  var pane = document.createElement("div"); pane.className = "mb-pane notranslate"; pane.setAttribute("translate", "no"); pane.hidden = true; pane.setAttribute("role", "dialog"); pane.setAttribute("aria-label", "You and who is online");
  document.body.appendChild(pane);
  var name = function () { return ls("arcade-name"); }, av = function () { var i = +ls("mib-avatar"); return isNaN(i) || i < 0 || i >= AV.length ? -1 : i; };
  var cid = ls("arcade-cid"); if (!cid) { cid = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); ls("arcade-cid", cid); }
  var who = [], online = 0, deferred = null, myId = "", invTo = "";
  // 4 Nov (owner: "invite another user online to play directly: a notification on their profile, one click to join the
  // room"): 🎮 next to a name, pick the game, the arcade opens your room and the server sends the invitation to that
  // person only (by a public id for this visit, never the browser id)
  var INV_GAMES = [["tennis", "Rally Rumble"], ["goal", "Goal Rush"], ["snake", "Snake"], ["rocks", "Rocks"], ["blocks", "Blocks"], ["jump", "Jump"], ["city", "Chaos City"], ["spa", "Grand Prix"]];
  var meBtn = bar.querySelector(".mb-me");
  var paintMe = function () { meBtn.querySelector("b").textContent = av() >= 0 ? AV[av()] : "👤"; meBtn.querySelector("span").textContent = name() || L("Pick a name", "Choisis un pseudo"); meBtn.querySelector("i").textContent = online ? "● " + online : ""; };
  var dark = function () { var t = document.documentElement.getAttribute("data-theme"); return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; };
  var paintPane = function () {
    var a = av();
    pane.innerHTML = "<h4>" + L("You", "Toi") + '</h4><input id="mbName" maxlength="16" placeholder="' + L("Pick a name (a nickname, not your real name)", "Choisis un pseudo (pas ton vrai nom)") + '" value="' + esc(name()) + '">'
      + '<div class="mb-av notranslate" translate="no">' + AV.map(function (e, i) { return '<button type="button" data-av="' + i + '"' + (i === a ? ' class="on"' : "") + ' aria-label="avatar ' + e + '">' + e + "</button>"; }).join("") + "</div>"
      + '<div class="mb-note">' + L("Your name and avatar are used in the chat, the arcade and the scoreboards. Kept in this browser only.", "Ton pseudo et ton avatar servent dans le chat, l'arcade et les classements. Gardés dans ce navigateur seulement.") + "</div>"
      + "<h4>" + L("Online now", "En ligne") + " · " + online + "</h4>"
      + '<div class="mb-who">' + (who.length ? who.map(function (w) { return "<div><b>" + esc(AV[w.a] || "👤") + '</b><span class="notranslate" translate="no">' + esc(w.n) + "</span><small>" + esc((fr ? { today: "accueil", week: "la semaine", archive: "archives", arcade: "arcade", page: "le site" } : { today: "home", week: "the week", archive: "archive", arcade: "arcade", page: "reading" })[w.p] || "") + "</small>" + (w.id && w.id !== myId ? '<button class="mb-btn mb-inv" type="button" data-inv="' + esc(w.id) + '" title="' + L("Invite to play", "Inviter à jouer") + '">🎮</button>' : "") + "</div>"; }).join("")
      + '<div class="mb-games" hidden>' + INV_GAMES.map(function (g) { return '<button class="mb-btn" type="button" data-ig="' + g[0] + '">' + g[1] + "</button>"; }).join("") + "</div>" : '<span class="mb-note">' + L("Just you for now.", "Rien que toi pour l'instant.") + "</span>") + (who.length && online > who.length ? '<span class="mb-note">' + L("+ ", "+ ") + (online - who.length) + L(online - who.length > 1 ? " visitors without a name" : " visitor without a name", online - who.length > 1 ? " visiteurs sans pseudo" : " visiteur sans pseudo") + "</span>" : "") + "</div>"
      + '<div class="mb-row"><a class="mb-btn pri" href="/arcade/">' + L("Play", "Jouer") + '</a><a class="mb-btn" href="/#lounge">Chat</a></div>'
      + "<h4>" + L("Settings", "Réglages") + "</h4>"
      + '<div class="mb-row"><button class="mb-btn" type="button" data-act="theme">' + (dark() ? L("☀ Light mode", "☀ Mode clair") : L("☾ Dark mode", "☾ Mode sombre")) + '</button>'
      + '<button class="mb-btn notranslate" translate="no" type="button" data-act="lang">' + (fr ? "🇬🇧 English" : "🇫🇷 Français") + "</button></div>"
      + '<div class="mb-row"><button class="mb-btn" type="button" data-act="install">' + L("📲 Add to home screen", "📲 Sur l'écran d'accueil") + '</button><button class="mb-btn" type="button" data-act="share">' + L("↗ Share with a friend", "↗ Partager avec un ami") + "</button></div>"
      + '<div class="mb-note" id="mbMsg"></div>'
      + '<div class="mb-row"><a class="mb-btn" href="/privacy.html">' + L("Privacy", "Confidentialité") + "</a></div>";
  };
  meBtn.addEventListener("click", function (e) { e.stopPropagation(); pane.hidden = !pane.hidden; if (!pane.hidden) { paintPane(); var n = pane.querySelector("#mbName"); if (!name()) n.focus(); } });
  document.addEventListener("click", function (e) { if (!pane.hidden && !pane.contains(e.target) && e.target !== meBtn) pane.hidden = true; });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") pane.hidden = true; });
  var say = function (t) { var m = pane.querySelector("#mbMsg"); if (m) m.textContent = t; };
  pane.addEventListener("change", function (e) {
    if (e.target.id !== "mbName") return;
    var n = e.target.value.replace(/[^\p{L}\p{N} _.\-]/gu, "").trim().slice(0, 16);
    ls("arcade-name", n || null); e.target.value = n; paintMe(); hello(); say(n ? L("Saved.", "Enregistré.") : L("Name removed.", "Pseudo effacé."));
    window.dispatchEvent(new CustomEvent("mib-me"));
  });
  pane.addEventListener("click", function (e) {
    var iv = e.target.closest("[data-inv]");
    if (iv) { invTo = iv.dataset.inv; var gm = pane.querySelector(".mb-games"); if (gm) { gm.hidden = false; iv.parentNode.after(gm); } return; }
    var ig = e.target.closest("[data-ig]");
    if (ig && invTo) { location.href = "/arcade/?invite=" + encodeURIComponent(invTo) + "&g=" + ig.dataset.ig; return; }
    var b = e.target.closest("[data-av],[data-act]"); if (!b) return;
    if (b.dataset.av !== undefined) { ls("mib-avatar", b.dataset.av); paintMe(); paintPane(); hello(); window.dispatchEvent(new CustomEvent("mib-me")); return; }
    var act = b.dataset.act;
    if (act === "lang") {
      if (fr) { ls("mib-lang", null); clearGt(); location.reload(); return; }
      ls("mib-lang", "fr"); location.reload(); return;
    }
    if (act === "theme") { var t = dark() ? "light" : "dark"; document.documentElement.setAttribute("data-theme", t); ls("mib-theme", t); paintPane(); }
    if (act === "install") {
      if (deferred) { deferred.prompt(); deferred = null; return; }
      say(/iPhone|iPad/.test(navigator.userAgent) ? L("On iPhone: tap Share ⬆︎ at the bottom of Safari, then “Add to Home Screen”.", "Sur iPhone : touche Partager ⬆︎ en bas de Safari, puis « Sur l'écran d'accueil ».") : L("In your browser's menu (⋮), choose “Install app” or “Add to Home screen”.", "Dans le menu du navigateur (⋮), choisis « Installer l'application » ou « Ajouter à l'écran d'accueil »."));
    }
    if (act === "share") {
      var d = { title: "MIB Terminal", text: L("The market in 3 minutes, then chat and play together. Open it and add it to your home screen:", "Le marché en 3 minutes, puis on discute et on joue ensemble. Ouvre-le et ajoute-le à ton écran d'accueil :"), url: "https://mibterminal.com/?add=1" };
      if (navigator.share) navigator.share(d).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(d.url).then(function () { say(L("Link copied: send it to a friend.", "Lien copié : envoie-le à un ami.")); }, function () { say(d.url); });
      else say(d.url);
    }
  });
  // ---- French: Google's translator inside this page, started only when the viewer asks for it (until then Google sees
  // nothing). The language is kept in this browser; English clears it and reloads the original page.
  var clearGt = function () { var x = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"; document.cookie = x; document.cookie = x + "; domain=" + location.hostname; document.cookie = x + "; domain=." + location.hostname.replace(/^www\./, ""); };
  var pickFr = function (n) {
    var c = document.querySelector(".goog-te-combo");
    if (!c || ![].some.call(c.options, function (o) { return o.value === "fr"; })) { if (n < 75) setTimeout(function () { pickFr(n + 1); }, 200); return; }
    if (c.value !== "fr") { c.value = "fr"; c.dispatchEvent(new Event("change")); }
  };
  var translate = function () {
    if (window.google && google.translate && google.translate.TranslateElement) { pickFr(0); return; }
    if (document.getElementById("google_translate_element")) return;
    var box = document.createElement("div"); box.id = "google_translate_element"; document.body.appendChild(box);
    window.mibTranslate = function () { try { new google.translate.TranslateElement({ pageLanguage: "en", includedLanguages: "fr", autoDisplay: false }, "google_translate_element"); } catch (e) { return; } pickFr(0); };
    var sc = document.createElement("script"); sc.src = "https://translate.google.com/translate_a/element.js?cb=mibTranslate"; sc.async = true; document.head.appendChild(sc);
  };
  if (fr) translate();
  addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; });
  // ---- the home-screen invitation (4 Nov, owner: "sharing with a friend just opens the browser, it does not add the
  // icon to the home screen"): no website may put its icon there by itself, so a phone that is not using the installed
  // app gets a small bar: on Android its button opens the phone's own install window, on an iPhone (where Apple allows
  // nothing more) it shows the two taps. Shown at once for a shared link (?add=1), otherwise from the second visit;
  // ✕ hides it for good.
  (function () {
    var installed = (navigator.standalone === true) || matchMedia("(display-mode: standalone)").matches;
    var q = new URLSearchParams(location.search), shared = q.get("add") === "1";
    if (shared) { q.delete("add"); history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "") + location.hash); }
    var visits = (+ls("mib-visits") || 0) + 1; ls("mib-visits", String(visits));
    if (installed || !matchMedia("(pointer: coarse)").matches || ls("mib-add-no") || active === "arcade") return;
    var ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    var st = document.createElement("style");
    st.textContent = ".mb-add{position:fixed;left:max(10px,env(safe-area-inset-left,0px));right:max(10px,env(safe-area-inset-right,0px));bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:1002;background:var(--mb-bg);color:var(--mb-ink);border:1px solid var(--mb-line);border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.35);padding:12px 12px 12px 14px;display:flex;gap:10px;align-items:center;font:600 15px/1.35 'Source Sans 3',sans-serif}"
      + ".mb-add img{width:40px;height:40px;border-radius:9px;flex:none}.mb-add div{flex:1}.mb-add small{display:block;color:var(--mb-muted);font-weight:400;font-size:13px}body.playing .mb-add{display:none}.mb-add .mb-btn{font:700 14px 'Source Sans 3',sans-serif;padding:8px 14px;border-radius:10px;border:0;background:var(--mb-brand);color:#1a1205;cursor:pointer}.mb-add .x{background:none;border:0;color:var(--mb-muted);font-size:20px;padding:4px 6px;cursor:pointer}";
    document.head.appendChild(st);
    var box = document.createElement("div"); box.className = "mb-add notranslate"; box.setAttribute("translate", "no");
    box.innerHTML = '<img src="/arcade/icon-192.png" alt=""><div>' + L("Add MIB to your home screen", "Ajoute MIB à ton écran d'accueil") + "<small>" + L("One tap to the market, the chat and the games.", "Le marché, le chat et les jeux en un geste.") + '</small></div><button class="mb-btn pri" type="button" data-add="1">' + L("Add", "Ajouter") + '</button><button class="x" type="button" aria-label="close">✕</button>';
    var go = function () { document.body.appendChild(box); };
    if (document.body) setTimeout(go, shared ? 600 : 2500); else addEventListener("DOMContentLoaded", function () { setTimeout(go, 2500); });
    box.addEventListener("click", function (e) {
      if (e.target.closest(".x")) { ls("mib-add-no", "1"); box.remove(); return; }
      if (!e.target.closest("[data-add]")) return;
      if (deferred) { deferred.prompt(); deferred.userChoice && deferred.userChoice.then(function (c) { if (c && c.outcome === "accepted") box.remove(); }); deferred = null; return; }
      box.querySelector("div").innerHTML = ios ? L("Tap <b>Share ⬆︎</b> at the bottom of the screen, then <b>“Add to Home Screen”</b>.", "Touche <b>Partager ⬆︎</b> en bas de l'écran, puis <b>« Sur l'écran d'accueil »</b>.")
        : L("Open the browser's menu <b>⋮</b>, then <b>“Install app”</b> or <b>“Add to Home screen”</b>.", "Ouvre le menu du navigateur <b>⋮</b>, puis <b>« Installer l'application »</b> ou <b>« Ajouter à l'écran d'accueil »</b>.");
      e.target.closest("[data-add]").remove();
    });
  })();

  // ---- presence: one light line to the chat server; it counts this visit (no cookie, nothing personal) and
  // says who is online. Your place shows only your chosen name, avatar and the page you are on.
  var ws = null, tries = 0;
  var GNAME = {}; INV_GAMES.forEach(function (g) { GNAME[g[0]] = g[1]; });
  var invited = function (d) {
    if (!d.r) return;
    var old = document.querySelector(".mb-invt"); if (old) old.remove();
    var c = document.createElement("div"); c.className = "mb-invt notranslate"; c.setAttribute("translate", "no");
    c.innerHTML = '<b class="av">' + esc(AV[d.a] || "🎮") + "</b><div>" + esc(d.from) + L(" invites you to ", " t'invite à ") + "<b>" + esc(GNAME[d.g] || "a game") + '</b></div><a class="mb-btn pri" href="/arcade/?join=' + encodeURIComponent(d.r) + '">' + L("Join", "Rejoindre") + '</a><button class="x" type="button" aria-label="close">✕</button>';
    c.querySelector(".x").onclick = function () { c.remove(); };
    document.body.appendChild(c); try { navigator.vibrate && navigator.vibrate(120); } catch (x) {}
    setTimeout(function () { c.remove(); }, 120000);
  };
  window.MIB_INVITE = function (to, g, room) { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ t: "invite", to: to, g: g, r: room })); };
  if (active !== "arcade") {                                          // 4 Nov (owner): back from the arcade, the phone upright again
    var up = document.createElement("div"); up.className = "mb-up on"; up.innerHTML = "<div>📱<br>" + L("Turn your phone upright to read MIB", "Remets ton téléphone à la verticale pour lire MIB") + "</div>";
    var putUp = function () { if (document.body && !up.parentNode) document.body.appendChild(up); };
    if (document.body) putUp(); else addEventListener("DOMContentLoaded", putUp);
  }
  var hello = function () { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ t: "me", n: name(), a: av(), p: active })); };
  var connect = function () {
    if (!window.MIB_API_DONE) { window.MIB_API_READY.then(function () { window.MIB_API_DONE = true; connect(); }); return; }
    try { ws = new WebSocket(API.replace(/^http/, "ws") + "/chat?" + new URLSearchParams({ room: "here", name: name() || "", cid: cid, a: String(av()), p: active })); } catch (e) { return; }
    ws.onopen = function () { tries = 0; };
    ws.onmessage = function (e) { var d; try { d = JSON.parse(e.data); } catch (x) { return; } if (d.t === "you") myId = d.id; if (d.t === "invite") invited(d); if (d.t === "here") { who = d.who || []; online = d.n || who.length; paintMe(); if (!pane.hidden && !pane.contains(document.activeElement)) paintPane(); window.MIB_HERE = { n: online, who: who }; window.dispatchEvent(new CustomEvent("mib-here")); } };
    ws.onclose = function () { if (tries >= 2 && tries % 2 === 0 && window.MIB_FLIP) window.MIB_FLIP(); setTimeout(connect, Math.min(30000, 2000 * ++tries)); };
  };
  setInterval(function () { if (ws && ws.readyState === 1) ws.send("#ping"); }, 25000);
  paintMe(); connect();

  if (!home) return;
  // 2026-11-04 (owner: "limit scrolls, really one pagers wherever possible"): on the homepage each menu item shows its
  // own part of the page instead of scrolling to it; the address keeps #news etc. (links, sharing and Back still work),
  // and each part ends with a button to the next one, so the whole brief can still be read in order
  var VIEWS = [["today", ["today", "markets"]], ["news", ["news"]], ["money", ["money"]], ["calendar", ["calendar"]], ["dives", ["dives"]], ["lounge", ["lounge", "premium"]]];
  var NAMES = { today: L("Today", "Aujourd'hui"), news: L("News", "Actus"), money: L("Money", "Marchés"), calendar: L("Calendar", "Agenda"), dives: L("Deep dive", "Analyses"), lounge: L("Lounge", "Lounge") };
  var keyOf = function (h) { h = (h || "").replace("#", ""); for (var i = 0; i < VIEWS.length; i++) if (VIEWS[i][0] === h || VIEWS[i][1].indexOf(h) >= 0) return VIEWS[i][0]; return "today"; };
  var nextBtn = document.createElement("div"); nextBtn.className = "mb-nextv notranslate"; nextBtn.setAttribute("translate", "no");
  var st2 = document.createElement("style");
  st2.textContent = ".mb-nextv{display:flex;justify-content:space-between;gap:10px;margin:22px 0 6px}.mb-nextv a{font:700 15px 'Source Sans 3',sans-serif;padding:10px 16px;border-radius:10px;border:1px solid var(--line,#26304a);color:inherit;text-decoration:none}.mb-nextv a.nx{background:var(--brand,#e8a317);border-color:var(--brand,#e8a317);color:#1a1205;margin-left:auto}";
  document.head.appendChild(st2);
  var show = function (k, jump) {
    var at = 0; for (var i = 0; i < VIEWS.length; i++) if (VIEWS[i][0] === k) at = i;
    var want = VIEWS[at][1];
    [].forEach.call(document.querySelectorAll("main section[id]"), function (sec) { sec.style.display = want.indexOf(sec.id) >= 0 ? "" : "none"; });
    [].forEach.call(bar.querySelectorAll("nav a"), function (a) { if (a.dataset.k !== "lounge") a.classList.toggle("on", a.dataset.k === k); });
    var prev = VIEWS[at - 1], next = VIEWS[at + 1];
    nextBtn.innerHTML = (prev ? '<a href="#' + prev[0] + '">← ' + NAMES[prev[0]] + "</a>" : "") + (next ? '<a class="nx" href="#' + next[0] + '">' + L("Next: ", "Suite : ") + NAMES[next[0]] + " →</a>" : "");
    var foot = document.getElementById("foot"); if (foot && nextBtn.parentNode !== foot.parentNode) foot.parentNode.insertBefore(nextBtn, foot);
    if (jump !== false) window.scrollTo(0, 0);
    window.dispatchEvent(new CustomEvent("mib-view", { detail: k }));
  };
  bar.addEventListener("click", function (e) {
    var a = e.target.closest("nav a"); if (!a || !a.dataset.k || a.dataset.k === "week" || a.dataset.k === "archive" || a.dataset.k === "arcade") return;
    e.preventDefault(); var k = keyOf(a.dataset.k); if (location.hash !== "#" + k) history.pushState(null, "", "#" + k); show(k);
  });
  addEventListener("hashchange", function () { show(keyOf(location.hash)); });
  addEventListener("popstate", function () { show(keyOf(location.hash)); });
  var first = function () { show(keyOf(location.hash), false); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", first); else first();
})();
