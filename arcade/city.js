"use strict";
let CITY_RADAR = null;
function drawMushroom(X, sx, sy, a, k) {
  const fade = a < 0.75 ? 1 : 1 - (a - 0.75) / 0.25, rise = Math.min(1, a * 1.8), H = (50 + 150 * rise) * k;
  X.save();
  if (a < 0.35) { X.globalAlpha = (1 - a / 0.35) * 0.9; X.strokeStyle = "#fff7ed"; X.lineWidth = 4 * k; X.beginPath(); X.ellipse(sx, sy, (40 + 520 * a) * k, (20 + 260 * a) * k, 0, 0, 6.3); X.stroke(); }
  X.globalAlpha = 0.85 * fade;
  const g = X.createRadialGradient(sx, sy, 2, sx, sy, (30 + 70 * rise) * k); g.addColorStop(0, a < 0.3 ? "#fffbeb" : "#fdba74"); g.addColorStop(0.5, "#f97316"); g.addColorStop(1, "rgba(87,83,78,0)");
  X.fillStyle = g; X.beginPath(); X.ellipse(sx, sy, (30 + 70 * rise) * k, (14 + 30 * rise) * k, 0, 0, 6.3); X.fill();
  const sw = (10 + 8 * rise) * k, st = X.createLinearGradient(0, sy, 0, sy - H);
  st.addColorStop(0, "rgba(120,113,108,.9)"); st.addColorStop(0.6, a < 0.4 ? "#fb923c" : "#a8a29e"); st.addColorStop(1, "#78716c");
  X.fillStyle = st; X.beginPath(); X.moveTo(sx - sw * 1.6, sy); X.quadraticCurveTo(sx - sw * 0.6, sy - H * 0.5, sx - sw * 0.8, sy - H); X.lineTo(sx + sw * 0.8, sy - H); X.quadraticCurveTo(sx + sw * 0.6, sy - H * 0.5, sx + sw * 1.6, sy); X.closePath(); X.fill();
  const cw = (34 + 60 * rise) * k, ch = (20 + 26 * rise) * k, cy = sy - H;
  for (const [dx, dy, r, c] of [[0, 0, 1, "#57534e"], [-0.55, 0.15, 0.6, "#78716c"], [0.55, 0.15, 0.6, "#78716c"], [0, -0.25, 0.75, "#a8a29e"], [-0.3, -0.1, 0.45, a < 0.45 ? "#fdba74" : "#d6d3d1"], [0.3, -0.05, 0.4, a < 0.45 ? "#f97316" : "#a8a29e"]]) {
    X.fillStyle = c; X.beginPath(); X.ellipse(sx + dx * cw, cy + dy * ch, cw * r, ch * r, 0, 0, 6.3); X.fill();
  }
  if (a < 0.5) { X.globalAlpha = (0.5 - a) * 1.6 * fade; X.fillStyle = "#fde047"; X.beginPath(); X.ellipse(sx, cy + ch * 0.35, cw * 0.55, ch * 0.3, 0, 0, 6.3); X.fill(); }
  X.restore();
}
function City() {
  const T = 32, NB = 8, PER = 14, E = 3, MT = E * 2 + NB * PER + 2, HC = 600;
  const WATER = 0, ROAD = 1, WALK = 2, GRASS = 3, BUILD = 4, LOT = 5, POND = 6, FENCE = 7, BASE = 8;
  const solidT = (t) => t === WATER || t === BUILD || t === POND || t === FENCE;
  const mul = (a) => () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const R = mul(20261029), any = (xs) => xs[Math.floor(Math.random() * xs.length)];
  const map = new Uint8Array(MT * MT);
  const tile = (tx, ty) => (tx < 0 || ty < 0 || tx >= MT || ty >= MT ? WATER : map[ty * MT + tx]);
  const tileAt = (x, y) => tile(Math.floor(x / T), Math.floor(y / T)), solidAt = (x, y) => solidT(tileAt(x, y));
  const put = (tx, ty, v) => { if (tx >= 0 && ty >= 0 && tx < MT && ty < MT) map[ty * MT + tx] = v; };
  const fill = (x, y, w, h, v) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) put(i, j, v); };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y), wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  const L0 = E, L1 = E + NB * PER + 1;
  fill(L0, L0, L1 - L0 + 1, L1 - L0 + 1, WALK);
  const RD = []; for (let k = 0; k <= NB; k++) RD.push(E + k * PER);
  for (const r of RD) { fill(r, L0, 2, L1 - L0 + 1, ROAD); fill(L0, r, L1 - L0 + 1, 2, ROAD); }
  const LN = RD.map((r) => (r + 1) * T);
  const builds = [], trees = [], parked = [], booths = [], spots = [], pads = [], special = {};
  const PAL = [["#64748b", "#475569"], ["#a8a29e", "#78716c"], ["#c2410c", "#9a3412"], ["#94a3b8", "#64748b"], ["#7c3aed", "#5b21b6"], ["#0e7490", "#155e75"],
               ["#be123c", "#9f1239"], ["#d6d3d1", "#a8a29e"], ["#4d7c0f", "#3f6212"], ["#b45309", "#92400e"], ["#334155", "#1e293b"]];
  const building = (tx, ty, w, h, hg, pal, label) => { fill(tx, ty, w, h, BUILD); builds.push({ x: tx * T, y: ty * T, w: w * T, h: h * T, hg, roof: pal[0], wall: pal[1], label, ac: R() < 0.7 ? [R(), R(), R()] : null }); };
  function bsp(x, y, w, h) {
    if (w >= 7 || h >= 7 || ((w >= 5 || h >= 5) && R() < 0.6)) {
      if (w >= h) { const s = 2 + Math.floor(R() * (w - 4)); bsp(x, y, s, h); bsp(x + s + 1, y, w - s - 1, h); }
      else { const s = 2 + Math.floor(R() * (h - 4)); bsp(x, y, w, s); bsp(x, y + s + 1, w, h - s - 1); }
      return;
    }
    building(x, y, w, h, 34 + R() * (w * h > 12 ? 170 : 90), PAL[Math.floor(R() * PAL.length)]);
  }
  const carType = () => { const r = R(); return r < 0.42 ? "sedan" : r < 0.58 ? "sport" : r < 0.72 ? "taxi" : "van"; };
  const KIND = { "1,1": "police", "6,2": "hospital", "2,5": "spray", "5,6": "spray", "7,7": "army", "3,3": "park", "4,4": "park", "0,6": "park", "6,0": "lot", "2,2": "lot", "4,7": "lot" };
  for (let j = 0; j < NB; j++) for (let i = 0; i < NB; i++) {
    const kind = KIND[i + "," + j] || (R() < 0.1 ? "park" : R() < 0.1 ? "lot" : "city"), bx = E + i * PER + 3, by = E + j * PER + 3;
    if (kind === "city") bsp(bx, by, 10, 10);
    else if (kind === "park") {
      fill(bx, by, 10, 10, GRASS); fill(bx + 4, by, 2, 10, WALK); fill(bx, by + 4, 10, 2, WALK);
      if (R() < 0.7) fill(bx + 6, by + 6, 3, 3, POND);
      for (let n = 0; n < 14; n++) { const tx = bx + Math.floor(R() * 10), ty = by + Math.floor(R() * 10); if (tile(tx, ty) === GRASS) trees.push({ x: tx * T + 8 + R() * 16, y: ty * T + 8 + R() * 16, r: 10 + R() * 7 }); }
    } else if (kind === "lot") {
      fill(bx, by, 10, 10, LOT);
      for (let r = 0; r < 3; r++) for (let n = 0; n < 8; n++) if (R() < 0.5) parked.push({ x: (bx + 0.9 + n * 1.18) * T, y: (by + 1.6 + r * 3.3) * T, a: Math.PI / 2 * (r % 2 ? 1 : -1), t: carType() });
    } else if (kind === "police") {
      building(bx, by, 6, 5, 80, ["#1e3a8a", "#172554"], "POLICE"); fill(bx, by + 5, 10, 5, LOT); fill(bx + 6, by, 4, 5, LOT);
      [0, 1, 2].forEach((n) => parked.push({ x: (bx + 1.2 + n * 1.3) * T, y: (by + 7.5) * T, a: -Math.PI / 2, t: "police" }));
      special.police = { x: (bx + 3) * T, y: (by - 0.5) * T };
    } else if (kind === "hospital") {
      building(bx + 2, by + 1, 6, 5, 90, ["#f1f5f9", "#cbd5e1"], "+"); fill(bx, by + 6, 10, 4, LOT);
      parked.push({ x: (bx + 2) * T, y: (by + 8) * T, a: 0, t: "ambulance" });
      special.hospital = { x: (bx + 5) * T, y: (by + 10.5) * T };
    } else if (kind === "spray") {
      building(bx, by, 4, 10, 60, PAL[3]); building(bx + 7, by, 3, 10, 52, PAL[9]); building(bx + 4, by + 7, 3, 3, 46, PAL[1]);
      fill(bx + 4, by, 3, 7, LOT); pads.push({ x: (bx + 4) * T, y: (by + 2) * T, w: 3 * T, h: 4 * T });
    } else if (kind === "army") {
      fill(bx, by, 10, 10, BASE);
      for (let n = 0; n < 10; n++) { put(bx + n, by, FENCE); put(bx + n, by + 9, FENCE); put(bx, by + n, FENCE); put(bx + 9, by + n, FENCE); }
      put(bx + 4, by + 9, BASE); put(bx + 5, by + 9, BASE);
      building(bx + 1, by + 1, 3, 3, 40, ["#57534e", "#44403c"], "ARMY");
      parked.push({ x: (bx + 5.5) * T, y: (by + 5) * T, a: Math.PI / 2, t: "tank" });
      spots.push({ x: (bx + 7.5) * T, y: (by + 2.5) * T, k: "rocket" });
    }
  }
  [[0, 0], [4, 1], [1, 4], [6, 4], [3, 6], [7, 5]].forEach(([i, j]) => booths.push({ x: (E + i * PER + 2.5) * T, y: (E + j * PER + 2.5) * T }));
  ["pistol", "pistol", "pistol", "uzi", "uzi", "uzi", "health", "health", "health", "armor", "armor", "rocket", "pistol", "uzi", "health", "cash", "cash"].forEach((k) => {
    const i = Math.floor(R() * NB), j = Math.floor(R() * NB);
    spots.push({ x: (E + i * PER + 3 + Math.floor(R() * 10)) * T + T / 2, y: (E + j * PER + 2.5) * T, k });
  });
  builds.sort((a, b) => a.hg - b.hg);
  if (!CITY_RADAR) {
    CITY_RADAR = document.createElement("canvas"); CITY_RADAR.width = CITY_RADAR.height = MT;
    const r = CITY_RADAR.getContext("2d"), COL = ["#1e3a8a", "#52525b", "#a1a1aa", "#3f8f3a", "#1f2937", "#6b7280", "#1e40af", "#44403c", "#8a7a52"];
    for (let y = 0; y < MT; y++) for (let x = 0; x < MT; x++) { r.fillStyle = COL[map[y * MT + x]]; r.fillRect(x, y, 1, 1); }
  }

  const VT = {
    sedan: { name: "SALOON", l: 30, w: 15, max: 270, acc: 270, grip: 7, turn: 2.7, hp: 100, cols: ["#3b82f6", "#e5e7eb", "#64748b", "#16a34a", "#b91c1c", "#a16207", "#0f766e"] },
    sport: { name: "SPORTS CAR", l: 30, w: 14, max: 400, acc: 440, grip: 8, turn: 3.0, hp: 80, cols: ["#ef4444", "#f59e0b", "#a855f7", "#22d3ee", "#facc15"] },
    taxi: { name: "TAXI", l: 30, w: 15, max: 280, acc: 280, grip: 7, turn: 2.7, hp: 100, cols: ["#facc15"] },
    van: { name: "VAN", l: 36, w: 17, max: 230, acc: 210, grip: 6, turn: 2.2, hp: 140, cols: ["#f8fafc", "#78716c", "#0f766e", "#7c2d12"] },
    bus: { name: "BUS", l: 58, w: 19, max: 200, acc: 150, grip: 6, turn: 1.7, hp: 220, cols: ["#ea580c"] },
    police: { name: "POLICE CAR", l: 31, w: 15, max: 340, acc: 360, grip: 8, turn: 2.9, hp: 130, cols: ["#0f172a"] },
    ambulance: { name: "AMBULANCE", l: 38, w: 18, max: 280, acc: 250, grip: 6.5, turn: 2.3, hp: 150, cols: ["#f8fafc"] },
    tank: { name: "TANK", l: 42, w: 26, max: 130, acc: 140, grip: 14, turn: 1.5, hp: 1200, cols: ["#4d5d32"] },
    jet: { name: "F-16", l: 48, w: 40, max: 950, acc: 520, grip: 4, turn: 2.4, hp: 600, cols: ["#94a3b8"], fly: true },
  };
  const SKIN = ["#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#5a3825", "#3b2219", "#ffdbac"];
  const SHIRT = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316", "#e5e7eb", "#14b8a6", "#ec4899", "#6b7280"];
  const cars = [], peds = [], shots = [], fx = [], decals = [];
  let seq = 0;
  function mkCar(t, x, y, a, extra) {
    const ty = VT[t], c = Object.assign({ id: ++seq, t, ty, x, y, a, vx: 0, vy: 0, steer: 0, hp: ty.hp, fire: 0, wreck: 0, col: any(ty.cols), drv: null, ai: null,
      siren: false, stuck: 0, rev: 0, cool: 0, lastHit: null, keep: false, ctl: null, unloaded: false }, extra || {});
    cars.push(c); return c;
  }
  parked.forEach((p) => mkCar(p.t, p.x, p.y, p.a, { keep: true }));
  const pickups = spots.map((s) => ({ ...s, t: 0 }));
  const mkPed = (x, y, extra) => { const p = Object.assign({ x, y, a: Math.random() * 6.28, hp: 30, down: 0, skin: any(SKIN), shirt: any(SHIRT), flee: 0, fx: 0, fy: 0, cop: false, walkT: 0, cool: 1, turnT: 0 }, extra || {}); peds.push(p); return p; };
  const start = { x: (E + 3 * PER + 2.5) * T, y: (E + 4 * PER + 2.5) * T };
  const WP = { fist: { name: "FISTS", cool: 0.35 }, pistol: { name: "PISTOL", cool: 0.3, dmg: 26, sp: 0.04 }, uzi: { name: "MACHINE GUN", cool: 0.075, dmg: 13, sp: 0.13 }, rocket: { name: "ROCKETS", cool: 0.9 } };
  const WO = ["fist", "pistol", "uzi", "rocket"];
  const pl = { x: start.x, y: start.y, a: 0, vx: 0, vy: 0, hp: 100, armor: 0, car: null, ammo: { fist: 1, pistol: 40, uzi: 0, rocket: 0 }, wi: 1, cool: 0, money: 0,
               wanted: 0, hidden: 0, walkT: 0, dead: 0, deadKind: "", arrest: 0, skin: "#5a3825", shirt: "#f97316" };
  const g = { id: "city", own: true, score: 0, over: false, t: 0, camx: pl.x, camy: pl.y, zoom: 1.0, shake: 0, big: null, toasts: [], mission: null, ring: 0, mN: 0, spawnT: 0, sirenT: 0,
              help: "arrows/WASD move & drive · Space shoot · F or Enter get in/out of any car · X or Shift: handbrake / run · Q E weapon · H horn · answer the ringing phone (radar) for jobs · Esc menu" };
  g.ring = Math.floor(Math.random() * booths.length);
  const toast = (s, c = "#fde047") => { g.toasts.push({ s, c, t: 2.6 }); if (g.toasts.length > 4) g.toasts.shift(); };
  const bigMsg = (s, c, t = 2.5, sub = "") => { g.big = { s, c, t, sub }; };

  function moveWalker(o, dx, dy, r = 5) {
    o.x += dx; if (solidAt(o.x + Math.sign(dx) * r, o.y - r + 1) || solidAt(o.x + Math.sign(dx) * r, o.y + r - 1)) o.x -= dx;
    o.y += dy; if (solidAt(o.x - r + 1, o.y + Math.sign(dy) * r) || solidAt(o.x + r - 1, o.y + Math.sign(dy) * r)) o.y -= dy;
  }
  const corners = (c) => { const f = [Math.cos(c.a), Math.sin(c.a)], r = [-f[1], f[0]], l = c.ty.l / 2, w = c.ty.w / 2;
    return [[l, w], [l, -w], [-l, w], [-l, -w], [l, 0], [-l, 0], [0, w], [0, -w]].map(([u, v]) => [c.x + f[0] * u + r[0] * v, c.y + f[1] * u + r[1] * v]); };
  const carSolid = (c) => corners(c).some(([x, y]) => solidAt(x, y));
  const fwd = (c) => c.vx * Math.cos(c.a) + c.vy * Math.sin(c.a);
  function carPhys(c, dt, thr, steerIn, hb) {
    const t = c.ty, fxx = Math.cos(c.a), fyy = Math.sin(c.a), rx = -fyy, ry = fxx;
    let vf = c.vx * fxx + c.vy * fyy, vr = c.vx * rx + c.vy * ry;
    if (c.wreck || c.hp <= 0) thr = 0;
    if (thr > 0) vf += t.acc * thr * dt * (vf < -5 ? 2.5 : 1);
    else if (thr < 0) vf += (vf > 10 ? -t.acc * 2.4 : -t.acc * 0.7) * -thr * dt;
    vf -= vf * (thr === 0 ? 1.1 : 0.3) * dt;
    vf = clamp(vf, -t.max * 0.35, t.max);
    vr *= Math.exp(-(hb ? 1.3 : t.grip) * dt);
    c.steer += (steerIn - c.steer) * Math.min(1, dt * 9);
    const oldA = c.a;
    c.a += c.steer * t.turn * clamp(vf / 90, -1, 1) * dt * (hb ? 1.4 : 1);
    if (!t.fly && carSolid(c)) c.a = oldA;
    c.vx = fxx * vf + rx * vr; c.vy = fyy * vf + ry * vr;
    const sx = c.vx, sy = c.vy;
    c.x += c.vx * dt; if (!t.fly && carSolid(c)) { c.x -= c.vx * dt; c.vx *= -0.3; }
    c.y += c.vy * dt; if (!t.fly && carSolid(c)) { c.y -= c.vy * dt; c.vy *= -0.3; }
    if (t.fly) { const lim = MT * T - 40; if (c.x < 40 || c.x > lim) { c.x = clamp(c.x, 40, lim); c.vx *= -0.4; } if (c.y < 40 || c.y > lim) { c.y = clamp(c.y, 40, lim); c.vy *= -0.4; } }
    const impact = Math.hypot(sx - c.vx, sy - c.vy);
    if (impact > 160) { c.hp -= (impact - 140) * 0.09 * (c.t === "tank" ? 0.1 : 1); sparks(c.x + fxx * t.l / 2, c.y + fyy * t.l / 2, 6); if (near(c, 500)) SFX.bump(); if (c === pl.car) g.shake = Math.max(g.shake, 0.25); }
    if ((Math.abs(vr) > 80 || (hb && Math.abs(vf) > 90)) && !c.wreck && g.t % 0.05 < dt) skid(c);
  }
  const near = (o, r) => Math.abs(o.x - g.camx) < r && Math.abs(o.y - g.camy) < r;
  function skid(c) {
    const f = [Math.cos(c.a), Math.sin(c.a)], r = [-f[1], f[0]], l = c.ty.l * 0.35, w = c.ty.w * 0.4;
    [[-l, w], [-l, -w]].forEach(([u, v]) => decals.push({ k: "skid", x: c.x + f[0] * u + r[0] * v, y: c.y + f[1] * u + r[1] * v, a: c.a, t: 20 }));
    if (decals.length > 500) decals.splice(0, decals.length - 500);
  }
  function carCircles(c) { const o = c.ty.l / 2 - c.ty.w / 2, f = [Math.cos(c.a), Math.sin(c.a)]; return [[c.x + f[0] * o, c.y + f[1] * o], [c.x, c.y], [c.x - f[0] * o, c.y - f[1] * o]]; }
  function collideCars(A, B) {
    if (A.ty.fly || B.ty.fly) return;
    if (Math.abs(A.x - B.x) > 60 || Math.abs(A.y - B.y) > 60) return;
    let best = null; const ra = A.ty.w / 2, rb = B.ty.w / 2;
    for (const p of carCircles(A)) for (const q of carCircles(B)) {
      const dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy), o = ra + rb - d;
      if (o > 0 && (!best || o > best.o)) best = { o, nx: d ? dx / d : 1, ny: d ? dy / d : 0 };
    }
    if (!best) return;
    const ma = A.ty.hp, mb = B.ty.hp, sa = mb / (ma + mb), sb = ma / (ma + mb);
    A.x -= best.nx * best.o * sa; A.y -= best.ny * best.o * sa; B.x += best.nx * best.o * sb; B.y += best.ny * best.o * sb;
    if (carSolid(A)) { A.x += best.nx * best.o * sa; A.y += best.ny * best.o * sa; }
    if (carSolid(B)) { B.x -= best.nx * best.o * sb; B.y -= best.ny * best.o * sb; }
    const rv = (B.vx - A.vx) * best.nx + (B.vy - A.vy) * best.ny;
    if (rv >= 0) return;
    const j = -1.35 * rv / (1 / ma + 1 / mb);
    A.vx -= j / ma * best.nx; A.vy -= j / ma * best.ny; B.vx += j / mb * best.nx; B.vy += j / mb * best.ny;
    if (-rv > 90) {
      A.hp -= (-rv - 70) * 0.1 * sa * 2 * (A.t === "tank" ? 0.1 : 1); B.hp -= (-rv - 70) * 0.1 * sb * 2 * (B.t === "tank" ? 0.1 : 1);
      sparks((A.x + B.x) / 2, (A.y + B.y) / 2, 8); if (near(A, 400)) SFX.bump();
      for (const [me, other] of [[A, B], [B, A]]) if (me === pl.car) { other.lastHit = pl; g.shake = Math.max(g.shake, 0.3); if (other.t === "police" && -rv > 130) crime(0.5); }
    }
  }
  function carVsWalker(c, p, isPlayer) {
    if (c.ty.fly) return;
    const dx = p.x - c.x, dy = p.y - c.y, f = [Math.cos(c.a), Math.sin(c.a)], u = dx * f[0] + dy * f[1], v = -dx * f[1] + dy * f[0];
    if (Math.abs(u) > c.ty.l / 2 + 5 || Math.abs(v) > c.ty.w / 2 + 5) return;
    const sp = Math.hypot(c.vx, c.vy);
    if (sp > 60 && !c.wreck) {
      if (isPlayer) { hurtPlayer(sp * 0.12); pl.x += c.vx * 0.12; pl.y += c.vy * 0.12; return; }
      if (!p.down) { knock(p, c.vx, c.vy); if (c === pl.car) { crime(p.cop ? 1.2 : 0.6); } }
      return;
    }
    const k = (c.ty.w / 2 + 6 - Math.abs(v)) * Math.sign(v || 1);
    moveWalker(isPlayer ? pl : p, -f[1] * k * 0.3, f[0] * k * 0.3);
  }

  function sparks(x, y, n, c = "#fde047") { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = rnd(40, 160); fx.push({ k: "spark", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: rnd(0.15, 0.4), c }); } }
  function knock(p, vx, vy) {
    p.down = 0.01; p.hp = 0; p.a = Math.atan2(vy, vx);
    decals.push({ k: "blood", x: p.x, y: p.y, r: rnd(5, 9), t: 25 });
    for (const o of peds) if (!o.down && !o.cop && Math.abs(o.x - p.x) < 180 && Math.abs(o.y - p.y) < 180) { o.flee = 4; o.fx = p.x; o.fy = p.y; }
    SFX.stomp();
  }
  function hurtPlayer(d) {
    if (pl.dead > 0) return;
    const a = Math.min(pl.armor, d * 0.7); pl.armor -= a; pl.hp -= d - a;
    g.shake = Math.max(g.shake, 0.15);
    if (pl.hp <= 0) die("WASTED");
  }
  function explode(x, y, r = 72, dmg = 120, byPlayer = false, nuke = false) {
    if (nuke) {
      fx.push({ k: "mush", x, y, t: 4, vx: 0, vy: 0 });
      for (let i = 0; i < 30; i++) { const a = Math.random() * 6.28, v = rnd(120, 420); fx.push({ k: "fire", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: rnd(0.4, 1.1), s: rnd(8, 16) }); }
      decals.push({ k: "scorch", x, y, r: r * 0.55, t: 60 });
      const far = Math.hypot(x - g.camx, y - g.camy);
      if (far < 1600) { g.nukeT = Math.max(g.nukeT || 0, 0.45 * (1 - far / 1600) + 0.1); g.shake = Math.max(g.shake, 1.6 * (1 - far / 1600)); noise(3.2, 0.75, 220); noise(1.1, 0.5, 1400); tone(52, 3, "sine", 0.35, -30); }
      for (const p of peds) { const d = Math.hypot(p.x - x, p.y - y); if (d < r && !p.down) knock(p, p.x - x, p.y - y); else if (d < r * 3 && !p.cop) { p.flee = 6; p.fx = x; p.fy = y; } }
      for (const c of cars) { const d = Math.hypot(c.x - x, c.y - y); if (d >= r || c.wreck || c === pl.car) continue; const k = 1 - d / r; c.hp -= dmg * 2 * k * (c.t === "tank" ? 0.3 : 1); c.vx += (c.x - x) / (d || 1) * 600 * k; c.vy += (c.y - y) / (d || 1) * 600 * k; if (byPlayer) c.lastHit = pl; }
      if (!byPlayer && (!pl.car || pl.car.t !== "tank")) { const d = Math.hypot(pl.x - x, pl.y - y); if (d < r) hurtPlayer(dmg * (1 - d / r)); }
      if (byPlayer) crime(1);
      return;
    }
    for (let i = 0; i < 26; i++) { const a = Math.random() * 6.28, v = rnd(30, 190); fx.push({ k: "fire", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: rnd(0.3, 0.8), s: rnd(5, 11) }); }
    for (let i = 0; i < 14; i++) { const a = Math.random() * 6.28, v = rnd(10, 60); fx.push({ k: "smoke", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: rnd(1, 2.2), s: rnd(8, 14) }); }
    decals.push({ k: "scorch", x, y, r: r * 0.5, t: 40 });
    if (near({ x, y }, 600)) { SFX.boom(); g.shake = Math.max(g.shake, 0.5 * (1 - Math.min(1, Math.hypot(x - g.camx, y - g.camy) / 600))); }
    for (const p of peds) { const d = Math.hypot(p.x - x, p.y - y); if (d < r && !p.down) { knock(p, p.x - x, p.y - y); if (byPlayer) crime(p.cop ? 1.2 : 0.4); } else if (d < r * 3 && !p.cop) { p.flee = 5; p.fx = x; p.fy = y; } }
    for (const c of cars) {
      const d = Math.hypot(c.x - x, c.y - y); if (d >= r || c.wreck) continue;
      const k = 1 - d / r; c.hp -= dmg * 1.6 * k * (c.t === "tank" ? 0.15 : 1); c.vx += (c.x - x) / (d || 1) * 300 * k; c.vy += (c.y - y) / (d || 1) * 300 * k;
      if (byPlayer) c.lastHit = pl;
    }
    if (!pl.car || pl.car.t !== "tank") { const d = Math.hypot(pl.x - x, pl.y - y); if (d < r) hurtPlayer(dmg * (1 - d / r) * (pl.car ? 0.5 : 1)); }
    if (byPlayer) crime(0.5);
  }
  function shoot(from, x, y, a, kind, dmg, owner, nuke = false) {
    if (g.net && owner === pl) g.shotQ.push([Math.round(x), Math.round(y), Math.round(a * 1000) / 1000, kind, dmg, nuke ? 1 : 0]);
    const v = kind === "b" ? 900 : kind === "rocket" ? 430 : 520;
    shots.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, kind, dmg, owner, from, nuke, t: kind === "b" ? 0.7 : 2.4 });
    fx.push({ k: "flash", x: x + Math.cos(a) * 3, y: y + Math.sin(a) * 3, t: 0.05 });
    for (const p of peds) if (!p.cop && !p.down && Math.abs(p.x - x) < 240 && Math.abs(p.y - y) < 240) { p.flee = 5; p.fx = x; p.fy = y; }
  }
  function fire(car) {
    if (pl.cool > 0) return;
    if (car && car.ty.fly) {
      const a = car.a, nx = car.x + Math.cos(a) * 26, ny = car.y + Math.sin(a) * 26;
      shoot(car, nx, ny, a + rnd(-0.025, 0.025), "b", 34, pl); pl.cool = 0.06; noise(0.04, 0.09, 3200);
      if (g.t - (pl.mslAt || 0) > 1.1) { pl.mslAt = g.t; for (const sd of [-1, 1]) shoot(car, car.x - Math.sin(a) * 14 * sd, car.y + Math.cos(a) * 14 * sd, a, "rocket", 0, pl, true); noise(0.5, 0.25, 900); }
      return;
    }
    const w = car && car.t === "tank" ? "shell" : WO[pl.wi];
    const a = pl.a, ox = car ? Math.cos(a) * (car.ty.l / 2 + 4) : Math.cos(a) * 7, oy = car ? Math.sin(a) * (car.ty.l / 2 + 4) : Math.sin(a) * 7;
    if (w === "shell") { shoot(car, pl.x + ox, pl.y + oy, a, "shell", 0, pl, true); pl.cool = 1.0; noise(0.6, 0.45, 380); tone(70, 0.4, "sine", 0.25, -40); g.shake = Math.max(g.shake, 0.4); return; }
    if (w === "fist") {
      if (car) return;
      pl.cool = WP.fist.cool;
      const t = peds.find((p) => !p.down && Math.hypot(p.x - pl.x - Math.cos(a) * 9, p.y - pl.y - Math.sin(a) * 9) < 10);
      if (t) { t.hp -= 12; t.flee = 5; t.fx = pl.x; t.fy = pl.y; tone(140, 0.08, "square", 0.08, -60); crime(t.cop ? 1 : 0.25); if (t.hp <= 0) knock(t, Math.cos(a), Math.sin(a)); }
      return;
    }
    if (pl.ammo[w] <= 0) { pl.cool = 0.25; tone(1800, 0.03, "square", 0.02); return; }
    pl.ammo[w]--; pl.cool = WP[w].cool;
    if (w === "rocket") { shoot(car, pl.x + ox, pl.y + oy, a, "rocket", 0, pl); noise(0.3, 0.12, 1200); }
    else { shoot(car, pl.x + ox, pl.y + oy, a + rnd(-WP[w].sp, WP[w].sp), "b", WP[w].dmg, pl); w === "uzi" ? noise(0.05, 0.12, 2400) : (tone(520, 0.06, "square", 0.05, -320), noise(0.06, 0.1, 1800)); }
    if (copNear(260)) crime(0.12);
  }
  function carHit(c, x, y) { const dx = x - c.x, dy = y - c.y, f = [Math.cos(c.a), Math.sin(c.a)]; return Math.abs(dx * f[0] + dy * f[1]) < c.ty.l / 2 && Math.abs(-dx * f[1] + dy * f[0]) < c.ty.w / 2; }
  function stepShots(dt) {
    for (const s of shots) {
      if (s.kind === "rocket" && Math.random() < 0.6) fx.push({ k: "smoke", x: s.x, y: s.y, vx: 0, vy: 0, t: 0.6, s: 4 });
      const n = Math.max(1, Math.ceil(Math.hypot(s.vx, s.vy) * dt / 6));
      for (let k = 0; k < n && !s.dead; k++) {
        s.x += s.vx * dt / n; s.y += s.vy * dt / n;
        let hitIt = solidAt(s.x, s.y) ? "wall" : null;
        if (!hitIt) for (const p of peds) if (!p.down && p !== s.from && Math.abs(p.x - s.x) < 6 && Math.abs(p.y - s.y) < 6) { hitIt = p; break; }
        if (!hitIt) for (const c of cars) if (c !== s.from && Math.abs(c.x - s.x) < 32 && Math.abs(c.y - s.y) < 32 && carHit(c, s.x, s.y)) { hitIt = c; break; }
        if (!hitIt && s.owner !== pl && !pl.car && pl.dead <= 0 && Math.abs(pl.x - s.x) < 6 && Math.abs(pl.y - s.y) < 6) hitIt = "player";
        if (!hitIt) continue;
        s.dead = true;
        const byP = s.owner === pl;
        if (s.kind !== "b") { explode(s.x - s.vx * dt / n, s.y - s.vy * dt / n, s.nuke ? 200 : s.kind === "shell" ? 80 : 70, s.nuke ? 420 : s.kind === "shell" ? 150 : 120, byP, s.nuke); break; }
        if (hitIt === "wall") sparks(s.x, s.y, 3, "#e5e7eb");
        else if (hitIt === "player") hurtPlayer(s.dmg);
        else if (hitIt.ty) {
          hitIt.hp -= s.dmg * 0.55; sparks(s.x, s.y, 4);
          if (byP) { hitIt.lastHit = pl; if (hitIt.drv === "ai" && Math.random() < 0.3) bail(hitIt); if (hitIt.t === "police") crime(0.4); }
          if (hitIt === pl.car) hurtPlayer(s.dmg * 0.15);
        } else {
          hitIt.hp -= s.dmg; hitIt.flee = 5; hitIt.fx = s.x - s.vx; hitIt.fy = s.y - s.vy;
          for (let i = 0; i < 3; i++) fx.push({ k: "spark", x: s.x, y: s.y, vx: rnd(-50, 50), vy: rnd(-50, 50), t: 0.25, c: "#991b1b" });
          if (hitIt.hp <= 0) { knock(hitIt, s.vx, s.vy); if (byP) crime(hitIt.cop ? 1.5 : 0.6); } else if (byP) crime(hitIt.cop ? 1 : 0.3);
        }
      }
      s.t -= dt;
      if (s.t <= 0 && !s.dead) { s.dead = true; if (s.kind !== "b") explode(s.x, s.y, s.nuke ? 200 : 70, s.nuke ? 420 : 120, s.owner === pl, s.nuke); }
    }
    prune(shots, (s) => !s.dead);
  }
  const prune = (arr, keep) => { let j = 0; for (const x of arr) if (keep(x)) arr[j++] = x; arr.length = j; };
  function bail(c) {
    if (!c.drv || c.drv === "player") return;
    const f = [Math.cos(c.a), Math.sin(c.a)], side = [-f[1] * (c.ty.w / 2 + 7), f[0] * (c.ty.w / 2 + 7)];
    const p = mkPed(c.x + side[0], c.y + side[1], { flee: 6, fx: c.x, fy: c.y, cop: c.drv === "cop" });
    if (solidAt(p.x, p.y)) { p.x = c.x - side[0]; p.y = c.y - side[1]; }
    c.drv = null; c.ai = null;
  }

  const copNear = (r) => peds.some((p) => p.cop && !p.down && Math.abs(p.x - pl.x) < r && Math.abs(p.y - pl.y) < r && los(p, pl)) ||
                         cars.some((c) => c.t === "police" && !c.wreck && c.drv && Math.abs(c.x - pl.x) < r && Math.abs(c.y - pl.y) < r && los(c, pl));
  function los(a, b) { const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.ceil(d / 12); for (let i = 1; i < n; i++) if (solidAt(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n)) return false; return true; }
  function crime(amount) {
    if (pl.dead > 0) return;
    const before = Math.floor(pl.wanted);
    pl.wanted = Math.min(5, pl.wanted + amount); pl.hidden = 0;
    if (Math.floor(pl.wanted) > before) { tone(660, 0.1, "square", 0.05); tone(880, 0.12, "square", 0.05, 0, 0.1); }
  }
  function law(dt) {
    const stars = Math.floor(pl.wanted);
    if (stars >= 1) {
      if (copNear(330)) pl.hidden = 0; else pl.hidden += dt;
      if (pl.hidden > 10 + stars * 3) { pl.wanted = Math.max(0, stars - 1); pl.hidden = 0; toast(pl.wanted < 1 ? "YOU LOST THEM" : "ONE STAR LESS", "#93c5fd"); }
    } else pl.wanted = Math.min(pl.wanted, 0.99);
    const st = pl.car ? Math.hypot(pl.car.vx, pl.car.vy) : 0;
    const cuff = stars >= 1 && peds.some((p) => p.cop && !p.down && Math.hypot(p.x - pl.x, p.y - pl.y) < (pl.car ? 28 : 16)) && (!pl.car || st < 25);
    pl.arrest = cuff ? pl.arrest + dt : Math.max(0, pl.arrest - dt);
    if (pl.arrest > (pl.car ? 2 : 1.2)) die("BUSTED");
    const pad = pl.car && pl.car.t !== "tank" && pads.find((p) => pl.x > p.x && pl.x < p.x + p.w && pl.y > p.y && pl.y < p.y + p.h);
    if (pad && st < 60 && (stars >= 1 || pl.car.hp < pl.car.ty.hp)) {
      if (pl.money < 300) { if (!g.padMsg) toast("A RESPRAY COSTS $300", "#fca5a5"); g.padMsg = true; }
      else { pl.money -= 300; pl.wanted = 0; pl.hidden = 0; pl.car.col = any(SHIRT); pl.car.hp = pl.car.ty.hp; pl.car.fire = 0; bigMsg("RESPRAYED", "#86efac", 2, "new colour, no stars, -$300"); SFX.coin(); }
    } else if (!pad) g.padMsg = false;
  }
  function die(kind) {
    if (pl.dead > 0) return;
    pl.dead = 3; pl.deadKind = kind; pl.arrest = 0;
    if (pl.car) { const c = pl.car; c.drv = null; pl.car = null; if (kind === "BUSTED") c.vx = c.vy = 0; }
    if (g.mission) failMission(kind);
    bigMsg(kind, kind === "WASTED" ? "#ef4444" : "#60a5fa", 3, kind === "BUSTED" ? "guns taken, 10% of your cash fined" : "your guns are gone");
    if (kind === "BUSTED") pl.money = Math.floor(pl.money * 0.9);
    SFX.over(); engineSet(false);
  }
  function respawn() {
    const at = pl.deadKind === "BUSTED" ? special.police : special.hospital;
    Object.assign(pl, { x: at.x, y: at.y, a: -Math.PI / 2, hp: 100, armor: 0, wanted: 0, hidden: 0, dead: 0, ammo: { fist: 1, pistol: 0, uzi: 0, rocket: 0 }, wi: 0 });
    for (const p of peds) if (p.cop) { p.flee = 0; }
    g.camx = pl.x; g.camy = pl.y;
  }

  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1], laneOff = (d) => [-DY[d] * T / 2, DX[d] * T / 2];
  const valid = (i, j) => i >= 0 && j >= 0 && i <= NB && j <= NB;
  const appPt = (i, j, d) => { const o = laneOff(d); return [LN[i] - DX[d] * T * 1.3 + o[0], LN[j] - DY[d] * T * 1.3 + o[1]]; };
  const exitPt = (i, j, d) => { const o = laneOff(d); return [LN[i] + DX[d] * T * 1.3 + o[0], LN[j] + DY[d] * T * 1.3 + o[1]]; };
  function chooseDir(c) {
    const ai = c.ai, opts = [0, 1, 2, 3].filter((d) => d !== (ai.d + 2) % 4 && valid(ai.i + DX[d], ai.j + DY[d]));
    if (!opts.length) return (ai.d + 2) % 4;
    if (c.drv === "cop" && pl.wanted >= 1) {
      const sc = (d) => Math.hypot(LN[ai.i + DX[d]] - pl.x, LN[ai.j + DY[d]] - pl.y);
      return opts.reduce((a, b) => (sc(b) < sc(a) ? b : a));
    }
    return opts.includes(ai.d) && Math.random() < 0.5 ? ai.d : any(opts);
  }
  function snap(c) {
    const i = clamp(Math.round((c.x / T - E - 1) / PER), 0, NB), j = clamp(Math.round((c.y / T - E - 1) / PER), 0, NB);
    const dx = LN[i] - c.x, dy = LN[j] - c.y, d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3);
    c.ai = { i, j, d, ph: "app", wp: appPt(i, j, d), speed: c.ai ? c.ai.speed : 150, direct: false };
  }
  function driveAI(c, dt) {
    const ai = c.ai, sp = fwd(c), tgt = pl.car || pl;
    let tx, ty, want, ram = false;
    const chase = c.drv === "cop" && pl.wanted >= 1 && pl.dead <= 0;
    if (chase && Math.hypot(tgt.x - c.x, tgt.y - c.y) < 280 && los(c, tgt)) { tx = tgt.x + (tgt.vx || 0) * 0.35; ty = tgt.y + (tgt.vy || 0) * 0.35; want = 360; ram = true; ai.direct = true; }
    else {
      if (ai.direct) snap(c);
      [tx, ty] = c.ai.wp; want = chase ? 330 : c.ai.speed;
      if (Math.hypot(tx - c.x, ty - c.y) < 18) {
        const a2 = c.ai;
        if (a2.ph === "app") { a2.d = chooseDir(c); a2.ph = "exit"; a2.wp = exitPt(a2.i, a2.j, a2.d); }
        else { a2.i += DX[a2.d]; a2.j += DY[a2.d]; a2.ph = "app"; a2.wp = appPt(a2.i, a2.j, a2.d); }
        [tx, ty] = a2.wp;
      }
      if (c.ai.ph === "exit" || Math.hypot(tx - c.x, ty - c.y) < 70) want = Math.min(want, chase ? 200 : 95);
    }
    const da = wrapA(Math.atan2(ty - c.y, tx - c.x) - c.a);
    let steer = clamp(da * 2.6, -1, 1); want *= 1 - Math.min(0.6, Math.abs(da) * 0.7);
    if (!ram && c.drv === "ai") {
      const f = [Math.cos(c.a), Math.sin(c.a)], look = c.ty.l / 2 + 30;
      const ahead = (o) => { const dx = o.x - c.x, dy = o.y - c.y, u = dx * f[0] + dy * f[1]; return u > 0 && u < look && Math.abs(-dx * f[1] + dy * f[0]) < 13; };
      if (cars.some((o) => o !== c && Math.abs(o.x - c.x) < 70 && Math.abs(o.y - c.y) < 70 && ahead(o)) || peds.some((p) => !p.down && Math.abs(p.x - c.x) < 60 && Math.abs(p.y - c.y) < 60 && ahead(p)) || (pl.dead <= 0 && ahead(pl))) {
        want = c.stuck > 6 ? want : 0; c.stuck += dt;
        if (c.stuck > 3 && c.cool <= 0 && near(c, 400)) { tone(330, 0.2, "square", 0.03); tone(415, 0.2, "square", 0.03); c.cool = 2.5; }
      } else c.stuck = Math.max(0, c.stuck - dt * 2);
    }
    c.cool -= dt;
    let thr = sp < want - 10 ? 1 : sp > want + 30 ? -0.7 : 0;
    if (c.rev > 0) { c.rev -= dt; thr = -1; steer = -steer; }
    else if (thr > 0 && Math.abs(sp) < 6) { c.jam = (c.jam || 0) + dt; if (c.jam > 1.2) { c.rev = 0.9; c.jam = 0; } } else c.jam = 0;
    if (c.drv === "cop" && chase && !c.unloaded && Math.hypot(tgt.x - c.x, tgt.y - c.y) < 90 && Math.abs(sp) < 60 && peds.filter((p) => p.cop && !p.down).length < 7) {
      c.unloaded = true;
      const f = [Math.cos(c.a), Math.sin(c.a)];
      [-1, 1].forEach((s) => { const p = mkPed(c.x - f[1] * s * 14, c.y + f[0] * s * 14, { cop: true, shirt: "#1e3a8a", hp: 45 }); if (solidAt(p.x, p.y)) { p.x = c.x; p.y = c.y; } });
      c.drv = null; c.ai = null;
    }
    return { thr, steer, hb: false };
  }
  function roadSpot(minD, maxD) {
    for (let n = 0; n < 24; n++) {
      const i = Math.floor(Math.random() * (NB + 1)), j = Math.floor(Math.random() * (NB + 1)), d = Math.floor(Math.random() * 4);
      if (!valid(i + DX[d], j + DY[d])) continue;
      const a = exitPt(i, j, d), b = appPt(i + DX[d], j + DY[d], d), f = Math.random(), x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f, dd = Math.hypot(x - pl.x, y - pl.y);
      if (dd < minD || dd > maxD || cars.some((c) => Math.abs(c.x - x) < 50 && Math.abs(c.y - y) < 50)) continue;
      return { x, y, a: Math.atan2(DY[d], DX[d]), ai: { i: i + DX[d], j: j + DY[d], d, ph: "app", wp: appPt(i + DX[d], j + DY[d], d), speed: rnd(110, 190), direct: false } };
    }
    return null;
  }
  function spawner() {
    const act = (o, r) => Math.abs(o.x - pl.x) < r && Math.abs(o.y - pl.y) < r;
    const traffic = cars.filter((c) => c.drv === "ai" && act(c, 750)).length;
    if (traffic < 22) { const s = roadSpot(420, 720); if (s) { const r = Math.random(), c = mkCar(r < 0.06 ? "bus" : r < 0.5 ? "sedan" : r < 0.65 ? "taxi" : r < 0.8 ? "van" : "sport", s.x, s.y, s.a, { drv: "ai", ai: s.ai }); c.vx = Math.cos(s.a) * 80; c.vy = Math.sin(s.a) * 80; } }
    const stars = Math.floor(pl.wanted), cops = cars.filter((c) => c.t === "police" && c.drv === "cop" && !c.wreck && act(c, 900)).length;
    if (stars >= 1 && pl.dead <= 0 && cops < [0, 2, 3, 4, 6, 8][stars]) { const s = roadSpot(380, 650); if (s) mkCar("police", s.x, s.y, s.a, { drv: "cop", ai: s.ai, siren: true }); }
    const walkers = peds.filter((p) => !p.down && act(p, 560)).length;
    for (let n = 0; n < 3 && walkers + n < 46; n++) {
      const x = pl.x + rnd(-540, 540), y = pl.y + rnd(-540, 540), t = tileAt(x, y);
      if ((t === WALK || t === GRASS) && (Math.abs(x - pl.x) > 300 || Math.abs(y - pl.y) > 230)) mkPed(x, y);
    }
    prune(cars, (c) => c.keep || c === pl.car || (g.mission && g.mission.car === c) || act(c, c.drv ? 950 : 1300));
    prune(peds, (p) => act(p, p.down ? 650 : 760) && !(p.down > 30));
  }
  function walkAI(p, dt) {
    if (p.down) { p.down += dt; return; }
    if (p.cop && pl.wanted >= 1 && pl.dead <= 0) {
      const tgt = pl.car || pl, d = Math.hypot(tgt.x - p.x, tgt.y - p.y);
      p.a = Math.atan2(tgt.y - p.y, tgt.x - p.x);
      if (d > 13) { moveWalker(p, Math.cos(p.a) * 82 * dt, Math.sin(p.a) * 82 * dt); p.walkT += dt * 7; }
      p.cool -= dt;
      if (pl.wanted >= 2 && d < 220 && d > 20 && p.cool <= 0 && los(p, tgt)) { shoot(p, p.x + Math.cos(p.a) * 7, p.y + Math.sin(p.a) * 7, p.a + rnd(-0.14, 0.14), "b", 9, p); tone(560, 0.05, "square", 0.03, -300); p.cool = rnd(0.8, 1.5); }
      return;
    }
    let sp = 30;
    if (p.flee > 0) { p.flee -= dt; sp = 88; p.a = Math.atan2(p.y - p.fy, p.x - p.fx) + Math.sin(p.walkT) * 0.25; }
    else if ((p.turnT -= dt) < 0) { p.turnT = rnd(2, 6); if (Math.random() < 0.5) p.a += rnd(-1.6, 1.6); }
    const nx = p.x + Math.cos(p.a) * sp * dt, ny = p.y + Math.sin(p.a) * sp * dt, t = tileAt(nx, ny);
    if (solidT(t) || (t === ROAD && p.flee <= 0 && tileAt(p.x, p.y) !== ROAD && Math.random() < 0.985)) { p.a += (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2; return; }
    moveWalker(p, nx - p.x, ny - p.y); p.walkT += dt * sp / 9;
  }

  const JOBS = ["delivery", "checkpoints", "hit", "demolition", "escape"];
  function sidewalkSpot(minD, maxD) {
    for (let n = 0; n < 60; n++) { const x = rnd(L0 * T, (L1 + 1) * T), y = rnd(L0 * T, (L1 + 1) * T), d = Math.hypot(x - pl.x, y - pl.y); if (d > minD && d < maxD && tileAt(x, y) === WALK) return { x, y }; }
    return { x: special.hospital.x, y: special.hospital.y };
  }
  function startMission() {
    const kind = JOBS[g.mN++ % JOBS.length]; let m;
    if (kind === "delivery") { const p = sidewalkSpot(900, 1700); m = { kind, target: p, t: Math.round(Math.hypot(p.x - pl.x, p.y - pl.y) / 120) + 20, reward: 1500, text: "Take the package to the marked drop-off" }; }
    else if (kind === "checkpoints") {
      const cps = []; let prev = pl;
      for (let n = 0; n < 6; n++) { let best = roadSpot(0, 1e9) || { x: LN[n % NB], y: LN[(n * 3) % NB] }; for (let k = 0; k < 12; k++) { const q = roadSpot(0, 1e9); if (q && Math.abs(Math.hypot(q.x - prev.x, q.y - prev.y) - 450) < Math.abs(Math.hypot(best.x - prev.x, best.y - prev.y) - 450)) best = q; } cps.push({ x: best.x, y: best.y }); prev = best; }
      m = { kind, cps, target: cps[0], t: 70, reward: 2500, text: "Race through the 6 checkpoints" };
    } else if (kind === "hit") {
      const s = roadSpot(500, 900) || roadSpot(300, 4000) || { x: LN[2], y: LN[3] + T / 2, a: 0, ai: { i: 3, j: 3, d: 0, ph: "app", wp: appPt(3, 3, 0), speed: 200, direct: false } }, c = mkCar("sport", s.x, s.y, s.a, { drv: "ai", ai: s.ai, col: "#dc2626", keep: true });
      c.ai.speed = 230; m = { kind, car: c, target: c, t: 100, reward: 3000, text: "Wreck the red sports car" };
    } else if (kind === "demolition") m = { kind, n: 0, need: 6, t: 60, reward: 3000, text: "Wreck 6 cars" };
    else { pl.wanted = Math.max(pl.wanted, 3); pl.hidden = 0; m = { kind, t: 100, reward: 4000, text: "Lose a 3-star police chase" }; }
    g.mission = m; bigMsg("NEW JOB", "#fde047", 2, m.text); SFX.coin();
  }
  function passMission(bonus = 0) {
    const m = g.mission, cash = m.reward + bonus; pl.money += cash;
    bigMsg("JOB DONE!", "#86efac", 2.5, `+$${cash}`); SFX.win();
    if (m.car) m.car.keep = false;
    g.mission = null; g.ring = (g.ring + 1 + Math.floor(Math.random() * (booths.length - 1))) % booths.length;
  }
  function failMission(why) {
    const m = g.mission; if (!m) return;
    if (m.car) m.car.keep = false;
    g.mission = null; g.ring = (g.ring + 1 + Math.floor(Math.random() * (booths.length - 1))) % booths.length;
    if (why !== "WASTED" && why !== "BUSTED") bigMsg("JOB FAILED", "#fca5a5", 2, why);
  }
  function missions(dt) {
    const m = g.mission;
    if (!m) { if (!pl.car && pl.dead <= 0 && dist(pl, booths[g.ring]) < 14) startMission(); return; }
    m.t -= dt;
    if (m.kind === "delivery" && dist(pl, m.target) < 26) return passMission(Math.round(m.t) * 25);
    if (m.kind === "checkpoints" && dist(pl, m.cps[0]) < 34) { m.cps.shift(); SFX.coin(); if (!m.cps.length) return passMission(Math.round(m.t) * 30); m.target = m.cps[0]; }
    if (m.kind === "hit" && (m.car.wreck || m.car.hp <= 0)) return passMission();
    if (m.kind === "demolition" && m.n >= m.need) return passMission();
    if (m.kind === "escape" && pl.wanted < 1) return passMission();
    if (m.t <= 0) failMission("out of time");
  }

  function enterCar() {
    let best = null, bd = 30;
    for (const c of cars) { if (c.wreck || c.hp <= 0) continue; const d = Math.hypot(c.x - pl.x, c.y - pl.y) - c.ty.l / 4; if (d < bd) { bd = d; best = c; } }
    if (!best) return;
    if (best.drv === "ai" || best.drv === "cop") { bail(best); crime(copNear(300) ? 1 : 0.35); toast("CAR JACKED!", "#fb923c"); }
    if (best.t === "police") crime(1); if (best.t === "tank") { crime(2); toast("A TANK. REALLY.", "#86efac"); }
    best.drv = "player"; best.ai = null; best.keep = false; best.siren = false; pl.car = best; pl.a = best.a;
    toast(best.ty.name, "#e5e7eb"); tone(200, 0.08, "square", 0.05);
  }
  function exitCar() {
    if (pl.car && pl.car.ty.fly && Math.hypot(pl.car.vx, pl.car.vy) > 70) { toast("SLOW DOWN TO LAND (hold ↓)", "#fde047"); return; }
    const c = pl.car, f = [Math.cos(c.a), Math.sin(c.a)], o = c.ty.w / 2 + 8;
    let x = c.x + f[1] * o, y = c.y - f[0] * o;
    if (solidAt(x, y)) { x = c.x - f[1] * o; y = c.y + f[0] * o; }
    if (solidAt(x, y)) return;
    pl.x = x; pl.y = y; c.drv = null; c.ctl = null; pl.car = null; engineSet(false);
  }
  function playerStep(dt) {
    const up = held("ArrowUp", "KeyW"), dn = held("ArrowDown", "KeyS"), lf = held("ArrowLeft", "KeyA"), rt = held("ArrowRight", "KeyD");
    pl.cool -= dt;
    if (pressed("KeyQ")) pl.wi = (pl.wi + WO.length - 1) % WO.length;
    if (pressed("KeyE")) pl.wi = (pl.wi + 1) % WO.length;
    if (pressed("KeyF", "Enter")) { if (pl.car) exitCar(); else enterCar(); }
    const c = pl.car;
    if (c) {
      if (c.hp <= 0 && c.fire > 1.9) exitCar();
      if (pressed("KeyH")) { tone(330, 0.3, "square", 0.05); tone(415, 0.3, "square", 0.05); for (const p of peds) if (Math.hypot(p.x - c.x, p.y - c.y) < 120 && !p.cop) { p.flee = 2; p.fx = c.x; p.fy = c.y; } }
      c.ctl = { thr: up ? 1 : dn ? -1 : 0, steer: (rt ? 1 : 0) - (lf ? 1 : 0), hb: held("KeyX", "ShiftLeft", "ShiftRight") };
      pl.x = c.x; pl.y = c.y; pl.a = c.a; pl.vx = c.vx; pl.vy = c.vy;
      if (held("Space")) fire(c);
      const v = Math.abs(fwd(c)); engineSet(true, c.ty.fly ? 2600 + v * 9 : (c.t === "tank" ? 1200 : 1800) + v * (c.t === "tank" ? 10 : 22), up || dn ? 1 : 0.2);
    } else {
      const run = held("ShiftLeft", "ShiftRight", "KeyX") ? 1.75 : 1, sp = (up ? 78 : dn ? -42 : 0) * run;
      pl.a += ((rt ? 1 : 0) - (lf ? 1 : 0)) * 3.8 * dt;
      if (sp) { moveWalker(pl, Math.cos(pl.a) * sp * dt, Math.sin(pl.a) * sp * dt); pl.walkT += dt * Math.abs(sp) / 9; }
      pl.vx = pl.vy = 0;
      if (held("Space")) fire(null);
    }
    for (const k of pickups) {
      if (k.t > 0 || Math.abs(k.x - pl.x) > 16 || Math.abs(k.y - pl.y) > 16) continue;
      k.t = 40; SFX.coin();
      if (k.k === "health") { pl.hp = Math.min(100, pl.hp + 50); toast("+50 HEALTH", "#86efac"); }
      else if (k.k === "armor") { pl.armor = 100; toast("BODY ARMOUR", "#93c5fd"); }
      else if (k.k === "cash") { pl.money += 300; toast("+$300", "#fde047"); }
      else { const add = { pistol: 40, uzi: 160, rocket: 6 }[k.k]; pl.ammo[k.k] += add; pl.wi = WO.indexOf(k.k); toast(`${WP[k.k].name} +${add}`, "#fde047"); }
    }
  }

  const CHEATS = {
    F16: () => { const j = spawnRide("jet"); toast("F-16 · Space: cannon + missiles · ↓ slow down, F to land", "#fde047"); bigMsg("F-16", "#fde047", 1.5); return j; },
    TANK: () => { spawnRide("tank"); toast("A TANK. FROM NOWHERE.", "#86efac"); },
    GUNS: () => { pl.ammo.pistol = 200; pl.ammo.uzi = 600; pl.ammo.rocket = 40; pl.wi = 2; toast("ALL WEAPONS", "#fde047"); },
    MONEY: () => { pl.money += 100000; toast("+$100,000", "#fde047"); },
    HEAL: () => { pl.hp = 100; pl.armor = 100; if (pl.car) pl.car.hp = pl.car.ty.hp; toast("HEALTH + ARMOUR", "#86efac"); },
    NOCOPS: () => { pl.wanted = 0; for (const c of cars) if (c.siren) c.siren = false; toast("WANTED LEVEL CLEARED", "#93c5fd"); },
  };
  function spawnRide(t) {
    if (pl.dead > 0) return null;
    if (pl.car) { const o = pl.car; o.drv = null; o.ctl = null; pl.car = null; }
    const c = mkCar(t, pl.x, pl.y, pl.a, { keep: true });
    c.drv = "player"; pl.car = c; tone(660, 0.1, "square", 0.06); tone(990, 0.15, "square", 0.06, 0, 0.1);
    return c;
  }
  g.dbgCar = () => pl.car ? { t: pl.car.t, x: Math.round(pl.car.x), y: Math.round(pl.car.y), v: Math.round(Math.hypot(pl.car.vx, pl.car.vy)), shots: shots.length } : null;
  g.cheat = (code) => { const k = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); if (CHEATS[k]) { CHEATS[k](); return true; } toast("NO SUCH CHEAT", "#94a3b8"); return false; };
  let typed = "";
  if (window.__cityCheatKey) removeEventListener("keydown", window.__cityCheatKey);
  window.__cityCheatKey = (e) => {
    if (typeof cur === "undefined" || cur !== g || e.key.length !== 1 || (window.TouchPad && TouchPad.on)) return;
    typed = (typed + e.key.toUpperCase()).slice(-8);
    for (const k of Object.keys(CHEATS)) if (typed.endsWith(k)) { typed = ""; if (typeof hit !== "undefined") hit.clear(); CHEATS[k](); break; }
  };
  addEventListener("keydown", window.__cityCheatKey);
  g.update = (dt) => {
    g.t += dt; g.shake = Math.max(0, g.shake - dt); g.nukeT = Math.max(0, (g.nukeT || 0) - dt);
    if (g.big) { g.big.t -= dt; if (g.big.t <= 0) g.big = null; }
    g.toasts.forEach((t) => { t.t -= dt; }); prune(g.toasts, (t) => t.t > 0);
    pickups.forEach((k) => { k.t = Math.max(0, k.t - dt); });
    if (pl.dead > 0) { pl.dead -= dt; if (pl.dead <= 0) respawn(); }
    else playerStep(dt);
    const act = (o, r) => Math.abs(o.x - pl.x) < r && Math.abs(o.y - pl.y) < r, live = cars.filter((c) => act(c, 1000));
    for (const c of live) {
      if (c.hp <= 0 && !c.wreck) {
        c.fire += dt;
        if (Math.random() < 0.5) fx.push({ k: "fire", x: c.x + rnd(-6, 6), y: c.y + rnd(-5, 5), vx: rnd(-10, 10), vy: rnd(-30, -5), t: rnd(0.3, 0.6), s: rnd(3, 6) });
        if (c.drv && c.drv !== "player" && c.fire > 0.4) bail(c);
        if (c.fire > 2.6) {
          c.wreck = 1; c.siren = false; const byP = c.lastHit === pl;
          explode(c.x, c.y, 75, 120, byP);
          if (byP) { pl.money += c.t === "police" ? 200 : 60; if (c.t === "police") crime(1); if (g.mission && g.mission.kind === "demolition") g.mission.n++; }
          if (c === pl.car) { pl.car = null; c.drv = null; hurtPlayer(200); }
        }
      }
      let ctl = { thr: 0, steer: 0, hb: false };
      if (c.drv === "player" && c.ctl) ctl = c.ctl;
      else if ((c.drv === "ai" || c.drv === "cop") && c.ai) ctl = driveAI(c, dt);
      carPhys(c, dt, ctl.thr, ctl.steer, ctl.hb);
    }
    for (let a = 0; a < live.length; a++) for (let b = a + 1; b < live.length; b++) collideCars(live[a], live[b]);
    for (const p of peds) if (act(p, 800)) walkAI(p, dt);
    for (const c of live) {
      if (Math.abs(c.vx) + Math.abs(c.vy) < 4) continue;
      for (const p of peds) if (Math.abs(p.x - c.x) < 34 && Math.abs(p.y - c.y) < 34) carVsWalker(c, p, false);
      if (c !== pl.car && !pl.car && pl.dead <= 0 && Math.abs(pl.x - c.x) < 34 && Math.abs(pl.y - c.y) < 34) carVsWalker(c, pl, true);
    }
    stepShots(dt);
    fx.forEach((f) => { f.x += (f.vx || 0) * dt; f.y += (f.vy || 0) * dt; f.t -= dt; if (f.k === "smoke") { f.s += dt * 10; } });
    prune(fx, (f) => f.t > 0);
    decals.forEach((d) => { d.t -= dt; }); prune(decals, (d) => d.t > 0);
    if (pl.dead <= 0) { law(dt); missions(dt); }
    if ((g.spawnT -= dt) <= 0) { g.spawnT = 0.35; spawner(); }
    if (Math.floor(pl.wanted) >= 1 && cars.some((c) => c.siren && !c.wreck && Math.abs(c.x - pl.x) < 480 && Math.abs(c.y - pl.y) < 480) && (g.sirenT -= dt) <= 0) {
      g.sirenT = 0.42; g.sirenHi = !g.sirenHi; tone(g.sirenHi ? 880 : 660, 0.4, "triangle", 0.03);
    }
    g.score = Math.max(g.score, pl.money);
    const v = pl.car ? Math.hypot(pl.car.vx, pl.car.vy) : 0, zt = pl.car ? 0.92 - Math.min(0.4, v / 650) : 1.0;
    g.zoom += (zt - g.zoom) * Math.min(1, dt * 1.3);
    const lx = pl.x + (pl.car ? pl.car.vx * 0.45 : 0), ly = pl.y + (pl.car ? pl.car.vy * 0.45 : 0);
    g.camx += (lx - g.camx) * Math.min(1, dt * 4); g.camy += (ly - g.camy) * Math.min(1, dt * 4);
  };

  function ground(x0, y0, x1, y1) {
    const tx0 = Math.max(0, Math.floor(x0 / T)), tx1 = Math.min(MT - 1, Math.floor(x1 / T)), ty0 = Math.max(0, Math.floor(y0 / T)), ty1 = Math.min(MT - 1, Math.floor(y1 / T));
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const t = map[ty * MT + tx], x = tx * T, y = ty * T;
      if (t === ROAD) rect(x, y, T, T, "#3b3b41");
      else if (t === WALK) { rect(x, y, T, T, "#a3a3ab"); rect(x, y, T, 1, "#8b8b93"); rect(x, y, 1, T, "#8b8b93"); }
      else if (t === GRASS) rect(x, y, T, T, (tx + ty) % 2 ? "#3d8b37" : "#41923a");
      else if (t === LOT) { rect(x, y, T, T, "#4a4a50"); rect(x, y + T - 1, T, 1, "#5d5d64"); }
      else if (t === BASE) rect(x, y, T, T, (tx + ty) % 2 ? "#8a7a52" : "#857550");
      else if (t === FENCE) { rect(x, y, T, T, "#8a7a52"); rect(x + 2, y + 2, T - 4, T - 4, "#57534e"); rect(x + 6, y + 6, T - 12, T - 12, "#8a7a52"); }
      else if (t === WATER || t === POND) {
        rect(x, y, T, T, "#1e40af"); rect(x + ((g.t * 10 + ty * 13 + tx * 5) % (T - 8)), y + 10 + (tx % 3) * 6, 8, 2, "#3b63d6");
        if (t === WATER) {
          const land = (i, j) => { const n = tile(i, j); return n !== WATER && n !== POND; };
          if (land(tx, ty - 1)) { rect(x, y, T, 5, "#78716c"); rect(x, y, T, 2, "#a8a29e"); rect(x, y + 5, T, 2, "#93c5fd"); }
          if (land(tx, ty + 1)) { rect(x, y + T - 5, T, 5, "#78716c"); rect(x, y + T - 2, T, 2, "#57534e"); rect(x, y + T - 7, T, 2, "#93c5fd"); }
          if (land(tx - 1, ty)) { rect(x, y, 5, T, "#78716c"); rect(x, y, 2, T, "#a8a29e"); rect(x + 5, y, 2, T, "#93c5fd"); }
          if (land(tx + 1, ty)) { rect(x + T - 5, y, 5, T, "#78716c"); rect(x + T - 2, y, 2, T, "#57534e"); rect(x + T - 7, y, 2, T, "#93c5fd"); }
        }
      }
      else rect(x, y, T, T, "#2a2a2e");
    }
    const lo = L0 * T, hi = (L1 + 1) * T;
    for (let k = 0; k <= NB; k++) {
      const X = LN[k];
      if (X > x0 - T && X < x1 + T) for (let y = Math.floor(Math.max(y0, lo) / 24) * 24; y < Math.min(y1, hi - 12); y += 24) if (!LN.some((Y) => Math.abs(y + 6 - Y) < T + 14)) rect(X - 1, y, 2, 12, "#eab308");
      if (X > y0 - T && X < y1 + T) for (let x = Math.floor(Math.max(x0, lo) / 24) * 24; x < Math.min(x1, hi - 12); x += 24) if (!LN.some((Xv) => Math.abs(x + 6 - Xv) < T + 14)) rect(x, X - 1, 12, 2, "#eab308");
    }
    const dry = (x, y) => tileAt(x, y) === ROAD;
    for (const X of LN) for (const Y of LN) {
      if (X < x0 - 80 || X > x1 + 80 || Y < y0 - 80 || Y > y1 + 80) continue;
      const n = dry(X, Y - T - 6), s2 = dry(X, Y + T + 6), w = dry(X - T - 6, Y), e = dry(X + T + 6, Y);
      for (let s = 0; s < 7; s++) {
        if (n) rect(X - T + 3 + s * 9, Y - T - 11, 5, 9, "#d4d4d8"); if (s2) rect(X - T + 3 + s * 9, Y + T + 2, 5, 9, "#d4d4d8");
        if (w) rect(X - T - 11, Y - T + 3 + s * 9, 9, 5, "#d4d4d8"); if (e) rect(X + T + 2, Y - T + 3 + s * 9, 9, 5, "#d4d4d8");
      }
    }
  }
  function drawJet(c) {
    const sp = Math.hypot(c.vx, c.vy), alt = 18 + Math.min(30, sp / 20), k = 1.7 / Math.max(0.6, g.zoom);
    for (const [ox, oy, col] of [[alt, alt, "rgba(0,0,0,.28)"], [0, 0, null]]) {
      cx.save(); cx.translate(c.x + ox, c.y + oy); cx.rotate(c.a); cx.scale(k, k);
      const f = col || "#94a3b8", d = col || "#64748b", poly = (pts, cc) => { cx.fillStyle = cc; cx.beginPath(); pts.forEach(([x, y], i) => (i ? cx.lineTo(x, y) : cx.moveTo(x, y))); cx.closePath(); cx.fill(); };
      poly([[24, 0], [14, -3], [-2, -4], [-2, -20], [-8, -20], [-14, -5], [-20, -5], [-24, -12], [-27, -12], [-25, 0], [-27, 12], [-24, 12], [-20, 5], [-14, 5], [-8, 20], [-2, 20], [-2, 4], [14, 3]], f);
      if (!col) {
        poly([[-2, -20], [-8, -20], [-14, -5], [-6, -5]], d); poly([[-2, 20], [-8, 20], [-14, 5], [-6, 5]], d);
        poly([[16, 0], [8, -2.5], [4, 0], [8, 2.5]], "#0ea5e9");
        rect(-7, -21, 3, 2, "#ef4444"); rect(-7, 19, 3, 2, "#ef4444");
        if (c.ctl && c.ctl.thr > 0) { circ(-28, 0, 3 + Math.random() * 2, "#fde047"); circ(-31, 0, 2 + Math.random() * 2, "#f97316"); }
      }
      cx.restore();
    }
  }
  function drawCar(c) {
    if (c.ty.fly) return;
    const l = c.ty.l, w = c.ty.w;
    cx.save(); cx.translate(c.x, c.y); cx.rotate(c.a);
    rect(-l / 2 + 2, -w / 2 + 3, l, w, "rgba(0,0,0,.28)");
    const body = c.wreck ? "#262626" : c.col;
    if (c.t === "tank") {
      rect(-l / 2, -w / 2, l, 6, "#27272a"); rect(-l / 2, w / 2 - 6, l, 6, "#27272a");
      for (let i = 0; i < 7; i++) { rect(-l / 2 + i * 6 + ((g.t * Math.abs(fwd(c)) * 0.1) % 6), -w / 2, 2, 6, "#3f3f46"); rect(-l / 2 + i * 6 + ((g.t * Math.abs(fwd(c)) * 0.1) % 6), w / 2 - 6, 2, 6, "#3f3f46"); }
      rect(-l / 2 + 3, -w / 2 + 5, l - 6, w - 10, body); circ(-2, 0, 8, c.wreck ? "#1c1c1c" : "#3f4f28"); rect(4, -2, 22, 4, c.wreck ? "#1c1c1c" : "#2f3a1e");
      cx.restore(); return;
    }
    rect(-l / 2, -w / 2, l, w, body);
    rect(-l / 2 + 1, -w / 2 + 1, l - 2, 1.5, "rgba(255,255,255,.18)");
    if (c.t === "bus") { rect(-l / 2 + 4, -w / 2 + 3, l - 12, w - 6, "rgba(255,255,255,.12)"); for (let i = 0; i < 6; i++) { rect(-l / 2 + 5 + i * 8, -w / 2 + 1, 5, 2, "#1e293b"); rect(-l / 2 + 5 + i * 8, w / 2 - 3, 5, 2, "#1e293b"); } rect(l / 2 - 7, -w / 2 + 2, 4, w - 4, "#1e293b"); }
    else {
      const glass = c.wreck ? "#111" : "#1e293b";
      rect(l * 0.1, -w / 2 + 2, l * 0.2, w - 4, glass); rect(-l * 0.34, -w / 2 + 2, l * 0.12, w - 4, glass);
      rect(-l * 0.22, -w / 2 + 2, l * 0.32, w - 4, c.wreck ? "#1c1c1c" : "rgba(255,255,255,.14)");
      if (c.t === "van" || c.t === "ambulance") rect(-l / 2 + 2, -w / 2 + 2, l * 0.58, w - 4, c.wreck ? "#1c1c1c" : body);
      if (c.t === "ambulance" && !c.wreck) { rect(-l * 0.18 - 6, -1.5, 12, 3, "#dc2626"); rect(-l * 0.18 - 1.5, -6, 3, 12, "#dc2626"); }
      if (c.t === "taxi" && !c.wreck) rect(-3, -3, 6, 6, "#111");
      if (c.t === "police" && !c.wreck) { const on = c.siren && Math.floor(g.t * 8) % 2; rect(-2, -w / 2 + 2, 4, w / 2 - 2, on ? "#ef4444" : "#7f1d1d"); rect(-2, 0, 4, w / 2 - 2, on ? "#1e3a8a" : "#3b82f6"); rect(-l / 2 + 2, -w / 2, l - 4, 2, "#f8fafc"); rect(-l / 2 + 2, w / 2 - 2, l - 4, 2, "#f8fafc"); }
    }
    if (!c.wreck) { rect(l / 2 - 2, -w / 2 + 1, 2, 3, "#fef9c3"); rect(l / 2 - 2, w / 2 - 4, 2, 3, "#fef9c3"); rect(-l / 2, -w / 2 + 1, 1.5, 3, "#ef4444"); rect(-l / 2, w / 2 - 4, 1.5, 3, "#ef4444"); }
    if (c.hp < c.ty.hp * 0.35 && !c.wreck && Math.random() < 0.15) fx.push({ k: "smoke", x: c.x + Math.cos(c.a) * l * 0.35, y: c.y + Math.sin(c.a) * l * 0.35, vx: rnd(-8, 8), vy: rnd(-8, 8), t: 0.9, s: 4 });
    cx.restore();
  }
  function drawPed(p, me) {
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a);
    if (p.down) { cx.globalAlpha = clamp(1 - (p.down - 20) / 10, 0, 1); rect(-7, -3, 11, 6, p.shirt); circ(5.5, 0, 2.8, p.skin); cx.restore(); return; }
    const sw = Math.sin(p.walkT) * 3;
    rect(-1.5 + sw, -4, 4, 2.4, "#1f2937"); rect(-1.5 - sw, 1.6, 4, 2.4, "#1f2937");
    circ(0, 0, 4.3, p.shirt); circ(0.8, 0, 2.8, p.skin);
    if (p.cop) rect(-0.5, -2.6, 3.2, 5.2, "#1e3a8a");
    if (me) { rect(-0.6, -2.7, 2.6, 5.4, "#111"); if (WO[pl.wi] !== "fist") rect(3, 1.5, pl.wi === 3 ? 10 : 6, pl.wi === 3 ? 2.4 : 1.6, "#111"); }
    else if (p.cop && pl.wanted >= 2) rect(3, 1.5, 6, 1.6, "#111");
    cx.restore();
  }
  function drawBuilding(b, x0, y0, x1, y1) {
    const H2 = HC / g.zoom, s = H2 / (H2 - b.hg), P = (x, y) => [g.camx + (x - g.camx) * s, g.camy + (y - g.camy) * s];
    const base = [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]], roof = base.map(([x, y]) => P(x, y));
    const minx = Math.min(b.x, roof[0][0]), maxx = Math.max(b.x + b.w, roof[1][0]), miny = Math.min(b.y, roof[0][1]), maxy = Math.max(b.y + b.h, roof[2][1]);
    if (maxx < x0 || minx > x1 || maxy < y0 || miny > y1) return;
    for (let i = 0; i < 4; i++) {
      const a = base[i], bb = base[(i + 1) % 4], ra = roof[i], rb = roof[(i + 1) % 4];
      cx.fillStyle = i % 2 ? b.wall : shadeOf(b.wall); cx.beginPath(); cx.moveTo(a[0], a[1]); cx.lineTo(bb[0], bb[1]); cx.lineTo(rb[0], rb[1]); cx.lineTo(ra[0], ra[1]); cx.closePath(); cx.fill();
    }
    const [rx, ry] = roof[0], rw = roof[1][0] - rx, rh = roof[3][1] - ry;
    rect(rx, ry, rw, rh, b.roof); cx.strokeStyle = "rgba(0,0,0,.25)"; cx.lineWidth = 2; cx.strokeRect(rx + 2, ry + 2, rw - 4, rh - 4);
    if (b.ac) { rect(rx + rw * (0.15 + b.ac[0] * 0.5), ry + rh * (0.15 + b.ac[1] * 0.5), 10 * s, 8 * s, "rgba(0,0,0,.25)"); rect(rx + rw * (0.2 + b.ac[2] * 0.4), ry + rh * 0.65, 6 * s, 6 * s, "rgba(255,255,255,.2)"); }
    if (b.label) txt(b.label, rx + rw / 2, ry + rh / 2 + 6, b.label.length > 1 ? 13 : 30, b.label === "+" ? "#dc2626" : "#f8fafc", "center");
  }
  const SHADE = {}; const shadeOf = (c) => SHADE[c] || (SHADE[c] = "#" + [1, 3, 5].map((i) => Math.round(parseInt(c.slice(i, i + 2), 16) * 0.72).toString(16).padStart(2, "0")).join(""));
  function marker(x, y, col, label) {
    const r = 12 + Math.sin(g.t * 6) * 3;
    cx.strokeStyle = col; cx.lineWidth = 3; cx.beginPath(); cx.arc(x, y, r, 0, 6.3); cx.stroke();
    if (label) txt(label, x, y - r - 4, 9, col, "center");
  }
  g.draw = () => {
    const z = g.zoom, sh = g.shake ? rnd(-4, 4) * g.shake : 0;
    const x0 = g.camx - W / 2 / z - T, x1 = g.camx + W / 2 / z + T, y0 = g.camy - H / 2 / z - T, y1 = g.camy + H / 2 / z + T;
    cx.save(); cx.translate(W / 2 + sh, H / 2 + sh); cx.scale(z, z); cx.translate(-g.camx, -g.camy);
    rect(x0, y0, x1 - x0, y1 - y0, "#1e40af");
    ground(x0, y0, x1, y1);
    const vis = (o, m = 40) => o.x > x0 - m && o.x < x1 + m && o.y > y0 - m && o.y < y1 + m;
    for (const d of decals) if (vis(d)) {
      if (d.k === "skid") { cx.save(); cx.translate(d.x, d.y); cx.rotate(d.a); cx.globalAlpha = Math.min(0.5, d.t / 20); rect(-3, -1, 6, 2, "#111"); cx.restore(); }
      else if (d.k === "scorch") { cx.globalAlpha = Math.min(0.6, d.t / 20); circ(d.x, d.y, d.r, "#111"); }
      else { cx.globalAlpha = Math.min(0.7, d.t / 15); circ(d.x, d.y, d.r, "#7f1d1d"); }
    }
    cx.globalAlpha = 1;
    for (const p of pads) if (vis(p, 200)) { cx.strokeStyle = "#eab308"; cx.setLineDash([6, 6]); cx.lineWidth = 3; cx.strokeRect(p.x + 3, p.y + 3, p.w - 6, p.h - 6); cx.setLineDash([]); txt("SPRAY $300", p.x + p.w / 2, p.y + p.h / 2 + 4, 11, "#eab308", "center"); }
    booths.forEach((b, i) => { if (!vis(b)) return; rect(b.x - 5, b.y - 5, 10, 10, "#1d4ed8"); rect(b.x - 3, b.y - 3, 6, 6, "#93c5fd"); if (i === g.ring && !g.mission && Math.floor(g.t * 4) % 2) marker(b.x, b.y, "#fde047", "RING RING"); });
    for (const k of pickups) if (k.t <= 0 && vis(k)) {
      const bob = Math.sin(g.t * 4 + k.x) * 2, col = { pistol: "#a1a1aa", uzi: "#f59e0b", rocket: "#ef4444", health: "#22c55e", armor: "#3b82f6", cash: "#eab308" }[k.k];
      rect(k.x - 7, k.y - 7 + bob, 14, 14, "#111"); rect(k.x - 6, k.y - 6 + bob, 12, 12, col);
      txt({ pistol: "P", uzi: "M", rocket: "R", health: "+", armor: "A", cash: "$" }[k.k], k.x, k.y + 4 + bob, 10, "#111", "center");
    }
    const m = g.mission;
    if (m && m.target && (m.kind === "delivery" || m.kind === "checkpoints")) marker(m.target.x, m.target.y, "#22d3ee", m.kind === "delivery" ? "DROP-OFF" : `CHECKPOINT ${7 - m.cps.length}/6`);
    for (const p of peds) if (p.down && vis(p)) drawPed(p);
    for (const c of cars) if (vis(c, 60)) drawCar(c);
    for (const p of peds) if (!p.down && vis(p)) drawPed(p);
    if (!pl.car && pl.dead <= 0) drawPed(pl, true);
    if (g.net) drawRemote(false);
    for (const s of shots) { if (s.kind === "b") rect(s.x - 1.5, s.y - 1.5, 3, 3, "#fde047"); else { circ(s.x, s.y, s.kind === "shell" ? 4 : 3, "#e5e7eb"); circ(s.x - s.vx * 0.012, s.y - s.vy * 0.012, 2.5, "#f97316"); } }
    for (const f of fx) {
      if (f.k === "mush") continue;
      if (f.k === "fire") { cx.globalAlpha = clamp(f.t * 2, 0, 1); circ(f.x, f.y, f.s * (0.5 + f.t), f.t > 0.4 ? "#fde047" : "#f97316"); }
      else if (f.k === "smoke") { cx.globalAlpha = clamp(f.t * 0.35, 0, 0.5); circ(f.x, f.y, f.s, "#52525b"); }
      else if (f.k === "flash") { cx.globalAlpha = 1; circ(f.x, f.y, 4, "#fef08a"); }
      else { cx.globalAlpha = clamp(f.t * 4, 0, 1); rect(f.x - 1, f.y - 1, 2, 2, f.c); }
    }
    cx.globalAlpha = 1;
    if (m && m.kind === "hit" && !m.car.wreck) { const bob = Math.sin(g.t * 6) * 3; txt("▼", m.car.x, m.car.y - 22 + bob, 16, "#ef4444", "center"); }
    for (const t of trees) if (vis(t)) { const H2 = HC / z, s = H2 / (H2 - 28), tx = g.camx + (t.x - g.camx) * s, ty = g.camy + (t.y - g.camy) * s; circ(t.x + 3, t.y + 3, t.r, "rgba(0,0,0,.25)"); circ(tx, ty, t.r, "#166534"); circ(tx - t.r * 0.25, ty - t.r * 0.25, t.r * 0.6, "#15803d"); }
    for (const b of builds) drawBuilding(b, x0, y0, x1, y1);
    for (const c of cars) if (c.ty.fly && !c.wreck && vis(c, 120)) drawJet(c);
    if (g.net) drawRemote(true);
    for (const f of fx) if (f.k === "mush" && vis(f, 400)) drawMushroom(cx, f.x, f.y, 1 - f.t / 4, 1.3);
    cx.restore();
    if (g.nukeT > 0) { cx.globalAlpha = Math.min(0.95, g.nukeT * 2.2); rect(0, 0, W, H, "#fffbeb"); cx.globalAlpha = 1; }
    hud();
  };
  function hud() {
    const money = "$" + String(pl.money).padStart(7, "0");
    txt(money, 11, 27, 22, "#111"); txt(money, 10, 26, 22, "#fde047");
    for (let i = 0; i < 5; i++) { const f = clamp((pl.hp - i * 20) / 20, 0, 1); txt("♥", 12 + i * 15, 46, 14, "#3f0d12"); if (f > 0) { cx.globalAlpha = 0.35 + f * 0.65; txt("♥", 12 + i * 15, 46, 14, "#ef4444"); cx.globalAlpha = 1; } }
    if (pl.armor > 0) { rect(10, 52, 72, 4, "#1e293b"); rect(10, 52, 72 * pl.armor / 100, 4, "#3b82f6"); }
    const stars = Math.floor(pl.wanted), flash = stars && pl.hidden < 1 && Math.floor(g.t * 5) % 2;
    for (let i = 0; i < 5; i++) txt("★", W - 18 - i * 17, 26, 17, i < stars ? (flash ? "#fef08a" : "#facc15") : "rgba(255,255,255,.18)", "center");
    if (stars && pl.hidden > 2) txt("out of sight...", W - 10, 42, 9, "#93c5fd", "right");
    const w = pl.car && pl.car.ty.fly ? "GUN+MISSILE" : pl.car && pl.car.t === "tank" ? "CANNON" : WP[WO[pl.wi]].name, ammo = pl.car && (pl.car.t === "tank" || pl.car.ty.fly) ? "∞" : WO[pl.wi] === "fist" ? "" : String(pl.ammo[WO[pl.wi]]);
    rect(6, H - 36, 128, 30, "rgba(0,0,0,.5)"); txt(w, 12, H - 22, 11, "#e5e7eb"); txt(ammo, 12, H - 10, 11, "#fde047");
    if (pl.car) { txt(pl.car.ty.name, 130, H - 22, 9, "#94a3b8", "right"); rect(70, H - 15, 58, 4, "#1e293b"); rect(70, H - 15, 58 * clamp(pl.car.hp / pl.car.ty.hp, 0, 1), 4, pl.car.hp > pl.car.ty.hp * 0.35 ? "#22c55e" : "#ef4444"); }
    const RS = 78, rx = W - RS - 8, ry = H - RS - 8, sc = 4.2, img = MT * sc;
    cx.save(); cx.beginPath(); cx.rect(rx, ry, RS, RS); cx.clip();
    rect(rx, ry, RS, RS, "#0b1020");
    cx.imageSmoothingEnabled = false; cx.globalAlpha = 0.9;
    cx.drawImage(CITY_RADAR, rx + RS / 2 - pl.x / T * sc, ry + RS / 2 - pl.y / T * sc, img, img); cx.globalAlpha = 1;
    const dot = (o, c, r = 2.2) => circ(clamp(rx + RS / 2 + (o.x - pl.x) / T * sc, rx + 3, rx + RS - 3), clamp(ry + RS / 2 + (o.y - pl.y) / T * sc, ry + 3, ry + RS - 3), r, c);
    if (!g.mission) dot(booths[g.ring], Math.floor(g.t * 4) % 2 ? "#fde047" : "#a16207", 3);
    else if (g.mission.target) dot(g.mission.target, "#22d3ee", 3);
    for (const c of cars) if (c.t === "police" && c.drv && Math.abs(c.x - pl.x) < 700 && Math.abs(c.y - pl.y) < 700) dot(c, Math.floor(g.t * 8) % 2 ? "#ef4444" : "#3b82f6", 1.8);
    if (g.net) for (const r of g.remote.values()) if (!r.dead && performance.now() - r.t < 3000) dot(r, r.shirt || "#fff", 3);
    cx.save(); cx.translate(rx + RS / 2, ry + RS / 2); cx.rotate(pl.a); cx.fillStyle = "#fff"; cx.beginPath(); cx.moveTo(5, 0); cx.lineTo(-3.5, -3.5); cx.lineTo(-3.5, 3.5); cx.closePath(); cx.fill(); cx.restore();
    cx.restore();
    cx.strokeStyle = "#475569"; cx.lineWidth = 1; cx.strokeRect(rx, ry, RS, RS);
    const m = g.mission;
    if (m) {
      rect(W / 2 - 120, 4, 240, 30, "rgba(0,0,0,.55)");
      txt(m.kind === "demolition" ? `${m.text}: ${m.n}/${m.need}` : m.text, W / 2, 17, 10, "#e5e7eb", "center");
      txt(`${Math.max(0, Math.ceil(m.t))} s`, W / 2, 30, 11, m.t < 10 ? "#ef4444" : "#fde047", "center");
      const tg = m.target || (m.kind === "escape" ? null : null);
      if (tg) {
        const a = Math.atan2(tg.y - pl.y, tg.x - pl.x), d = Math.hypot(tg.x - pl.x, tg.y - pl.y);
        if (d > 90) { cx.save(); cx.translate(W / 2 + Math.cos(a) * 70, H / 2 + Math.sin(a) * 70); cx.rotate(a); cx.fillStyle = "#22d3ee"; cx.beginPath(); cx.moveTo(12, 0); cx.lineTo(-6, -8); cx.lineTo(-2, 0); cx.lineTo(-6, 8); cx.closePath(); cx.fill(); cx.restore(); txt(`${Math.round(d / 8)} m`, W / 2 + Math.cos(a) * 92, H / 2 + Math.sin(a) * 92 + 4, 9, "#22d3ee", "center"); }
      }
    } else if (pl.dead <= 0 && dist(pl, booths[g.ring]) > 120) txt("☎ a phone is ringing (yellow on the radar)", W / 2, 16, 10, "#fde047", "center");
    g.toasts.forEach((t, i) => { cx.globalAlpha = clamp(t.t, 0, 1); txt(t.s, 10, 74 + i * 14, 11, t.c); }); cx.globalAlpha = 1;
    if (g.big) {
      const a = clamp(g.big.t * 2, 0, 1); cx.globalAlpha = a;
      txt(g.big.s, W / 2 + 2, H / 2 - 18, 34, "#111", "center"); txt(g.big.s, W / 2, H / 2 - 20, 34, g.big.c, "center");
      if (g.big.sub) txt(g.big.sub, W / 2, H / 2 + 4, 12, "#f8fafc", "center");
      cx.globalAlpha = 1;
    }
  }
  for (let n = 0; n < 18; n++) { const s = roadSpot(90, 650); if (s) mkCar(Math.random() < 0.6 ? "sedan" : any(["taxi", "van", "sport"]), s.x, s.y, s.a, { drv: "ai", ai: s.ai }); }
  for (let n = 0; n < 160 && peds.length < 40; n++) { const x = pl.x + rnd(-520, 520), y = pl.y + rnd(-420, 420), t = tileAt(x, y); if ((t === WALK || t === GRASS) && Math.hypot(x - pl.x, y - pl.y) > 40) mkPed(x, y); }
  g.joinNet = (o) => {
    const slot = Math.max(0, o.players.findIndex((q) => q.id === o.me));
    g.net = o; g.remote = new Map(); g.shotQ = []; pl.shirt = ["#f97316", "#ec4899", "#84cc16", "#eab308"][slot % 4];
    pl.x += (slot % 2) * 26; pl.y += Math.floor(slot / 2) * 26;
  };
  g.netState = (from, m) => {
    if (m.x === undefined) return;
    g.remote.set(from, { x: m.x, y: m.y, a: m.a, car: m.car, dead: m.dead, shirt: m.shirt, money: m.money, t: performance.now(), walkT: (g.remote.get(from) || {}).walkT || 0 });
    for (const [x, y, a, kind, dmg, nk] of m.sh || []) shoot(null, x, y, a, kind, dmg, "net", !!nk);
  };
  g.netOut = () => ({ x: Math.round(pl.x), y: Math.round(pl.y), a: Math.round(pl.a * 100) / 100, dead: pl.dead > 0, shirt: pl.shirt, money: pl.money, score: g.score,
    car: pl.car ? { t: pl.car.t, col: pl.car.col, sp: Math.round(Math.hypot(pl.car.vx, pl.car.vy)) } : null, sh: g.shotQ.splice(0) });
  const ghost = (r) => { const ty = VT[r.car.t]; return { t: r.car.t, ty, x: r.x, y: r.y, a: r.a, vx: r.car.sp || 0, vy: 0, col: r.car.col, hp: ty.hp, wreck: 0, siren: r.car.t === "police", ctl: { thr: 1 } }; };
  function drawRemote(air) {
    for (const [id, r] of g.remote) {
      if (performance.now() - r.t > 3000 || r.dead) continue;
      const fly = r.car && VT[r.car.t] && VT[r.car.t].fly;
      if (air !== !!fly) continue;
      if (r.car && VT[r.car.t]) { const c = ghost(r); fly ? drawJet(c) : drawCar(c); }
      else { r.walkT += 0.25; drawPed({ x: r.x, y: r.y, a: r.a, skin: "#c68642", shirt: r.shirt || "#e5e7eb", walkT: r.walkT }); }
      txt(g.net.name(id), r.x, r.y - (r.car ? 22 : 10), 9, "#fde047", "center");
    }
  }
  g.debug = { pl, cars, peds, map, MT, T, builds, booths, get mission() { return g.mission; }, startMission, crime };
  return g;
}
