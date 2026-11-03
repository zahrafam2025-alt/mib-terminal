"use strict";
const SPA_XY = [-254,802,-367,999,-369,1007,-364,1015,-353,1019,-341,1016,-304,997,-213,954,-170,927,-124,894,-84,860,-51,825,122,620,134,608,155,595,193,571,209,555,223,533,232,513,237,491,242,450,245,435,250,422,260,404,346,268,400,182,415,149,425,125,436,87,505,-150,610,-510,634,-597,635,-611,633,-627,624,-639,612,-650,597,-658,587,-667,581,-677,576,-693,577,-708,598,-802,597,-818,594,-832,583,-849,569,-860,330,-1024,315,-1030,300,-1030,284,-1026,271,-1016,262,-1003,258,-989,257,-975,262,-961,270,-947,282,-937,387,-873,398,-862,404,-850,407,-837,406,-820,362,-694,349,-642,318,-483,303,-392,300,-377,292,-360,282,-346,267,-332,250,-321,232,-313,213,-310,150,-306,126,-309,104,-315,82,-324,64,-336,43,-356,30,-375,15,-403,-44,-550,-97,-680,-108,-701,-122,-715,-140,-725,-159,-730,-176,-731,-193,-727,-208,-720,-232,-705,-248,-698,-267,-695,-287,-697,-304,-703,-319,-713,-329,-725,-341,-741,-438,-892,-447,-901,-459,-908,-473,-911,-489,-910,-503,-903,-569,-856,-607,-828,-617,-815,-627,-800,-633,-786,-637,-768,-638,-751,-635,-729,-628,-711,-620,-688,-607,-652,-584,-612,-559,-577,-521,-535,-458,-474,-421,-445,-390,-427,-228,-343,-204,-329,-182,-311,-162,-292,-144,-271,-128,-249,-106,-209,-88,-171,-48,-82,-41,-62,-37,-42,-36,-15,-40,8,-64,69,-90,136,-121,220,-129,251,-137,288,-142,323,-144,352,-154,487,-152,496,-147,502,-138,504,-124,502,-109,502,-99,504,-92,511,-91,520,-95,531,-147,614];
const SPA_TURNS = [["LA SOURCE", 170, 310, 1], ["EAU ROUGE", 860, 940, 1.15], ["RAIDILLON", 940, 1180, 1.1], ["KEMMEL STRAIGHT", 1200, 2150, 1],
  ["LES COMBES", 2190, 2410, 1.25], ["MALMEDY", 2430, 2560, 1.2], ["RIVAGE", 2780, 3010, 1.55], ["POUHON", 3570, 3995, 1], ["FAGNES", 4240, 4590, 1.15],
  ["PAUL FRERE", 4700, 4860, 1.1], ["STAVELOT", 4900, 5090, 1.2], ["BLANCHIMONT", 5600, 6090, 1], ["BUS STOP", 6480, 6690, 1]];
const SPA_ELEV = [[0, 0], [250, 3], [900, -22], [1160, 14], [2200, 42], [2500, 34], [2900, 14], [3700, -14], [4400, -30], [4800, -44],
  [5400, -34], [5900, -18], [6550, -3], [6954, 0]];
let SPA = null;
function spaTrack(N = 2100) {
  const P = []; for (let i = 0; i < SPA_XY.length; i += 2) P.push([SPA_XY[i], SPA_XY[i + 1]]);
  const n = P.length, cum = [0];
  for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; cum.push(cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const step = cum[n] / N; let R = [], j = 0;
  for (let k = 0; k < N; k++) {
    const s = k * step; while (cum[j + 1] < s) j++;
    const a = P[j], b = P[(j + 1) % n], t = (s - cum[j]) / (cum[j + 1] - cum[j]);
    R.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  for (let pass = 0; pass < 3; pass++) R = R.map((p, i) => { const a = R[(i + N - 1) % N], b = R[(i + 1) % N]; return [(a[0] + 2 * p[0] + b[0]) / 4, (a[1] + 2 * p[1] + b[1]) / 4]; });
  const hd = R.map((p, i) => { const q = R[(i + 1) % N]; return Math.atan2(q[1] - p[1], q[0] - p[0]); });
  let dth = hd.map((h, i) => { const d = hd[(i + 1) % N] - h; return -((((d + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI); });
  const SIG = 5, KW = 15, ker = []; for (let k = -KW; k <= KW; k++) ker.push(Math.exp(-k * k / (2 * SIG * SIG)));
  const ks = ker.reduce((a, b) => a + b, 0);
  dth = dth.map((_, i) => { let s = 0; for (let k = -KW; k <= KW; k++) s += dth[(i + k + N) % N] * ker[k + KW]; return s / ks; });
  const turn = new Array(N).fill(-1), mult = new Array(N).fill(1);
  SPA_TURNS.forEach(([, a, b, m], t) => { for (let i = Math.floor(a / step); i < Math.min(N, Math.ceil(b / step)); i++) { turn[i] = t; mult[i] = m; } });
  const ease = (a, b, p) => a + (b - a) * (0.5 - Math.cos(p * Math.PI) / 2);
  const elev = R.map((_, i) => {
    const m = i * step; let k = 0; while (k < SPA_ELEV.length - 2 && SPA_ELEV[k + 1][0] < m) k++;
    const [m0, e0] = SPA_ELEV[k], [m1, e1] = SPA_ELEV[k + 1]; return ease(e0, e1, clamp((m - m0) / (m1 - m0), 0, 1));
  });
  return { N, step, xy: R, curve: dth.map((d, i) => 110 * d * mult[i]), elev, turn };
}

function Racer(two = false, online = null) {
  const T = SPA || (SPA = spaTrack()), N = T.N, SEG = 200, LEN = N * SEG, ROAD = 2000, CAMH = 1000, DEPTH = 1 / Math.tan(50 * Math.PI / 180), PZ = CAMH * DEPTH;
  const DRAW = 150, MIRROR = 70, LAPS = 3, MAX = SEG / STEP, ACC = MAX / 4.2, BRAKE = MAX * 1.15, DEC = MAX / 5, OFF_DEC = MAX / 1.6, OFF_LIM = MAX / 4;
  const CW = 0.2, CL = 900, YS = SEG / T.step * 1.8;
  const K = SEG / 110;
  const rain = online ? online.rain : Math.random() < 0.25, CENT = rain ? 0.36 : 0.3;
  const YMAX = MAX * 1.08 / (110 * CENT * SEG);
  const DIFF = [{ name: "ROOKIE", top: [0.86, 0.91], corner: 0.86 }, { name: "PRO", top: [0.955, 0.99], corner: 0.95 }, { name: "LEGEND", top: [0.99, 1.02], corner: 1.0 }];
  let diff = 1; try { const d = parseInt(localStorage.getItem("arcade-gp-diff"), 10); if (d >= 0 && d <= 2) diff = d; } catch (e) {}
  const wrap = (d) => (d > LEN / 2 ? d - LEN : d < -LEN / 2 ? d + LEN : d), segIdx = (z) => Math.floor(((z % LEN) + LEN) % LEN / SEG) % N;

  const segs = T.curve.map((c, i) => ({ i, curve: c, y1: T.elev[i] * YS, y2: T.elev[(i + 1) % N] * YS, dark: Math.floor(i / 3) % 2, kerb: false, spr: [], p1: {}, p2: {}, clip: 0, vis: false }));
  segs.forEach((s, i) => { for (let k = -5; k <= 5 && !s.kerb; k++) if (Math.abs(segs[(i + k + N) % N].curve) > 2.4) s.kerb = true; });
  let seed = 11; const srnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const TL = N * T.step, atM = (m) => Math.floor((((m % TL) + TL) % TL) / T.step) % N;
  const STANDS = [[6780, 6950, -1], [0, 140, -1], [180, 330, -1], [870, 1010, 1], [6470, 6700, -1], [2780, 2900, -1]];
  const standAt = (i, side) => STANDS.some(([a, b, s]) => s === side && i >= atM(a) && i <= atM(b));
  segs.forEach((s, i) => {
    [-1, 1].forEach((side) => {
      if (standAt(i, side)) { if (i % 6 === 0) s.spr.push({ k: "stand", x: side * 2.35, c: Math.floor(srnd() * 4) }); return; }
      if (i % 3 === 0 && srnd() < 0.8) s.spr.push({ k: "tree", x: side * (1.8 + srnd() * 3.4), h: 0.75 + srnd() * 0.6, c: ["#14532d", "#166534", "#1a4d2e"][Math.floor(srnd() * 3)] });
    });
    const m = i * T.step;
    if (((m > 1300 && m < 2100) || (m > 5650 && m < 6400)) && i % 40 === 0) s.spr.push({ k: "ad", x: (i / 40) % 2 ? 1.3 : -1.3, w: (i / 40) % 3 ? "MIB" : "MoonxZara" });
  });
  ["LA SOURCE", "LES COMBES", "RIVAGE", "PAUL FRERE", "BUS STOP"].forEach((name) => {
    const t = SPA_TURNS.find((x) => x[0] === name);
    [3, 2, 1].forEach((n) => segs[atM(t[1] - n * 100)].spr.push({ k: "board", x: 1.32, n: String(n) }));
  });
  segs[0].spr.push({ k: "gantry", x: 0 });
  const elevAt = (z) => { const s = segs[segIdx(z)], f = (((z % SEG) + SEG) % SEG) / SEG; return s.y1 + (s.y2 - s.y1) * f; };

  const KEYS = two ? [{ up: ["KeyW"], down: ["KeyS"], left: ["KeyA"], right: ["KeyD"], turbo: ["KeyF", "Space"] },
                      { up: ["ArrowUp"], down: ["ArrowDown"], left: ["ArrowLeft"], right: ["ArrowRight"], turbo: ["Enter", "Slash", "ShiftRight"] }]
                   : [{ up: ["ArrowUp", "KeyW"], down: ["ArrowDown", "KeyS"], left: ["ArrowLeft", "KeyA"], right: ["ArrowRight", "KeyD"], turbo: ["Space"] }];
  const base = () => ({ z: 0, x: 0, vx: 0, h: 0, speed: 0, lap: 0, lapT: 0, bestLap: 0, turbo: 1, place: 0, done: false, finishT: 0, finishPlace: 0, bumpT: 0, tow: false });
  const NETC = ["#8b5cf6", "#ef4444", "#22c55e", "#f59e0b"];
  const meName = online ? (online.players.find((q) => q.id === online.me) || {}).name || "YOU" : "";
  const P = KEYS.map((k, i) => Object.assign(base(), { me: true, n: i + 1, k, name: online ? meName : two ? (i ? "BLUE" : "RED") : "MoonxZara", code: online ? meName.slice(0, 3).toUpperCase() : two ? (i ? "BLU" : "RED") : "MXZ",
    c: online ? NETC[online.players.findIndex((q) => q.id === online.me) % 4] : two ? (i ? "#2563eb" : "#dc2626") : "#8b5cf6", shake: 0, msg: "", msgT: 0, gear: 1, rpm: 4200, thr: 0, sky: 0, st: 0, turnT: 0, turnName: "", lastTurn: -1, lastPlace: 0, slide: 0 }));
  const AIC = ["#1e40af", "#dc2626", "#ef4444", "#f97316", "#14b8a6", "#15803d", "#fb923c"];
  const AIN = [["Max Verst.", "VER"], ["Lewis Ham.", "HAM"], ["Charles Lec.", "LEC"], ["Lando Nor.", "NOR"], ["George Rus.", "RUS"], ["Fernando Alo.", "ALO"], ["Oscar Pia.", "PIA"]];
  const AI = online ? [] : AIC.slice(0, two ? 6 : 7).map((c, i) => Object.assign(base(), { ai: true, c, name: AIN[i][0], code: AIN[i][1], top: 1, react: rnd(0.15, 0.5), tx: 0, defT: 0, defX: 0, boost: false }));
  const RP = online ? online.players.filter((q) => q.id !== online.me).map((q) => Object.assign(base(), { remote: true, id: q.id, name: q.name, code: q.name.slice(0, 3).toUpperCase(),
    c: NETC[online.players.findIndex((x) => x.id === q.id) % 4], shake: 0, msg: "", msgT: 0, gear: 1, rpm: 4200, thr: 0, sky: 0, st: 0, turnT: 0, turnName: "", lastTurn: -1, lastPlace: 0, slide: 0, net: null })) : [];
  const all = online ? online.players.map((q) => (q.id === online.me ? P[0] : RP.find((r) => r.id === q.id))) : AI.concat(P);
  let FIELD = all.length, split = !!online && all.length > 1;
  all.forEach((c, k) => { c.z = LEN - (3 + Math.floor(k / 2) * 6 + (k % 2) * 3) * SEG; c.x = c.tx = k % 2 ? 0.42 : -0.42; c.place = k + 1; });
  let VAI = [], LINE = [];
  function setDiff(d) {
    diff = d; try { localStorage.setItem("arcade-gp-diff", String(d)); } catch (e) {}
    const [lo, hi] = DIFF[d].top;
    AI.forEach((c, i) => { c.top = hi - (hi - lo) * i / Math.max(1, AI.length - 1); });
    VAI = segs.map((s) => Math.min(MAX * 1.3, MAX / Math.max(1e-6, Math.abs(s.curve) * CENT) * DIFF[d].corner));
    for (let pass = 0; pass < 2; pass++) for (let i = N - 1; i >= 0; i--) VAI[i] = Math.min(VAI[i], Math.sqrt(VAI[(i + 1) % N] ** 2 + 2 * BRAKE * 0.85 * SEG));
  }
  LINE = segs.map((_, i) => { let ahead = 0, here = 0; for (let k = 10; k < 40; k++) ahead += segs[(i + k) % N].curve; for (let k = -6; k < 6; k++) here += segs[(i + k + N) % N].curve; return 0.7 * Math.tanh(here * 0.02 - ahead * 0.006); });
  LINE = LINE.map((_, i) => { let s = 0; for (let k = -8; k <= 8; k++) s += LINE[(i + k + N) % N]; return s / 17; });
  setDiff(diff);

  const g = { id: two ? "racer2" : "spa", race: true, score: 0, over: false, t: 0, lights: 0, lightsT: 0, goAt: online ? 0.8 : rnd(0.3, 1.4), go: false, outT: 0, result: null, firstDone: 0, finishers: 0, P,
              help: two ? "RED (top): W A S D, F turbo  |  BLUE (bottom): arrows, Enter turbo  ·  3 laps of Spa · brake for the corners · first over the line wins · Esc menu"
                        : "↑ throttle · ↓ brake · ← → steer · Space ERS boost · 3 laps of Spa from the back · brake before La Source, Rivage and the Bus Stop · 1 2 3 on the grid: difficulty · Esc menu" };

  const GEARS = [0, 0.16, 0.29, 0.42, 0.55, 0.68, 0.83, 1.0], LIGHT_S = 0.7;
  function revs(p, dt, thr) {
    let want;
    if (!g.go) want = thr ? 17600 : 4200;
    else {
      const pct = p.speed / MAX;
      if (pct > GEARS[p.gear] * 0.985 && p.gear < 7) { p.gear++; SHIFT(); }
      else if (p.gear > 1 && pct < GEARS[p.gear - 1] * 0.75) { p.gear--; SHIFT(); p.rpm += 2500; }
      want = 4800 + Math.min(1.08, pct / GEARS[p.gear]) * 13400;
    }
    p.rpm += clamp(want - p.rpm, -26000 * dt, 34000 * dt);
    if (p.rpm > 18000) p.rpm = 17600 + Math.random() * 500;
    if (p.thr && !thr && p.rpm > 12000) noise(0.05, 0.08, 2600);
    p.thr = thr;
  }
  function engineNote() { const lead = P.reduce((a, p) => (p.rpm > a.rpm ? p : a), P[0]); engineSet(true, lead.rpm, P.some((p) => p.thr) ? 1 : 0.2); }
  const say = (p, s, t = 0.9) => { if (p.me && p.msgT < 0) { p.msg = s; p.msgT = t; } };
  function hitFx(c, words, hard = true) {
    if (!c.me || c.bumpT > 0) return;
    c.bumpT = 0.35; c.shake = hard ? 0.3 : 0.12; SFX.bump(); say(c, pick(words), 0.8);
  }
  function advance(c, d) {
    c.z += d;
    while (c.z >= LEN) { c.z -= LEN; c.lap++; crossed(c); }
    while (c.z < 0) { c.z += LEN; c.lap--; }
  }
  function crossed(c) {
    if (c.done || c.lap < 1) return;
    if (c.lap === 1) { c.lapT = 0; return; }
    if (c.lapT > 10 && (!c.bestLap || c.lapT < c.bestLap)) c.bestLap = c.lapT;
    c.lapT = 0;
    if (c.lap > LAPS) { c.done = true; c.finishT = g.t; c.finishPlace = ++g.finishers; if (c.me) { say(c, `FINISHED P${c.finishPlace}!`, 4); if (!g.firstDone) g.firstDone = g.t; } }
    else if (c.me) { SFX.coin(); c.msgT = -1; say(c, c.lap === LAPS ? "FINAL LAP!" : `LAP ${c.lap}`, 1.4); }
  }
  function towed(c) {
    for (const o of all) { if (o === c) continue; const dz = wrap(o.z - c.z); if (dz > CL * 1.3 && dz < SEG * 22 && Math.abs(o.x - c.x) < 0.3) return true; }
    return false;
  }
  const accel = (v, top) => ACC * Math.max(0.2, 1 - 0.8 * Math.pow(Math.min(1, v / top), 3));
  function longit(c, dt, thr, brake, boost, top) {
    if (thr) c.speed += accel(c.speed, top) * (boost ? 1.8 : 1) * (c.tow ? 1.12 : 1) * dt;
    else if (brake) c.speed -= BRAKE * dt; else c.speed -= DEC * dt;
    if (c.speed > top) c.speed = Math.max(top, c.speed - DEC * 1.5 * dt);
    c.speed = Math.max(0, c.speed);
  }
  function edges(c, dt, seg) {
    const ax = Math.abs(c.x);
    if (ax > 1.15 && c.speed > OFF_LIM) { c.speed -= OFF_DEC * dt; if (c.me) c.shake = Math.max(c.shake, 0.06); }
    else if (ax > 1 && seg.kerb && c.me && c.speed > MAX * 0.3) c.shake = Math.max(c.shake, 0.03);
    if (ax > 2.5) { c.x = Math.sign(c.x) * 2.5; c.vx = -Math.sign(c.x) * 0.6; c.speed *= 0.55; c.h = (c.h || 0) * 0.2; hitFx(c, ["BARRIER!", "OUCH!", "THAT'S A BIG ONE!"]); }
  }
  function drive(p, dt) {
    p.msgT -= dt; p.shake = Math.max(0, p.shake - dt); p.turnT -= dt; p.bumpT -= dt;
    if (!p.done) p.lapT += dt;
    const i = segIdx(p.z), seg = segs[i], pct = p.speed / MAX, auto = p.done;
    const want = auto ? 0 : (held(...p.k.right) ? 1 : 0) - (held(...p.k.left) ? 1 : 0);
    p.st += (want - p.st) * Math.min(1, dt * 10);
    const road = seg.curve / 110 * p.speed / SEG;
    let yaw;
    if (auto) yaw = road + clamp((LINE[i] - p.x) * 1.2 - p.h * 2.5, -1, 1) * 0.6;
    else yaw = p.st * YMAX * Math.min(1, p.speed / (MAX * 0.06));
    p.h = clamp(p.h + (yaw - road) * dt, -0.9, 0.9);
    p.x += Math.sin(p.h) * p.speed * dt / ROAD + p.vx * dt; p.vx *= Math.exp(-6 * dt);
    p.sky += yaw * dt;
    if (!auto && Math.abs(p.st) > 0.6 && pct > 0.3) p.speed -= Math.abs(p.st) * pct * MAX * 0.05 * dt;
    p.slide = 0;
    if (!auto) {
      p.warn = null;
      for (let k = 2; k < 62; k++) { const c = segs[(i + k) % N].curve; if (Math.abs(c) > 2) {
        const lim = MAX / (Math.abs(c) * CENT) * 1.08, need = p.speed > lim && p.speed * p.speed - lim * lim > 2 * BRAKE * 0.8 * (k * SEG);
        p.warn = { dir: Math.sign(c), k, brake: need }; break; } }
    }
    const boost = !auto && held(...p.k.turbo) && p.turbo > 0.02;
    p.turbo = clamp(p.turbo + (boost ? -0.45 : 0.08) * dt, 0, 1);
    p.tow = towed(p);
    const top = MAX * (boost ? 1.18 : auto ? 0.55 : 1) * (p.tow ? 1.045 : 1);
    const thr = auto ? (p.speed < top ? 1 : 0) : held(...p.k.up) || boost ? 1 : 0;
    longit(p, dt, thr, !auto && held(...p.k.down), boost, top);
    edges(p, dt, seg);
    advance(p, p.speed * dt);
    if (seg.turn >= 0 && seg.turn !== p.lastTurn) { p.turnName = SPA_TURNS[seg.turn][0]; p.turnT = 1.8; }
    p.lastTurn = seg.turn;
    revs(p, dt, thr);
  }
  function aiDrive(c, dt) {
    c.bumpT -= dt; c.defT -= dt;
    if (g.t < c.react) return;
    if (!c.done) c.lapT += dt;
    const i = segIdx(c.z), seg = segs[i], pct = c.speed / MAX;
    c.tow = towed(c);
    let target = Math.min(VAI[i], VAI[(i + 3) % N]), tx = LINE[i];
    for (const o of all) {
      if (o === c) continue;
      const dz = wrap(o.z - c.z), dx = o.x - c.x;
      if (dz > 0 && dz < SEG * 14 && Math.abs(dx) < 0.34 && o.speed < c.speed + 400) {
        tx = clamp(o.x > c.x ? o.x - 0.5 : o.x + 0.5, -0.85, 0.85);
        if (Math.abs(o.x) > 0.6) tx = clamp(o.x - Math.sign(o.x) * 0.5, -0.85, 0.85);
        if (dz < CL * 1.6 && Math.abs(dx) < CW * 1.15) target = Math.min(target, o.speed - 150);
      }
      if (Math.abs(dz) < CL * 1.2 && Math.abs(dx) < CW * 1.5) tx = c.x - Math.sign(dx || 1) * 0.3;
      if (o.me && diff > 0 && dz < 0 && dz > -SEG * 9 && o.speed > c.speed && c.defT < -1.5 && Math.abs(seg.curve) < 1.5) { c.defT = 1.2; c.defX = clamp(o.x, -0.7, 0.7); }
    }
    if (c.defT > 0) tx = c.defX;
    if (c.done) target = Math.min(target, MAX * 0.6);
    const straight = VAI[i] >= MAX * 1.29 && VAI[(i + 40) % N] >= MAX * 1.29;
    c.boost = !c.done && straight && c.turbo > (diff === 2 ? 0.25 : 0.45) && (c.tow || c.turbo > 0.9);
    c.turbo = clamp(c.turbo + (c.boost ? -0.45 : 0.08) * dt, 0, 1);
    const top = MAX * c.top * (c.boost ? 1.18 : 1) * (c.tow ? 1.045 : 1);
    target = Math.min(target, top);
    longit(c, dt, c.speed < target - 60 ? 1 : 0, c.speed > target + 60, c.boost, top);
    const rate = (0.35 + 0.8 * pct) * dt;
    c.tx = tx; c.x += clamp(tx - c.x, -rate, rate) + c.vx * dt; c.vx *= Math.exp(-5 * dt);
    edges(c, dt, seg);
    advance(c, c.speed * dt);
  }
  function contacts() {
    for (let a = 0; a < all.length; a++) for (let b = a + 1; b < all.length; b++) {
      const A = all[a], B = all[b], dz = wrap(B.z - A.z), dx = B.x - A.x;
      if (Math.abs(dz) >= CL || Math.abs(dx) >= CW) continue;
      if ((CL - Math.abs(dz)) / CL < (CW - Math.abs(dx)) / CW) {
        const front = dz > 0 ? B : A, back = front === B ? A : B, push = CL - Math.abs(dz);
        advance(back, -push * 0.6); advance(front, push * 0.4);
        const rel = back.speed - front.speed;
        if (rel > 0) { back.speed -= rel * 0.75; front.speed += rel * 0.25; }
        if (!back.touch) back.vx += (back.x < front.x ? -1 : 1) * (back.me ? 0.06 : 0.2);
        back.touch = front.touch = 0.25;
        hitFx(back, ["BUMP!", "OOPS!", "SORRY NOT SORRY!", "RUBBING IS RACING!"], rel > 1500); hitFx(front, ["HEY!", "TAPPED!", "WATCH IT!"], rel > 1500);
      } else {
        const s = Math.sign(dx) || 1, push = CW - Math.abs(dx), wa = A.me ? 0.2 : B.me ? 0.8 : 0.5;
        A.x -= s * push * wa; B.x += s * push * (1 - wa);
        if (!A.touch || !B.touch) { A.vx -= s * (A.me ? 0.08 : 0.3); B.vx += s * (B.me ? 0.08 : 0.3); }
        A.touch = B.touch = 0.25; A.speed *= 0.998; B.speed *= 0.998;
        hitFx(A, ["WHEEL TO WHEEL!", "SIDE BY SIDE!"], false); hitFx(B, ["WHEEL TO WHEEL!", "SIDE BY SIDE!"], false);
      }
    }
  }
  let order = all.slice();
  function standings() {
    const prog = (c) => (c.done ? 1e12 - c.finishPlace : c.lap * LEN + c.z);
    order = all.slice().sort((a, b) => prog(b) - prog(a));
    order.forEach((c, k) => { c.place = k + 1; });
    P.forEach((p) => {
      if (g.t > 3 && p.lastPlace && p.place < p.lastPlace && !p.done) { const by = order[p.place]; say(p, by && by.ai ? `P${p.place}! PASSED ${by.name.toUpperCase()}` : `P${p.place}!`, 1.1); }
      p.lastPlace = p.place;
    });
  }
  g.update = (dt) => {
    g.lightsT += dt;
    if (!g.go) {
      if (!two) { const d = pressed("Digit1", "Numpad1") ? 0 : pressed("Digit2", "Numpad2") ? 1 : pressed("Digit3", "Numpad3") ? 2 : -1; if (d >= 0 && d !== diff) { setDiff(d); SFX.move(); } }
      const want = Math.min(5, Math.floor(g.lightsT / LIGHT_S));
      if (want > g.lights) { g.lights = want; tone(880, 0.22, "square", 0.07); }
      if (g.lights === 5 && g.lightsT > 5 * LIGHT_S + g.goAt) { g.go = true; g.lights = 0; g.outT = 1.4; P.forEach((p) => { p.msg = two ? "GO GO GO!" : "LIGHTS OUT AND AWAY WE GO!"; p.msgT = 1.6; }); }
      P.forEach((p) => revs(p, dt, held(...p.k.up) ? 1 : 0)); engineNote();
      return;
    }
    g.outT -= dt; g.t += dt;
    if (online) { onlineStep(dt); return; }
    P.forEach((p) => drive(p, dt));
    AI.forEach((c) => aiDrive(c, dt));
    all.forEach((c) => { c.touch = Math.max(0, (c.touch || 0) - dt); });
    contacts(); standings(); engineNote();
    if (P.every((p) => p.done) && g.t - Math.max(...P.map((p) => p.finishT)) > 2.5) finish();
    else if (two && g.firstDone && g.t - g.firstDone > 30) finish();
  };
  let sendT = 0;
  g.netState = (id, m) => { const r = RP.find((x) => x.id === id); if (r) r.net = m; };
  g.addRemote = (q) => {
    if (RP.some((r) => r.id === q.id) || all.length >= 4) return;
    const k = all.length, r = Object.assign(base(), { remote: true, id: q.id, name: q.name, code: q.name.slice(0, 3).toUpperCase(), c: NETC[k % 4], shake: 0, msg: "", msgT: 0, gear: 1, rpm: 4200, thr: 0, sky: 0, st: 0, turnT: 0, turnName: "", lastTurn: -1, lastPlace: 0, slide: 0, net: null });
    r.z = LEN - 3 * SEG; r.x = 0;
    RP.push(r); all.push(r); FIELD = all.length; split = true; standings();
  };
  function onlineStep(dt) {
    const me = P[0];
    drive(me, dt);
    for (const r of RP) {
      const m = r.net; if (!m) continue;
      const dz = wrap(m.z - r.z);
      if (Math.abs(dz) > SEG * 40) { r.z = m.z; r.x = m.x; } else { r.z = (r.z + dz * Math.min(1, dt * 12) + LEN) % LEN; r.x += (m.x - r.x) * Math.min(1, dt * 12); }
      Object.assign(r, { h: m.h, speed: m.speed, lap: m.lap, lapT: m.lapT, st: m.st, sky: m.sky, bestLap: m.bestLap, turbo: m.turbo, gear: m.gear, rpm: m.rpm });
      if (m.done && !r.done) { r.done = true; r.finishT = g.t; r.finishPlace = ++g.finishers; if (!g.firstDone) g.firstDone = g.t; }
    }
    for (const r of RP) {
      const dz = wrap(r.z - me.z), dx = r.x - me.x;
      if (Math.abs(dz) >= CL || Math.abs(dx) >= CW) continue;
      if ((CL - Math.abs(dz)) / CL < (CW - Math.abs(dx)) / CW) {
        if (dz > 0 && me.speed > r.speed) { me.speed = r.speed * 0.97; advance(me, -(CL - dz) * 0.5); hitFx(me, ["BUMP!", "RUBBING IS RACING!"], false); }
      } else { me.x -= Math.sign(dx || 1) * (CW - Math.abs(dx)) * 0.6; hitFx(me, ["WHEEL TO WHEEL!", "SIDE BY SIDE!"], false); }
    }
    standings(); engineNote();
    sendT -= dt;
    if (sendT <= 0) { sendT = 0.05; const r2 = (v) => (typeof v === "number" ? Math.round(v * 100) / 100 : v);
      online.send({ z: r2(me.z), x: r2(me.x), h: r2(me.h), speed: r2(me.speed), lap: me.lap, lapT: r2(me.lapT), st: r2(me.st), sky: r2(me.sky), bestLap: r2(me.bestLap), turbo: r2(me.turbo), gear: me.gear, rpm: Math.round(me.rpm), done: me.done }); }
    if (all.every((c) => c.done) && g.t - Math.max(...all.map((c) => c.finishT)) > 2.5) finish();
    else if (me.done && g.firstDone && g.t - g.firstDone > 45) finish();
  }
  function finish() {
    g.over = true; engineSet(false);
    if (online) {
      const p = P[0], ord = all.slice().sort((a, b) => (a.done === b.done ? (a.done ? a.finishPlace - b.finishPlace : b.lap * LEN + b.z - a.lap * LEN - a.z) : a.done ? -1 : 1));
      g.result = [`${ord[0].name.toUpperCase()} WINS!`, ord.map((c, i) => `${i + 1}. ${c.name}${c.bestLap ? " " + c.bestLap.toFixed(2) + " s" : ""}`).join("   ")];
      if (p.bestLap) record("spa", "lap_ms", Math.round(p.bestLap * 1000));
      if (ord[0] === p) SFX.win(); else SFX.over();
      return;
    }
    if (!two) {
      const p = P[0], pts = [25, 18, 15, 12, 10, 8, 6, 4][p.finishPlace - 1] || 0;
      g.score = pts * 100 + Math.max(0, 400 - Math.round(p.finishT)) + (pts ? [0, 300, 700][diff] : 0);
      const ahead = order.find((c) => c.done && c.finishPlace === 1);
      g.result = [p.finishPlace === 1 ? "MoonxZara WINS AT SPA!" : `P${p.finishPlace}  ${p.finishPlace <= 3 ? "PODIUM!" : "points: " + pts}${ahead && ahead !== p ? " · " + ahead.name + " wins" : ""}`,
                  `${DIFF[diff].name} · ${p.finishT.toFixed(1)} s · best lap ${p.bestLap ? p.bestLap.toFixed(2) + " s" : "–"}`];
      if (p.bestLap) record("spa", "lap_ms", Math.round(p.bestLap * 1000));
      if (p.finishPlace === 1) SFX.win(); else SFX.over();
      return;
    }
    const ord = P.slice().sort((a, b) => (a.done === b.done ? (a.done ? a.finishT - b.finishT : b.lap * LEN + b.z - a.lap * LEN - a.z) : a.done ? -1 : 1));
    const win = ord[0];
    g.result = [`${win.name} WINS THE DUEL!`, ...P.map((p) => `${p.name}: ${p.done ? "P" + p.finishPlace : "did not finish"} · best lap ${p.bestLap ? p.bestLap.toFixed(2) + " s" : "–"}`)];
    record("duel", win.n === 1 ? "p1" : "p2", 1); SFX.win();
  }

  const r2 = (v) => Math.round(v * 2) / 2;
  function proj(pt, x, y, z, v) { const sc = DEPTH / z; pt.sc = sc; pt.X = r2(v.w / 2 + sc * x * v.fx); pt.Y = r2(v.hy - sc * y * v.fy); pt.Wd = r2(sc * ROAD * v.fx); }
  function quad(x1, y1, w1, x2, y2, w2, c) { cx.fillStyle = c; cx.beginPath(); cx.moveTo(x1 - w1, y1); cx.lineTo(x2 - w2, y2); cx.lineTo(x2 + w2, y2); cx.lineTo(x1 + w1, y1); cx.closePath(); cx.fill(); }
  const GRASS = rain ? ["#14532d", "#166534"] : ["#15803d", "#16a34a"], TAR = rain ? ["#3a3a40", "#3f3f46"] : ["#52525b", "#57575f"];
  function paint(s, a, b, f, v) {
    rect(-10, b.Y, v.w + 20, a.Y - b.Y, GRASS[s.dark]);
    if (s.kerb) quad(a.X, a.Y, a.Wd * 1.13, b.X, b.Y, b.Wd * 1.13, s.dark ? "#dc2626" : "#f8fafc");
    quad(a.X, a.Y, a.Wd * 1.035, b.X, b.Y, b.Wd * 1.035, "#e5e7eb");
    if (s.i < 2) for (let j = 0; j < 8; j++) { const o = -1 + (j + 0.5) / 4; quad(a.X + a.Wd * o, a.Y, a.Wd / 8, b.X + b.Wd * o, b.Y, b.Wd / 8, (j + s.i) % 2 ? "#fff" : "#111"); }
    else quad(a.X, a.Y, a.Wd, b.X, b.Y, b.Wd, TAR[s.dark]);
    const haze = f < 0.4 ? 0 : Math.pow((f - 0.4) / 0.6, 1.5);
    if (haze > 0) { cx.globalAlpha = Math.min(0.9, haze); rect(-10, b.Y, v.w + 20, a.Y - b.Y + 1, rain ? "#9ca3af" : "#8fbbe8"); cx.globalAlpha = 1; }
  }
  function sky(v, off, k) {
    const gr = cx.createLinearGradient(0, 0, 0, v.hy); gr.addColorStop(0, rain ? "#374151" : "#1e3a8a"); gr.addColorStop(1, rain ? "#9ca3af" : "#8fbbe8");
    cx.fillStyle = gr; cx.fillRect(-5, -5, v.w + 10, v.hy + 10); rect(-5, v.hy, v.w + 10, v.h - v.hy + 5, GRASS[0]);
    for (let i = 0; i < 10; i++) {
      const hx = ((i * 74 - off * 300) % 740 + 740) % 740 - 120;
      cx.fillStyle = i % 2 ? "#14532d" : "#1a5e35"; cx.beginPath(); cx.moveTo(hx, v.hy + 4 * k);
      cx.quadraticCurveTo(hx + 60, v.hy - (24 + (i % 3) * 10) * k, hx + 120, v.hy + 4 * k); cx.fill();
    }
  }
  function roadFwd(p, v) {
    const camZ = ((p.z - PZ) % LEN + LEN) % LEN, bi = Math.floor(camZ / SEG) % N, bp = (camZ % SEG) / SEG, camY = elevAt(p.z) + CAMH, cxo = -p.x * ROAD;
    const th = Math.tan(p.h || 0);
    let maxy = v.h, xo = 0, dxo = -(segs[bi].curve * bp) * K;
    for (let n = 0; n < DRAW; n++) {
      const s = segs[(bi + n) % N], z1 = (n - bp) * SEG;
      proj(s.p1, xo + cxo - (z1 - PZ) * th, s.y1 - camY, z1, v); proj(s.p2, xo + dxo + cxo - (z1 + SEG - PZ) * th, s.y2 - camY, z1 + SEG, v);
      xo += dxo; dxo += s.curve * K;
      s.clip = maxy; s.vis = z1 > 60;
      s.draw = z1 > DEPTH && s.p2.Y < s.p1.Y && s.p2.Y < maxy;
      if (s.draw) maxy = s.p2.Y;
    }
    return bi;
  }
  function roadBack(p, v) {
    const bi = segIdx(p.z), bp = (((p.z % SEG) + SEG) % SEG) / SEG, camY = elevAt(p.z) + CAMH * 0.55, cxo = -p.x * ROAD;
    let maxy = v.h, xo = 0, dxo = 0;
    for (let n = 0; n < MIRROR; n++) {
      const s = segs[(bi - n + N) % N], dF = (bp + n) * SEG, dN = dF - SEG;
      proj(s.p2, xo + cxo, s.y2 - camY, dN, v); proj(s.p1, xo + dxo + cxo, s.y1 - camY, dF, v);
      xo += dxo; dxo += s.curve * K;
      s.clip = maxy;
      s.draw = dN > DEPTH && s.p1.Y < s.p2.Y && s.p1.Y < maxy;
      if (s.draw) maxy = s.p1.Y;
    }
    return bi;
  }
  function f1(x, y, w, c, steer = 0, me = false, front = false) {
    const u = w / 20, b = (dx, dy, dw, dh, col) => rect(Math.round(x + dx * u), Math.round(y + dy * u), Math.ceil(dw * u), Math.ceil(dh * u), col);
    if (front) {
      b(-7.5, -15, 15, 2, c); b(-10, -12, 5, 6, "#111"); b(5, -12, 5, 6, "#111");
      b(-4, -12, 8, 8, c); b(-2.5, -13.5, 5, 3, me ? "#fde047" : "#e5e7eb"); b(-1.5, -5, 3, 4, c);
      b(-9.5, -6, 4.5, 5, "#111"); b(5, -6, 4.5, 5, "#111"); b(-9, -1.5, 18, 2, c);
      return;
    }
    b(-10, -9, 5, 6, "#111"); b(5, -9, 5, 6, "#111"); b(-7.5, -14, 15, 3, c); b(-1, -11, 2, 3, "#222");
    b(-4, -11, 8, 9, c); b(-3 + steer * 0.6, -13, 6, 3, me ? "#fde047" : "#e5e7eb"); b(-2.5, -2, 5, 2, c); b(-8, -2, 16, 2, c);
    b(-9, -5, 4, 4, "#111"); b(5, -5, 4, 4, "#111");
  }
  function sprite(sp, pt, v, clip) {
    const u = pt.sc * v.fx, x = pt.X + sp.x * ROAD * u, y = pt.Y;
    if (x < -300 || x > v.w + 300) return;
    const h0 = { tree: 2600, stand: 1000, board: 520, ad: 320, gantry: 1300 }[sp.k] * u;
    if (h0 < 1.2 || y - h0 * 1.4 > clip) return;
    if (sp.k === "tree") {
      const h = h0 * sp.h, w = h * 0.42;
      rect(x - w * 0.06, y - h * 0.2, w * 0.12, h * 0.2, "#3f2a1d"); cx.fillStyle = sp.c;
      [[0.15, 1, 0.5], [0.45, 0.78, 0.36]].forEach(([b0, t0, ww]) => { cx.beginPath(); cx.moveTo(x, y - h * t0); cx.lineTo(x - w * ww, y - h * b0); cx.lineTo(x + w * ww, y - h * b0); cx.closePath(); cx.fill(); });
    } else if (sp.k === "stand") {
      const w = h0 * 1.9, h = h0;
      rect(x - w / 2, y - h, w, h, "#475569"); rect(x - w / 2 - h * 0.05, y - h - h * 0.12, w + h * 0.1, h * 0.12, "#e2e8f0");
      const cols = [["#f87171", "#fde047", "#60a5fa"], ["#fb923c", "#f472b6", "#a3e635"], ["#fde047", "#f8fafc", "#f87171"], ["#60a5fa", "#fbbf24", "#e5e7eb"]][sp.c];
      for (let r = 0; r < 4; r++) rect(x - w / 2 + h * 0.05, y - h + h * (0.08 + r * 0.22), w - h * 0.1, h * 0.12, cols[r % 3]);
    } else if (sp.k === "board") {
      const w = h0 * 0.55;
      rect(x - h0 * 0.03, y - h0 * 0.5, h0 * 0.06, h0 * 0.5, "#9ca3af"); rect(x - w / 2, y - h0, w, h0 * 0.55, "#f8fafc");
      if (h0 > 9) txt(sp.n, x, y - h0 * 0.56, Math.round(h0 * 0.4), "#111", "center");
    } else if (sp.k === "ad") {
      const w = h0 * 4.2;
      const mz = sp.w === "MoonxZara";
      rect(x - w / 2, y - h0, w, h0, mz ? "#1f1027" : "#111827");
      if (h0 > 7) txt(sp.w, x, y - h0 * 0.22, Math.round(h0 * (mz ? 0.6 : 0.7)), mz ? "#f9a8d4" : "#a78bfa", "center");
    } else if (sp.k === "gantry") {
      const lx = pt.X - 1.25 * ROAD * u, rx = pt.X + 1.25 * ROAD * u, t = h0 * 0.12;
      rect(lx - t / 2, y - h0, t, h0, "#374151"); rect(rx - t / 2, y - h0, t, h0, "#374151"); rect(lx, y - h0, rx - lx, t * 1.6, "#1f2937");
      if (h0 > 14) txt("SPA-FRANCORCHAMPS", pt.X, y - h0 + t * 1.3, Math.round(t * 1.3), "#f8fafc", "center");
    }
  }
  function carAt(o, s, v, front) {
    const kk = (((o.z % SEG) + SEG) % SEG) / SEG, sc = s.p1.sc + (s.p2.sc - s.p1.sc) * kk;
    if (!(sc > 0)) return;
    const X = s.p1.X + (s.p2.X - s.p1.X) * kk + sc * o.x * ROAD * v.fx, Y = s.p1.Y + (s.p2.Y - s.p1.Y) * kk, w = sc * ROAD * v.fx * CW;
    if (w < 1.5 || Y - w > s.clip || X < -w || X > v.w + w) return;
    f1(X, Y, w, o.c, 0, !!o.me, front);
    if (rain && !front && o.speed > MAX * 0.3) { cx.globalAlpha = 0.28; cx.fillStyle = "#e5e7eb"; cx.beginPath(); cx.ellipse(X, Y - w * 0.3, w * 0.75, w * 0.45, 0, 0, 6.3); cx.fill(); cx.globalAlpha = 1; }
  }
  function things(p, v, bi) {
    const at = new Map();
    for (const o of all) if (o !== p) { const n = (segIdx(o.z) - bi + N) % N; if (n > 0 && n < DRAW) { if (!at.has(n)) at.set(n, []); at.get(n).push(o); } }
    for (let n = DRAW - 1; n >= 0; n--) {
      const s = segs[(bi + n) % N];
      if (s.draw) paint(s, s.p1, s.p2, n / DRAW, v);
      if (!n || !s.vis) continue;
      for (const sp of s.spr) sprite(sp, s.p1, v, s.clip);
      const cs = at.get(n); if (cs) cs.sort((a, b) => b.z - a.z).forEach((o) => carAt(o, s, v, false));
    }
  }
  function mirror(p, mx, my, mw, mh) {
    rect(mx - 3, my - 3, mw + 6, mh + 6, "#0b0b0f");
    cx.save(); cx.translate(mx, my); cx.beginPath(); cx.rect(0, 0, mw, mh); cx.clip();
    const v = { w: mw, h: mh, fx: mw / 2, fy: mw / 2, hy: mh * 0.42 };
    const gr = cx.createLinearGradient(0, 0, 0, v.hy); gr.addColorStop(0, rain ? "#4b5563" : "#3b82f6"); gr.addColorStop(1, rain ? "#9ca3af" : "#93c5fd");
    cx.fillStyle = gr; cx.fillRect(0, 0, mw, v.hy); rect(0, v.hy, mw, mh - v.hy, GRASS[0]);
    const bi = roadBack(p, v), behind = new Map();
    for (const o of all) if (o !== p) { const n = (bi - segIdx(o.z) + N) % N; if (n > 0 && n < MIRROR) { if (!behind.has(n)) behind.set(n, []); behind.get(n).push(o); } }
    for (let n = MIRROR - 1; n >= 0; n--) {
      const s = segs[(bi - n + N) % N];
      if (s.draw) paint(s, s.p2, s.p1, n / MIRROR, v);
      const cs = behind.get(n); if (cs) cs.forEach((o) => carAt(o, s, v, true));
    }
    cx.restore();
    rect(mx - 3, my - 3, mw + 6, 2, "#27272a");
  }
  let MM = null;
  function minimap(x0, y0, w, h, p, compact) {
    if (!MM) { const xs = T.xy.map((q) => q[0]), ys = T.xy.map((q) => q[1]); MM = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }; }
    const s = Math.min(w / (MM.x1 - MM.x0), h / (MM.y1 - MM.y0)), ox = x0 + (w - (MM.x1 - MM.x0) * s) / 2 - MM.x0 * s, oy = y0 + (h - (MM.y1 - MM.y0) * s) / 2 + MM.y1 * s;
    const at = (i) => [ox + T.xy[i][0] * s, oy - T.xy[i][1] * s];
    rect(x0 - 4, y0 - 4, w + 8, h + 8, "rgba(0,0,0,.45)");
    cx.lineJoin = "round"; cx.lineWidth = compact ? 2 : 3; cx.strokeStyle = "rgba(229,231,235,.85)"; cx.beginPath();
    for (let i = 0; i <= N; i += 6) { const [x, y] = at(i % N); cx[i ? "lineTo" : "moveTo"](x, y); } cx.closePath(); cx.stroke();
    const [sx, sy] = at(0); rect(sx - 2, sy - 1, 4, 2, "#f43f5e");
    for (const o of order.slice().reverse()) { const [x, y] = at(segIdx(o.z)); if (o === p) { circ(x, y, compact ? 3 : 3.8, "#fff"); circ(x, y, compact ? 2 : 2.6, o.c); } else circ(x, y, compact ? 1.6 : 2.2, o.c); }
  }
  function hud(p, vy, vh) {
    const compact = two || split, bar = compact ? 20 : 24, by = bar - 7;
    cx.save(); cx.translate(0, vy);
    rect(0, 0, W, bar, "rgba(0,0,0,.5)");
    txt(`${two ? p.name + " " : ""}P${p.place}/${FIELD}`, 8, by, compact ? 13 : 15, p.place === 1 ? "#fde047" : two ? (p.n === 1 ? "#fca5a5" : "#93c5fd") : "#fff");
    txt(`LAP ${clamp(p.lap, 1, LAPS)}/${LAPS}`, compact ? 112 : 84, by, compact ? 12 : 13);
    txt(`${p.lapT.toFixed(1)} s`, compact ? 178 : 158, by, compact ? 11 : 12, "#cbd5e1");
    txt(p.bestLap ? `BEST ${p.bestLap.toFixed(2)}` : "", compact ? 228 : 208, by, compact ? 10 : 11, "#a7f3d0");
    if (!compact) txt(`${typeof FPS === "number" ? FPS + " fps · " : ""}${DIFF[diff].name}${rain ? " · WET" : ""}`, W - 92, by, 10, rain ? "#93c5fd" : "#94a3b8", "right");
    txt("ERS", W - 84, by, 9, "#94a3b8"); rect(W - 62, compact ? 6 : 8, 54, compact ? 7 : 8, "#334155"); rect(W - 62, compact ? 6 : 8, 54 * p.turbo, compact ? 7 : 8, p.turbo > 0.3 ? "#22d3ee" : "#f97316");
    const mw = compact ? 96 : 136, mh = compact ? 24 : 36;
    if (g.go) mirror(p, W / 2 - mw / 2, bar + (compact ? 3 : 6), mw, mh);
    minimap(compact ? W - 44 : W - 76, bar + (compact ? 6 : 10), compact ? 36 : 66, compact ? 58 : 106, p, compact);
    if (!compact) order.forEach((c, k) => {
      const y = bar + 16 + k * 11;
      rect(4, y - 8, 76, 10, c === p ? "rgba(253,224,71,.28)" : "rgba(0,0,0,.45)"); rect(4, y - 8, 3, 10, c.c);
      txt(`${k + 1} ${c.name}`, 10, y, 8.5, c === p ? "#fde047" : "#e5e7eb");
      if (c.done) txt("■", 78, y, 8, "#f8fafc", "right");
    });
    const dh = compact ? 28 : 34, dw = compact ? 112 : 128, dy0 = vh - dh - 5;
    rect(5, dy0, dw, dh, "rgba(0,0,0,.55)");
    txt(String(p.gear), 18, dy0 + dh - (compact ? 7 : 9), compact ? 18 : 24, "#fff", "center");
    const lit = clamp(Math.round((p.rpm - 10000) / 8000 * 15), 0, 15);
    for (let i = 0; i < 15; i++) circ(36 + i * (compact ? 5 : 6.6), dy0 + (compact ? 7 : 9), compact ? 1.8 : 2.4, i < lit ? (i < 5 ? "#22c55e" : i < 10 ? "#ef4444" : "#3b82f6") : "#1f2937");
    txt(`${Math.round(p.speed / MAX * 330)} km/h`, 34, dy0 + dh - (compact ? 6 : 8), compact ? 11 : 14);
    if (p.tow && g.go && !p.done) txt("SLIPSTREAM", W / 2, vh - (compact ? 62 : 118), compact ? 9 : 11, "#93c5fd", "center");
    if (p.warn && g.go && !p.done) {
      const wy = bar + (compact ? 52 : 76), wtx = p.warn.dir > 0 ? "RIGHT ▶▶" : "◀◀ LEFT", col = p.warn.brake ? "#ef4444" : "#fde047";
      cx.globalAlpha = p.warn.brake ? 0.75 + 0.25 * Math.sin(g.t * 18) : clamp(1.3 - p.warn.k / 60, 0.35, 1);
      txt(wtx, W / 2, wy, compact ? 12 : 15, col, "center"); if (p.warn.brake) txt("BRAKE", W / 2, wy + (compact ? 14 : 19), compact ? 13 : 17, "#ef4444", "center");
      cx.globalAlpha = 1;
    }
    if (p.turnT > 0 && g.go) { cx.globalAlpha = clamp(p.turnT, 0, 1); txt(p.turnName, W / 2, bar + (compact ? 40 : 58), compact ? 10 : 12, "#fde047", "center"); cx.globalAlpha = 1; }
    if (g.go && p.msgT > 0) txt(p.msg, W / 2, compact ? vh * 0.5 : g.outT > 0 ? 170 : 110, p.msg.length > 16 ? (compact ? 13 : 16) : (compact ? 18 : 22), "#fde047", "center");
    cx.restore();
  }
  function rainFx(v) {
    cx.strokeStyle = "rgba(200,210,230,.35)"; cx.lineWidth = 1; cx.beginPath();
    for (let i = 0; i < 50; i++) { const x = Math.random() * v.w, y = Math.random() * v.h; cx.moveTo(x, y); cx.lineTo(x - 3, y + 10); }
    cx.stroke();
  }
  function view(p, vy, vh) {
    const k = vh / H, v = { w: W, h: vh, fx: W / 2 * k, fy: vh / 2, hy: vh / 2 };
    cx.save(); cx.beginPath(); cx.rect(0, vy, W, vh); cx.clip();
    cx.translate(p.shake ? rnd(-3, 3) * p.shake * 3 : 0, vy + (p.shake ? rnd(-1.5, 1.5) * p.shake * 3 : 0));
    sky(v, p.sky, k);
    const bi = roadFwd(p, v);
    things(p, v, bi);
    const bob = p.speed > 0 ? Math.round(Math.sin(g.t * 40) * (p.speed / MAX) * 1.2 * k) : 0;
    f1(W / 2 + p.st * 4 * k, vh - 14 * k + bob, 96 * k, p.c, p.st, true);
    if (rain) rainFx(v);
    cx.restore();
    hud(p, vy, vh);
  }
  function gantry(gy) {
    const gx = W / 2 - 130;
    rect(gx - 6, gy - 8, 272, 4, "#374151"); rect(gx - 6, gy - 4, 4, 70, "#374151"); rect(gx + 262, gy - 4, 4, 70, "#374151");
    for (let i = 0; i < 5; i++) {
      const lx = gx + 6 + i * 52;
      rect(lx, gy, 40, 62, "#0b0b0b"); rect(lx, gy, 40, 2, "#2b2b2b");
      for (let r = 0; r < 2; r++) {
        const on = g.go ? false : i < g.lights, cxl = lx + 20, cyl = gy + 17 + r * 28;
        if (on) { const glow = cx.createRadialGradient(cxl, cyl, 2, cxl, cyl, 18); glow.addColorStop(0, "rgba(255,60,60,.9)"); glow.addColorStop(1, "rgba(255,0,0,0)"); cx.fillStyle = glow; cx.fillRect(cxl - 18, cyl - 18, 36, 36); }
        circ(cxl, cyl, 10, on ? "#ff2a2a" : "#3a0a0a"); if (on) circ(cxl - 3, cyl - 3, 3, "#ffb4b4");
      }
    }
    if (!g.go) {
      txt(g.lights < 5 ? (two ? "W and ↑ rev the engines" : "↑ to rev the engine") : "...", W / 2, gy + 84, 12, "#fff", "center");
      if (!two) DIFF.forEach((d, i) => txt(`${i + 1} ${d.name}`, W / 2 + (i - 1) * 84, gy + 102, 11, i === diff ? "#fde047" : "#94a3b8", "center"));
      if (rain) txt("RAIN AT SPA: less grip, brake earlier", W / 2, gy + (two ? 100 : 120), 11, "#93c5fd", "center");
    }
  }
  g.draw = () => {
    if (split) {
      const vs = [P[0], ...RP];
      if (vs.length === 2) { view(vs[0], 0, H / 2); view(vs[1], H / 2, H / 2); rect(0, H / 2 - 1, W, 2, "#0d1020"); }
      else vs.forEach((p, i) => { cx.save(); cx.translate((i % 2) * W / 2, Math.floor(i / 2) * H / 2); cx.scale(0.5, 0.5); view(p, 0, H); cx.restore(); });
      if (vs.length > 2) { rect(W / 2 - 1, 0, 2, H, "#0d1020"); rect(0, H / 2 - 1, W, 2, "#0d1020"); }
      if (!g.go || g.outT > 0) gantry(H / 2 - 40);
      if (g.over && g.result) banner(["CHEQUERED FLAG", ...g.result], "Esc: back to the online lobby");
      return;
    }
    if (two) { view(P[0], 0, H / 2); view(P[1], H / 2, H / 2); rect(0, H / 2 - 1, W, 2, "#0d1020"); }
    else view(P[0], 0, H);
    if (!g.go || g.outT > 0) gantry(two ? H / 2 - 40 : 64);
    if (g.over && g.result) banner(["CHEQUERED FLAG", ...g.result], "Space race again · Esc menu");
  };
  g.debug = { all, segs, LINE, T, rain, CENT, get VAI() { return VAI; } };
  return g;
}
