/* MiB — IMMERSIVE TERMINAL (isolated prototype)
   Renders window.MIB_BRIEF (built by concept/build.py from the EXISTING
   daily brief — same content, same wording, same hierarchy) as a scroll-
   driven narrative. All brief text lands via textContent (never innerHTML),
   so the manifest is treated as data, not markup.

   The background "visual world" is procedural line-art seeded by the date:
   the brief's own regime picks the mood (palette + pace) and the brief's own
   words pick the scenery (tankers vs chips vs radar). Visual layer only —
   zero editorial. */

(function () {
  "use strict";

  var B = window.MIB_BRIEF;
  if (!B) { document.body.textContent = "No brief manifest — run concept/build.py first."; return; }

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MOOD = (B.regime && B.regime.mood) || "neutral";
  var TIER = (B.meta && B.meta.tier) || "member";

  /* mood → pace + world palette (motion should feel expensive, never busy) */
  var MOODS = {
    on:      { dur: "0.85s", flow: 1.5,  glow: "60,196,141",  drift: 1.25 },
    off:     { dur: "1.35s", flow: 0.55, glow: "233,185,73",  drift: 0.6  },
    neutral: { dur: "1.1s",  flow: 0.85, glow: "150,168,190", drift: 0.85 }
  };
  var moodCfg = MOODS[MOOD] || MOODS.neutral;
  document.documentElement.style.setProperty("--dur", moodCfg.dur);
  document.body.classList.add("mood-" + MOOD);

  /* ── tiny helpers ─────────────────────────────────────────── */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null && text !== "") n.textContent = text;
    return n;
  }
  function rv(node, i) { node.classList.add("rv"); node.style.setProperty("--stagger", i || 0); return node; }
  function signCls(v) { return v > 0 ? "pos" : v < 0 ? "neg" : "flat"; }
  function fmtPct(v) { return (v > 0 ? "+" : "") + Number(v).toFixed(1) + "%"; }
  function firstSentence(t) {
    var m = String(t || "").match(/^.*?[.!?](?=\s|$)/);
    return m ? m[0] : String(t || "");
  }

  /* seeded PRNG — same day, same world; new day, new world */
  function seedFrom(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ══════════════════════════════════════════════════════════
     THE VISUAL WORLD — procedural blueprint scenery on canvas
     ══════════════════════════════════════════════════════════ */
  var GOLD = "233,185,73", INKC = "244,247,250", STEEL = "120,150,185";

  /* each glyph draws centred on (0,0) inside ~[-60..60]×[-40..40] units */
  var GLYPHS = {
    tanker: function (ctx, t) {
      var bob = Math.sin(t * 0.4) * 1.2;
      ctx.save(); ctx.translate(0, bob);
      ctx.beginPath();                                  /* hull */
      ctx.moveTo(-58, 8); ctx.lineTo(-50, 20); ctx.lineTo(46, 20);
      ctx.lineTo(58, 8); ctx.closePath(); ctx.stroke();
      ctx.strokeRect(30, -6, 16, 14);                   /* bridge */
      ctx.strokeRect(34, -12, 8, 6);
      ctx.beginPath(); ctx.moveTo(38, -12); ctx.lineTo(38, -20); ctx.stroke();
      for (var i = 0; i < 5; i++) {                     /* tank domes */
        ctx.beginPath(); ctx.arc(-44 + i * 15, 8, 5, Math.PI, 0); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(-58, 8); ctx.lineTo(58, 8); ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= 0.35;              /* waterline */
      ctx.beginPath(); ctx.moveTo(-70, 24); ctx.lineTo(70, 24); ctx.stroke();
      ctx.restore();
    },
    rig: function (ctx) {
      ctx.beginPath(); ctx.moveTo(-30, 20); ctx.lineTo(30, 20); ctx.stroke();     /* deck */
      ctx.beginPath(); ctx.moveTo(-24, 20); ctx.lineTo(-24, 36); ctx.moveTo(24, 20);
      ctx.lineTo(24, 36); ctx.moveTo(0, 20); ctx.lineTo(0, 36); ctx.stroke();      /* legs */
      ctx.beginPath();                                                             /* derrick */
      ctx.moveTo(-10, 20); ctx.lineTo(0, -34); ctx.lineTo(10, 20);
      ctx.moveTo(-7, 6); ctx.lineTo(7, 6); ctx.moveTo(-4.5, -8); ctx.lineTo(4.5, -8);
      ctx.moveTo(-7, 6); ctx.lineTo(4.5, -8); ctx.moveTo(7, 6); ctx.lineTo(-4.5, -8);
      ctx.stroke();
      ctx.strokeRect(12, 8, 14, 12);                                               /* module */
    },
    radar: function (ctx, t) {
      var i;
      for (i = 1; i <= 3; i++) {                        /* range rings */
        ctx.save(); ctx.globalAlpha *= 0.25 + 0.18 * i;
        ctx.beginPath(); ctx.arc(0, 0, i * 15, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(50, 0);
      ctx.moveTo(0, -50); ctx.lineTo(0, 50); ctx.stroke();
      var a = (t * 0.5) % (Math.PI * 2);                /* sweep + trail */
      for (i = 0; i < 7; i++) {
        ctx.save(); ctx.globalAlpha *= (1 - i / 7) * 0.6;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a - i * 0.09) * 45, Math.sin(a - i * 0.09) * 45);
        ctx.stroke(); ctx.restore();
      }
      ctx.beginPath(); ctx.arc(Math.cos(a - 0.6) * 30, Math.sin(a - 0.6) * 30, 1.8, 0, Math.PI * 2);
      ctx.fill();
    },
    satellite: function (ctx, t) {
      ctx.save(); ctx.rotate(Math.sin(t * 0.12) * 0.08);
      ctx.strokeRect(-8, -6, 16, 12);                   /* bus */
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-30, 0); ctx.moveTo(8, 0); ctx.lineTo(30, 0); ctx.stroke();
      ctx.strokeRect(-30, -8, 14, 16); ctx.strokeRect(16, -8, 14, 16);  /* panels */
      ctx.beginPath(); ctx.moveTo(-27, -4); ctx.lineTo(-19, 4); ctx.moveTo(-23, -6); ctx.lineTo(-17, 0);
      ctx.moveTo(19, -4); ctx.lineTo(27, 4); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -12, 5, Math.PI, 0); ctx.moveTo(0, -12); ctx.lineTo(0, -6); ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= 0.3;               /* orbit trace */
      ctx.beginPath(); ctx.arc(0, 90, 108, -Math.PI * 0.78, -Math.PI * 0.22); ctx.stroke();
      ctx.restore();
    },
    columns: function (ctx) {
      ctx.beginPath();                                  /* pediment */
      ctx.moveTo(-44, -16); ctx.lineTo(0, -34); ctx.lineTo(44, -16); ctx.closePath(); ctx.stroke();
      for (var i = 0; i < 6; i++) {                     /* colonnade */
        var x = -35 + i * 14;
        ctx.strokeRect(x, -12, 6, 34);
      }
      ctx.beginPath(); ctx.moveTo(-48, -16); ctx.lineTo(48, -16);
      ctx.moveTo(-48, 22); ctx.lineTo(48, 22); ctx.moveTo(-52, 27); ctx.lineTo(52, 27);
      ctx.moveTo(-56, 32); ctx.lineTo(56, 32); ctx.stroke();   /* steps */
    },
    curveGlyph: function (ctx, t) {
      ctx.beginPath(); ctx.moveTo(-45, -30); ctx.lineTo(-45, 26); ctx.lineTo(50, 26); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-45, 18);
      var i, breathe = Math.sin(t * 0.3) * 1.5;
      for (i = 0; i <= 20; i++) {
        var x = -45 + i * 4.6;
        var y = 18 - 34 * (1 - Math.exp(-i / 6)) + (i > 10 ? breathe * (i - 10) / 10 : 0);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([2, 4]);                          /* forward curve ghost */
      ctx.beginPath(); ctx.moveTo(-45, 14);
      for (i = 0; i <= 20; i++) ctx.lineTo(-45 + i * 4.6, 14 - 22 * (1 - Math.exp(-i / 7)));
      ctx.stroke(); ctx.setLineDash([]);
    },
    chip: function (ctx) {
      ctx.strokeRect(-26, -26, 52, 52);
      ctx.strokeRect(-14, -14, 28, 28);
      var i;
      for (i = 0; i < 5; i++) {                         /* pins */
        var p = -20 + i * 10;
        ctx.beginPath();
        ctx.moveTo(p, -26); ctx.lineTo(p, -34); ctx.moveTo(p, 26); ctx.lineTo(p, 34);
        ctx.moveTo(-26, p); ctx.lineTo(-34, p); ctx.moveTo(26, p); ctx.lineTo(34, p);
        ctx.stroke();
      }
      ctx.beginPath();                                  /* traces */
      ctx.moveTo(-14, -20); ctx.lineTo(-20, -20); ctx.lineTo(-20, -14);
      ctx.moveTo(14, 20); ctx.lineTo(20, 20); ctx.lineTo(20, 14);
      ctx.moveTo(-14, 8); ctx.lineTo(-22, 8); ctx.moveTo(14, -8); ctx.lineTo(22, -8);
      ctx.stroke();
    },
    rack: function (ctx, t) {
      ctx.strokeRect(-18, -36, 36, 72);
      for (var i = 0; i < 6; i++) {
        var y = -30 + i * 11;
        ctx.strokeRect(-14, y, 28, 7);
        var on = (Math.sin(t * 1.6 + i * 1.7) + 1) / 2 > 0.45;
        ctx.save(); ctx.globalAlpha *= on ? 0.9 : 0.2;
        ctx.beginPath(); ctx.arc(9, y + 3.5, 1.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    },
    crane: function (ctx) {
      ctx.beginPath();
      ctx.moveTo(-20, 34); ctx.lineTo(-20, -22); ctx.moveTo(-6, 34); ctx.lineTo(-6, -22);
      ctx.moveTo(-20, -22) ; ctx.lineTo(44, -22);        /* boom */
      ctx.moveTo(-20, -22); ctx.lineTo(-13, -34); ctx.lineTo(6, -22);
      ctx.moveTo(-13, -34); ctx.lineTo(30, -22);
      ctx.moveTo(-20, 6); ctx.lineTo(-6, 6); ctx.moveTo(-20, 20); ctx.lineTo(-6, 20);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(26, -22); ctx.lineTo(26, -6); ctx.stroke();
      ctx.strokeRect(20, -6, 12, 8);                     /* hoisted container */
    },
    containers: function (ctx) {
      var rows = [[-30, 12, 3], [-22, 0, 2], [-14, -12, 1]];
      for (var r = 0; r < rows.length; r++) {
        for (var c = 0; c < rows[r][2]; c++) {
          ctx.strokeRect(rows[r][0] + c * 22, rows[r][1], 20, 10);
          ctx.beginPath();
          ctx.moveTo(rows[r][0] + c * 22 + 5, rows[r][1]);
          ctx.lineTo(rows[r][0] + c * 22 + 5, rows[r][1] + 10);
          ctx.stroke();
        }
      }
    },
    coinGlyph: function (ctx, t) {
      ctx.save(); ctx.rotate(Math.sin(t * 0.15) * 0.05);
      ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 21, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();                                  /* the ₿ strokes */
      ctx.moveTo(-6, -13); ctx.lineTo(-6, 13);
      ctx.moveTo(-6, -13); ctx.lineTo(4, -13);
      ctx.arc(4, -7, 6, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(-6, -1); ctx.moveTo(-6, -1); ctx.lineTo(5, -1);
      ctx.arc(5, 6, 7, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(-6, 13);
      ctx.moveTo(-2, -13); ctx.lineTo(-2, -17); ctx.moveTo(-2, 13); ctx.lineTo(-2, 17);
      ctx.stroke(); ctx.restore();
    },
    nodes: function (ctx, t, rng) {
      var pts = [], i, j;
      for (i = 0; i < 9; i++) {
        pts.push([(rng() - 0.5) * 110, (rng() - 0.5) * 70]);
      }
      ctx.save(); ctx.globalAlpha *= 0.55;
      for (i = 0; i < pts.length; i++) {
        for (j = i + 1; j < pts.length; j++) {
          var dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1];
          if (dx * dx + dy * dy < 2400) {
            ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]);
            ctx.lineTo(pts[j][0], pts[j][1]); ctx.stroke();
          }
        }
      }
      ctx.restore();
      for (i = 0; i < pts.length; i++) {
        var pulse = 1 + Math.sin(t * 0.9 + i * 2) * 0.4;
        ctx.beginPath(); ctx.arc(pts[i][0], pts[i][1], 1.6 * pulse, 0, Math.PI * 2); ctx.fill();
      }
    },
    helix: function (ctx, t) {
      var i, ph = t * 0.35;
      ctx.beginPath();
      for (i = 0; i <= 36; i++) {
        var y = -40 + i * 2.2, x = Math.sin(i * 0.32 + ph) * 16;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.beginPath();
      for (i = 0; i <= 36; i++) {
        var y2 = -40 + i * 2.2, x2 = Math.sin(i * 0.32 + ph + Math.PI) * 16;
        i ? ctx.lineTo(x2, y2) : ctx.moveTo(x2, y2);
      }
      ctx.stroke();
      ctx.save(); ctx.globalAlpha *= 0.5;
      for (i = 2; i <= 34; i += 4) {
        var yy = -40 + i * 2.2;
        ctx.beginPath();
        ctx.moveTo(Math.sin(i * 0.32 + ph) * 16, yy);
        ctx.lineTo(Math.sin(i * 0.32 + ph + Math.PI) * 16, yy);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  var THEME_GLYPHS = {
    energy:     ["tanker", "rig"],
    defense:    ["radar", "satellite"],
    semis:      ["chip", "rack"],
    macro:      ["columns", "curveGlyph"],
    china:      ["crane", "containers"],
    crypto:     ["coinGlyph", "nodes"],
    healthcare: ["helix"]
  };

  function World(canvas) {
    var ctx = canvas.getContext("2d");
    var seed = seedFrom((B.meta && B.meta.date) || "mib");
    var rng = mulberry32(seed);
    var W = 0, H = 0, DPR = 1;
    var scroll = 0, heroFade = 1, accent = { flow: 1, radar: 1 };

    /* place the day's scenery: top themes → glyph clusters at depth slots */
    var themes = (B.themes || []).slice(0, 3);
    if (!themes.length) themes = [{ id: "macro", weight: 1 }];
    var slots = [
      { x: 0.72, y: 0.58, s: 2.4, a: 0.5,  d: 1.0 },   /* primary, near */
      { x: 0.2,  y: 0.48, s: 1.5, a: 0.34, d: 0.65 },  /* secondary, mid */
      { x: 0.47, y: 0.3,  s: 0.95, a: 0.22, d: 0.4 }   /* tertiary, far */
    ];
    var placed = [];
    themes.forEach(function (th, i) {
      var names = THEME_GLYPHS[th.id] || [];
      var slot = slots[i];
      names.forEach(function (name, j) {
        var jx = (rng() - 0.5) * 0.14, jy = (rng() - 0.5) * 0.08;
        placed.push({
          fn: GLYPHS[name],
          x: slot.x + jx + j * 0.11, y: slot.y + jy + j * (i === 0 ? 0.14 : 0.1),
          s: slot.s * (j ? 0.62 : 1), a: slot.a * (j ? 0.75 : 1),
          d: slot.d, phase: rng() * 10, grng: mulberry32((seed ^ (i * 7 + j * 13)) >>> 0),
          radar: name === "radar"
        });
      });
    });

    /* capital-flow particles */
    var parts = [];
    for (var i = 0; i < 64; i++) {
      parts.push({ x: rng(), y: 0.25 + rng() * 0.6, v: 0.25 + rng() * 0.75,
                   amp: 8 + rng() * 26, ph: rng() * Math.PI * 2, sz: rng() < 0.85 ? 1 : 1.6 });
    }

    /* an etched sparkline shaped by the day's snapshot momenta */
    var snap = (B.regime && B.regime.snapshot) || {};
    var snapVals = Object.keys(snap).map(function (k) { return Number(snap[k]) || 0; });
    var spark = [];
    var acc = 0;
    for (var s = 0; s < 90; s++) {
      var v = snapVals.length ? snapVals[s % snapVals.length] : (rng() - 0.5);
      acc += v * 0.16 + (rng() - 0.5) * 0.9;
      spark.push(acc);
    }
    var sMin = Math.min.apply(null, spark), sMax = Math.max.apply(null, spark);

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * DPR; canvas.height = H * DPR;
    }
    window.addEventListener("resize", resize);
    resize();

    function draw(now) {
      var t = now / 1000 * moodCfg.drift;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      /* sky wash */
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#0a1730"); g.addColorStop(0.55, "#091426"); g.addColorStop(1, "#060d1a");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      var par = scroll * 0.14;             /* the slow camera */

      /* graph-paper grid, receding with scroll */
      ctx.strokeStyle = "rgba(45,70,105,0.28)"; ctx.lineWidth = 1;
      var step = 54, gy0 = (-par * 0.35) % step;
      ctx.beginPath();
      for (var gx = 0.5; gx <= W; gx += step) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
      for (var gy = gy0 + 0.5; gy <= H; gy += step) { ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
      ctx.stroke();

      /* horizon halo — the day's "sun": gold ring cluster behind the scenery */
      var hx = W * 0.66, hy = H * 0.52 - par * 0.4;
      var halo = ctx.createRadialGradient(hx, hy, 10, hx, hy, Math.max(W, H) * 0.42);
      halo.addColorStop(0, "rgba(" + moodCfg.glow + ",0.13)");
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);
      ctx.lineWidth = 1;
      for (var r = 0; r < 3; r++) {
        ctx.strokeStyle = "rgba(" + GOLD + "," + (0.16 - r * 0.045) * heroFade + ")";
        ctx.beginPath();
        ctx.arc(hx, hy, 90 + r * 46 + Math.sin(t * 0.2 + r) * 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      /* etched sparkline across the horizon */
      ctx.strokeStyle = "rgba(" + INKC + "," + 0.1 * heroFade + ")";
      ctx.beginPath();
      for (var p = 0; p < spark.length; p++) {
        var sx = (p / (spark.length - 1)) * W;
        var sy = H * 0.5 - par * 0.4 + ((spark[p] - sMin) / (sMax - sMin || 1) - 0.5) * H * 0.16;
        p ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
      }
      ctx.stroke();

      /* the day's scenery */
      var glyphDim = 0.35 + 0.65 * heroFade;
      placed.forEach(function (pl) {
        ctx.save();
        ctx.translate(pl.x * W, pl.y * H - par * pl.d);
        ctx.scale(pl.s, pl.s);
        var a = pl.a * glyphDim * (pl.radar ? accent.radar : 1);
        ctx.globalAlpha = a;
        ctx.strokeStyle = "rgba(" + GOLD + ",0.9)";
        ctx.fillStyle = "rgba(" + GOLD + ",0.9)";
        ctx.lineWidth = 1.1 / pl.s;
        pl.fn(ctx, t + pl.phase, mulberry32(seed ^ 99));
        /* steel under-stroke pass gives the line-work depth */
        ctx.globalAlpha = a * 0.4;
        ctx.strokeStyle = "rgba(" + STEEL + ",0.8)";
        ctx.translate(0.8, 1.2);
        pl.fn(ctx, t + pl.phase, mulberry32(seed ^ 99));
        ctx.restore();
      });

      /* capital flow — direction and colour follow the regime */
      var flowDir = MOOD === "off" ? -1 : 1;
      ctx.fillStyle = "rgba(" + moodCfg.glow + ",0.5)";
      parts.forEach(function (q) {
        var px = ((q.x + t * 0.008 * q.v * moodCfg.flow * accent.flow * flowDir) % 1 + 1) % 1;
        var py = q.y * H - par * 0.5 + Math.sin(t * 0.35 + q.ph) * q.amp;
        ctx.globalAlpha = 0.25 + 0.3 * Math.sin(t + q.ph) * Math.sin(t + q.ph);
        ctx.beginPath(); ctx.arc(px * W, py, q.sz, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.1;
        ctx.beginPath(); ctx.moveTo(px * W, py);
        ctx.lineTo(px * W - 14 * flowDir * moodCfg.flow, py);
        ctx.strokeStyle = "rgba(" + moodCfg.glow + ",0.5)"; ctx.lineWidth = 1; ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }

    var self = {
      setScroll: function (y, fade) { scroll = y; heroFade = fade; },
      setAccent: function (a) { accent = a; },
      drawOnce: function () { draw(performance.now()); }
    };

    if (!REDUCED) {
      (function loop(now) { draw(now || 0); requestAnimationFrame(loop); })();
    } else {
      self.drawOnce();
      window.addEventListener("resize", self.drawOnce);
      window.addEventListener("scroll", function () { self.drawOnce(); }, { passive: true });
    }
    return self;
  }

  /* ══════════════════════════════════════════════════════════
     SCENE BUILDERS — the existing brief, staged
     ══════════════════════════════════════════════════════════ */
  var sceneIndex = 0;
  var railEntries = [];

  function scene(id, title, opts) {
    opts = opts || {};
    var sec = el("section", "scene" + (opts.wide ? " scene-wide" : ""));
    sec.id = id;
    var inner = el("div", "scene-inner");
    if (title) {
      sceneIndex += 1;
      var k = el("div", "kicker");
      k.appendChild(el("span", "idx", String(sceneIndex).padStart(2, "0")));
      k.appendChild(el("span", "", title));
      inner.appendChild(rv(k, 0));
      railEntries.push({ id: id, label: opts.rail || title });
    }
    sec.appendChild(inner);
    return { sec: sec, inner: inner };
  }

  function prose(texts) {
    var d = el("div", "prose");
    texts.filter(Boolean).forEach(function (t, i) { d.appendChild(rv(el("p", "", t), i + 1)); });
    return d;
  }

  function aside(label, text, warn) {
    var a = el("div", "aside" + (warn ? " warn" : ""));
    a.appendChild(el("b", "", label));
    a.appendChild(document.createTextNode(text));
    return a;
  }

  function countUp(node, target, suffix, decimals) {
    if (REDUCED) { node.textContent = target.toFixed(decimals || 0) + (suffix || ""); return; }
    var t0 = null, dur = 1600;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      p = 1 - Math.pow(1 - p, 3);
      node.textContent = (target * p).toFixed(decimals || 0) + (suffix || "");
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var SNAP_LABELS = { spx: "S&P 500", ndx: "NASDAQ", wti: "WTI", gold: "GOLD",
                      dxy: "DXY", btc: "BTC", us10y: "US 10Y", eth: "ETH" };
  function snapshotRow(cls) {
    var snap = (B.regime && B.regime.snapshot) || {};
    var keys = Object.keys(snap);
    if (!keys.length) return null;
    var row = el("div", cls);
    keys.forEach(function (k) {
      var v = Number(snap[k]) || 0;
      var chip = el("span", "t");
      chip.appendChild(el("span", "", (SNAP_LABELS[k] || k.toUpperCase())));
      var val = el("b", signCls(v),
        k === "us10y" ? ((v > 0 ? "+" : "") + v + " bp") : fmtPct(v));
      chip.appendChild(val);
      row.appendChild(chip);
    });
    return row;
  }

  /* — hero — */
  function buildHero(main) {
    var S = scene("hero", "");
    S.sec.classList.remove("scene");
    S.sec.className = "scene"; S.sec.id = "hero";
    railEntries.push({ id: "hero", label: "TODAY" });

    var date = el("div", "hero-date");
    date.appendChild(el("b", "", B.meta.date || ""));
    date.appendChild(document.createTextNode("  ·  published before the US open"));
    S.inner.appendChild(rv(date, 0));

    // both tiers now carry the full brief — the headline is always the lede
    var headSrc = (B.sections.story && B.sections.story.lede) || "";
    var head = firstSentence(headSrc);
    var h1 = el("h1", "hero-headline" + (head.length > 130 ? " long" : ""), head);
    S.inner.appendChild(rv(h1, 1));

    var chip = el("div", "regime-chip");
    chip.appendChild(el("i", "regime-dot " + MOOD));
    chip.appendChild(el("span", "", B.regime.label));
    chip.appendChild(el("span", "sep", "·"));
    chip.appendChild(el("span", "", "stress " + B.regime.stress + "/100"));
    if (B.regime.vix) {
      chip.appendChild(el("span", "sep", "·"));
      chip.appendChild(el("span", "", "VIX " + B.regime.vix +
        (B.regime.vix_term ? " " + B.regime.vix_term : "")));
    }
    S.inner.appendChild(rv(chip, 2));

    var tick = snapshotRow("ticker-row");
    if (tick) S.inner.appendChild(rv(tick, 3));

    var cue = el("div", "scroll-cue", "STEP INSIDE TODAY'S MARKET");
    S.sec.appendChild(cue);
    main.appendChild(S.sec);
  }

  /* — MiB Market Health (daily indicator, right after the hero) — */
  function buildHealth(main) {
    var h = B.health_html;
    if (!h) return;
    var S = scene("health", "MiB Market Health", { rail: "HEALTH" });
    var box = el("div", "health-embed");
    box.innerHTML = h;   /* trusted, self-generated inline SVG + CSS */
    S.inner.appendChild(rv(box, 1));
    main.appendChild(S.sec);
  }

  /* — member scenes — */
  function buildStory(main) {
    var st = B.sections.story || {};
    var S = scene("story", "Today's Story");
    S.inner.appendChild(prose([st.lede, st.interpretation]));
    if (st.counter) S.inner.appendChild(rv(aside("Counter-risk", st.counter, true), 3));
    if (st.stale_note) S.inner.appendChild(rv(aside("Continuity", st.stale_note), 4));
    main.appendChild(S.sec);
  }

  function donut(breadth) {
    var wrap = el("div", "donut-wrap");
    var R = 86, C = 2 * Math.PI * R;
    var pct = Math.max(0, Math.min(100, breadth.pct));
    var svg = '<svg viewBox="0 0 220 220" role="img" aria-label="Market breadth">' +
      '<circle cx="110" cy="110" r="' + R + '" fill="none" stroke="rgba(36,54,82,.9)" stroke-width="17"/>' +
      '<circle class="arc-dn" cx="110" cy="110" r="' + R + '" fill="none" stroke="#e85a5e" stroke-opacity=".75" stroke-width="17" stroke-linecap="butt" transform="rotate(-90 110 110)" stroke-dasharray="' + C + '" stroke-dashoffset="0"/>' +
      '<circle class="arc-up" cx="110" cy="110" r="' + R + '" fill="none" stroke="#3cc48d" stroke-width="17" stroke-linecap="butt" transform="rotate(-90 110 110)" stroke-dasharray="0 ' + C + '"/></svg>';
    wrap.innerHTML = svg;                      /* static markup, no brief text */
    var center = el("div", "donut-center");
    var big = el("div", "big", "0%");
    center.appendChild(big);
    center.appendChild(el("div", "cap", "of " + breadth.n + " tracked\nnames advancing"));
    wrap.appendChild(center);
    wrap.animateIn = function () {
      var up = wrap.querySelector(".arc-up");
      var target = C * pct / 100;
      if (REDUCED) { up.setAttribute("stroke-dasharray", target + " " + C); big.textContent = pct + "%"; return; }
      up.style.transition = "stroke-dasharray 1.8s cubic-bezier(.22,.61,.2,1)";
      requestAnimationFrame(function () {
        up.setAttribute("stroke-dasharray", target + " " + C);
      });
      countUp(big, pct, "%");
    };
    return wrap;
  }

  function buildTape(main) {
    var tp = B.sections.tape;
    if (!tp) return;
    var S = scene("tape", "The Tape", { wide: true });

    (tp.body || []).forEach(function (t, i) {
      S.inner.appendChild(rv(el("p", "prose-p desk-body", t), i + 1));
      S.inner.lastChild.style.cssText = "font:400 clamp(19px,2.1vw,23px)/1.6 var(--serif);max-width:66ch;margin-bottom:1em;";
    });

    var grid = el("div", "tape-grid");
    if (tp.breadth) {
      var left = el("div");
      var d = donut(tp.breadth);
      left.appendChild(d);
      var leg = el("div", "donut-legend");
      var l1 = el("span"); l1.appendChild(el("i", "", "")); l1.lastChild.style.background = "#3cc48d";
      l1.appendChild(document.createTextNode("ADVANCING " + tp.breadth.adv));
      var l2 = el("span"); l2.appendChild(el("i", "", "")); l2.lastChild.style.background = "#e85a5e";
      l2.appendChild(document.createTextNode("DECLINING " + tp.breadth.dec));
      leg.appendChild(l1); leg.appendChild(l2);
      left.appendChild(leg);
      grid.appendChild(rv(left, 2));
      S.donut = d;
    }
    var right = el("div");
    var stats = el("div", "stat-row");
    function stat(v, lbl, colored) {
      var s = el("div", "stat");
      var vv = el("div", "v" + (colored ? " " + signCls(v) : ""), "");
      vv.dataset.target = v;
      s.appendChild(vv); s.appendChild(el("div", "l", lbl));
      stats.appendChild(s);
      return vv;
    }
    S.statNodes = [];
    if (tp.green_sectors || tp.total_sectors)
      S.statNodes.push([stat(tp.green_sectors, "of " + tp.total_sectors + " sectors green"), tp.green_sectors, "", 0]);
    if (tp.index_mom !== undefined)
      S.statNodes.push([stat(tp.index_mom, "index momentum", true), tp.index_mom, "%", 1]);
    if (tp.cyc_def_spread)
      S.statNodes.push([stat(tp.cyc_def_spread, "cyclicals − defensives", true), tp.cyc_def_spread, "", 1]);
    if (tp.concentration)
      S.statNodes.push([stat(Math.round(tp.concentration * 100), "of up-momentum in top 3"), Math.round(tp.concentration * 100), "%", 0]);
    right.appendChild(stats);

    if ((tp.observations || []).length) {
      var ul = el("ul", "obs");
      tp.observations.forEach(function (o) { ul.appendChild(el("li", "", o)); });
      right.appendChild(ul);
    }
    if (tp.breadth && tp.breadth.low_confidence) {
      right.appendChild(aside("Coverage note", "Breadth coverage is reduced this run — read participation with care."));
    }
    grid.appendChild(rv(right, 3));
    S.inner.appendChild(grid);
    main.appendChild(S.sec);
  }

  function buildMoney(main) {
    var mo = B.sections.money;
    if (!mo) return;
    var S = scene("money", "Where Money Is Moving", { wide: true });
    if (mo.narration) {
      var p = el("p", "", mo.narration);
      p.style.cssText = "font:400 clamp(19px,2.1vw,23px)/1.6 var(--serif);max-width:66ch;margin-bottom:8px;";
      S.inner.appendChild(rv(p, 1));
    }
    var chart = el("div", "sector-chart");
    var maxMean = 0.001;
    (mo.sectors || []).forEach(function (s) { maxMean = Math.max(maxMean, Math.abs(Number(s.mean) || 0)); });
    (mo.sectors || []).forEach(function (s, i) {
      var row = el("div", "sector-row");
      var name = el("div", "name", s.name);
      if (Math.abs(s.drank || 0) >= 2) {
        name.appendChild(el("span", "rk" + (s.drank < 0 ? " dn" : ""), s.drank > 0 ? "▲" : "▼"));
      }
      var track = el("div", "bar-track");
      var mean = Number(s.mean) || 0;
      var bar = el("div", "bar " + (mean >= 0 ? "up" : "dn"));
      // final width is fixed; the reveal animates transform:scaleX (GPU) not width
      bar.style.width = (Math.abs(mean) / maxMean * 46).toFixed(2) + "%";
      bar.style.transitionDelay = (i * 70) + "ms";
      track.appendChild(bar);
      var val = el("div", "val " + signCls(mean), fmtPct(mean));
      val.appendChild(el("span", "sub", s.adv_n + "/" + s.n));
      row.appendChild(name); row.appendChild(track); row.appendChild(val);
      chart.appendChild(row);
    });
    S.inner.appendChild(rv(chart, 2));
    S.bars = chart;

    var rows = el("div", "chip-rows");
    function chipRow(lbl, list, up) {
      if (!list || !list.length) return;
      var r = el("div", "chip-row");
      r.appendChild(el("span", "lbl", lbl));
      list.forEach(function (x) {
        var c = el("span", "chip " + (up ? "up" : "dn"));
        c.appendChild(el("b", "", x[0]));
        c.appendChild(document.createTextNode(" "));
        c.appendChild(el("span", "sec", "(" + x[2] + ")"));
        r.appendChild(c);
      });
      rows.appendChild(r);
    }
    chipRow("↑ LEADERS", mo.leaders, true);
    chipRow("↓ LAGGARDS", mo.laggards, false);
    if (rows.children.length) S.inner.appendChild(rv(rows, 3));
    main.appendChild(S.sec);
  }

  function buildChanged(main) {
    var ch = B.sections.changed || [];
    if (!ch.length) return;
    var S = scene("changed", "What Changed");
    var tl = el("div", "timeline");
    ch.forEach(function (c, i) { tl.appendChild(rv(el("div", "tl-item", c), i + 1)); });
    S.inner.appendChild(tl);
    main.appendChild(S.sec);
  }

  function buildDisconnect(main) {
    var dc = B.sections.disconnect;
    if (!dc) return;
    var S = scene("disconnect", "The Disconnect");
    var sp = el("div", "split panel");
    sp.style.padding = "0";
    var left = el("div", "side tape-side");
    left.appendChild(el("h3", "", "What the tape says"));
    (dc.divergences || []).forEach(function (d) {
      var it = el("div", "item");
      it.appendChild(el("span", "m", "▸"));
      it.lastChild.style.color = "var(--gold)";
      it.appendChild(el("span", "", d));
      left.appendChild(it);
    });
    var right = el("div", "side story-side");
    right.appendChild(el("h3", "", "What the narrative assumes"));
    (dc.mispriced || []).forEach(function (m) {
      var it = el("div", "item");
      it.appendChild(el("span", "m", m.mark));
      it.appendChild(el("span", "", m.text));
      right.appendChild(it);
    });
    if (!right.children.length || right.children.length === 1) {
      if ((dc.mispriced || []).length === 0) right.appendChild(el("div", "item", "—"));
    }
    sp.appendChild(left); sp.appendChild(right);
    S.inner.appendChild(rv(sp, 1));
    main.appendChild(S.sec);
  }

  var DIR_GLYPH = { up: "↑", down: "↓", two_sided: "⚠", watch: "⟳", flat: "—" };
  function buildDrivers(main) {
    var dr = B.sections.drivers || [];
    if (!dr.length) return;
    var S = scene("drivers", "What's Driving It");
    var list = el("div", "driver-list");
    dr.forEach(function (d, i) {
      var card = el("div", "driver " + (d.direction || "watch"));
      card.appendChild(el("div", "glyph", DIR_GLYPH[d.direction] || "⟳"));
      var body = el("div");
      body.appendChild(el("div", "txt", d.text));
      var meta = el("div", "meta");
      if (d.new) meta.appendChild(el("span", "tagc new", "NEW LEAD"));
      (d.complexes || []).forEach(function (c) { meta.appendChild(el("span", "tagc", c)); });
      if (meta.children.length) body.appendChild(meta);
      card.appendChild(body);
      list.appendChild(rv(card, i + 1));
    });
    S.inner.appendChild(list);
    main.appendChild(S.sec);
  }

  /* ── THE CONNECTIONS — the moat: today's causal chain, drawn ─────
     Catalyst -> which complexes it hits -> how the tape actually moved ->
     where the tape and the narrative disagree -> what would flip it.
     Every node is a direct reference to a driver/sector/divergence/
     watchlist item build.py already computed — no new facts, just drawn
     instead of read. Deterministic 4-column layout; edges are SVG curves
     recomputed from real DOM anchor positions so it never misaligns. */
  function buildConnections(main) {
    var cx = B.sections.connections;
    if (!cx || (!cx.drivers || !cx.drivers.length) && !cx.flip) return;
    var S = scene("connections", "The Connections", { wide: true });

    var board = el("div", "conn-board");
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "conn-lines");
    board.appendChild(svg);

    var colRoot = el("div", "conn-col conn-root");
    var colDrivers = el("div", "conn-col conn-drivers");
    var colTape = el("div", "conn-col conn-tape");
    var colCatch = el("div", "conn-col conn-catch");

    var rootNode = el("div", "conn-node cn-root", "");
    rootNode.appendChild(el("b", "", "TODAY'S CATALYST"));
    rootNode.appendChild(el("span", "", cx.root));
    rootNode.id = "cn-root";
    colRoot.appendChild(rootNode);

    (cx.drivers || []).forEach(function (d) {
      var n = el("div", "conn-node cn-driver " + (d.direction || "watch"));
      n.id = "cn-" + d.id;
      n.appendChild(el("b", "", d.label));
      n.appendChild(el("span", "", d.detail));
      colDrivers.appendChild(n);
    });

    (cx.tape || []).forEach(function (t) {
      var n = el("div", "conn-node cn-tape " + (t.value >= 0 ? "up" : "down"));
      n.id = "cn-" + t.id;
      n.dataset.from = "cn-" + t.from;
      n.appendChild(el("b", "", t.label));
      n.appendChild(el("span", "", fmtPct(t.value) + " · " + t.adv_n + "/" + t.n + " advancing"));
      colTape.appendChild(n);
    });

    (cx.catches || []).forEach(function (c) {
      var n = el("div", "conn-node cn-catch");
      n.id = "cn-" + c.id;
      n.dataset.from = c.anchor ? "cn-" + c.anchor : "cn-root";
      n.appendChild(el("b", "", "THE CATCH"));
      n.appendChild(el("span", "", c.label));
      colCatch.appendChild(n);
    });

    if (cx.flip) {
      var flipNode = el("div", "conn-node cn-flip");
      flipNode.id = "cn-flip";
      flipNode.dataset.from = "cn-root";
      flipNode.appendChild(el("b", "", "WHAT FLIPS IT"));
      flipNode.appendChild(el("span", "", cx.flip));
      colCatch.appendChild(flipNode);
    }

    [colRoot, colDrivers, colTape, colCatch].forEach(function (c) {
      if (c.children.length) board.appendChild(c);
    });
    S.inner.appendChild(rv(board, 1));
    main.appendChild(S.sec);

    /* edges: root->driver, driver->tape, anchor->catch, root->flip.
       Positions read from the live DOM so it's correct at any width. */
    function drawEdges() {
      var bb = board.getBoundingClientRect();
      var svgns = "http://www.w3.org/2000/svg";
      svg.setAttribute("width", bb.width);
      svg.setAttribute("height", bb.height);
      svg.innerHTML = "";
      function anchor(el, side) {
        var r = el.getBoundingClientRect();
        var y = r.top - bb.top + r.height / 2;
        return side === "right" ? [r.right - bb.left, y] : [r.left - bb.left, y];
      }
      function curve(a, b, dashed) {
        var mx = (a[0] + b[0]) / 2;
        var d = "M" + a[0] + "," + a[1] + " C" + mx + "," + a[1] + " " +
          mx + "," + b[1] + " " + b[0] + "," + b[1];
        var p = document.createElementNS(svgns, "path");
        p.setAttribute("d", d);
        p.setAttribute("class", "conn-edge" + (dashed ? " dashed" : ""));
        var len = 800;
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
        svg.appendChild(p);
        return p;
      }
      var edges = [];
      (cx.drivers || []).forEach(function (d) {
        var from = document.getElementById("cn-root"), to = document.getElementById("cn-" + d.id);
        if (from && to) edges.push(curve(anchor(from, "right"), anchor(to, "left"), false));
      });
      (cx.tape || []).forEach(function (t) {
        var from = document.getElementById("cn-" + t.from), to = document.getElementById("cn-" + t.id);
        if (from && to) edges.push(curve(anchor(from, "right"), anchor(to, "left"), false));
      });
      board.querySelectorAll(".conn-node.cn-catch, .conn-node.cn-flip").forEach(function (n) {
        var from = document.getElementById(n.dataset.from);
        if (from) edges.push(curve(anchor(from, "right"), anchor(n, "left"), true));
      });
      return edges;
    }
    S.sec._connEdges = drawEdges;    // attach to the DOM node IO observes, not the {sec,inner} wrapper
    window.addEventListener("resize", function () { if (S.sec.classList.contains("visible")) drawEdges(); });
  }

  function buildConsensus(main) {
    var co = B.sections.consensus || [];
    if (!co.length) return;
    var S = scene("consensus", "The Consensus View");
    var list = el("div", "consensus-list");
    co.forEach(function (c, i) { list.appendChild(rv(el("div", "consensus-item", c), i + 1)); });
    S.inner.appendChild(list);
    main.appendChild(S.sec);
  }

  function buildWatchlist(main) {
    var w = B.sections.watchlist;
    if (!w) return;
    if (!(w.calendar || []).length && !(w.items || []).length && !w.empty) return;
    var S = scene("watchlist", "What To Watch Next", { wide: true });
    if ((w.calendar || []).length) {
      var nar = el("div", "cal-narration");
      w.calendar.forEach(function (c, i) { nar.appendChild(rv(el("div", "item", c), i + 1)); });
      S.inner.appendChild(nar);
    }
    if ((w.items || []).length) {
      var grid = el("div", "watch-grid");
      w.items.forEach(function (u, i) {
        var card = el("div", "watch-card");
        card.appendChild(el("span", "impact" + (u.impact === "high" ? " high" : ""), u.impact || "tba"));
        card.appendChild(el("div", "when", u.when));
        card.appendChild(el("h4", "", u.event));
        if (u.consensus) card.appendChild(el("div", "cons", "consensus: " + u.consensus));
        if (u.confirms || u.invalidates || u.tests) {
          var sc = el("div", "scenario");
          if (u.confirms) sc.appendChild(el("div", "ok", u.confirms));
          if (u.invalidates) sc.appendChild(el("div", "ko", u.invalidates));
          if (!u.confirms && !u.invalidates && u.tests) sc.appendChild(el("div", "ts", u.tests));
          card.appendChild(sc);
        }
        grid.appendChild(rv(card, i + 2));
      });
      S.inner.appendChild(grid);
    }
    if (w.empty) S.inner.appendChild(rv(el("p", "locked-note", w.empty), 1));
    main.appendChild(S.sec);
  }

  function buildDesks(main) {
    var dk = B.sections.desks || {};
    if (dk.crypto) {
      var S = scene("crypto", "Crypto");
      var row = el("div", "coin-row");
      function coin(sym, info) {
        if (!info) return;
        var c = el("div", "coin");
        c.appendChild(el("span", "sym", sym));
        var dir = info.dir === "long" ? "↑" : info.dir === "short" ? "↓" : "→";
        c.appendChild(el("span", "dir " + (dir === "↑" ? "pos" : dir === "↓" ? "neg" : "flat"), dir));
        if (info.price) c.appendChild(el("span", "px", "~" + Number(info.price).toLocaleString("en-US")));
        row.appendChild(c);
      }
      coin("BTC", dk.crypto.btc); coin("ETH", dk.crypto.eth);
      if (dk.crypto.longs || dk.crypto.shorts) {
        var tallies = el("div", "coin");
        tallies.appendChild(el("span", "px", dk.crypto.longs + " bid / " + dk.crypto.shorts + " sold"));
        row.appendChild(tallies);
      }
      if (row.children.length) S.inner.appendChild(rv(row, 1));
      if (dk.crypto.body) S.inner.appendChild(rv(el("p", "desk-body", dk.crypto.body), 2));
      main.appendChild(S.sec);
    }
    if (dk.ai_semis) {
      var S2 = scene("semis", "AI / Semis");
      if (dk.ai_semis.body) S2.inner.appendChild(rv(el("p", "desk-body", dk.ai_semis.body), 1));
      if ((dk.ai_semis.names || []).length) {
        var r = el("div", "semi-row");
        dk.ai_semis.names.forEach(function (x) {
          var mom = Number(x[1]) || 0;
          var c = el("span", "chip " + (mom >= 0 ? "up" : "dn"));
          c.appendChild(el("b", "", x[0]));
          c.appendChild(document.createTextNode(" " + fmtPct(mom)));
          r.appendChild(c);
        });
        S2.inner.appendChild(rv(r, 2));
      }
      main.appendChild(S2.sec);
    }
    if (dk.cross_asset) {
      var S3 = scene("crossasset", "Cross-Asset");
      S3.inner.appendChild(rv(el("p", "desk-body", dk.cross_asset.body), 1));
      var strip = snapshotRow("snapshot-strip");
      if (strip) S3.inner.appendChild(rv(strip, 2));
      main.appendChild(S3.sec);
    }
  }

  function buildGlossary(main) {
    var gl = B.sections.glossary || [];
    if (!gl.length) return;
    var S = scene("plain", "In Plain English", { wide: true });
    var grid = el("div", "gloss-grid");
    gl.forEach(function (g, i) {
      var c = el("div", "gloss");
      c.appendChild(el("b", "", g[0]));
      c.appendChild(el("span", "", g[1]));
      grid.appendChild(rv(c, (i % 6) + 1));
    });
    S.inner.appendChild(grid);
    main.appendChild(S.sec);
  }

  /* — premium placeholder (public tier) —
     The full brief above is free forever. This scene is the ROADMAP for the
     new paid offering: features that accumulate value over time (history,
     search, alerts, dashboards) rather than today's read behind a wall.
     Placeholder only — nothing here is wired up yet. */
  function buildPremium(main) {
    var p = B.premium;
    if (!p || !(p.features && p.features.length)) return;
    var S = scene("premium", p.title || "MIB Premium", { rail: "PREMIUM" });
    if (p.eyebrow) S.inner.appendChild(rv(el("div", "premium-eyebrow", p.eyebrow), 1));
    if (p.tagline) S.inner.appendChild(rv(el("p", "premium-tagline", p.tagline), 2));
    var grid = el("div", "premium-grid");
    p.features.forEach(function (f, i) {
      var card = el("div", "premium-card");
      card.appendChild(el("b", "", f.name || ""));
      if (f.detail) card.appendChild(el("span", "", f.detail));
      grid.appendChild(rv(card, (i % 6) + 1));
    });
    S.inner.appendChild(grid);
    S.inner.appendChild(rv(el("p", "premium-note",
      "Premium is on the way. Today's brief stays free, every trading " +
      "morning — this is what compounds on top of it."), p.features.length + 1));
    main.appendChild(S.sec);
  }

  /* — close / CTA — */
  function buildClose(main) {
    var S = scene("close", "");
    S.sec.id = "close";
    railEntries.push({ id: "close", label: "CLOSE" });
    S.inner.appendChild(rv(el("div", "end-mark", "MIB ▮"), 0));
    S.inner.appendChild(rv(el("h2", "",
      TIER === "public"
        ? "Tomorrow the market tells a different story. Read it here, free, every morning."
        : "Tomorrow the market tells a different story. This page will too."), 1));
    // No CTA row — no Telegram/Whop/subscribe links anywhere on the site.
    var foot = el("footer", "colophon");
    foot.appendChild(el("div", (B.footer && B.footer.degraded) ? "warn" : "", (B.footer && B.footer.stats) || ""));
    foot.appendChild(el("div", "", (B.footer && B.footer.disclaimer) || ""));
    S.inner.appendChild(rv(foot, 3));
    main.appendChild(S.sec);
  }

  /* ══════════════════════════════════════════════════════════
     ASSEMBLY
     ══════════════════════════════════════════════════════════ */
  var main = document.querySelector("main");

  document.querySelector(".stamp").textContent =
    (B.meta.generated_at || "");

  /* site menu — the same destinations the current product exposes.
     Links come from the manifest (env-configured, like the production
     terminal page); unset ones render as placeholders so the menu can be
     evaluated in the prototype. */
  (function buildMenu() {
    var links = B.nav || [];
    var bar = document.querySelector("nav.menu");
    var ovl = document.querySelector(".menu-overlay");
    var ovlNav = ovl.querySelector("nav");
    links.forEach(function (l, i) {
      [bar, ovlNav].forEach(function (host) {
        var a = el("a", (l.active ? "active " : "") + (l.cta ? "cta " : ""), l.label);
        if (l.href) { a.href = l.href; }
        else { a.classList.add("placeholder"); a.title = "Not configured in this prototype build"; }
        a.style.setProperty("--i", i);
        host.appendChild(a);
      });
    });
    var hasPlaceholder = links.some(function (l) { return !l.href; });
    if (hasPlaceholder) {
      ovlNav.appendChild(el("div", "ovl-note",
        "Dimmed items link to existing pages — set MIB_*_URL when building"));
    }
    var btn = document.querySelector(".menu-toggle");
    btn.addEventListener("click", function () {
      var open = ovl.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      ovl.setAttribute("aria-hidden", String(!open));
    });
    ovl.addEventListener("click", function (e) {
      if (e.target === ovl || e.target.tagName === "A") {
        ovl.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
        ovl.setAttribute("aria-hidden", "true");
      }
    });
  })();
  if (B.meta.demo) {
    var tag = el("span", "demo-tag", "DEMO DATA");
    document.querySelector("header.masthead").appendChild(tag);
  }
  // No tier badge and no floating subscribe/paywall action — the full brief
  // is simply the free public page. (Premium is paused until it's built.)

  // per-scene photography (photo mode) supersedes the single hero-art layer
  var photoMode = !!(window.MIB_SCENES && (window.MIB_SCENES.order || []).length);
  if (photoMode) {
    var oldHero = document.getElementById("hero-art");
    if (oldHero) oldHero.remove();
  }

  if (!photoMode && B.hero && B.hero.image) {
    var ha = document.getElementById("hero-art");
    var haArt = el("div", "art");
    haArt.style.backgroundImage = "url('" + encodeURI(B.hero.image) + "')";
    ha.appendChild(haArt);
    ha.classList.add("on");
    if (!REDUCED) ha.classList.add("alive");        /* the slow drift */
    if (B.hero.kind === "photo") {                  /* real photography:
      house colour-grade, temperature picked by the day's regime */
      ha.classList.add("grade-" + MOOD);
    }
    // no credit chrome on the page — provenance lives in the manifest only
  }

  buildHero(main);
  buildHealth(main);
  // The full daily brief is public now — every reader gets every section.
  {
    buildStory(main);
    buildTape(main);
    buildMoney(main);
    buildChanged(main);
    buildDisconnect(main);
    buildDrivers(main);
    buildConsensus(main);
    buildWatchlist(main);
    buildDesks(main);
    buildGlossary(main);
    // Premium placeholder paused until there's a real premium offer.
  }
  buildClose(main);

  /* progress rail */
  var rail = document.getElementById("rail");
  railEntries.forEach(function (e) {
    var a = el("a");
    a.href = "#" + e.id;
    a.appendChild(el("span", "", e.label.toUpperCase()));
    rail.appendChild(a);
  });

  /* tier switch (prototype affordance) — hidden on the production build,
     where the deploy step sets window.MIB_PROD and ships public-only data */
  var sw = document.querySelector(".tier-switch");
  if (sw) {
    if (window.MIB_PROD) {
      sw.remove();
    } else {
      sw.querySelector("[data-tier='member']").classList.toggle("on", TIER === "member");
      sw.querySelector("[data-tier='public']").classList.toggle("on", TIER === "public");
    }
  }

  /* ── choreography ─────────────────────────────────────────── */
  var scenes = Array.prototype.slice.call(document.querySelectorAll(".scene"));

  /* ── PHOTO MODE: a real, news-sourced, mood-graded photograph behind
     EVERY scene, cross-fading as you scroll. When scene photos are present
     (concept/fetch_scenes.py), this is the experience — the wireframe world
     stands down. Falls back to the 3D/2D world only if no photos exist. */
  function photoFor(sceneId, i) {
    var S = window.MIB_SCENES; if (!S) return null;
    var by = S.byScene || {};
    // hero shares the story image; members lock uses the story image too
    var key = (sceneId === "hero" || sceneId === "members") ? "story" : sceneId;
    return by[key] || by.story || by.tape || null;   // relevant-neutral fallback
  }

  var world = null;

  if (photoMode) {
    document.body.classList.add("photo-mode", "grade-" + (window.MIB_SCENES.mood || MOOD));
    var cvs = document.getElementById("world");
    if (cvs) cvs.remove();                          /* no wireframe canvas */
    var bg = el("div", "photo-bg");
    bg.setAttribute("aria-hidden", "true");
    document.body.insertBefore(bg, document.body.firstChild);
    scenes.forEach(function (s, i) {
      var ph = photoFor(s.id, i);
      var layer = el("div", "scene-photo");
      if (ph) {
        var img = el("div", "sp-img");
        img.style.backgroundImage = "url('" + encodeURI(ph.src) + "')";
        /* alternate push/pull so the scroll reads as continuous travel
           through the story rather than a slideshow of unrelated fades */
        img.classList.add(i % 2 ? "kb-out" : "kb-in");
        img.style.animationDelay = (-(i % 4) * 5) + "s";
        layer.appendChild(img);
        layer.dataset.credit = ph.credit;
      }
      bg.appendChild(layer);
      s._photo = layer;
    });
    // no on-page credit chrome: only the brief's own content appears.
    // (Sourcing is restricted to public-domain/CC0 so nothing requires
    // attribution; full per-image provenance stays in data/scenes.js.)
  } else {
    function makeWorld(canvas) {
      if (!REDUCED && window.MIBWorld3D) {
        try {
          var w = window.MIBWorld3D(canvas, {
            mood: MOOD, moodCfg: moodCfg, themes: B.themes || [],
            seed: seedFrom((B.meta && B.meta.date) || "mib"),
            stations: scenes.map(function (s) { return s.id; }),
            snapshot: (B.regime && B.regime.snapshot) || {}
          });
          if (w) { document.body.classList.add("world-3d"); return w; }
        } catch (e) { /* fall through to 2D */ }
      }
      return World(canvas);
    }
    world = makeWorld(document.getElementById("world"));
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("visible");
        var S = en.target;
        if (S._fired) return;
        S._fired = true;
        /* charts fire once, when their scene arrives */
        var donutEl = S.querySelector(".donut-wrap");
        if (donutEl && donutEl.animateIn) donutEl.animateIn();
        S.querySelectorAll(".bar").forEach(function (b) { b.classList.add("in"); });
        /* THE CONNECTIONS: draw the chain — nodes pop in by column (already
           handled by .rv stagger via CSS below), edges trace in sequence
           right after so the causal chain visibly "connects itself" */
        if (S._connEdges) {
          var edges = S._connEdges();
          edges.forEach(function (p, i) {
            if (REDUCED) { p.style.strokeDashoffset = "0"; return; }
            setTimeout(function () {
              p.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.22,.61,.2,1)";
              p.style.strokeDashoffset = "0";
            }, 500 + i * 220);
          });
        }
        S.querySelectorAll(".stat .v").forEach(function (v) {
          var t = Number(v.dataset.target) || 0;
          var suffix = v.dataset.suffix || "";
          var dec = Math.abs(t) < 10 && t % 1 !== 0 ? 1 : 0;
          countUp(v, t, suffix, dec);
        });
      }
    });
  }, { threshold: 0.22 });
  scenes.forEach(function (s) { io.observe(s); });

  /* per-scene world accents */
  var ACCENTS = {
    money: { flow: 2.2, radar: 1 },
    watchlist: { flow: 1, radar: 2.2 },
    crypto: { flow: 1.6, radar: 1 }
  };
  var railLinks = Array.prototype.slice.call(rail.querySelectorAll("a"));

  function onScroll() {
    var y = window.scrollY || 0;
    var vh = window.innerHeight || 1;
    var doc = document.documentElement.scrollHeight - vh;
    document.getElementById("scroll-progress").style.width =
      (doc > 0 ? (y / doc) * 100 : 0) + "%";

    var heroFade = Math.max(0.18, 1 - y / (vh * 1.15));
    if (world) world.setScroll(y, heroFade);

    var current = scenes[0];
    scenes.forEach(function (s) {
      if (s.getBoundingClientRect().top <= vh * 0.45) current = s;
    });
    if (world) world.setAccent(ACCENTS[current.id] || { flow: 1, radar: 1 });
    railLinks.forEach(function (a) {
      a.classList.toggle("on", a.getAttribute("href") === "#" + current.id);
    });

    if (photoMode) {
      /* cross-fade to the active scene's photo; the most-centred one is both
         most opaque AND stacked on top, so exactly one image dominates */
      scenes.forEach(function (s) {
        if (!s._photo) return;
        var r = s.getBoundingClientRect();
        var mid = r.top + r.height / 2;
        var d = Math.abs(mid - vh / 2) / vh;        /* 0 at centre */
        var on = Math.max(0, Math.min(1, 1 - (d - 0.15) * 2.4));
        s._photo.style.opacity = String(on);
        s._photo.style.zIndex = String(Math.round(on * 100));
        /* parallax on the WRAPPER so it doesn't fight the Ken Burns drift
           running on the inner .sp-img */
        if (!REDUCED) s._photo.style.transform =
          "translate3d(0," + (-(mid - vh / 2) * 0.05) + "px,0)";
      });
      return;
    }

    var art = document.getElementById("hero-art");
    if (art && art.classList.contains("on")) {
      art.style.opacity = String(0.92 * heroFade);
      /* the photo retreats slower than the page — cinematic parallax:
         content scrolls up past it while it slips away at ~1/5 speed */
      var lyr = art.firstElementChild;
      if (lyr && !REDUCED) {
        lyr.style.transform = "translate3d(0," + (y * 0.2) + "px,0)";
      }
      var credit = document.querySelector(".hero-credit");
      if (credit) credit.style.opacity = String(Math.max(0, heroFade * 1.4 - 0.4));
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* stat suffixes need to survive countUp — annotate them */
  scenes.forEach(function (S) {
    S.querySelectorAll(".stat .v").forEach(function (v) {
      var lbl = v.nextElementSibling ? v.nextElementSibling.textContent : "";
      if (/momentum|top 3/.test(lbl)) v.dataset.suffix = "%";
    });
  });
})();
