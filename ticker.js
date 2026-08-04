/* MiB — HOMEPAGE TICKER (Bloomberg-style scrolling band)
 *
 * ADDITIVE OVERLAY, loaded after app.js: two thin marquee rows fixed to the
 * bottom of the page. It never touches the renderer, so if anything here throws
 * the immersive brief above is already drawn.
 *
 *   • PRICE band  — near-live delayed quotes from the mib-ticker Cloudflare
 *     worker (window.MIB_TICKER.url). Paints the build-time fallback instantly,
 *     then swaps to fetched values and re-polls every ~60s. If the worker is
 *     unset or unreachable, the band stays on the fallback — never empty.
 *   • NEWS band   — today's own drivers / watchlist / lede from
 *     window.MIB_BRIEF. Zero-cost, always matches the day's brief, and it
 *     re-translates on the FR toggle (i18n.js already carries this prose).
 *
 * All text lands via textContent (data, never markup). Motion honours
 * prefers-reduced-motion; the marquee pauses on hover. */
(function () {
  "use strict";

  var T = window.MIB_TICKER || {};
  var B = window.MIB_BRIEF || null;
  var REDUCED = false;
  try { REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  catch (_) {}

  var POLL_MS = 60000;       // one worker poll a minute (matches its cache)
  var SPEED_PX = 82;         // marquee px/second → duration scales with content

  /* ── tiny helpers ─────────────────────────────────────────── */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null && text !== "") n.textContent = text;
    return n;
  }
  function moveVal(it) { return it.bp != null ? it.bp : it.pct; }
  function moveCls(it) {
    var v = moveVal(it);
    return v > 0 ? "pos" : v < 0 ? "neg" : "flat";
  }
  function fmtPrice(it) {
    if (it.price == null) return "";
    if (it.bp != null) return Number(it.price).toFixed(2) + "%";   // yield level
    var p = Number(it.price), a = Math.abs(p);
    if (a >= 1000) return Math.round(p).toLocaleString("en-US");
    if (a >= 100) return p.toFixed(1);
    if (a >= 1) return p.toFixed(2);
    return p.toFixed(4);
  }
  function fmtMove(it) {
    if (it.bp != null) return (it.bp > 0 ? "+" : "") + it.bp + " bp";
    if (it.pct == null) return "";
    var arrow = it.pct > 0 ? "▲" : it.pct < 0 ? "▼" : "•";
    return arrow + " " + Math.abs(Number(it.pct)).toFixed(2) + "%";
  }

  /* ── marquee plumbing ─────────────────────────────────────── */
  // A marquee = one content sequence, cloned once, inside a track animated by
  // -50%. Duration is set from the measured sequence width so long and short
  // days both scroll at the same readable speed.
  function marquee(rowEl, buildSeq) {
    var track = el("div", "tick-track");
    var seq = el("div", "tick-seq");
    buildSeq(seq);
    track.appendChild(seq);
    track.appendChild(seq.cloneNode(true));   // seamless wrap
    rowEl.innerHTML = "";
    rowEl.appendChild(track);
    // measure after layout so the speed is uniform regardless of content length
    requestAnimationFrame(function () {
      var w = seq.getBoundingClientRect().width || 800;
      var dur = Math.max(18, Math.round(w / SPEED_PX));
      track.style.animationDuration = dur + "s";
    });
    return track;
  }

  /* ── PRICE band ───────────────────────────────────────────── */
  function priceChip(seq, it) {
    var chip = el("span", "tick-chip");
    chip.appendChild(el("span", "tick-sym", it.label || it.sym || ""));
    var price = fmtPrice(it);
    if (price) chip.appendChild(el("span", "tick-px", price));
    var move = fmtMove(it);
    if (move) chip.appendChild(el("b", "tick-mv " + moveCls(it), move));
    return chip;
  }
  function buildPrices(rowEl, items) {
    if (!items || !items.length) return;
    marquee(rowEl, function (seq) {
      items.forEach(function (it) { seq.appendChild(priceChip(seq, it)); });
    });
  }

  /* ── NEWS band ────────────────────────────────────────────── */
  function newsItems() {
    if (!B || !B.sections) return [];
    var s = B.sections, out = [], seen = {};
    function push(txt) {
      var t = String(txt || "").trim();
      if (t.length < 8 || seen[t]) return;
      seen[t] = 1; out.push(t);
    }
    (s.drivers || []).forEach(function (d) { push(d && d.text); });
    var wl = s.watchlist || {};
    (wl.calendar || []).forEach(function (c) { push(c); });
    (wl.items || []).forEach(function (u) {
      if (u && u.event) push(u.event + (u.when ? " — " + u.when : ""));
    });
    if (!out.length && s.story && s.story.lede) push(s.story.lede);
    return out.slice(0, 8);
  }
  function buildNews(rowEl, items) {
    if (!items || !items.length) return false;
    marquee(rowEl, function (seq) {
      items.forEach(function (t) {
        var item = el("span", "tick-news-item");
        item.appendChild(el("i", "tick-dot"));
        item.appendChild(el("span", "", t));
        seq.appendChild(item);
      });
    });
    return true;
  }

  /* ── mount + live updates ─────────────────────────────────── */
  var host, priceRow, newsRow;

  function mount() {
    host = document.getElementById("ticker");
    if (!host) return false;

    var priceItems = (T.fallback || []).slice();
    var news = newsItems();
    if (!priceItems.length && !news.length) return false;   // nothing to show

    // price row
    var pWrap = el("div", "tick-row tick-prices");
    pWrap.appendChild(el("span", "tick-tag", "DELAYED"));
    priceRow = el("div", "tick-marquee");
    pWrap.appendChild(priceRow);

    // news row
    var nWrap = el("div", "tick-row tick-news");
    nWrap.appendChild(el("span", "tick-tag alt", "MARKETS"));
    newsRow = el("div", "tick-marquee");
    nWrap.appendChild(newsRow);

    host.innerHTML = "";
    if (priceItems.length) host.appendChild(pWrap);
    if (news.length) host.appendChild(nWrap);
    host.hidden = false;
    document.body.classList.add("has-ticker");

    if (priceItems.length) buildPrices(priceRow, priceItems);
    if (news.length) buildNews(newsRow, news);
    return true;
  }

  function refreshPrices() {
    if (!T.url || !priceRow) return;
    fetch(T.url, { cache: "no-store" }).then(function (r) {
      return r.ok ? r.json() : null;
    }).then(function (data) {
      if (data && data.items && data.items.length) {
        buildPrices(priceRow, data.items);
      }
    }).catch(function () { /* keep the fallback / last good values */ });
  }

  function boot() {
    if (!mount()) return;
    refreshPrices();                       // upgrade fallback → live once
    if (T.url) setInterval(refreshPrices, POLL_MS);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
