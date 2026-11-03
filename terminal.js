/* MIB Terminal homepage (2026-11-03): renders window.MIB_BRIEF (data/brief.js, written by the daily run), the live
   prices (data/ticker.js + its feed) and the Lounge's chat (the arcade's server). */
(function () {
  "use strict";
  var B = window.MIB_BRIEF || {}, S = B.sections || {}, R = B.regime || {}, T = (window.MIB_TICKER || {}), NEWS = B.news || window.MIB_NEWS || [];
  var ARCHIVE = !!window.MIB_ARCHIVE_DAY;                 // an archived day: no live prices, its own comments
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var pct = function (v) { return v == null ? "" : (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2) + "%"; };
  var cls = function (v) { return v == null ? "" : v >= 0 ? "u" : "d"; };
  var items = (T.items || T.fallback || []);
  var get = function (sym) { for (var i = 0; i < items.length; i++) if (items[i].sym === sym) return items[i]; return null; };

  // the numbers strip: the build's snapshot first, then the live (15-min delayed) feed every minute
  var paintTape = function (list) {
    if (!list || !list.length) return;
    items = list;
    $("tape").innerHTML = list.map(function (t) {
      var ch = t.bp != null ? (t.bp >= 0 ? "+" : "−") + Math.abs(t.bp) + " bp" : pct(t.pct), c = t.bp != null ? cls(t.bp) : cls(t.pct);
      return '<div class="tk"><span>' + esc(t.label) + '</span>' + (t.price != null ? t.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "") + ' <b class="' + c + '">' + ch + "</b></div>";
    }).join("");
  };
  if (ARCHIVE) { var tp = document.querySelector(".tape"); if (tp) tp.hidden = true; }
  else {
    paintTape(items);
    var live = function () { if (!T.url) return; fetch(T.url, { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (d) { if (d && d.items) { paintTape(d.items); hero(); } }).catch(function () {}); };
  }

  // today in three minutes: the headline written from the numbers
  var d = B.meta && B.meta.date ? new Date(B.meta.date + "T12:00:00Z") : new Date();
  $("date").textContent = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  var mood = R.mood === "on" ? "var(--up)" : R.mood === "off" ? "var(--down)" : "var(--warn)";
  $("regime").innerHTML = '<b style="background:' + mood + '"></b>' + esc(R.label || "");
  var tape = S.tape || {}, br = (tape.breadth || {}).pct;
  var hero = function () {                                   // written again when the live prices come in
  var spx = get("SPX"), ndx = get("NDX");
  var vixJump = (S.changed || []).filter(function (c) { return /^VIX/.test(c); })[0];
  var h = [];
  if (spx && spx.pct != null) h.push((spx.pct >= 0.15 ? "Stocks edge up" : spx.pct <= -0.15 ? "Stocks slip" : "Stocks go nowhere") + (br != null && br < 40 && spx.pct > 0 ? " on a handful of giants" : br != null && br > 60 ? " with most names joining in" : ""));
  if (vixJump || (R.vix && R.vix > 20)) h.push("the fear gauge " + (vixJump ? "jumps to " + Number(R.vix).toFixed(1) : "sits above 20"));
  $("headline").textContent = h.length ? h.join(" while ").replace(/^./, function (c) { return c.toUpperCase(); }) + "." : (S.story || {}).lede || "";
  var next = ((S.watchlist || {}).items || []).filter(function (e) { return e.impact === "high"; })[0] || ((S.watchlist || {}).items || [])[0];
  var rows = [
    ["What happened", [spx && spx.pct != null ? "S&P 500 " + pct(spx.pct) + (ndx && ndx.pct != null ? ", Nasdaq 100 " + pct(ndx.pct) : "") : "",
      br != null ? (br < 50 ? "Only " : "") + br + "% of stocks rose: " + ((tape.observations || [])[1] || "a narrow move").replace(/^Leadership /, "leadership ") : ""].filter(Boolean).join(". ")],
    ["Why it matters", (S.story || {}).interpretation || ""],
    ["What's next", next ? next.event + ", " + next.when + (next.consensus ? " (expected " + next.consensus + ")" : "") + ". " + (next.invalidates ? "If it surprises: " + next.invalidates + "." : "") : ""],
  ];
  $("three").innerHTML = rows.filter(function (r) { return r[1]; }).map(function (r) { return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("");
  };
  hero();
  if (!ARCHIVE) { live(); setInterval(live, 60000); }

  // the stress gauge: a half circle from calm to stressed
  (function () {
    var v = Math.max(0, Math.min(100, Number(R.stress) || 0)), a = Math.PI * (1 - v / 100), cx = 120, cy = 112, r = 92;
    var arc = function (a0, a1, col) { var x0 = cx + r * Math.cos(a0), y0 = cy - r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy - r * Math.sin(a1); return '<path d="M' + x0 + "," + y0 + " A" + r + "," + r + " 0 0 1 " + x1 + "," + y1 + '" stroke="' + col + '" stroke-width="16" fill="none" stroke-linecap="butt"/>'; };
    $("stress").innerHTML = '<svg viewBox="0 0 240 124" role="img" aria-label="stress ' + v + ' out of 100">' + arc(Math.PI, Math.PI * 0.62, "var(--up)") + arc(Math.PI * 0.6, Math.PI * 0.38, "var(--warn)") + arc(Math.PI * 0.36, 0, "var(--down)")
      + '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + (r - 24) * Math.cos(a)) + '" y2="' + (cy - (r - 24) * Math.sin(a)) + '" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/><circle cx="' + cx + '" cy="' + cy + '" r="7" fill="var(--ink)"/>'
      + '<text x="20" y="122" font-size="11" fill="var(--muted)">calm</text><text x="220" y="122" font-size="11" fill="var(--muted)" text-anchor="end">stressed</text></svg>'
      + '<div class="gtxt"><b>' + v + '</b><small>out of 100 · VIX ' + (R.vix != null ? Number(R.vix).toFixed(1) : "–") + (R.vix > 20 ? " (above its long-run 20)" : "") + "</small></div>";
  })();
  if (br != null) {
    $("breadthPct").textContent = br + "% rising";
    $("breadthTxt").textContent = (tape.green_sectors != null ? tape.green_sectors + " of " + tape.total_sectors + " sectors green" : "");
    $("breadthBar").innerHTML = '<i style="width:' + br + '%;background:var(--up)"></i><i style="width:' + (100 - br) + '%;background:var(--down);opacity:.55"></i>';
  }
  $("changed").innerHTML = (S.changed || []).map(function (c) { return '<span class="chip">' + esc(c) + "</span>"; }).join("") || '<span style="color:var(--muted)">Nothing major</span>';

  // news
  var ago = function (iso) { var m = Math.round((Date.now() - Date.parse(iso)) / 60000); return isNaN(m) ? "" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : Math.round(m / 1440) + " d ago"; };
  $("newsList").innerHTML = NEWS.slice(0, 8).map(function (n) { return '<a href="' + esc(n.url) + '" target="_blank" rel="noopener"><b>' + esc(n.title) + "</b><small>" + esc(n.src) + " · " + esc(ago(n.at)) + "</small></a>"; }).join("")
    || (S.consensus || []).map(function (c) { return '<a><b>' + esc(c) + "</b></a>"; }).join("");

  // where the money went
  var sec = ((S.money || {}).sectors || []).slice().sort(function (a, b) { return b.mean - a.mean; });
  var mx = Math.max.apply(null, sec.map(function (s) { return Math.abs(s.mean); }).concat([0.05]));
  $("sectors").innerHTML = sec.map(function (s) {
    var w = Math.abs(s.mean) / mx * 50, left = s.mean >= 0 ? 50 : 50 - w;
    return '<div class="hbar"><span>' + esc(s.name) + '</span><div class="t"><i style="left:' + left + "%;width:" + Math.max(0.6, w) + "%;background:" + (s.mean >= 0 ? "var(--up)" : "var(--down)") + '"></i></div><span class="v">' + (s.mean >= 0 ? "+" : "−") + Math.abs(s.mean).toFixed(2) + "</span></div>";
  }).join("");
  var ll = function (xs) { return (xs || []).slice(0, 5).map(function (x) { return "<div><span><b>" + esc(x[0]) + '</b> <span style="color:var(--muted)">' + esc(x[2] || "") + '</span></span><span class="tnum ' + cls(x[1]) + '">' + (x[1] >= 0 ? "+" : "−") + Math.abs(x[1]).toFixed(2) + "</span></div>"; }).join(""); };
  $("leaders").innerHTML = ll((S.money || {}).leaders); $("laggards").innerHTML = ll((S.money || {}).laggards);

  // calendar, by day
  var yr = String((B.meta && B.meta.date) || new Date().getFullYear()).slice(0, 4);
  var when = function (e) { var p = (e.when || "").split(" "); var t = Date.parse(p[1] + " " + p[2] + " " + yr + " " + (p[3] || "00:00") + " UTC"); return isNaN(t) ? 9e15 : t; };
  var evs = ((S.watchlist || {}).items || []).slice().sort(function (a, b) { return when(a) - when(b); }), days = {};   // soonest first
  evs.forEach(function (e) { var k = (e.when || "").split(" ").slice(0, 3).join(" "); (days[k] = days[k] || []).push(e); });
  var impc = { high: "var(--down)", medium: "var(--warn)", low: "var(--muted)" };
  $("cal").innerHTML = Object.keys(days).map(function (k) {
    return '<div class="day"><div class="dl">' + esc(k) + '</div><div class="ev">' + days[k].map(function (e) {
      return '<details class="ev1"><summary><i class="imp" style="background:' + (impc[e.impact] || "var(--muted)") + '" title="' + esc(e.impact) + ' impact"></i><b>' + esc(e.event) + '</b><span class="tm">' + esc((e.when || "").split(" ").slice(3).join(" ")) + (e.consensus ? " · exp. " + esc(e.consensus) : "") + "</span></summary>"
        + '<div class="body">' + (e.confirms ? "<span>As expected: " + esc(e.confirms) + "</span>" : "") + (e.invalidates ? "<span>Surprise: " + esc(e.invalidates) + "</span>" : "") + (!e.confirms && !e.invalidates ? "<span>" + esc(e.impact) + " impact</span>" : "") + "</div></details>";
    }).join("") + "</div></div>";
  }).join("") || '<p class="sub">No major event this week.</p>';

  // deep dives
  var dives = [], desk = S.desks || {}, cr = desk.crypto || {}, lv = (desk.chart_read || {}).levels || {};
  dives.push({ t: "Who is buying", p: (tape.body || [""])[0].split(" — ")[0] + ".", body: "<p>" + esc((tape.body || [""])[0]) + "</p><ul>" + (tape.observations || []).map(function (o) { return "<li>" + esc(o) + "</li>"; }).join("") + "</ul>" });
  var lvKeys = Object.keys(lv).filter(function (k) { return lv[k].range_low != null; });
  if (lvKeys.length) dives.push({ t: "Price levels", p: "Where the big funds sit inside today's range: near the top is strength, near the bottom weakness.", body: lvKeys.map(function (k) { var x = lv[k];
    return '<div class="lvl"><div style="display:flex;justify-content:space-between"><b>' + esc(k) + '</b><span class="tnum">' + x.price + " · " + x.range_pos_pct + '% of the range</span></div><div class="rng"><i style="left:calc(' + x.range_pos_pct + '% - 2px)"></i></div><div class="ends"><span>support ' + x.range_low + "</span><span>resistance " + x.range_high + "</span></div></div>"; }).join("") });
  if (cr.body) dives.push({ t: "Crypto desk", p: "Bitcoin " + (cr.btc && cr.btc.price ? "$" + Math.round(cr.btc.price).toLocaleString("en-US") : "") + (cr.eth && cr.eth.price ? " · Ether $" + Math.round(cr.eth.price).toLocaleString("en-US") : ""),
    body: "<p>" + esc(cr.body) + "</p>" + (cr.longs != null ? '<div class="label">Signals: ' + cr.longs + " up · " + cr.shorts + ' down</div><div class="bar"><i style="width:' + (100 * cr.longs / (cr.longs + cr.shorts || 1)) + '%;background:var(--up)"></i><i style="flex:1;background:var(--down);opacity:.55"></i></div>' : "") });
  var semis = (desk.ai_semis || {}).names || [];
  if (semis.length) dives.push({ t: "AI & chips", p: semis.map(function (n) { return n[0]; }).join(", ") + ": who is leading the AI trade today.", body: '<div class="chips">' + semis.map(function (n) { return '<span class="chip">' + esc(n[0]) + ' <span class="' + cls(n[1]) + '">' + (n[1] >= 0 ? "+" : "−") + Math.abs(n[1]).toFixed(2) + "</span></span>"; }).join("") + "</div><p style=\"color:var(--muted);margin:0\">Momentum scores from −1 to +1.</p>" });
  var dis = S.disconnect || {};
  if ((dis.divergences || []).length || (dis.mispriced || []).length) dives.push({ t: "What doesn't add up", p: (dis.divergences || [])[0] || "", body: "<ul>" + (dis.divergences || []).concat((dis.mispriced || []).map(function (m) { return m.text; })).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" });
  if ((S.consensus || []).length) dives.push({ t: "What everyone thinks", p: "Where the crowd leans, and what it may be missing.", body: "<ul>" + S.consensus.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" });
  if ((S.glossary || []).length) dives.push({ t: "Words of the day", p: S.glossary.slice(0, 4).map(function (g) { return g[0]; }).join(" · "), body: '<div class="gl">' + S.glossary.map(function (g) { return "<div><b>" + esc(g[0]) + "</b> <span>" + esc(g[1]) + "</span></div>"; }).join("") + "</div>" });
  $("diveList").innerHTML = dives.map(function (x) { return '<details class="dive"><summary><div class="row"><h3>' + esc(x.t) + '</h3><span class="more">Open</span></div><p>' + esc(x.p) + '</p></summary><div class="body">' + x.body + "</div></details>"; }).join("");

  // the Lounge's chat (the arcade's server: one room per subject, and one per day's brief for its comments)
  var API = window.MIB_CHAT_API || "https://mib-arcade.terminalmib.workers.dev";
  var ls = function (k, v) { try { if (v === undefined) return localStorage.getItem(k) || ""; localStorage.setItem(k, v); } catch (e) { return ""; } };
  var cid = ls("arcade-cid"); if (!cid) { cid = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); ls("arcade-cid", cid); }
  var day = (B.meta && B.meta.date) || new Date().toISOString().slice(0, 10), roomOf = { today: "brief-" + day, markets: "markets", crypto: "crypto", games: "games" };
  var room = "today", ws = null, tries = 0, msgs = [], online = 0, nameMode = !ls("arcade-name");
  var col = function (n) { var h = 0; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 360; return "hsl(" + h + " 55% 45%)"; };
  var hhmm = function (t) { var d = new Date(t); return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); };
  var state = function (s) { $("chatState").textContent = s; };
  var paint = function () {
    $("msgs").innerHTML = msgs.length ? msgs.map(function (m) { return '<div class="m"><span class="av" style="background:' + col(m.n) + '">' + esc((m.n || "?")[0].toUpperCase()) + '</span><div><div class="who">' + esc(m.n) + "<small>" + hhmm(m.at) + '</small></div><p>' + esc(m.x) + "</p></div></div>"; }).join("")
      : '<p style="color:var(--muted);margin:0">' + (room === "today" ? "No comment on this brief yet. Be the first." : "Nobody has said anything here yet. Start it off.") + "</p>";
    $("msgs").scrollTop = 1e6;
  };
  var setForm = function () {
    $("msg").placeholder = nameMode ? "Pick a name to chat (it is also your arcade name)" : room === "today" ? "Comment on today's brief…" : "Say something…";
    $("msg").maxLength = nameMode ? 16 : 280;
    document.querySelector("#send .btn").textContent = nameMode ? "Join" : "Send";
  };
  var connect = function () {
    if (ws) { ws.onclose = null; try { ws.close(); } catch (e) {} }
    var r = room;
    state("connecting…");
    ws = new WebSocket(API.replace(/^http/, "ws") + "/chat?" + new URLSearchParams({ room: roomOf[r], name: ls("arcade-name") || "Guest", cid: cid }));
    ws.onmessage = function (e) {
      var d; try { d = JSON.parse(e.data); } catch (x) { return; }
      if (r !== room) return;
      if (d.t === "hello" || d.t === "reload") { msgs = d.msgs || []; if (d.online) online = d.online; tries = 0; paint(); }
      else if (d.t === "msg") { msgs.push(d.m); if (msgs.length > 200) msgs.shift(); paint(); }
      else if (d.t === "del") { msgs = msgs.filter(function (m) { return m.id !== d.id; }); paint(); }
      else if (d.t === "online") online = d.n;
      else if (d.t === "slow") state("one message every 3 s");
      if (d.t !== "slow") state(online + " here");
    };
    ws.onclose = function () { state("reconnecting…"); setTimeout(function () { if (r === room) connect(); }, Math.min(15000, 1500 * ++tries)); };
  };
  setInterval(function () { if (ws && ws.readyState === 1) ws.send("#ping"); }, 25000);
  $("rooms").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b || b.dataset.room === room) return; room = b.dataset.room; [].forEach.call($("rooms").children, function (x) { x.classList.toggle("on", x === b); }); msgs = []; paint(); setForm(); connect(); });
  $("send").addEventListener("submit", function (e) {
    e.preventDefault(); var v = $("msg").value.trim(); if (!v) return;
    if (nameMode) { var n = v.replace(/[^\p{L}\p{N} _.\-]/gu, "").trim().slice(0, 16); if (!n) return; ls("arcade-name", n); nameMode = false; $("msg").value = ""; setForm(); connect(); return; }
    if (ws && ws.readyState === 1) { ws.send(JSON.stringify({ t: "say", x: v })); $("msg").value = ""; } else state("not connected yet");
  });
  setForm(); connect();
  var G = [["Grand Prix", "race each other at Spa"], ["Strike & Defuse", "5 maps, up to 8 players"], ["Goal Rush", "2 v 2 football"], ["Corsican Empire", "build, gather, conquer"], ["Chaos City", "one city for everyone"], ["Rocks", "together or versus"]];
  $("games") && ($("games").innerHTML = G.map(function (g) { return '<a href="/arcade/"><b>' + esc(g[0]) + "</b><small>" + esc(g[1]) + "</small></a>"; }).join(""));

  // premium and footer
  var P = B.premium || {};
  $("premEyebrow").textContent = P.eyebrow || ""; $("premTitle").textContent = P.title || ""; $("premTag").textContent = P.tagline || "";
  $("premChips").innerHTML = (P.features || []).map(function (f) { return '<span class="chip" title="' + esc(f.detail) + '">' + esc(f.name) + "</span>"; }).join("");
  var F = B.footer || {};
  $("foot").innerHTML = "<div>" + esc(F.disclaimer || "") + "</div><div style=\"margin-top:6px\">" + esc(F.stats || "") + "</div>";

})();
