/* MIB Terminal, "Since this morning" (13 Nov 2026, owner: "I want the MIB to be constantly updated ... this morning the
   key event was inflation being announced; now it's announced but I don't know the result, I need to go to a competitor
   page"). The morning brief stays as it is; this block sits on top of it and is refreshed every 30 minutes on weekdays by
   the mib-live Cloudflare Worker (cloudflare/mib-live): the results of the day's US releases against the forecast and
   what they mean, the big moves since the morning, the new headlines, and a short note. It also writes each result into
   the "Coming up" calendar. Nothing shows if the worker does not answer. */
(function () {
  "use strict";
  if (window.MIB_ARCHIVE_DAY) return;                          // an archived day keeps its own page
  var API = (window.MIB_LIVE_API || "https://mib-live.terminalmib.workers.dev").replace(/\/$/, "");
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var no = function (s) { return '<span translate="no">' + esc(s) + "</span>"; };          // figures and names: never translated
  var hm = function (t) { return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); };
  var dayName = function (t) { var d = new Date(t), n = new Date(); if (d.toDateString() === n.toDateString()) return "today"; var tm = new Date(n.getTime() + 86400000); if (d.toDateString() === tm.toDateString()) return "tomorrow"; return d.toLocaleDateString("en-GB", { weekday: "long" }); };
  var ago = function (t) { var m = Math.round((Date.now() - t) / 60000); return m < 1 ? "just now" : m < 60 ? m + " min ago" : Math.round(m / 60) + " h ago"; };
  var VERD = { above: ["Above forecast", "var(--warn)"], below: ["Below forecast", "var(--warn)"], inline: ["As expected", "var(--up)"] };

  var paint = function (p) {
    var sec = $("latest"); if (!sec || !p || !p.asof) return;
    var n = p.note || {}, res = p.results || [], mv = p.moves || [], nx = p.next || [], hd = p.headlines || [];
    var stale = Date.now() - p.asof > 3 * 3600000;
    $("liveAt").innerHTML = "Updated " + no(hm(p.asof)) + " your time" + (dayName(p.asof) !== "today" ? ", " + esc(dayName(p.asof)) : "")
      + (p.weekend ? " · weekend: every 4 hours" : stale ? "" : " · every 30 min on weekdays");
    $("liveHead").textContent = n.headline || "";

    var nextTxt = nx[0] ? nx[0].name + ", " + dayName(nx[0].t) + " at " + hm(nx[0].t) + " your time" + (nx[0].forecast ? " (expected " + nx[0].forecast + ")" : "") + "." : "";
    $("liveNote").innerHTML = [["What changed", n.changed], ["What to watch", n.watch], ["Next release", nextTxt]]
      .filter(function (r) { return r[1]; }).map(function (r) { return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("");

    // the day's releases: the result against the forecast, or "out, figure not in yet"
    $("liveResults").innerHTML = res.length ? '<div class="label" style="margin:14px 0 6px">Today\'s US releases</div>' + res.map(function (r) {
      var v = VERD[r.verdict];
      var fig = r.status === "out"
        ? "<b class=\"tnum lfig\">" + no(r.actual) + "</b>" + (r.period ? ' <small>for ' + esc(r.period) + "</small>" : "")
          + (r.forecast ? " <small>· expected " + no(r.forecast) + "</small>" : "") + (r.previous ? " <small>· previous " + no(r.previous) + "</small>" : "")
          + (v ? ' <span class="lverd" style="border-color:' + v[1] + ";color:" + v[1] + '">' + esc(v[0]) + "</span>" : "")
        : '<small>Out at ' + no(hm(r.t)) + ' your time' + (r.forecast ? " · expected " + no(r.forecast) : "") + ". The official figure is not in the free data yet" + (r.headline ? ": the first headline is below." : "; next check within 30 min.") + "</small>";
      return '<div class="lres"><div><b>' + esc(r.name) + '</b> <small class="evn" translate="no">' + esc(r.event) + "</small></div><div>" + fig + "</div>"
        + (r.meaning ? "<p>" + esc(r.meaning) + "</p>" : "")
        + (r.headline ? '<p class="lhl"><a href="' + esc(r.headline.url) + '" target="_blank" rel="noopener">' + esc(r.headline.title) + "</a> <small>" + esc(r.headline.src) + "</small></p>" : "") + "</div>";
    }).join("") : "";

    // the moves since the morning (the big ones first)
    // since the first look of the day once it is an hour old; before that (the day's first update), the day's change
    var so = p.sinceOk, mm = mv.filter(function (m) { return so ? m.sinceTxt : m.dayTxt; }).sort(function (a, b) { return (b.big ? 1 : 0) - (a.big ? 1 : 0); });
    $("liveMoves").innerHTML = mm.length ? '<div class="label" style="margin:14px 0 6px">' + (so ? "Since this morning" + (p.morningAt ? " (" + no(hm(p.morningAt)) + ")" : "") : "Today, against the last close") + "</div><div class=\"chips\">" + mm.map(function (m) {
      var x = so ? m.sinceTxt : m.dayTxt, up = /^\+/.test(x);
      return '<span class="chip"' + (m.big ? ' style="outline:2px solid var(--warn)"' : "") + ">" + esc(m.label) + ' <b class="tnum ' + (up ? "u" : /^−/.test(x) ? "d" : "") + '" translate="no">' + esc(x) + "</b></span>";
    }).join("") + "</div>" : "";

    $("liveNews").innerHTML = hd.length ? '<div class="label" style="margin:14px 0 6px">New headlines</div><div class="news">' + hd.slice(0, 6).map(function (h) {
      return '<a href="' + esc(h.url) + '" target="_blank" rel="noopener"><b>' + esc(h.title) + "</b><small>" + esc(h.src) + " · " + esc(ago(h.at)) + "</small></a>";
    }).join("") + "</div>" : "";

    $("liveSrc").textContent = "Official figures from the US agencies via FRED (St. Louis Fed); forecasts from the ForexFactory calendar; prices delayed about 15 min. "
      + (n.by === "ai" ? "The note is written by AI from these figures only." : "The note is written from the figures.");
    sec.hidden = false;
    window.MIB_LIVE_NEXT = nx[0] || null;                       // the hero's "What's next" when the brief's events are all out
    if (window.MIB_HERO) try { window.MIB_HERO(); } catch (e) {}

    // the "Coming up" calendar: each result written into its event
    res.forEach(function (r) {
      if (r.status !== "out") return;
      [].forEach.call(document.querySelectorAll("details.ev1[data-ev]"), function (d) {
        if (d.getAttribute("data-ev") !== r.event || Math.abs(Number(d.getAttribute("data-t")) - r.t) > 5 * 60000) return;
        var tm = d.querySelector(".tm"), body = d.querySelector(".body"), v = VERD[r.verdict];
        if (tm && !tm.querySelector(".lres-cal")) tm.insertAdjacentHTML("beforeend", ' <b class="lres-cal">· result ' + no(r.actual) + "</b>");
        if (body && !body.querySelector(".lres-cal")) body.insertAdjacentHTML("afterbegin", '<span class="lres-cal"><b>Result: ' + no(r.actual) + "</b>" + (r.forecast ? " vs " + no(r.forecast) + " expected" : "") + (v ? " (" + esc(v[0].toLowerCase()) + ")" : "") + ". " + esc(r.meaning || "") + "</span>");
      });
    });
  };

  var load = function () { fetch(API + "/latest", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(paint).catch(function () {}); };
  load(); setInterval(load, 5 * 60000);
})();
