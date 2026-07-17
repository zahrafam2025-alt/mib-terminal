/* MiB — IMMERSIVE TERMINAL · the 3D visual world (Three.js).

   STORYTELLING FIRST: before a word is read, the scene should say what kind
   of day it is. The opening of the fly-through is a COMPOSED STAGE built
   from the brief's own themes — for an oil/geopolitics day: two coastlines
   converging into a strait, a tanker crossing it, radar sweeping from the
   shore, and the day's biggest market move etched as a price line climbing
   into the sky. Scroll dollies the camera off the stage and down a quiet
   track where one grounded motif accompanies each section, mirrored in a
   dark-glass sea.

   Composition rules (nothing is random):
     • every grounded object SITS on the ground plane and reflects in it;
     • one subject per station, alternating sides, dimmer than the stage;
     • brightness encodes depth: stage > stations > distant ridges;
     • regime mood picks palette, fog and pace; themes pick the scenery;
     • the day-seed only varies jitter WITHIN the composition, never the
       composition itself.

   Presentation only — no editorial, no new facts. Vendored THREE
   (vendor/three.min.js): offline, self-contained. API matches the 2D
   fallback: setScroll(y, fade), setAccent(a), drawOnce(), resize(). */

window.MIBWorld3D = function (canvas, opts) {
  "use strict";
  if (typeof THREE === "undefined") return null;
  try {   // probe support on a THROWAWAY canvas, never the real one
    var probe = document.createElement("canvas");
    if (!(probe.getContext("webgl") || probe.getContext("experimental-webgl")))
      return null;
  } catch (e) { return null; }

  opts = opts || {};
  var MOOD = opts.mood || "neutral";
  var moodCfg = opts.moodCfg || { drift: 0.85, flow: 0.85 };
  var stations = opts.stations || [];
  var seed = opts.seed >>> 0 || 1;
  var themes = (opts.themes || []).map(function (t) { return t.id; });
  if (!themes.length) themes = ["macro"];
  var snapshot = opts.snapshot || {};

  /* ── palette (mood-driven) ─────────────────────────────────── */
  var PAL = {
    off:     { sky0: 0x0a1730, sky1: 0x04090f, fog: 0x060d18, fogD: 0.0062,
               glow: 0xe9b949, glowRGB: [233, 185, 73], speed: 0.5 },
    on:      { sky0: 0x0c1c34, sky1: 0x071120, fog: 0x0a1626, fogD: 0.005,
               glow: 0x3cc48d, glowRGB: [60, 196, 141], speed: 1.4 },
    neutral: { sky0: 0x0a1730, sky1: 0x060d18, fog: 0x081120, fogD: 0.0056,
               glow: 0x96a8be, glowRGB: [150, 168, 190], speed: 0.85 }
  };
  var P = PAL[MOOD] || PAL.neutral;
  var GOLD = 0xe9b949, STEEL = 0x54749a;
  var GROUND = -9;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rng = mulberry32(seed);

  /* ── renderer / scene / camera ─────────────────────────────── */
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setClearColor(P.fog, 1);
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(P.fog, P.fogD);
  var camera = new THREE.PerspectiveCamera(56, 1, 0.1, 700);

  var STATION_GAP = 55;
  var N = Math.max(2, stations.length || 12);
  var Z0 = 8, TRACK = (N - 1) * STATION_GAP, Z1 = Z0 - TRACK;

  /* ── sky: gradient + a warm horizon band (dawn behind the story) ── */
  var sky = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color(P.sky0) },
        bot: { value: new THREE.Color(P.sky1) },
        gl:  { value: new THREE.Color(P.glow) }
      },
      vertexShader:
        "varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,1.0,1.0); }",
      fragmentShader:
        "varying vec2 vUv; uniform vec3 top; uniform vec3 bot; uniform vec3 gl;" +
        "void main(){" +
        "  vec3 c = mix(bot, top, smoothstep(0.0, 1.0, vUv.y));" +
        "  float band = exp(-pow((vUv.y - 0.46) * 7.0, 2.0));" +   /* horizon */
        "  c += gl * band * 0.10;" +
        "  gl_FragColor = vec4(c, 1.0); }"
    })
  );
  sky.frustumCulled = false;
  var skyScene = new THREE.Scene(); skyScene.add(sky);
  var skyCam = new THREE.Camera();

  /* ── material kits: brightness encodes depth ───────────────── */
  function lm(color, opacity, additive) {
    return new THREE.LineBasicMaterial({
      color: color, transparent: true, opacity: opacity, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending
    });
  }
  var HERO = { gold: lm(GOLD, 0.95), steel: lm(STEEL, 0.55), glow: lm(GOLD, 0.6, true) };
  var STN  = { gold: lm(GOLD, 0.42), steel: lm(STEEL, 0.26), glow: lm(GOLD, 0.28, true) };
  var FAR  = { gold: lm(GOLD, 0.16), steel: lm(STEEL, 0.14), glow: lm(GOLD, 0.12, true) };
  var REFL = lm(GOLD, 0.09);                     /* everything mirrors as this */

  /* ── geometry helpers ──────────────────────────────────────── */
  function segs(pts, mat) {
    var g = new THREE.BufferGeometry();
    var a = new Float32Array(pts.length * 3);
    for (var i = 0; i < pts.length; i++) {
      a[i * 3] = pts[i][0]; a[i * 3 + 1] = pts[i][1]; a[i * 3 + 2] = pts[i][2];
    }
    g.setAttribute("position", new THREE.BufferAttribute(a, 3));
    return new THREE.LineSegments(g, mat);
  }
  function strip(pts, mat) {                     /* connected polyline */
    var out = [];
    for (var i = 1; i < pts.length; i++) out.push(pts[i - 1], pts[i]);
    return segs(out, mat);
  }
  function wireBox(w, h, d, mat) {
    return new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), mat);
  }
  function wireCyl(r, h, n, mat) {
    return new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.CylinderGeometry(r, r, h, n || 10)), mat);
  }
  function flatRing(r, mat) {
    var pts = [];
    for (var i = 0; i <= 48; i++) {
      var a = i / 48 * Math.PI * 2;
      pts.push([Math.cos(a) * r, 0, Math.sin(a) * r]);
    }
    return strip(pts, mat);
  }
  function vRing(r, mat) {                       /* ring facing the camera */
    var pts = [];
    for (var i = 0; i <= 48; i++) {
      var a = i / 48 * Math.PI * 2;
      pts.push([Math.cos(a) * r, Math.sin(a) * r, 0]);
    }
    return strip(pts, mat);
  }

  /* ── motif library (each sits with its BASE at y=0) ────────── */
  function tanker(M) {
    var g = new THREE.Group();
    var hull = strip([[-11, 1.4, 2.6], [-8.6, 0, 2.6], [8.6, 0, 2.6], [11, 1.4, 2.6],
      [11, 3, 0], [11, 1.4, -2.6], [8.6, 0, -2.6], [-8.6, 0, -2.6], [-11, 1.4, -2.6],
      [-11, 3, 0], [-11, 1.4, 2.6]], M.gold);
    g.add(hull);
    g.add(segs([[-11, 3, 0], [11, 3, 0], [-8.6, 0, 2.6], [-8.6, 0, -2.6],
      [8.6, 0, 2.6], [8.6, 0, -2.6]], M.steel));
    for (var i = 0; i < 5; i++) {
      var t = wireCyl(0.85, 1.2, 8, M.gold);
      t.position.set(-6 + i * 2.7, 3.7, 0); g.add(t);
    }
    var b = wireBox(2.2, 2.6, 3.4, M.gold); b.position.set(8.2, 4.4, 0); g.add(b);
    g.add(segs([[9, 5.7, 0], [9, 7.6, 0]], M.steel));
    return g;
  }
  function derrick(M) {
    var g = new THREE.Group(), pts = [];
    var top = [0, 15, 0];
    [[-3, 0, -3], [3, 0, -3], [3, 0, 3], [-3, 0, 3]].forEach(function (b) { pts.push(b, top); });
    for (var y = 2; y < 14; y += 3.2) {
      var s = 3 * (1 - y / 15);
      pts.push([-s, y, -s], [s, y, -s], [s, y, -s], [s, y, s],
        [s, y, s], [-s, y, s], [-s, y, s], [-s, y, -s]);
    }
    g.add(segs(pts, M.gold));
    var deck = wireBox(9, 1, 9, M.steel); deck.position.y = 0.5; g.add(deck);
    return g;
  }
  function radar(M) {
    var g = new THREE.Group();
    var mast = segs([[0, 0, 0], [0, 4.4, 0]], M.steel); g.add(mast);
    var dish = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.SphereGeometry(3, 9, 4, 0, Math.PI)), M.gold);
    dish.position.y = 6; dish.rotation.x = -Math.PI / 2.6; g.add(dish);
    var rings = new THREE.Group();
    for (var i = 1; i <= 3; i++) rings.add(flatRing(i * 4.5, M.glow));
    rings.position.y = 0.2; g.add(rings);
    var sweep = segs([[0, 0.25, 0], [13, 0.25, 0]], M.glow);
    g.add(sweep);
    g.userData.sweep = sweep; g.userData.rings = rings;
    return g;
  }
  function satellite(M) {
    var g = new THREE.Group();
    g.add(wireBox(2.6, 2.6, 2.6, M.gold));
    var pl = wireBox(5.4, 3.4, 0.15, M.steel); pl.position.x = -4.4; g.add(pl);
    var pr = wireBox(5.4, 3.4, 0.15, M.steel); pr.position.x = 4.4; g.add(pr);
    var dish = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.SphereGeometry(1.6, 8, 3, 0, Math.PI)), M.gold);
    dish.position.y = 2.6; dish.rotation.x = Math.PI; g.add(dish);
    return g;
  }
  function colonnade(M) {
    var g = new THREE.Group();
    var s2 = wireBox(24, 1, 8, M.steel); s2.position.y = 0.5; g.add(s2);
    var s1 = wireBox(21, 1, 7, M.steel); s1.position.y = 1.5; g.add(s1);
    for (var i = 0; i < 6; i++) {
      var c = wireCyl(0.65, 8, 8, M.gold);
      c.position.set(-7 + i * 2.8, 6, 0); g.add(c);
    }
    g.add(strip([[-9.4, 10, 0], [0, 13.6, 0], [9.4, 10, 0], [-9.4, 10, 0]], M.gold));
    return g;
  };
  function chipDie(M) {
    var g = new THREE.Group();
    var base = wireBox(10, 0.7, 10, M.gold); base.position.y = 0.35; g.add(base);
    var core = wireBox(5, 1.6, 5, M.gold); core.position.y = 1.5; g.add(core);
    var p = [];
    for (var i = 0; i < 5; i++) {
      var q = -4 + i * 2;
      p.push([q, 0.35, 5], [q, 0.35, 6.6], [q, 0.35, -5], [q, 0.35, -6.6],
        [5, 0.35, q], [6.6, 0.35, q], [-5, 0.35, q], [-6.6, 0.35, q]);
    }
    g.add(segs(p, M.steel));
    return g;
  }
  function rack(M) {
    var g = new THREE.Group();
    var f = wireBox(5.4, 11, 4.4, M.gold); f.position.y = 5.5; g.add(f);
    for (var i = 0; i < 5; i++) {
      var s = wireBox(4.6, 1.1, 4, M.steel); s.position.y = 1.4 + i * 2.1; g.add(s);
    }
    return g;
  }
  function crane(M) {
    var g = new THREE.Group();
    g.add(segs([[-3, 0, 0], [-3, 13, 0], [2, 0, 0], [2, 13, 0],
      [-3, 4, 0], [2, 4, 0], [-3, 9, 0], [2, 9, 0]], M.gold));
    g.add(strip([[-3, 13, 0], [14, 11.4, 0]], M.gold));
    g.add(strip([[-3, 13, 0], [-0.8, 15.6, 0], [6, 12.2, 0]], M.steel));
    g.add(segs([[10, 11.7, 0], [10, 6.5, 0]], M.steel));
    var box = wireBox(3, 1.8, 2.4, M.gold); box.position.set(10, 5.5, 0); g.add(box);
    return g;
  }
  function containers(M) {
    var g = new THREE.Group();
    var rows = [[0, 0.9, 3], [0.6, 2.7, 2], [1.2, 4.5, 1]];
    rows.forEach(function (r, ri) {
      for (var c = 0; c < r[2]; c++) {
        var b = wireBox(4.6, 1.8, 2.6, (ri + c) % 2 ? M.steel : M.gold);
        b.position.set(r[0] + c * 5, r[1], 0); g.add(b);
      }
    });
    return g;
  }
  function coin(M) {
    var g = new THREE.Group();
    g.add(vRing(4, M.gold)); g.add(vRing(3.3, M.glow));
    g.add(segs([[-1, -2.2, 0], [-1, 2.2, 0], [-1.7, 2.2, 0], [1.1, 2.2, 0],
      [-1.7, 0, 0], [1.1, 0, 0], [-1.7, -2.2, 0], [1.1, -2.2, 0],
      [-1.7, -2.2, 0], [-1.7, 2.2, 0]], M.gold));
    return g;
  }
  function nodeField(M, r2) {
    var g = new THREE.Group(), ps = [], i, j;
    for (i = 0; i < 11; i++) ps.push([(r2() - 0.5) * 22, (r2() - 0.5) * 12, (r2() - 0.5) * 8]);
    var links = [];
    for (i = 0; i < ps.length; i++)
      for (j = i + 1; j < ps.length; j++) {
        var dx = ps[i][0] - ps[j][0], dy = ps[i][1] - ps[j][1], dz = ps[i][2] - ps[j][2];
        if (dx * dx + dy * dy + dz * dz < 78) links.push(ps[i], ps[j]);
      }
    g.add(segs(links, M.glow));
    var pg = new THREE.BufferGeometry();
    var pa = new Float32Array(ps.length * 3);
    ps.forEach(function (p, k) { pa[k * 3] = p[0]; pa[k * 3 + 1] = p[1]; pa[k * 3 + 2] = p[2]; });
    pg.setAttribute("position", new THREE.BufferAttribute(pa, 3));
    g.add(new THREE.Points(pg, new THREE.PointsMaterial({
      color: GOLD, size: 0.5, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false
    })));
    return g;
  }
  function helix(M) {
    var g = new THREE.Group(), a = [], b = [], i;
    for (i = 0; i <= 40; i++) {
      var y = i * 0.42, an = i * 0.38;
      a.push([Math.cos(an) * 2.6, y, Math.sin(an) * 2.6]);
      b.push([Math.cos(an + Math.PI) * 2.6, y, Math.sin(an + Math.PI) * 2.6]);
    }
    g.add(strip(a, M.gold)); g.add(strip(b, M.gold));
    var rungs = [];
    for (i = 0; i < a.length; i += 4) rungs.push(a[i], b[i]);
    g.add(segs(rungs, M.steel));
    return g;
  }
  function yieldCurve(M) {
    var g = new THREE.Group(), pts = [];
    for (var i = 0; i <= 24; i++)
      pts.push([-11 + i * 0.95, 1 + 9.5 * (1 - Math.exp(-i / 7)), 0]);
    g.add(strip(pts, M.gold));
    g.add(segs([[-11, 0.6, 0], [-11, 11.4, 0], [-11, 0.6, 0], [12.5, 0.6, 0]], M.steel));
    return g;
  }

  var MOTIF = { tanker: tanker, derrick: derrick, radar: radar,
    satellite: satellite, colonnade: colonnade, chip: chipDie, rack: rack,
    crane: crane, containers: containers, coin: coin, helix: helix,
    curve: yieldCurve };
  var THEME_MOTIFS = {
    energy: ["tanker", "derrick"], defense: ["radar", "satellite"],
    semis: ["rack", "chip"], macro: ["colonnade", "curve"],
    china: ["crane", "containers"], crypto: ["coin"], healthcare: ["helix"]
  };
  var SKY_MOTIFS = { satellite: 22, coin: 15 };  /* these float, others ground */

  /* ── grounding + reflection ────────────────────────────────── */
  var mirrored = [];                              /* [{src, refl}] synced per frame */
  function ground(obj, x, z, scale, ry, reflect) {
    obj.position.set(x, GROUND, z);
    obj.scale.setScalar(scale);
    obj.rotation.y = ry || 0;
    scene.add(obj);
    if (reflect !== false) {
      var r = obj.clone(true);
      r.traverse(function (o) { if (o.material) o.material = REFL; });
      r.scale.y = -scale;
      r.position.y = GROUND;
      scene.add(r);
      mirrored.push({ src: obj, refl: r });
    }
    return obj;
  }
  function float(obj, x, y, z, scale, ry) {
    obj.position.set(x, y, z);
    obj.scale.setScalar(scale);
    obj.rotation.y = ry || 0;
    scene.add(obj);
    return obj;
  }

  /* ── THE STORY STAGE — a composed opening scene ────────────── */
  var animated = [];                              /* {obj, kind, ph} */
  var stageZ = Z0 - 85;                           /* the stage straddles the first
                                                     stations; the camera passes
                                                     THROUGH the strait, and every
                                                     subject lives in the side
                                                     thirds — the centre corridor
                                                     belongs to the text */

  function ridgeLine(x0, z0, x1, z1, amp, n, mat) {
    var r2 = mulberry32(seed ^ (x0 * 31 + z1 * 7));
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      pts.push([x0 + (x1 - x0) * t,
        GROUND + 1.2 + amp * (0.35 + 0.65 * r2()) * Math.sin(t * Math.PI),
        z0 + (z1 - z0) * t]);
    }
    return strip(pts, mat);
  }

  function priceLineInSky() {
    /* the day's biggest mover, etched as a chart climbing (or sinking)
       toward the stage — the market IS the sky */
    var best = 0, key = "";
    Object.keys(snapshot).forEach(function (k) {
      var v = Number(snapshot[k]) || 0;
      if (Math.abs(v) > Math.abs(best)) { best = v; key = k; }
    });
    if (!key) best = 1;
    var dir = best >= 0 ? 1 : -1;
    var r2 = mulberry32(seed ^ 0xC0FFEE);
    var pts = [], x0 = -44, y0 = GROUND + 15 - dir * 5, z = stageZ - 32;
    var y = y0;
    for (var i = 0; i <= 26; i++) {
      var t = i / 26;
      y = y0 + dir * 16 * t * t + (r2() - 0.5) * 2.2 * (1 - t * 0.5);
      pts.push([x0 + 88 * t, y, z + t * 6]);
    }
    var line = strip(pts, HERO.glow);
    scene.add(line);
    var end = pts[pts.length - 1];
    var pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(end), 3));
    var dot = new THREE.Points(pg, new THREE.PointsMaterial({
      color: P.glow, size: 2.2, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    scene.add(dot);
    animated.push({ obj: dot, kind: "pulse", ph: 0 });
  }

  function sunRings(x, z, base) {
    var g = new THREE.Group();
    for (var i = 0; i < 3; i++) g.add(vRing(base + i * 6, FAR.glow));
    g.position.set(x, GROUND + 6, z);
    scene.add(g);
    animated.push({ obj: g, kind: "breathe", ph: 1.5 });
    return g;
  }

  function buildStage() {
    var has = function (t) { return themes.slice(0, 3).indexOf(t) >= 0; };

    /* the geopolitics/oil day — the strait scene (the user's example day) */
    if (has("energy") && has("defense")) {
      /* coastlines converge toward the horizon on BOTH sides of the lane */
      ridgeLine(-64, stageZ + 60, -16, stageZ - 55, 6, 26, STN.steel);
      ridgeLine(-70, stageZ + 66, -20, stageZ - 50, 4, 26, FAR.steel);
      ridgeLine(62, stageZ + 55, 18, stageZ - 58, 5, 26, STN.steel);
      ridgeLine(68, stageZ + 60, 22, stageZ - 54, 3.5, 26, FAR.steel);
      var tk = ground(tanker(HERO), 19, stageZ + 12, 1.1, -0.1);         /* the subject,
                                                     gliding past on the right */
      animated.push({ obj: tk, kind: "cross", x0: 19, ph: 0 });
      var rd = ground(radar(STN), -23, stageZ + 26, 0.9, 0);             /* the watch, left */
      animated.push({ obj: rd, kind: "radar", ph: 0 });
      if (has("macro"))                                                  /* the Fed, distant */
        ground(colonnade(FAR), 34, stageZ - 40, 0.85, -0.4);
      ground(derrick(FAR), -44, stageZ - 34, 0.8, 0.3);
      sunRings(0, stageZ - 62, 9);                                       /* storm sun in the gap */
    } else if (themes[0] === "semis") {
      for (var i = 0; i < 4; i++) {                                      /* datacenter valley */
        ground(rack(i ? STN : HERO), -17 - i * 2, stageZ + 20 - i * 16, 1 - i * 0.12, 0.2);
        ground(rack(i ? STN : HERO), 15 + i * 2, stageZ + 12 - i * 16, 1 - i * 0.12, -0.2);
      }
      ground(chipDie(HERO), 20, stageZ - 22, 1.5, 0.35);
      sunRings(0, stageZ - 58, 8);
    } else if (themes[0] === "crypto") {
      float(coin(HERO), 18, GROUND + 13, stageZ - 6, 1.9, 0);
      float(nodeField(HERO, mulberry32(seed ^ 5)), -19, GROUND + 12, stageZ + 8, 1, 0);
      sunRings(0, stageZ - 55, 10);
    } else if (themes[0] === "china") {
      ground(crane(HERO), -19, stageZ + 8, 1.1, 0.15);
      ground(containers(HERO), 16, stageZ + 14, 1.1, -0.05);
      ground(crane(STN), 24, stageZ - 18, 0.9, -0.3);
      sunRings(0, stageZ - 56, 9);
    } else if (themes[0] === "defense") {
      var r1 = ground(radar(HERO), -20, stageZ + 10, 1.3, 0);
      animated.push({ obj: r1, kind: "radar", ph: 0 });
      var r2m = ground(radar(STN), 20, stageZ - 10, 0.9, 0.6);
      animated.push({ obj: r2m, kind: "radar", ph: 2 });
      float(satellite(STN), 22, GROUND + 24, stageZ - 26, 1.2, 0.3);
      sunRings(0, stageZ - 56, 9);
    } else if (themes[0] === "healthcare") {
      ground(helix(HERO), 17, stageZ + 4, 1.1, 0);
      ground(helix(STN), -19, stageZ - 10, 0.7, 1.1);
      sunRings(0, stageZ - 54, 9);
    } else {                                                             /* macro default */
      ground(colonnade(HERO), 19, stageZ + 4, 1.15, -0.14);              /* the institution */
      ground(yieldCurve(STN), -20, stageZ + 12, 1.0, 0.35);              /* the curve */
      if (has("energy")) ground(derrick(FAR), -44, stageZ - 28, 0.8, 0.2);
      if (has("defense")) {
        var rr = ground(radar(STN), -30, stageZ - 16, 0.8, 0);
        animated.push({ obj: rr, kind: "radar", ph: 0 });
      }
      sunRings(0, stageZ - 56, 9);
    }
    priceLineInSky();
  }
  buildStage();

  /* ── the quiet track: ONE grounded subject per later station ── */
  var pool = [];
  themes.slice(0, 3).forEach(function (t) {
    (THEME_MOTIFS[t] || []).forEach(function (m) { pool.push(m); });
  });
  if (!pool.length) pool = ["colonnade"];
  for (var si = 2; si < N - 1; si++) {            /* stations 0-1 live on the stage */
    var name = pool[(si - 2) % pool.length];
    var fn = MOTIF[name];
    if (!fn) continue;
    var z = Z0 - si * STATION_GAP - STATION_GAP * 0.35;
    var side = (si % 2 === 0) ? 1 : -1;
    var x = side * (15 + rng() * 5);
    if (SKY_MOTIFS[name]) {
      var o = float(fn(STN), x, GROUND + SKY_MOTIFS[name], z, 1.1, (rng() - 0.5) * 0.5);
      animated.push({ obj: o, kind: "hover", ph: rng() * 6 });
    } else {
      var g = ground(fn(STN), x, z, 0.95 + rng() * 0.2, (rng() - 0.5) * 0.7);
      if (name === "radar") animated.push({ obj: g, kind: "radar", ph: rng() * 6 });
    }
  }
  /* the destination: sun rings at the end of the journey */
  sunRings(0, Z1 - 34, 12);

  /* ── distant ridges the whole way (scale + depth) ──────────── */
  ridgeLine(-70, Z0, -55, Z1 - 40, 7, 40, FAR.steel);
  ridgeLine(70, Z0, 58, Z1 - 40, 6, 40, FAR.steel);

  /* ── the dark-glass sea: sparse grid, denser toward lines of travel ── */
  (function floor() {
    var pts = [], gz, gx;
    for (gx = -80; gx <= 80; gx += 8)
      pts.push([gx, GROUND, Z0 + 24], [gx, GROUND, Z1 - 60]);
    for (gz = Z0 + 24; gz >= Z1 - 60; gz -= 8)
      pts.push([-80, GROUND, gz], [80, GROUND, gz]);
    scene.add(segs(pts, lm(STEEL, 0.16)));
    scene.add(segs([[0, GROUND + 0.02, Z0 + 24], [0, GROUND + 0.02, Z1 - 60]],
      lm(GOLD, 0.12)));
  })();

  /* ── embers, not confetti: sparse drifting particles ───────── */
  var COUNT = 420;
  var pgeo = new THREE.BufferGeometry();
  var pos = new Float32Array(COUNT * 3), spd = new Float32Array(COUNT);
  for (var pi = 0; pi < COUNT; pi++) {
    pos[pi * 3] = (rng() - 0.5) * 150;
    pos[pi * 3 + 1] = GROUND + 1 + rng() * 30;
    pos[pi * 3 + 2] = Z0 + 20 - rng() * (TRACK + 70);
    spd[pi] = 0.3 + rng();
  }
  pgeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(pgeo, new THREE.PointsMaterial({
    color: P.glow, size: 0.32, transparent: true, opacity: 0.4,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  })));

  /* ── camera: framed on the stage, then a calm dolly ────────── */
  var targetP = 0, curP = 0, accent = { flow: 1 };
  var look = new THREE.Vector3();
  var t0 = performance.now();

  function progress() {
    var doc = document.documentElement.scrollHeight - window.innerHeight;
    return doc > 0 ? Math.min(1, Math.max(0, (window.scrollY || 0) / doc)) : 0;
  }
  function resize() {
    var w = canvas.clientWidth || window.innerWidth;
    var h = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  function frame(now) {
    var t = (now - t0) / 1000 * moodCfg.drift;
    targetP = progress();
    curP += (targetP - curP) * 0.055;             /* cinematic lag */

    var cz = Z0 + (Z1 - Z0) * curP;
    /* gentle alternating sway keyed to the station rhythm — not noise */
    var sway = Math.sin(curP * Math.PI * (N / 2.4)) * 2.2
      + Math.sin(t * 0.1) * 0.7;
    camera.position.set(sway, GROUND + 11.4 + Math.sin(t * 0.09) * 0.5, cz);

    /* look steadily down the corridor — composition does the framing:
       subjects live in the side thirds, the centre stays clear for text */
    look.set(sway * 0.4, GROUND + 7.2, cz - 34);
    camera.lookAt(look);
    camera.rotation.z = Math.sin(t * 0.07) * 0.008;

    /* living, not busy */
    for (var i = 0; i < animated.length; i++) {
      var a = animated[i];
      if (a.kind === "radar") {
        if (a.obj.userData.sweep) a.obj.userData.sweep.rotation.y = t * 0.7 + a.ph;
        if (a.obj.userData.rings) {
          var s = 1 + ((t * 0.22 + a.ph) % 1) * 0.5;
          a.obj.userData.rings.scale.set(s, 1, s);
        }
      } else if (a.kind === "cross") {
        a.obj.position.x = (a.x0 || 0) + Math.sin(t * 0.05) * 4;  /* slow transit */
        a.obj.position.y = GROUND + Math.sin(t * 0.5) * 0.15;
      } else if (a.kind === "hover") {
        a.obj.position.y += Math.sin(t * 0.4 + a.ph) * 0.008;
        a.obj.rotation.y += 0.0012;
      } else if (a.kind === "breathe") {
        var b = 1 + Math.sin(t * 0.35 + a.ph) * 0.04;
        a.obj.scale.set(b, b, 1);
      } else if (a.kind === "pulse") {
        a.obj.material.size = 2 + Math.sin(t * 1.6) * 0.8;
      }
    }
    /* keep reflections glued to their objects */
    for (var m = 0; m < mirrored.length; m++) {
      var pr = mirrored[m];
      pr.refl.position.x = pr.src.position.x;
      pr.refl.position.z = pr.src.position.z;
      pr.refl.position.y = 2 * GROUND - pr.src.position.y;
      pr.refl.rotation.y = pr.src.rotation.y;
    }

    /* ember drift; direction follows the regime */
    var dir = MOOD === "off" ? -1 : 1;
    var pa = pgeo.attributes.position.array;
    var v = 0.045 * P.speed * accent.flow * dir;
    for (var j = 0; j < COUNT; j++) {
      pa[j * 3] += v * spd[j];
      pa[j * 3 + 1] += 0.006 * Math.sin(t * 0.4 + j);
      if (pa[j * 3] > 80) pa[j * 3] = -80; else if (pa[j * 3] < -80) pa[j * 3] = 80;
    }
    pgeo.attributes.position.needsUpdate = true;

    renderer.autoClear = false;
    renderer.clear();
    renderer.render(skyScene, skyCam);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    setScroll: function () {},                    /* scroll read internally */
    setAccent: function (a) { accent = a || { flow: 1 }; },
    drawOnce: function () {
      renderer.render(skyScene, skyCam); renderer.render(scene, camera);
    },
    resize: resize,
    is3D: true
  };
};
