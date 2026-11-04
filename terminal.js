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
  var chg = function (t) { return t.bp != null ? (t.bp >= 0 ? "+" : "−") + Math.abs(t.bp) + " bp" : pct(t.pct); }, chc = function (t) { return t.bp != null ? cls(t.bp) : cls(t.pct); };
  var px = function (t) { return t.price != null ? t.price.toLocaleString("en-US", { maximumFractionDigits: t.price > 1000 ? 0 : 2 }) : ""; };
  var paintTape = function (list) {
    if (!list || !list.length) return;
    items = list;
    var one = list.map(function (t) { return '<div class="tk"><span>' + esc(t.label) + '</span>' + px(t) + ' <b class="' + chc(t) + '">' + chg(t) + "</b></div>"; }).join("");
    $("tape").innerHTML = one + '<div class="tk sep" aria-hidden="true">·</div>' + one;            // twice, so it can roll round
    var b = $("board"); if (b) b.innerHTML = list.map(function (t) {
      var v = t.bp != null ? t.bp / 10 : t.pct, k = v == null ? 0 : Math.max(-1, Math.min(1, v / 1.5));
      var bg = v == null ? "var(--raised)" : "color-mix(in srgb, " + (k >= 0 ? "var(--up)" : "var(--down)") + " " + Math.round(10 + Math.abs(k) * 38) + "%, var(--surface))";
      return '<div class="bt" style="background:' + bg + '"><span>' + esc(t.label) + '</span><b class="tnum">' + px(t) + '</b><i class="tnum ' + chc(t) + '">' + chg(t) + "</i></div>";
    }).join("");
  };
  // 4 Nov (owner: "the bar with key info is not rolling, it has to be swiped with a finger"): it rolls by itself, a
  // finger or the mouse stops it for a few seconds, and it can still be swiped
  (function () {
    var el = $("tape"), hold = 0, last = performance.now(), pos = 0, held = false;
    var stop = function () { hold = performance.now() + 4000; held = true; };
    ["pointerdown", "touchstart", "wheel", "mouseenter"].forEach(function (ev) { el.addEventListener(ev, stop, { passive: true }); });
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // 4 Nov (owner: "the bar is not rolling any more"): half a pixel a frame was added to scrollLeft, which Safari keeps
    // in whole pixels, so it never moved; the position is now kept here and written whole
    var step = function (t) {
      var dt = Math.min(0.05, (t - last) / 1000); last = t;
      if (t > hold && el.scrollWidth > el.clientWidth + 4) {
        if (held) { pos = el.scrollLeft; held = false; }             // carry on from where a finger left it
        pos += 34 * dt; var half = el.scrollWidth / 2; if (pos >= half) pos -= half;
        el.scrollLeft = Math.round(pos);
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  })();
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
  if (vixJump || (R.vix && R.vix > 20)) { var vx = (get("VIX") || {}).price || R.vix; h.push("the VIX fear gauge " + (vixJump ? "jumps to " + Number(vx).toFixed(1) : "sits above 20, at " + Number(vx).toFixed(1))); }
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
  // 4 Nov (owner: "a coming-up event should have a simple way to set a reminder, like adding it to the calendar"): a
  // calendar file (iPhone, Android, Outlook, Mac: it opens "add to calendar") with an alert 15 minutes before, or Google
  // Calendar's own page. Nothing is sent anywhere until one is tapped.
  var stamp = function (t) { return new Date(t).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, ""); };
  var remind = function (e) {
    var t = when(e); if (t >= 9e15) return "";
    var title = (e.event || "Market event") + " (MIB Terminal)", note = [e.confirms ? "As expected: " + e.confirms : "", e.invalidates ? "Surprise: " + e.invalidates : "", "https://mibterminal.com/#calendar"].filter(Boolean).join("\n");
    var icsEsc = function (x) { return String(x).replace(/\\/g, "\\\\").replace(/[,;]/g, "\\$&").replace(/\n/g, "\\n"); };
    var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MIB Terminal//EN", "BEGIN:VEVENT", "UID:" + t + "-" + String(e.event || "").replace(/\W+/g, "") + "@mibterminal.com", "DTSTAMP:" + stamp(Date.now()),
      "DTSTART:" + stamp(t), "DTEND:" + stamp(t + 30 * 60000), "SUMMARY:" + icsEsc(title), "DESCRIPTION:" + icsEsc(note),
      "BEGIN:VALARM", "TRIGGER:-PT15M", "ACTION:DISPLAY", "DESCRIPTION:" + icsEsc(title), "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    var g = "https://calendar.google.com/calendar/render?" + new URLSearchParams({ action: "TEMPLATE", text: title, dates: stamp(t) + "/" + stamp(t + 30 * 60000), details: note });
    return '<span class="remind"><a class="btn" download="mib-' + stamp(t).slice(0, 8) + '.ics" href="data:text/calendar;charset=utf-8,' + encodeURIComponent(ics) + '">🔔 Add to my calendar</a>'
      + '<a class="btn ghost" target="_blank" rel="noopener" href="' + esc(g) + '">Google Calendar</a></span>';
  };
  $("cal").innerHTML = Object.keys(days).map(function (k) {
    return '<div class="day"><div class="dl">' + esc(k) + '</div><div class="ev">' + days[k].map(function (e) {
      return '<details class="ev1"><summary><i class="imp" style="background:' + (impc[e.impact] || "var(--muted)") + '" title="' + esc(e.impact) + ' impact"></i><b>' + esc(e.event) + '</b><span class="tm">' + esc((e.when || "").split(" ").slice(3).join(" ")) + (e.consensus ? " · exp. " + esc(e.consensus) : "") + "</span></summary>"
        + '<div class="body">' + (e.confirms ? "<span>As expected: " + esc(e.confirms) + "</span>" : "") + (e.invalidates ? "<span>Surprise: " + esc(e.invalidates) + "</span>" : "") + (!e.confirms && !e.invalidates ? "<span>" + esc(e.impact) + " impact</span>" : "") + remind(e) + "</div></details>";
    }).join("") + "</div></div>";
  }).join("") || '<p class="sub">No major event this week.</p>';

  // deep dives (4 Nov, owner: "the themes are great, the content and substance not"): each one gives the figures that
  // matter and the day's headlines on that theme; nothing generic
  var dives = [], desk = S.desks || {}, cr = desk.crypto || {}, lv = (desk.chart_read || {}).levels || {};
  var TAG = { crypto: /bitcoin|crypto|\bether\b|ethereum|\bbtc\b|binance|coinbase|stablecoin|blockchain|solana/i, ai: /\bai\b|nvidia|chip|semiconductor|\bamd\b|intel|tsmc|openai|data cent|broadcom|micron|qualcomm|anthropic/i,
    macro: /\bfed\b|powell|inflation|\bcpi\b|jobs|payroll|unemployment|yield|treasur|rate cut|rate hike|gdp|tariff|recession|consumer/i, energy: /\boil\b|opec|crude|natural gas|gasoline|\bgold\b|copper|commodit/i,
    earn: /earnings|revenue|guidance|outlook|quarter|q[1-4]\b|beats|misses|profit/i };
  var tagged = function (k, n) { return NEWS.filter(function (x) { return TAG[k].test(x.title); }).slice(0, n || 4); };
  var heads = function (k) { var xs = tagged(k); return xs.length ? '<div class="label">In the news</div><ul class="hl">' + xs.map(function (x) { return '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.title) + "</a> <small>" + esc(x.src) + " · " + esc(ago(x.at)) + "</small></li>"; }).join("") + "</ul>" : ""; };
  var bar2 = function (l, v, max, txt) { var w = Math.max(2, Math.min(100, 100 * Math.abs(v) / (max || 1))); return '<div class="mini"><span>' + esc(l) + '</span><div class="mt"><i style="width:' + w + "%;background:" + (v >= 0 ? "var(--up)" : "var(--down)") + '"></i></div><b class="tnum ' + cls(v) + '">' + esc(txt) + "</b></div>"; };
  var share = function (l, v, txt, goodHigh) { return '<div class="mini"><span>' + esc(l) + '</span><div class="mt"><i style="width:' + Math.max(2, Math.min(100, v)) + "%;background:" + ((goodHigh ? v >= 50 : v < 50) ? "var(--up)" : "var(--warn)") + '"></i></div><b class="tnum">' + esc(txt) + "</b></div>"; };
  var brd = tape.breadth || {}, sec2 = ((S.money || {}).sectors || []);
  if (brd.pct != null) {
    var lead = ((S.money || {}).leaders || []).slice(0, 3).map(function (x) { return x[0] + " (" + x[2] + ")"; }).join(", "), lag = ((S.money || {}).laggards || []).slice(0, 3).map(function (x) { return x[0] + " (" + x[2] + ")"; }).join(", ");
    dives.push({ t: "Who is buying", p: brd.pct + "% of " + (brd.n || "the") + " instruments rose · " + (tape.green_sectors != null ? tape.green_sectors + " of " + tape.total_sectors + " sectors green" : "") + (tape.concentration != null ? " · top 3 names = " + Math.round(tape.concentration * 100) + "% of the gains" : ""),
      body: share("Instruments rising", brd.pct, brd.pct + "%", true) + (tape.green_sectors != null ? share("Sectors green", tape.green_sectors / tape.total_sectors * 100, tape.green_sectors + " / " + tape.total_sectors, true) : "")
        + (tape.concentration != null ? share("Gains from the top 3 names", tape.concentration * 100, Math.round(tape.concentration * 100) + "%", false) : "")
        + (brd.delta != null ? "<p>Compared with the same session before, " + Math.abs(Math.round(brd.delta * 100)) + "% " + (brd.delta < 0 ? "fewer" : "more") + " instruments are taking part. " + (brd.pct < 40 ? "A narrow rise like this often fades unless more names join in." : brd.pct > 60 ? "A broad move: most of the market agrees." : "") + "</p>" : "")
        + (lead ? "<p><b>Leading:</b> " + esc(lead) + "<br><b>Lagging:</b> " + esc(lag) + "</p>" : "") });
  }
  var lvKeys = Object.keys(lv).filter(function (k) { return lv[k].range_low != null; });
  var NAMES = { SPY: "S&P 500", QQQ: "Nasdaq 100", SMH: "Chip stocks", XLB: "Materials", IWM: "Small caps", DIA: "Dow" };
  if (lvKeys.length) dives.push({ t: "Price levels", p: lvKeys.map(function (k) { return (NAMES[k] || k) + " at " + lv[k].range_pos_pct + "% of its range"; }).slice(0, 2).join(" · "),
    body: lvKeys.map(function (k) { var x = lv[k], pos = x.range_pos_pct, verdict = pos >= 75 ? "pressing on resistance" : pos <= 25 ? "close to support" : "mid-range";
      return '<div class="lvl"><div style="display:flex;justify-content:space-between;gap:8px"><b>' + esc(NAMES[k] || k) + ' <small style="color:var(--muted)">' + esc(k) + '</small></b><span class="tnum">' + x.price + " · " + esc(verdict) + '</span></div><div class="rng"><i style="left:calc(' + pos + '% - 2px)"></i></div><div class="ends"><span>support ' + x.range_low + "</span><span>resistance " + x.range_high + "</span></div></div>"; }).join("")
      + "<p>Near the top of the range, a break higher confirms strength; a fall back from it is a warning. Near the bottom, support either holds or gives way.</p>" });
  if (cr.body || tagged("crypto").length) {
    var btc = cr.btc || {}, eth = cr.eth || {}, lv2 = lv.BTCUSD || {};
    dives.push({ t: "Crypto desk", p: (btc.price ? "Bitcoin $" + Math.round(btc.price).toLocaleString("en-US") : "") + (eth.price ? " · Ether $" + Math.round(eth.price).toLocaleString("en-US") : "") + (cr.longs != null ? " · " + cr.longs + " signals up, " + cr.shorts + " down" : ""),
      body: (btc.price ? '<div class="tiles"><div><span>Bitcoin</span><b class="tnum">$' + Math.round(btc.price).toLocaleString("en-US") + "</b>" + (lv2.nearest_support ? "<small>support " + Math.round(lv2.nearest_support).toLocaleString("en-US") + " · resistance " + Math.round(lv2.nearest_resistance).toLocaleString("en-US") + "</small>" : "") + "</div>" + (eth.price ? '<div><span>Ether</span><b class="tnum">$' + Math.round(eth.price).toLocaleString("en-US") + "</b></div>" : "") + "</div>" : "")
        + (cr.body ? "<p>" + esc(cr.body.replace(/Bias: [^\s]+ /, "Bias: ")) + "</p>" : "")
        + (cr.longs != null ? share("Crypto signals up", cr.longs / (cr.longs + cr.shorts || 1) * 100, cr.longs + " of " + (cr.longs + cr.shorts), true) : "") + heads("crypto") });
  }
  var semis = (desk.ai_semis || {}).names || [];
  if (semis.length || tagged("ai").length) {
    var best = semis.slice().sort(function (a, b) { return b[1] - a[1]; });
    dives.push({ t: "AI & chips", p: best.length ? "Strongest " + best[0][0] + ", weakest " + best[best.length - 1][0] + (lv.SMH ? " · chip stocks at " + lv.SMH.range_pos_pct + "% of their range" : "") : "The AI trade in today's news",
      body: best.map(function (n) { return bar2(n[0], n[1], 1, (n[1] >= 0 ? "+" : "−") + Math.abs(n[1]).toFixed(2)); }).join("") + (best.length ? '<p style="color:var(--muted)">Momentum from −1 (selling) to +1 (buying).</p>' : "") + heads("ai") });
  }
  var macroEv = ((S.watchlist || {}).items || []).filter(function (e) { return e.impact === "high"; });
  if (macroEv.length || tagged("macro").length) dives.push({ t: "Jobs, inflation & the Fed", p: macroEv.length ? macroEv.length + " big releases ahead: " + macroEv.slice(0, 2).map(function (e) { return e.event; }).join(", ") : "The economy in today's news",
    body: macroEv.map(function (e) { return "<p><b>" + esc(e.event) + "</b> · " + esc(e.when) + (e.consensus ? " · expected " + esc(e.consensus) : "") + (e.invalidates ? "<br><span style=\"color:var(--muted)\">A surprise: " + esc(e.invalidates) + "</span>" : "") + "</p>"; }).join("") + heads("macro") });
  var oil = get("WTI"), gold = get("GOLD");
  if (oil || gold || tagged("energy").length) dives.push({ t: "Oil, gold & commodities", p: [oil ? "Oil $" + oil.price + " " + pct(oil.pct) : "", gold ? "Gold $" + Math.round(gold.price) + " " + pct(gold.pct) : ""].filter(Boolean).join(" · ") || "Commodities in the news",
    body: (oil || gold ? '<div class="tiles">' + [oil, gold, get("DXY")].filter(Boolean).map(function (t) { return "<div><span>" + esc(t.label) + '</span><b class="tnum">' + px(t) + '</b><small class="' + chc(t) + '">' + chg(t) + "</small></div>"; }).join("") + "</div>" : "") + heads("energy") });
  if (tagged("earn").length) dives.push({ t: "Earnings", p: tagged("earn", 2).map(function (x) { return x.title.split(/[:,]/)[0]; }).join(" · "), body: heads("earn") });
  var risks = [];
  if ((S.story || {}).counter) risks.push("What could flip it: " + S.story.counter);
  ((S.disconnect || {}).divergences || []).forEach(function (x) { if (risks.indexOf(x) < 0) risks.push(x); });
  (S.changed || []).forEach(function (x) { risks.push("Changed since yesterday: " + x); });
  if (risks.length) dives.push({ t: "Risks to watch", p: risks[0], body: "<ul>" + risks.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" });
  if ((S.glossary || []).length) dives.push({ t: "Words of the day", p: S.glossary.slice(0, 4).map(function (g) { return g[0]; }).join(" · "), body: '<div class="gl">' + S.glossary.map(function (g) { return "<div><b>" + esc(g[0]) + "</b> <span>" + esc(g[1]) + "</span></div>"; }).join("") + "</div>" });
  $("diveList").innerHTML = dives.map(function (x) { return '<details class="dive"><summary><div class="row"><h3>' + esc(x.t) + '</h3><span class="more">Open</span></div><p>' + esc(x.p) + '</p></summary><div class="body">' + x.body + "</div></details>"; }).join("");

  // the Lounge's chat (the arcade's server: one room per subject, and one per day's brief for its comments)
  var API = window.MIB_CHAT_API || "https://mib-arcade.terminalmib.workers.dev";
  var ls = function (k, v) { try { if (v === undefined) return localStorage.getItem(k) || ""; localStorage.setItem(k, v); } catch (e) { return ""; } };
  var cid = ls("arcade-cid"); if (!cid) { cid = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); ls("arcade-cid", cid); }
  var day = (B.meta && B.meta.date) || new Date().toISOString().slice(0, 10), roomOf = { today: "brief-" + day, markets: "markets", crypto: "crypto", games: "games" };
  var room = "today", ws = null, tries = 0, msgs = [], online = 0, nameMode = !ls("arcade-name");
  var AVS = window.MIB_AV || [], myAv = function () { var i = +ls("mib-avatar"); return isNaN(i) ? -1 : i; };
  var col = function (n) { var h = 0; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 360; return "hsl(" + h + " 55% 45%)"; };
  var hhmm = function (t) { var d = new Date(t); return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); };
  var state = function (s) { $("chatState").textContent = s; };
  var paint = function () {
    $("msgs").innerHTML = msgs.length ? msgs.map(function (m) { return '<div class="m"><span class="av" style="background:' + (AVS[m.a] ? "var(--raised)" : col(m.n)) + (AVS[m.a] ? ";font-size:18px" : "") + '">' + esc(AVS[m.a] || (m.n || "?")[0].toUpperCase()) + '</span><div><div class="who">' + esc(m.n) + "<small>" + hhmm(m.at) + '</small></div><p>' + esc(m.x) + "</p></div></div>"; }).join("")
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
    ws = new WebSocket(API.replace(/^http/, "ws") + "/chat?" + new URLSearchParams({ room: roomOf[r], name: ls("arcade-name") || "Guest", cid: cid, a: String(myAv()) }));
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
    if (nameMode) { var n = v.replace(/[^\p{L}\p{N} _.\-]/gu, "").trim().slice(0, 16); if (!n) return; ls("arcade-name", n); nameMode = false; $("msg").value = ""; setForm(); connect(); window.dispatchEvent(new CustomEvent("mib-me")); return; }
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ t: "say", x: v })); $("msg").value = "";
      var rs = (ls("mib-rooms") || "").split(",").filter(Boolean); if (rs.indexOf(roomOf[room]) < 0) { rs.push(roomOf[room]); ls("mib-rooms", rs.slice(-40).join(",")); }
    } else state("not connected yet");
  });
  setForm(); connect();
  addEventListener("mib-me", function () { nameMode = !ls("arcade-name"); setForm(); connect(); });   // a new name or avatar from the menu bar
  // who is on the site right now (the menu bar's line to the server), to start a game on the spot
  var paintHere = function () {
    var h = window.MIB_HERE || { n: 0, who: [] }, el = $("here"); if (!el) return;
    el.innerHTML = '<div class="label">Online now · ' + h.n + "</div>" + (h.who.length ? '<div class="chips">' + h.who.map(function (w) { return '<span class="chip">' + esc((AVS[w.a] || "👤") + " " + w.n) + (w.p === "arcade" ? ' <small style="color:var(--up)">playing</small>' : "") + "</span>"; }).join("") + "</div>"
      + (h.n > h.who.length ? '<p style="color:var(--muted);margin:4px 0 0;font-size:14px">+ ' + (h.n - h.who.length) + " visitor" + (h.n - h.who.length > 1 ? "s" : "") + " without a name</p>" : "")
      : '<p style="color:var(--muted);margin:4px 0 0;font-size:14px">' + (h.n > 1 ? h.n + " people here, none has picked a name yet." : "Just you for now. Share the site and play together.") + "</p>");
  };
  addEventListener("mib-here", paintHere); paintHere();
  var G = [["Grand Prix", "race each other at Spa"], ["Strike & Defuse", "5 maps, up to 8 players"], ["Goal Rush", "2 v 2 football"], ["Corsican Empire", "build, gather, conquer"], ["Chaos City", "one city for everyone"], ["Rocks", "together or versus"]];
  $("games") && ($("games").innerHTML = G.map(function (g) { return '<a href="/arcade/"><b>' + esc(g[0]) + "</b><small>" + esc(g[1]) + "</small></a>"; }).join(""));

  // premium and footer
  var P = B.premium || {};
  $("premEyebrow").textContent = P.eyebrow || ""; $("premTitle").textContent = P.title || ""; $("premTag").textContent = P.tagline || "";
  $("premChips").innerHTML = (P.features || []).map(function (f) { return '<span class="chip" title="' + esc(f.detail) + '">' + esc(f.name) + "</span>"; }).join("");
  var F = B.footer || {};
  $("foot").innerHTML = "<div>" + esc(F.disclaimer || "") + "</div><div style=\"margin-top:6px\">" + esc(F.stats || "") + "</div>";

})();
