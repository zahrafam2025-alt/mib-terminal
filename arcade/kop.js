"use strict";
const KOP_TEAMS = [
  { k: "mar", city: "Marseille", c1: "#e0f2fe", c2: "#38bdf8", food: "Bouillabaisse" },
  { k: "par", city: "Paris", c1: "#1e3a8a", c2: "#dc2626", food: "Jambon-beurre" },
  { k: "lyo", city: "Lyon", c1: "#f8fafc", c2: "#1d4ed8", food: "Tarte praline" },
  { k: "lil", city: "Lille", c1: "#dc2626", c2: "#f8fafc", food: "Gaufre" },
  { k: "mon", city: "Monaco", c1: "#dc2626", c2: "#f8fafc", food: "Barbajuan" },
  { k: "nic", city: "Nice", c1: "#dc2626", c2: "#111827", food: "Socca" },
  { k: "len", city: "Lens", c1: "#b91c1c", c2: "#facc15", food: "Frites" },
  { k: "ren", city: "Rennes", c1: "#dc2626", c2: "#111827", food: "Galette-saucisse" },
  { k: "nan", city: "Nantes", c1: "#facc15", c2: "#15803d", food: "Petit-beurre" },
  { k: "str", city: "Strasbourg", c1: "#2563eb", c2: "#f8fafc", food: "Bretzel" },
  { k: "tou", city: "Toulouse", c1: "#7c3aed", c2: "#f8fafc", food: "Cassoulet" },
  { k: "bre", city: "Brest", c1: "#dc2626", c2: "#f8fafc", food: "Kouign-amann" },
  { k: "hav", city: "Le Havre", c1: "#7dd3fc", c2: "#1e3a8a", food: "Teurgoule" },
  { k: "aux", city: "Auxerre", c1: "#f8fafc", c2: "#2563eb", food: "Gougère" },
  { k: "ang", city: "Angers", c1: "#111827", c2: "#f8fafc", food: "Quernon" },
  { k: "lor", city: "Lorient", c1: "#f97316", c2: "#111827", food: "Sardines" },
  { k: "met", city: "Metz", c1: "#7f1d1d", c2: "#f8fafc", food: "Mirabelles" },
  { k: "pfc", city: "Paris (Seine)", c1: "#0c4a6e", c2: "#7dd3fc", food: "Croissant" },
];
const KOP_NICK = ["Le Mur", "La Fusée", "Petit Prince", "Grand Ours", "Zinzin", "Le Sorcier", "Capitaine Crochet", "Turbo", "La Pieuvre", "Bouboule",
  "Le Chat", "Mistral", "Tonnerre", "Pépite", "Le Phare", "Cyclone", "Biscotte", "Le Moine", "Gazelle", "Marteau"];
const kopNames = (k) => { const i = Math.max(0, KOP_TEAMS.findIndex((t) => t.k === k)); return [0, 1, 2, 3].map((j) => KOP_NICK[(i * 3 + j * 5) % KOP_NICK.length]); };
const KOP_SCENE = {
  mar: { sky: ["#3b2a6b", "#f97316", "#fcd34d"], sun: [0.55, 150, 22, "#fde68a"], hills: ["#5b4a8a", 0.55, 60], marks: [["ndg", 0.32, 1.1], ["hill", 0.8, 1]], bld: [["#f5deb3", "#f1c27d", "#e8b07a", "#fde7c8"], "tile"], water: ["sea", "#1d4ed8"], props: ["boats", "buoys"], ground: ["quay", "#d6c3a0", "#bfa985"] },
  par: { sky: ["#1e3a8a", "#60a5fa", "#e0f2fe"], hills: ["#94a3b8", 0.25, 20], marks: [["eiffel", 0.28, 1.15], ["sacre", 0.7, 0.9], ["arc", 0.52, 0.7]], bld: [["#efe6d2", "#e7dcc3", "#f3ecdc"], "slate"], water: ["river", "#3b82f6"], props: ["barges", "lamps"], ground: ["cobble", "#9ca3af", "#7c838f"] },
  lyo: { sky: ["#0f766e", "#5eead4", "#fef3c7"], hills: ["#4d7c0f", 0.55, 50], marks: [["fourviere", 0.3, 1], ["crayon", 0.75, 1]], bld: [["#f59e0b", "#fbbf24", "#f97316", "#fde68a", "#fca5a5"], "tile"], water: ["river", "#0e7490"], props: ["barges", "lamps"], ground: ["cobble", "#a8a29e", "#8b8580"] },
  lil: { sky: ["#334155", "#94a3b8", "#e2e8f0"], hills: ["#64748b", 0.15, 10], marks: [["belfry", 0.3, 1.1], ["belfry", 0.72, 0.8]], bld: [["#b45309", "#92400e", "#c2410c", "#f5deb3"], "gable"], water: null, props: ["lamps"], ground: ["cobble", "#78716c", "#57534e"] },
  mon: { sky: ["#0369a1", "#38bdf8", "#e0f2fe"], hills: ["#57534e", 0.85, 90], marks: [["casino", 0.38, 1], ["rock", 0.78, 1.1]], bld: [["#fde68a", "#fecaca", "#f5f5f4", "#fed7aa"], "tile"], water: ["sea", "#0284c7"], props: ["yachts", "palms"], ground: ["quay", "#e7e5e4", "#d6d3d1"] },
  nic: { sky: ["#0284c7", "#7dd3fc", "#fef9c3"], hills: ["#65a30d", 0.6, 60], marks: [["castlehill", 0.75, 1], ["palace", 0.35, 0.9]], bld: [["#fdba74", "#fca5a5", "#fde68a", "#f5d0c5"], "tile"], water: ["sea", "#0ea5e9"], props: ["palms", "chairs"], ground: ["promenade", "#e5e7eb", "#cbd5e1"] },
  len: { sky: ["#44403c", "#a8a29e", "#fde68a"], hills: ["#3f3f46", 0.2, 10], marks: [["terril", 0.25, 1.2], ["terril", 0.42, 0.9], ["headframe", 0.7, 1]], bld: [["#9a3412", "#7c2d12", "#b45309"], "brick"], water: null, props: ["lamps"], ground: ["asphalt", "#57534e", "#44403c"] },
  ren: { sky: ["#1e40af", "#93c5fd", "#e0f2fe"], hills: ["#4d7c0f", 0.25, 20], marks: [["parlement", 0.45, 1]], bld: [["#f5f5f4", "#fef3c7", "#e7e5e4"], "timber"], water: ["river", "#2563eb"], props: ["lamps"], ground: ["cobble", "#a8a29e", "#8b8580"] },
  nan: { sky: ["#1e3a8a", "#60a5fa", "#fef9c3"], hills: ["#3f6212", 0.2, 15], marks: [["chateau", 0.3, 1], ["lu", 0.62, 1], ["crane", 0.85, 1.1]], bld: [["#f5f5f4", "#e7e5e4", "#fef3c7"], "slate"], water: ["river", "#1d4ed8"], props: ["lamps"], ground: ["cobble", "#9ca3af", "#7c838f"] },
  str: { sky: ["#4c1d95", "#a78bfa", "#fde68a"], hills: ["#4d7c0f", 0.3, 25], marks: [["spire", 0.4, 1.2]], bld: [["#fef3c7", "#fecaca", "#e7e5e4", "#fde68a"], "timber"], water: ["river", "#0f766e"], props: ["lamps"], ground: ["cobble", "#a8a29e", "#8b8580"] },
  tou: { sky: ["#7c2d12", "#fb923c", "#fde68a"], hills: ["#78350f", 0.2, 15], marks: [["capitole", 0.35, 1], ["rocket", 0.78, 1]], bld: [["#e11d48", "#be123c", "#f43f5e", "#fda4af"], "tile"], water: ["river", "#b45309"], props: ["lamps"], ground: ["brick", "#be123c", "#9f1239"] },
  bre: { sky: ["#334155", "#64748b", "#cbd5e1"], hills: ["#475569", 0.3, 20], marks: [["lighthouse", 0.7, 1], ["crane", 0.3, 1]], bld: [["#e2e8f0", "#cbd5e1", "#f1f5f9"], "slate"], water: ["sea", "#334155"], props: ["boats", "buoys"], ground: ["quay", "#9ca3af", "#6b7280"] },
  hav: { sky: ["#0c4a6e", "#7dd3fc", "#f0f9ff"], hills: ["#64748b", 0.2, 12], marks: [["perret", 0.35, 1.2], ["crane", 0.65, 1], ["crane", 0.8, 0.9]], bld: [["#d4d4d8", "#e4e4e7", "#a1a1aa"], "flat"], water: ["sea", "#0369a1"], props: ["containers"], ground: ["quay", "#a1a1aa", "#71717a"] },
  aux: { sky: ["#1d4ed8", "#93c5fd", "#fef9c3"], hills: ["#4d7c0f", 0.5, 40], marks: [["cathedral", 0.4, 1]], bld: [["#fef3c7", "#f5f5f4", "#fde68a"], "tile"], water: ["river", "#1e40af"], props: ["barges"], ground: ["cobble", "#a8a29e", "#8b8580"] },
  ang: { sky: ["#374151", "#9ca3af", "#f3f4f6"], hills: ["#3f6212", 0.25, 15], marks: [["chateau", 0.4, 1.1, 1]], bld: [["#f5f5f4", "#e7e5e4"], "slate"], water: ["river", "#475569"], props: ["lamps"], ground: ["cobble", "#6b7280", "#4b5563"] },
  lor: { sky: ["#7c2d12", "#fdba74", "#fef3c7"], hills: ["#57534e", 0.2, 10], marks: [["bunker", 0.4, 1], ["lighthouse", 0.82, 0.8]], bld: [["#f5f5f4", "#fed7aa", "#e7e5e4"], "slate"], water: ["sea", "#1e3a8a"], props: ["boats", "buoys"], ground: ["quay", "#a8a29e", "#78716c"] },
  met: { sky: ["#713f12", "#facc15", "#fef9c3"], hills: ["#4d7c0f", 0.35, 25], marks: [["cathedral", 0.45, 1.1]], bld: [["#fde68a", "#facc15", "#fef3c7"], "slate"], water: ["river", "#0f766e"], props: ["lamps"], ground: ["cobble", "#ca8a04", "#a16207"] },
  pfc: { sky: ["#0c4a6e", "#38bdf8", "#e0f2fe"], hills: ["#94a3b8", 0.25, 20], marks: [["arc", 0.3, 1], ["eiffel", 0.72, 0.85], ["ferris", 0.5, 0.8]], bld: [["#efe6d2", "#e7dcc3", "#f3ecdc"], "slate"], water: ["river", "#2563eb"], props: ["lamps"], ground: ["cobble", "#9ca3af", "#7c838f"] },
};
function Kop(online = null) {
  const GY = 304, LEN = 3400, GRAV = 1300, BOSS_AT = LEN - W, KS = 1.4;
  let OPT = {}; try { OPT = (online && online.opt) || JSON.parse(localStorage.getItem("arcade-sheet-kop") || "{}"); } catch (e) {}
  const team = KOP_TEAMS.find((t) => t.k === OPT.team) || KOP_TEAMS[0];
  const foeT = KOP_TEAMS.find((t) => t.k === OPT.opp && t.k !== team.k) || KOP_TEAMS.find((t) => t.k !== team.k);
  const away = OPT.venue === "away", place = away ? foeT : team, SCN = KOP_SCENE[place.k] || KOP_SCENE.mar;
  const diff = clamp(+(OPT.diff ?? 1), 0, 2), size = clamp(+(OPT.size || 2), 1, 4);
  const names = (Array.isArray(OPT.names) && OPT.names.length === 4 ? OPT.names : kopNames(team.k)).map((n, i) => String(n || kopNames(team.k)[i]).slice(0, 16));
  const host = !online || online.host, me = online ? online.me : 0;
  const humans = online ? online.players.slice(0, 4) : [{ id: 0, name: (window.ARC && ARC.getName()) || "YOU" }];
  const nP = Math.max(size, humans.length);
  const SKIN = ["#f1c27d", "#8d5524", "#e0ac69", "#c68642"], HAIR = ["#1f2937", "#111827", "#78350f", "#facc15"];
  const P = Array.from({ length: nP }, (_, i) => ({ i, human: i < humans.length ? humans[i] : null, name: names[i % 4], who: i < humans.length ? humans[i].name : "bot",
    x: 60 + i * 26, y: GY, vx: 0, vy: 0, on: true, face: 1, ax: 1, ay: 0, crouch: false, cd: 0, wpn: "P", ammo: 0, lives: 3, gren: 3, inv: 2, dead: 0, out: false,
    in: { mx: 0, my: 0, a: 0, b: 0, c: 0 }, lastB: 0, lastC: 0, run: 0, skin: SKIN[i % 4], hair: HAIR[i % 4], botT: 0 }));
  const g = { id: "kop", own: true, score: 0, over: false, win: false, t: 0, msg: "", msgT: 0, cam: 0, sendT: 0, net: null, boss: null,
    help: "arrows / W A S D run and aim · Space fire (hold) · Enter or X jump · E firecracker · ↓ crouch · beat the mascot-mech · Esc menu" };
  const E = [], B = [], K = [], FX = [];
  let nid = 1, shake = 0;
  const say = (m, t = 1.6) => { g.msg = m; g.msgT = t; };
  say(`${away ? "AWAY IN" : "AT HOME IN"} ${place.city.toUpperCase()} · vs ${foeT.city.toUpperCase()}`, 3.2);
  const PLAT = [], WAVES = [];
  for (let x = 380; x < BOSS_AT - 200; x += 170 + Math.floor(Math.random() * 140)) {
    const r = Math.random();
    if (r < 0.4) PLAT.push({ x, y: GY - 22, w: 26 + 26 * Math.floor(Math.random() * 2), k: "crate" });
    else if (r < 0.7) PLAT.push({ x, y: GY - 74 - Math.floor(Math.random() * 30), w: 64, k: "balcony" });
    else if (r < 0.82) PLAT.push({ x, y: GY - 34, w: 92, k: "bus" });
  }
  for (let x = 520; x < BOSS_AT - 60; x += 150 + Math.floor(Math.random() * 90)) {
    const r = Math.random(), n = 1 + Math.floor(Math.random() * (2 + diff));
    WAVES.push({ x, kind: r < 0.5 ? "grunt" : r < 0.68 ? "lob" : r < 0.84 ? "drone" : "sniper", n, done: false });
    if (Math.random() < 0.17) WAVES.push({ x: x + 60, kind: "van", n: 1, done: false });
  }
  WAVES.push({ x: 1600, kind: "van", n: 1, done: false });
  const FOODX = [Math.floor(BOSS_AT * 0.33), Math.floor(BOSS_AT * 0.7)];
  FOODX.forEach((x) => K.push({ x, y: GY - 10, k: "food", vy: 0 }));
  const FW = Math.ceil(W + LEN * 0.22), MW = Math.ceil(W + LEN * 0.55);
  const R = (() => { let s = 0; for (const ch of place.k) s = s * 31 + ch.charCodeAt(0); return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff); })();
  const far = pic(FW, 260, (x) => {
    const sk = x.createLinearGradient(0, 0, 0, 240); sk.addColorStop(0, SCN.sky[0]); sk.addColorStop(0.6, SCN.sky[1]); sk.addColorStop(1, SCN.sky[2]);
    x.fillStyle = sk; x.fillRect(0, 0, FW, 260);
    if (SCN.sun) { const [sx, sy, sr, sc] = SCN.sun; for (const k of [0.25, 0.45, 1]) { x.globalAlpha = k === 1 ? 1 : 0.2; x.fillStyle = sc; x.beginPath(); x.arc(FW * sx * 0.5, sy, sr / k * (k === 1 ? 1 : 0.6), 0, 7); x.fill(); } x.globalAlpha = 1; }
    x.fillStyle = "rgba(255,255,255,.55)"; for (let i = 0; i < 14; i++) { const cx0 = R() * FW, cy0 = 20 + R() * 90, cw = 30 + R() * 70; x.fillRect(cx0, cy0, cw, 3); x.fillRect(cx0 + 8, cy0 - 3, cw * 0.6, 3); }
    const [hc, ha, hh] = SCN.hills; x.fillStyle = hc; x.beginPath(); x.moveTo(0, 240);
    for (let i = 0; i <= FW; i += 8) x.lineTo(i, 236 - hh * (0.4 + ha * (0.5 + 0.5 * Math.sin(i / 97 + 1.3) * Math.sin(i / 41))) - R() * 3);
    x.lineTo(FW, 240); x.fill();
    for (let rep = 0; rep < 2; rep++) for (const [kind, fx, s, opt] of SCN.marks) landmark(x, kind, (fx + rep) * FW / 2, 236, s, opt);
  });
  function landmark(x, kind, px, py, s, opt) {
    const F = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(px + a * s, py - b * s, w * s, h * s); };
    const P0 = (c, pts) => { x.fillStyle = c; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo : x.moveTo).call(x, px + a * s, py - b * s)); x.fill(); };
    if (kind === "ndg" || kind === "hill" || kind === "castlehill" || kind === "fourviere" || kind === "sacre") {
      P0(kind === "castlehill" ? "#4d7c0f" : "#6b5b95", [[-90, 0], [-40, 50], [0, 64], [40, 52], [90, 0]]);
      if (kind === "castlehill") { for (let i = -50; i < 50; i += 12) P0("#3f6212", [[i, 40], [i + 6, 58], [i + 12, 40]]); F("#d6d3d1", -4, 92, 8, 30); }
    }
    if (kind === "ndg") {
      F("#f5f5f4", -26, 84, 40, 22); F("#d6d3d1", -26, 66, 40, 4); P0("#e7e5e4", [[-22, 84], [-6, 96], [10, 84]]);
      F("#f5f5f4", 10, 124, 12, 62); F("#d6d3d1", 12, 112, 8, 6); F("#d6d3d1", 12, 98, 8, 6); F("#fbbf24", 13, 138, 6, 14); F("#fbbf24", 11, 132, 10, 3);
      for (let i = -22; i < 10; i += 8) F("#a8a29e", i, 76, 3, 6);
    }
    if (kind === "eiffel") {
      x.strokeStyle = "#78350f"; x.lineWidth = 1.4 * s;
      const L = (a, b, c, d) => { x.beginPath(); x.moveTo(px + a * s, py - b * s); x.lineTo(px + c * s, py - d * s); x.stroke(); };
      L(-26, 0, -4, 110); L(26, 0, 4, 110); L(-4, 110, 0, 150); L(4, 110, 0, 150); L(-20, 30, 20, 30); L(-11, 70, 11, 70);
      for (let i = 0; i < 9; i++) { L(-26 + i * 2.4, i * 12, 26 - i * 2.4, i * 12 + 12); L(26 - i * 2.4, i * 12, -26 + i * 2.4, i * 12 + 12); }
      x.fillStyle = "#78350f"; x.beginPath(); x.arc(px, py - 22 * s, 13 * s, Math.PI, 0); x.fill(); x.fillStyle = SCN.sky[2]; x.beginPath(); x.arc(px, py - 20 * s, 10 * s, Math.PI, 0); x.fill();
      F("#78350f", -1, 158, 2, 10);
    }
    if (kind === "sacre") { for (const [a, r] of [[-14, 9], [0, 13], [14, 9]]) { x.fillStyle = "#fafaf9"; x.beginPath(); x.arc(px + a * s, py - 84 * s, r * s, Math.PI, 0); x.fill(); } F("#fafaf9", -24, 84, 48, 20); F("#fafaf9", -2, 104, 4, 10); }
    if (kind === "arc") { F("#e7e5e4", -22, 60, 44, 60); F(SCN.sky[2], -9, 40, 18, 40); x.fillStyle = SCN.sky[2]; x.beginPath(); x.arc(px, py - 40 * s, 9 * s, Math.PI, 0); x.fill(); F("#d6d3d1", -24, 64, 48, 6); }
    if (kind === "fourviere") { F("#f5f5f4", -28, 90, 50, 24); for (const a of [-28, -14, 8, 18]) F("#e7e5e4", a, 104, 6, 16); F("#fbbf24", -6, 108, 4, 8); }
    if (kind === "crayon") { F("#e5e7eb", -8, 120, 16, 120); x.fillStyle = "#dc2626"; x.beginPath(); x.moveTo(px - 8 * s, py - 120 * s); x.lineTo(px, py - 136 * s); x.lineTo(px + 8 * s, py - 120 * s); x.fill(); for (let i = 10; i < 120; i += 8) F("#94a3b8", -6, i, 12, 2); }
    if (kind === "belfry") { F("#b45309", -10, 110, 20, 110); F("#92400e", -12, 80, 24, 6); F("#fbbf24", -5, 104, 10, 10); P0("#57534e", [[-10, 110], [0, 140], [10, 110]]); for (let i = 20; i < 100; i += 18) F("#fde68a", -3, i, 6, 8); }
    if (kind === "casino") { F("#fef3c7", -40, 50, 80, 50); F("#fde68a", -40, 54, 80, 4); for (const a of [-36, 26]) { F("#fef3c7", a, 78, 10, 28); P0("#a16207", [[a, 78], [a + 5, 92], [a + 10, 78]]); } x.fillStyle = "#15803d"; x.beginPath(); x.arc(px, py - 54 * s, 12 * s, Math.PI, 0); x.fill(); for (let i = -34; i < 34; i += 8) F("#a16207", i, 40, 4, 18); }
    if (kind === "rock") { P0("#78716c", [[-50, 0], [-40, 70], [-10, 92], [30, 80], [50, 0]]); F("#fef3c7", -30, 100, 50, 14); F("#dc2626", -30, 104, 50, 4); }
    if (kind === "palace") { F("#fecaca", -50, 40, 100, 40); x.fillStyle = "#f8fafc"; x.beginPath(); x.arc(px, py - 40 * s, 16 * s, Math.PI, 0); x.fill(); x.fillStyle = "#94a3b8"; x.beginPath(); x.arc(px, py - 42 * s, 10 * s, Math.PI, 0); x.fill(); for (let i = -46; i < 46; i += 8) F("#f8fafc", i, 30, 4, 12); }
    if (kind === "terril") P0("#27272a", [[-60, 0], [-6, 96], [6, 96], [60, 0]]);
    if (kind === "headframe") { x.strokeStyle = "#7f1d1d"; x.lineWidth = 2 * s; x.beginPath(); x.moveTo(px - 20 * s, py); x.lineTo(px - 6 * s, py - 90 * s); x.lineTo(px + 6 * s, py - 90 * s); x.lineTo(px + 20 * s, py); x.moveTo(px - 16 * s, py - 20 * s); x.lineTo(px + 16 * s, py - 20 * s); x.moveTo(px - 11 * s, py - 50 * s); x.lineTo(px + 11 * s, py - 50 * s); x.moveTo(px + 6 * s, py - 90 * s); x.lineTo(px + 40 * s, py); x.stroke(); x.fillStyle = "#7f1d1d"; x.beginPath(); x.arc(px, py - 92 * s, 8 * s, 0, 7); x.fill(); }
    if (kind === "parlement") { F("#f5f5f4", -60, 44, 120, 44); P0("#334155", [[-62, 44], [-50, 60], [50, 60], [62, 44]]); for (let i = -54; i < 54; i += 10) F("#fbbf24", i, 36, 4, 10); }
    if (kind === "chateau") { const st = opt ? "#e5e7eb" : "#d6d3d1"; F("#d6d3d1", -60, 40, 120, 40); for (const a of [-66, -22, 22, 58]) { F(st, a, 56, 16, 56); if (opt) for (let i = 4; i < 56; i += 8) F("#111827", a, i, 16, 3); } for (let i = -60; i < 60; i += 8) F("#d6d3d1", i, 46, 5, 6); }
    if (kind === "lu") { F("#d6d3d1", -8, 80, 16, 80); x.fillStyle = "#b45309"; x.beginPath(); x.arc(px, py - 80 * s, 10 * s, Math.PI, 0); x.fill(); F("#fbbf24", -2, 98, 4, 8); }
    if (kind === "crane") { F("#eab308", -4, 100, 8, 100); F("#eab308", -40, 104, 90, 6); x.strokeStyle = "#a16207"; x.lineWidth = 1; x.beginPath(); x.moveTo(px + 40 * s, py - 98 * s); x.lineTo(px + 40 * s, py - 60 * s); x.stroke(); F("#a16207", 36, 60, 8, 6); }
    if (kind === "spire") { F("#be123c", -26, 80, 40, 80); F("#9f1239", -26, 84, 40, 4); P0("#be123c", [[4, 80], [10, 150], [16, 80]]); F("#be123c", 2, 104, 16, 24); x.fillStyle = "#fde68a"; x.beginPath(); x.arc(px - 6 * s, py - 60 * s, 7 * s, 0, 7); x.fill(); }
    if (kind === "capitole") { F("#e11d48", -70, 40, 140, 40); F("#fda4af", -70, 44, 140, 4); for (let i = -60; i < 60; i += 12) F("#fecdd3", i, 34, 4, 26); P0("#9f1239", [[-20, 44], [0, 56], [20, 44]]); }
    if (kind === "rocket") { F("#f8fafc", -6, 110, 12, 100); P0("#dc2626", [[-6, 110], [0, 128], [6, 110]]); P0("#94a3b8", [[-6, 14], [-14, 0], [-6, 0]]); P0("#94a3b8", [[6, 14], [14, 0], [6, 0]]); F("#1e3a8a", -3, 80, 6, 8); }
    if (kind === "lighthouse") { F("#f8fafc", -7, 90, 14, 90); for (let i = 10; i < 90; i += 20) F("#dc2626", -7, i + 10, 14, 10); F("#111827", -9, 98, 18, 8); F("#fde68a", -5, 96, 10, 5); }
    if (kind === "perret") { F("#a8a29e", -9, 150, 18, 150); for (let i = 20; i < 150; i += 10) F("#fbbf24", -6, i, 12, 2); P0("#a8a29e", [[-9, 150], [0, 168], [9, 150]]); F("#a8a29e", -40, 40, 80, 40); }
    if (kind === "cathedral") { F("#d6d3d1", -50, 60, 90, 60); P0("#a8a29e", [[-50, 60], [-5, 84], [40, 60]]); F("#e7e5e4", 30, 110, 22, 110); P0("#78716c", [[30, 110], [41, 130], [52, 110]]); x.fillStyle = "#93c5fd"; x.beginPath(); x.arc(px - 5 * s, py - 40 * s, 8 * s, 0, 7); x.fill(); }
    if (kind === "bunker") { F("#78716c", -80, 40, 160, 40); F("#57534e", -84, 44, 168, 6); for (let i = -70; i < 70; i += 30) F("#292524", i, 30, 20, 30); }
    if (kind === "ferris") { x.strokeStyle = "#f8fafc"; x.lineWidth = 1.5; x.beginPath(); x.arc(px, py - 60 * s, 40 * s, 0, 7); x.stroke(); for (let a = 0; a < 6.28; a += 0.52) { x.beginPath(); x.moveTo(px, py - 60 * s); x.lineTo(px + Math.cos(a) * 40 * s, py - 60 * s + Math.sin(a) * 40 * s); x.stroke(); F("#f43f5e", Math.cos(a) * 40 - 3, 60 - Math.sin(a) * 40 + 3, 6, 6); } F("#f8fafc", -3, 60, 6, 60); }
  }
  const mid = pic(MW, 300, (x) => {
    const [pal, roof] = SCN.bld, top = 168, base = 262, wy = SCN.water ? 268 : 300;
    for (let bx = 0; bx < MW; ) {
      const w = 30 + Math.floor(R() * 34), h = 46 + Math.floor(R() * 52), y0 = base - h, c = pal[Math.floor(R() * pal.length)];
      x.fillStyle = c; x.fillRect(bx, y0, w, h);
      if (roof === "tile") { x.fillStyle = "#c2410c"; x.fillRect(bx - 2, y0 - 5, w + 4, 6); }
      else if (roof === "slate") { x.fillStyle = "#475569"; x.beginPath(); x.moveTo(bx - 1, y0); x.lineTo(bx + 5, y0 - 10); x.lineTo(bx + w - 5, y0 - 10); x.lineTo(bx + w + 1, y0); x.fill(); x.fillStyle = "#cbd5e1"; x.fillRect(bx + w / 2 - 2, y0 - 9, 4, 6); }
      else if (roof === "gable") { x.fillStyle = c; for (let i = 0; i < 4; i++) x.fillRect(bx + i * w / 8, y0 - 6 * (i + 1), w - i * w / 4, 6); }
      else if (roof === "brick") { x.fillStyle = "#57534e"; x.fillRect(bx - 1, y0 - 4, w + 2, 5); x.fillStyle = "rgba(0,0,0,.12)"; for (let yy = y0 + 4; yy < base; yy += 5) x.fillRect(bx, yy, w, 1); }
      else if (roof === "timber") { x.fillStyle = "#7c2d12"; x.beginPath(); x.moveTo(bx - 2, y0); x.lineTo(bx + w / 2, y0 - 16); x.lineTo(bx + w + 2, y0); x.fill(); x.fillStyle = "#78350f"; for (let i = 0; i < w; i += 9) x.fillRect(bx + i, y0, 2, h); for (let yy = y0 + 12; yy < base; yy += 16) x.fillRect(bx, yy, w, 2); }
      else { x.fillStyle = "#71717a"; x.fillRect(bx, y0 - 3, w, 3); }
      for (let wy0 = y0 + 8; wy0 < base - 14; wy0 += 14) for (let wx = bx + 5; wx < bx + w - 8; wx += 10) {
        x.fillStyle = R() < 0.18 ? "#fde68a" : "#334155"; x.fillRect(wx, wy0, 5, 8);
        if (roof === "tile" && R() < 0.6) { x.fillStyle = ["#0e7490", "#15803d", "#1d4ed8"][Math.floor(R() * 3)]; x.fillRect(wx - 2, wy0, 2, 8); x.fillRect(wx + 5, wy0, 2, 8); }
      }
      x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(bx + w / 2 - 4, base - 12, 8, 12);
      if (R() < 0.3) { x.fillStyle = [team.c1, team.c2, "#ef4444", "#16a34a"][Math.floor(R() * 4)]; x.fillRect(bx + 2, base - 18, w - 4, 3); }
      bx += w + (R() < 0.2 ? 6 : 0);
    }
    x.fillStyle = "rgba(0,0,0,.18)"; x.fillRect(0, base, MW, 6);
    if (SCN.water) {
      const [kind, wc] = SCN.water; x.fillStyle = wc; x.fillRect(0, base + 6, MW, wy - base + 40);
      x.fillStyle = "rgba(255,255,255,.35)"; for (let i = 0; i < MW / 6; i++) x.fillRect(R() * MW, base + 10 + R() * 30, 4 + R() * 10, 1);
      if (SCN.props.includes("boats") || SCN.props.includes("yachts") || SCN.props.includes("barges")) for (let bx = 20; bx < MW; bx += 60 + R() * 90) {
        const yacht = SCN.props.includes("yachts"), barge = SCN.props.includes("barges"), bw = barge ? 60 : yacht ? 42 : 26;
        x.fillStyle = barge ? "#1f2937" : "#f8fafc"; x.fillRect(bx, base + 14, bw, 6); x.fillStyle = barge ? "#b91c1c" : "#1e3a8a"; x.fillRect(bx, base + 18, bw, 2);
        if (yacht) { x.fillStyle = "#f8fafc"; x.fillRect(bx + 8, base + 9, 24, 5); x.fillStyle = "#334155"; x.fillRect(bx + 12, base + 10, 16, 2); }
        else if (!barge) { x.fillStyle = "#e7e5e4"; x.fillRect(bx + 12, base - 6, 1, 20); }
        else { x.fillStyle = "#fde68a"; x.fillRect(bx + 10, base + 10, 14, 4); }
      }
      if (SCN.props.includes("buoys")) for (let bx = 10; bx < MW; bx += 34) { x.fillStyle = "#ef4444"; x.beginPath(); x.arc(bx, base + 30, 3, 0, 7); x.fill(); }
      if (SCN.props.includes("containers")) for (let bx = 10; bx < MW; bx += 90 + R() * 60) for (let j = 0; j < 3; j++) { x.fillStyle = ["#dc2626", "#2563eb", "#16a34a", "#f97316"][Math.floor(R() * 4)]; x.fillRect(bx + (j % 2) * 4, base + 4 - j * 9, 34, 8); }
    }
    if (SCN.props.includes("palms")) for (let bx = 30; bx < MW; bx += 70 + R() * 40) { x.fillStyle = "#78350f"; x.fillRect(bx, base - 40, 3, 46); x.fillStyle = "#15803d"; for (let a = 0; a < 6; a++) { x.save(); x.translate(bx + 1, base - 40); x.rotate(a * 1.05); x.fillRect(0, -2, 18, 4); x.restore(); } }
    if (SCN.props.includes("lamps")) for (let bx = 20; bx < MW; bx += 80) { x.fillStyle = "#1f2937"; x.fillRect(bx, base - 30, 2, 36); x.fillStyle = "#fde68a"; x.fillRect(bx - 2, base - 34, 6, 5); }
  });
  function guy(px, py, face, ax, ay, crouch, kit, skin, hair, run, num, bandana) {
    const h = crouch ? 16 : 24, t0 = py - h, leg = crouch ? 0 : run;
    cx.save(); cx.translate(Math.round(px), py); cx.scale(face * KS, KS); cx.translate(0, -py);
    rect(-4, py - 6 + (leg > 0 ? -1 : 0), 3, 6, kit.c2); rect(1, py - 6 + (leg < 0 ? -1 : 0), 3, 6, kit.c2);
    rect(-5, py - 1, 4, 2, "#111827"); rect(1, py - 1, 4, 2, "#111827");
    rect(-5, t0 + (crouch ? 9 : 13), 10, 5, kit.c2 === "#f8fafc" ? "#1f2937" : "#f8fafc");
    rect(-5, t0 + 5, 10, crouch ? 5 : 9, kit.c1); rect(-5, t0 + 5, 10, 2, kit.c2);
    if (num !== undefined) txt(String(num), -2, t0 + 12, 5, kit.c2);
    rect(-3, t0, 7, 6, skin); rect(-3, t0 - 1, 7, 2, hair); rect(2, t0 + 2, 1, 1, "#111827");
    if (bandana) rect(-3, t0 + 3, 7, 2, bandana);
    cx.save(); cx.translate(1, t0 + 8); cx.rotate(ax === 0 ? (ay < 0 ? -Math.PI / 2 : Math.PI / 2) : Math.atan2(ay, 1));
    rect(0, -1, 10, 3, "#374151"); rect(0, -1, 4, 3, skin); cx.restore();
    cx.restore();
  }
  const TYPES = ["grunt", "lob", "sniper", "drone", "van", "boss"];
  const HP = { grunt: 1, lob: 2, sniper: 2, drone: 2, van: 14 + diff * 4, boss: 110 + diff * 40 };
  function spawn(kind, x, y) {
    const e = { id: nid++, t: kind, x, y: y ?? GY, vx: 0, vy: 0, hp: HP[kind] * (kind === "boss" ? Math.max(1, 0.7 + 0.3 * nP) : 1), face: -1, cd: 0.8 + Math.random(), on: true, st: 0, hit: 0 };
    e.max = e.hp; E.push(e); return e;
  }
  const alive = () => P.filter((p) => !p.out && p.dead <= 0);
  const nearestP = (x, y) => { let b = null, bd = 1e9; for (const p of alive()) { const d = Math.hypot(p.x - x, p.y - 12 - y); if (d < bd) { bd = d; b = p; } } return b; };
  function eshot(x, y, tx, ty, sp, kind = "b") { const a = Math.atan2(ty - y, tx - x); B.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, f: false, t: 0, k: kind, d: 1 }); }
  function boom(x, y, r, dmg, friendly) {
    FX.push({ k: "boom", x, y, r, t: 0.45 }); shake = Math.max(shake, r / 8); SFX.boom();
    if (friendly) for (const e of E) { const [ex, ey] = [e.x, e.y - eh(e) / 2]; if (Math.hypot(ex - x, ey - y) < r + ew(e) / 2) hurtE(e, dmg); }
    else for (const p of alive()) if (Math.hypot(p.x - x, p.y - 12 - y) < r) hurtP(p);
  }
  const ew = (e) => ({ van: 54, boss: 64, drone: 18 })[e.t] || 12 * KS, eh = (e) => ({ van: 30, boss: 90, drone: 10 })[e.t] || 24 * KS;
  function hurtE(e, d) {
    if (e.hp <= 0) return; e.hp -= d; e.hit = 0.08;
    if (e.hp <= 0) {
      const pts = { grunt: 100, lob: 150, sniper: 200, drone: 200, van: 600, boss: 6000 }[e.t]; g.score += pts;
      FX.push({ k: "pts", x: e.x, y: e.y - eh(e) - 4, s: "+" + pts, t: 0.9 });
      if (e.t === "van" || e.t === "drone" || e.t === "boss") boom(e.x, e.y - eh(e) / 2, e.t === "boss" ? 60 : 30, 0, true); else { SFX.stomp(); FX.push({ k: "fly", x: e.x, y: e.y - 12, vx: rnd(-40, 80), vy: -220, t: 0.8, c: foeT.c1 }); }
      if (e.t === "van" || Math.random() < 0.07) K.push({ x: e.x, y: e.y - 20, vy: -150, k: pick(["M", "S", "F"]) });
      if (e.t === "boss") { g.win = true; g.over = false; g.endT = 2.5; say("VICTOIRE ! THE MASCOT-MECH IS DOWN", 4); SFX.win(); }
    }
  }
  function hurtP(p) {
    if (p.inv > 0 || p.dead > 0 || p.out) return;
    p.lives--; p.dead = 1.6; p.wpn = "P"; p.ammo = 0; tone(160, 0.3, "sawtooth", 0.08, -100);
    FX.push({ k: "fly", x: p.x, y: p.y - 12, vx: -p.face * 60, vy: -260, t: 0.9, c: team.c1 });
    if (p.lives <= 0) { p.out = true; say(`${p.name} IS OUT`, 1.6); }
  }
  const WPN = { P: { cd: 0.2, sp: 430, n: 1, d: 1 }, M: { cd: 0.075, sp: 470, n: 1, d: 1, ammo: 150 }, S: { cd: 0.3, sp: 400, n: 5, d: 1, ammo: 45 }, F: { cd: 0.45, sp: 300, n: 1, d: 5, ammo: 24 } };
  function fire(p) {
    const w = WPN[p.wpn]; p.cd = w.cd;
    const len = Math.hypot(p.ax, p.ay) || 1, dx = p.ax / len, dy = p.ay / len, ox = p.x + dx * 11 * KS, oy = p.y - (p.crouch ? 9 : 16) * KS + dy * 8 * KS;
    for (let i = 0; i < w.n; i++) {
      const a = Math.atan2(dy, dx) + (w.n > 1 ? (i - (w.n - 1) / 2) * 0.16 : 0);
      B.push({ x: ox, y: oy, vx: Math.cos(a) * w.sp, vy: Math.sin(a) * w.sp, f: true, t: 0, k: p.wpn === "F" ? "r" : "b", d: w.d, o: p.i });
    }
    if (p.wpn !== "P" && --p.ammo <= 0) { p.wpn = "P"; }
    tone(p.wpn === "F" ? 220 : 700 + p.i * 60, 0.05, "square", 0.025, -400);
  }
  function grenade(p) { p.gren--; B.push({ x: p.x, y: p.y - 18, vx: p.face * 210 + p.vx * 0.4, vy: -260, f: true, t: 0, k: "g", d: 6, o: p.i }); }
  function botThink(p, dt) {
    const lead = Math.max(...alive().filter((q) => q.human).map((q) => q.x), g.cam + 120);
    let tx = clamp(lead - 30 - p.i * 22, g.cam + 20, g.cam + W - 40);
    let tgt = null, bd = 300;
    for (const e of E) { if (e.hp <= 0 || e.x < g.cam - 10 || e.x > g.cam + W + 20) continue; const d = Math.hypot(e.x - p.x, (e.y - eh(e) / 2) - (p.y - 14)); if (d < bd) { bd = d; tgt = e; } }
    p.in.mx = Math.abs(tx - p.x) > 10 ? Math.sign(tx - p.x) : 0; p.in.my = 0; p.in.a = 0;
    if (tgt) {
      const dx = tgt.x - p.x, dy = (tgt.y - eh(tgt) / 2) - (p.y - 14);
      if (Math.abs(dy) > Math.abs(dx) * 0.6 && dy < 0) { p.in.my = -1; p.in.mx = Math.abs(dx) > 30 ? Math.sign(dx) : 0; }
      else if (p.in.mx === 0 || Math.sign(dx) !== p.face) p.face = Math.sign(dx) || 1;
      p.in.a = Math.abs(dy) < 30 || p.in.my < 0 ? 1 : 0;
      if ((tgt.t === "van" || tgt.t === "boss") && Math.abs(dx) < 150 && p.gren > 0 && (p.botT -= dt) <= 0) { p.botT = 4; p.in.c++; }
    }
    for (const b of B) if (!b.f && Math.abs(b.x - p.x) < 50 && Math.abs(b.y - (p.y - 14)) < 18 && Math.sign(p.x - b.x) === Math.sign(b.vx) && p.on && Math.random() < 0.3) { p.in.b++; break; }
    for (const q of PLAT) if (q.k === "crate" && p.on && p.in.mx > 0 && q.x - p.x > 0 && q.x - p.x < 18) p.in.b++;
  }
  function step(dt) {
    g.t += dt; g.msgT -= dt; shake = Math.max(0, shake - dt * 20);
    const live = alive();
    if (!g.over && P.filter((p) => p.human).every((p) => p.out)) { g.over = true; g.result = "DÉFAITE"; SFX.over(); }
    if (g.endT !== undefined && (g.endT -= dt) <= 0 && !g.over) { g.over = true; g.result = "VICTOIRE"; g.score += P.reduce((s, p) => s + Math.max(0, p.lives) * 500, 0); }
    if (live.length) {
      const lead = Math.max(...live.map((p) => p.x)), back = Math.min(...live.map((p) => p.x));
      g.cam = clamp(Math.max(g.cam, Math.min(lead - 200, back - 16)), 0, BOSS_AT);
    }
    if (g.cam >= BOSS_AT - 1 && !g.boss) { g.boss = spawn("boss", LEN - 70, GY); g.boss.st = 0; say(`THE ${foeT.city.toUpperCase()} MASCOT-MECH!`, 2.5); SFX.crowd(); }
    for (const w of WAVES) if (!w.done && g.cam + W + 30 > w.x) {
      w.done = true;
      for (let i = 0; i < w.n; i++) {
        if (w.kind === "drone") spawn("drone", w.x + i * 30, 90 + Math.random() * 60);
        else if (w.kind === "sniper") { const pl = PLAT.find((q) => q.k === "balcony" && q.x > g.cam + W * 0.5 && q.x < g.cam + W + 200); spawn(pl ? "sniper" : "grunt", pl ? pl.x + pl.w / 2 : w.x + i * 26, pl ? pl.y : GY); }
        else spawn(w.kind, w.x + i * 26 + (w.kind === "van" ? 40 : 0), GY);
      }
    }
    for (const p of P) {
      if (p.out) continue;
      if (p.dead > 0) { p.dead -= dt; if (p.dead <= 0) { p.x = g.cam + 60 + p.i * 20; p.y = 40; p.vy = 0; p.inv = 2; p.gren = Math.max(p.gren, 2); } continue; }
      if (!p.human) botThink(p, dt);
      p.inv = Math.max(0, p.inv - dt); p.cd -= dt;
      const mx = p.in.mx, my = p.in.my;
      p.crouch = p.on && my > 0.5;
      p.vx = p.crouch ? 0 : mx * 118; if (mx) p.face = Math.sign(mx);
      if (p.in.b > p.lastB) { p.lastB = p.in.b; if (p.on) { p.vy = -440; p.on = false; SFX.jump(); } }
      if (p.in.c > p.lastC) { p.lastC = p.in.c; if (p.gren > 0) grenade(p); }
      if (my < -0.5) { p.ax = mx ? Math.sign(mx) : 0; p.ay = -1; } else if (my > 0.5 && !p.on) { p.ax = mx ? Math.sign(mx) : 0; p.ay = 1; } else { p.ax = p.face; p.ay = 0; }
      if (!p.ax && !p.ay) p.ax = p.face;
      if (p.in.a && p.cd <= 0) fire(p);
      const py0 = p.y; p.vy = Math.min(800, p.vy + GRAV * dt); p.x += p.vx * dt; p.y += p.vy * dt; p.on = false;
      if (p.y >= GY) { p.y = GY; p.vy = 0; p.on = true; }
      for (const q of PLAT) if (p.vy >= 0 && py0 <= q.y + 1 && p.y >= q.y && p.x > q.x - 4 && p.x < q.x + q.w + 4) { p.y = q.y; p.vy = 0; p.on = true; }
      p.x = clamp(p.x, g.cam + 8, Math.min(g.cam + W - 10, LEN - 10)); p.run = p.on && p.vx ? (Math.floor(g.t * 10) % 2 ? 1 : -1) : 0;
      for (const k of K) if (!k.got && Math.abs(k.x - p.x) < 14 && Math.abs(k.y - (p.y - 10)) < 20) {
        k.got = true;
        if (k.k === "food") { p.lives = Math.min(5, p.lives + 1); g.score += 500; say(`${team.food.toUpperCase()} ! +1 LIFE`, 1.6); SFX.coin(); }
        else { p.wpn = k.k; p.ammo = WPN[k.k].ammo; say({ M: "MITRAILLETTE!", S: "ÉVENTAIL!", F: "FUSÉE DE DÉTRESSE!" }[k.k], 1.2); tone(660, 0.08, "square", 0.06); tone(990, 0.12, "square", 0.06, 0, 0.08); }
      }
    }
    const rate = [1.4, 1, 0.75][diff];
    for (const e of E) {
      if (e.hp <= 0) continue;
      e.hit = Math.max(0, e.hit - dt); e.cd -= dt;
      const p = nearestP(e.x, e.y - 12); if (!p) break;
      const dx = p.x - e.x; e.face = Math.sign(dx) || -1;
      if (e.t === "grunt") {
        const want = Math.abs(dx) > 150 ? Math.sign(dx) * 70 : Math.abs(dx) < 60 ? -Math.sign(dx) * 40 : 0;
        e.vx = want; e.x += e.vx * dt; e.vy = Math.min(800, e.vy + GRAV * dt); e.y = Math.min(GY, e.y + e.vy * dt); if (e.y >= GY) e.vy = 0;
        if (e.cd <= 0 && Math.abs(dx) < 300) { e.cd = rate * (1.3 + Math.random()); eshot(e.x + e.face * 10, e.y - 21, p.x, p.y - 18, 170); }
      } else if (e.t === "lob") {
        if (e.cd <= 0 && Math.abs(dx) < 280) { e.cd = rate * (2 + Math.random()); const T = 0.9, vx = dx / T; B.push({ x: e.x, y: e.y - 20, vx, vy: -GRAV * T / 2 + (p.y - e.y) / T, f: false, t: 0, k: "bottle", d: 1 }); }
      } else if (e.t === "sniper") {
        if (e.cd <= 0 && Math.abs(dx) < 340) { e.cd = rate * (1.6 + Math.random()); eshot(e.x, e.y - 22, p.x, p.y - 16, 210); }
      } else if (e.t === "drone") {
        e.x += (p.x + Math.sin(g.t + e.id) * 60 - e.x) * dt * 0.8; e.y = 80 + Math.sin(g.t * 2 + e.id) * 14 + (e.id % 3) * 16;
        if (e.cd <= 0 && Math.abs(dx) < 60) { e.cd = rate * 1.6; B.push({ x: e.x, y: e.y + 4, vx: 0, vy: 40, f: false, t: 0, k: "bomb", d: 1 }); }
      } else if (e.t === "van") {
        e.x -= 85 * dt; if (e.x < g.cam - 80) e.hp = 0;
        for (const q of alive()) if (Math.abs(q.x - e.x) < 30 && q.y > GY - 30) hurtP(q);
      } else if (e.t === "boss") {
        e.x = Math.min(e.x, LEN - 50); if ((e.st -= dt) <= 0) {
          const mv = Math.floor(Math.random() * 3); e.st = rate * (2.2 + Math.random());
          if (mv === 0) { for (let i = -2; i <= 2; i++) { const a = Math.atan2(p.y - 14 - (e.y - 70), dx) + i * 0.2; B.push({ x: e.x - 24, y: e.y - 70, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190, f: false, t: 0, k: "ball", d: 1 }); } tone(120, 0.2, "sawtooth", 0.08); }
          else if (mv === 1) { e.vy = -520; e.vx = clamp(dx, -260, 120) * 1.1; e.jump = true; }
          else { spawn("grunt", e.x - 40, GY); spawn("grunt", e.x + 20, GY); say("REINFORCEMENTS!", 1); }
        }
        if (e.jump) { e.vy += GRAV * dt; e.x = clamp(e.x + e.vx * dt, BOSS_AT + 40, LEN - 40); e.y += e.vy * dt; if (e.y >= GY) { e.y = GY; e.jump = false; shake = 8; noise(0.3, 0.2, 400); for (const s of [-1, 1]) B.push({ x: e.x + s * 30, y: GY - 6, vx: s * 230, vy: 0, f: false, t: 0, k: "wave", d: 1 }); } }
        for (const q of alive()) if (Math.abs(q.x - e.x) < 30 && q.y > e.y - 80) hurtP(q);
      }
    }
    for (let i = E.length - 1; i >= 0; i--) if (E[i].hp <= 0 || E[i].x < g.cam - 120) E.splice(i, 1);
    for (const b of B) {
      b.t += dt;
      if (b.k === "g" || b.k === "bottle") b.vy += GRAV * dt;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.k === "g" && (b.y >= GY - 3 || b.t > 1.6)) { b.dead = true; boom(b.x, Math.min(b.y, GY - 6), 42, 6, true); continue; }
      if (b.k === "bottle" && b.y >= GY - 2) { b.dead = true; FX.push({ k: "glass", x: b.x, y: GY - 2, t: 0.4 }); noise(0.06, 0.06, 3000); continue; }
      if (b.k === "wave") { if (b.t > 2) b.dead = true; }
      else if (b.x < g.cam - 20 || b.x > g.cam + W + 20 || b.y < -20 || b.y > H + 10) { b.dead = true; continue; }
      if (b.f) {
        if (b.k === "g") continue;
        for (const e of E) if (e.hp > 0 && Math.abs(b.x - e.x) < ew(e) / 2 + 2 && b.y < e.y + 2 && b.y > e.y - eh(e) - 2) { b.dead = true; if (b.k === "r") boom(b.x, b.y, 26, b.d, true); else hurtE(e, b.d); break; }
        if (!b.dead) for (const q of PLAT) if (q.k === "crate" && b.x > q.x && b.x < q.x + q.w && b.y > q.y && b.y < GY) { b.dead = true; break; }
      } else for (const p of alive()) {
        const top = p.y - (p.crouch ? 14 : 24) * KS;
        if (Math.abs(b.x - p.x) < 8 && b.y > top && b.y < p.y) { b.dead = true; hurtP(p); break; }
      }
    }
    for (let i = B.length - 1; i >= 0; i--) if (B[i].dead) B.splice(i, 1);
    for (const k of K) { if (k.vy !== undefined && !k.got) { k.vy += GRAV * 0.5 * dt; k.y = Math.min(GY - 10, k.y + k.vy * dt); } }
    for (let i = FX.length - 1; i >= 0; i--) { const f = FX[i]; f.t -= dt; if (f.k === "fly") { f.vy += GRAV * dt; f.x += f.vx * dt; f.y += f.vy * dt; } if (f.t <= 0) FX.splice(i, 1); }
    if (!g.over && Math.random() < dt * 0.04) SFX.crowd();
  }
  g.setSlot = (i, id, name) => { const p = P[i]; if (!p) return; p.human = { id, name }; p.who = name; p.lastB = p.in.b = 0; p.lastC = p.in.c = 0; };
  g.netInput = (id, m) => { const p = P.find((q) => q.human && q.human.id === id); if (!p) return; p.in.mx = clamp(+m.mx || 0, -1, 1); p.in.my = clamp(+m.my || 0, -1, 1); p.in.a = m.a ? 1 : 0; p.in.b = Math.max(p.in.b, +m.b || 0); p.in.c = Math.max(p.in.c, +m.c || 0); };
  g.netState = (id, m) => { if (!host) g.net = m; };
  let myB = 0, myC = 0;
  const myHands = () => ({ mx: (held("ArrowRight", "KeyD") ? 1 : 0) - (held("ArrowLeft", "KeyA") ? 1 : 0), my: (held("ArrowDown", "KeyS") ? 1 : 0) - (held("ArrowUp", "KeyW") ? 1 : 0), a: held("Space") ? 1 : 0 });
  g.update = (dt) => {
    if (pressed("Enter", "KeyX")) myB++;
    if (pressed("KeyE", "ShiftLeft")) myC++;
    if (!host) {
      g.sendT -= dt;
      if (g.sendT <= 0) { g.sendT = 0.05; online.send(Object.assign({ t: "in", b: myB, c: myC }, myHands())); }
      const m = g.net; if (!m) return;
      const k = Math.min(1, dt * 14);
      g.cam += (m.cam - g.cam) * k;
      m.P.forEach((q, i) => { const p = P[i]; if (!p) return; p.x += (q[0] - p.x) * k; p.y += (q[1] - p.y) * k; p.face = q[2]; p.ax = q[3]; p.ay = q[4]; p.crouch = !!q[5]; p.dead = q[6]; p.inv = q[7]; p.lives = q[8]; p.wpn = q[9]; p.gren = q[10]; p.out = !!q[11]; p.run = q[12]; });
      const seen = new Set();
      for (const q of m.E) { seen.add(q[0]); let e = E.find((x) => x.id === q[0]); if (!e) { e = { id: q[0], x: q[2], y: q[3] }; E.push(e); } e.t = TYPES[q[1]]; e.x += (q[2] - e.x) * k; e.y += (q[3] - e.y) * k; e.face = q[4]; e.hp = q[5]; e.max = 1; e.hit = q[6]; }
      for (let i = E.length - 1; i >= 0; i--) if (!seen.has(E[i].id)) E.splice(i, 1);
      if (m.B !== g.lastB) { B.length = 0; for (const q of m.B) B.push({ x: q[0], y: q[1], vx: q[2], vy: q[3], f: !!q[4], k: q[5] }); g.lastB = m.B; } else for (const b of B) { if (b.k === "g" || b.k === "bottle") b.vy += GRAV * dt; b.x += b.vx * dt; b.y += b.vy * dt; }
      K.length = 0; for (const q of m.K) K.push({ x: q[0], y: q[1], k: q[2] });
      if (m.fx) for (const f of m.fx) { FX.push({ k: "boom", x: f[0], y: f[1], r: f[2], t: 0.45 }); SFX.boom(); shake = Math.max(shake, f[2] / 8); }
      m.fx = null;
      g.score = m.s; if (m.msg !== g.msg) { g.msg = m.msg; g.msgT = m.msgT; } g.boss = m.boss ? { hp: m.boss } : null;
      if (m.over && !g.over) { g.over = true; g.result = m.res; if (m.res === "VICTOIRE") SFX.win(); else SFX.over(); }
      g.t += dt; g.msgT -= dt; shake = Math.max(0, shake - dt * 20);
      for (let i = FX.length - 1; i >= 0; i--) { FX[i].t -= dt; if (FX[i].t <= 0) FX.splice(i, 1); }
      return;
    }
    const mine = P.find((p) => p.human && p.human.id === me);
    if (mine) { Object.assign(mine.in, myHands()); mine.in.b = myB; mine.in.c = myC; }
    if (!g.over) step(dt);
    if (online) {
      g.sendT -= dt;
      if (g.sendT <= 0) {
        g.sendT = 0.05;
        const fx = FX.filter((f) => f.k === "boom" && !f.sent); fx.forEach((f) => { f.sent = true; });
        online.send({ t: "st", cam: Math.round(g.cam),
          P: P.map((p) => [Math.round(p.x), Math.round(p.y), p.face, p.ax, p.ay, p.crouch ? 1 : 0, +p.dead.toFixed(1), +p.inv.toFixed(1), p.lives, p.wpn, p.gren, p.out ? 1 : 0, p.run]),
          E: E.filter((e) => e.hp > 0).map((e) => [e.id, TYPES.indexOf(e.t), Math.round(e.x), Math.round(e.y), e.face, +(e.hp / e.max).toFixed(2), e.hit > 0 ? 1 : 0]),
          B: B.slice(0, 80).map((b) => [Math.round(b.x), Math.round(b.y), Math.round(b.vx), Math.round(b.vy), b.f ? 1 : 0, b.k]),
          K: K.filter((k) => !k.got).map((k) => [Math.round(k.x), Math.round(k.y), k.k]), fx: fx.map((f) => [Math.round(f.x), Math.round(f.y), f.r]),
          s: g.score, msg: g.msg, msgT: +g.msgT.toFixed(1), boss: g.boss && g.boss.hp > 0 ? +(g.boss.hp / g.boss.max).toFixed(2) : 0, over: g.over, res: g.result });
      }
    }
  };
  g.draw = () => {
    const sx = (shake ? (Math.random() - 0.5) * shake : 0), cam = g.cam;
    cx.save(); cx.translate(sx, 0);
    rect(-4, 0, W + 8, H, SCN.sky[0]);
    cx.drawImage(far, cam * 0.22 * 2, 0, W * 2, 520, 0, 0, W, 260);
    cx.drawImage(mid, cam * 0.55 * 2, 0, W * 2, 600, 0, 0, W, 300);
    const [gk, g1, g2] = SCN.ground;
    rect(0, GY - 8, W, H - GY + 8, g1);
    if (gk === "quay") { rect(0, GY - 8, W, 4, "#78716c"); for (let x = -(cam % 160); x < W; x += 160) { rect(x + 20, GY - 18, 10, 12, "#292524"); rect(x + 18, GY - 20, 14, 3, "#44403c"); } }
    if (gk === "promenade") { for (let x = -(cam % 60); x < W; x += 60) { rect(x + 8, GY - 16, 14, 2, "#0284c7"); rect(x + 8, GY - 16, 2, 8, "#0284c7"); rect(x + 20, GY - 16, 2, 8, "#0284c7"); rect(x + 8, GY - 22, 2, 6, "#0284c7"); } }
    const tw = gk === "brick" ? 18 : gk === "asphalt" ? 60 : 24, th = gk === "asphalt" ? 30 : 12;
    for (let row = 0; GY + row * th < H; row++) for (let x = -((cam + row * tw / 2) % tw); x < W; x += tw) { rect(x, GY + row * th, tw - 1, th - 1, (row + Math.floor((x + cam) / tw)) % 3 ? g1 : g2); }
    if (gk === "asphalt") for (let x = -(cam % 50); x < W; x += 50) rect(x, GY + 20, 24, 2, "#fde047");
    for (const q of PLAT) {
      const x0 = q.x - cam; if (x0 > W || x0 + q.w < 0) continue;
      if (q.k === "crate") { rect(x0, q.y, q.w, GY - q.y, "#a16207"); rect(x0 + 2, q.y + 2, q.w - 4, GY - q.y - 4, "#ca8a04"); rect(x0, q.y + (GY - q.y) / 2, q.w, 2, "#78350f"); }
      else if (q.k === "balcony") { rect(x0, q.y, q.w, 5, "#44403c"); for (let i = 2; i < q.w; i += 6) rect(x0 + i, q.y - 9, 1, 9, "#57534e"); rect(x0, q.y - 10, q.w, 2, "#57534e"); rect(x0 + 4, q.y + 5, 3, GY - q.y - 5, "#57534e"); rect(x0 + q.w - 7, q.y + 5, 3, GY - q.y - 5, "#57534e"); }
      else { rect(x0, q.y, q.w, GY - q.y - 6, foeT.c2 === "#f8fafc" ? "#64748b" : foeT.c2); rect(x0 + 4, q.y + 4, q.w - 8, 8, "#93c5fd"); circ(x0 + 16, GY - 5, 5, "#111827"); circ(x0 + q.w - 16, GY - 5, 5, "#111827"); txt("BUS", x0 + q.w / 2, q.y + 22, 7, "#f8fafc", "center"); }
    }
    for (const k of K) {
      if (k.got) continue; const x0 = k.x - cam, bob = Math.sin(g.t * 5 + k.x) * 2;
      if (k.k === "food") { rect(x0 - 8, k.y - 6 + bob, 16, 10, "#f8fafc"); rect(x0 - 6, k.y - 4 + bob, 12, 6, "#f97316"); txt(team.food, x0, k.y - 10 + bob, 7, "#fde68a", "center"); }
      else { rect(x0 - 7, k.y - 7 + bob, 14, 14, "#1f2937"); rect(x0 - 6, k.y - 6 + bob, 12, 12, { M: "#dc2626", S: "#2563eb", F: "#f59e0b" }[k.k]); txt(k.k, x0, k.y + 3 + bob, 10, "#fff", "center"); }
    }
    for (const e of E) {
      if (e.hp <= 0 && !online) continue;
      const x0 = e.x - cam; if (x0 < -80 || x0 > W + 80) continue;
      if (e.hit > 0) cx.globalAlpha = 0.5;
      if (e.t === "grunt" || e.t === "lob" || e.t === "sniper") guy(x0, e.y, e.face, 1, 0, false, { c1: foeT.c1, c2: foeT.c2 }, e.t === "lob" ? "#e0ac69" : "#c68642", "#111827", Math.floor(g.t * 8 + e.id) % 2 ? 1 : -1, undefined, foeT.c2);
      else if (e.t === "drone") { rect(x0 - 9, e.y - 4, 18, 5, "#374151"); rect(x0 - 12, e.y - 7, 6, 2, "#9ca3af"); rect(x0 + 6, e.y - 7, 6, 2, "#9ca3af"); rect(x0 - 3, e.y + 1, 6, 3, foeT.c1); }
      else if (e.t === "van") { rect(x0 - 27, e.y - 30, 54, 24, foeT.c1); rect(x0 - 27, e.y - 30, 54, 5, foeT.c2); rect(x0 - 27, e.y - 22, 14, 9, "#93c5fd"); circ(x0 - 15, e.y - 5, 5, "#111827"); circ(x0 + 15, e.y - 5, 5, "#111827"); txt(foeT.city.slice(0, 6).toUpperCase(), x0 + 4, e.y - 13, 7, foeT.c2, "center"); }
      else if (e.t === "boss") {
        rect(x0 - 26, e.y - 30, 12, 30, "#4b5563"); rect(x0 + 14, e.y - 30, 12, 30, "#4b5563"); rect(x0 - 30, e.y - 4, 18, 4, "#1f2937"); rect(x0 + 12, e.y - 4, 18, 4, "#1f2937");
        rect(x0 - 30, e.y - 58, 60, 30, "#6b7280"); rect(x0 - 30, e.y - 58, 60, 6, foeT.c2); rect(x0 - 50, e.y - 72, 26, 8, "#374151");
        circ(x0, e.y - 76, 22, foeT.c1); circ(x0 - 8, e.y - 80, 5, "#f8fafc"); circ(x0 + 8, e.y - 80, 5, "#f8fafc"); circ(x0 - 8 + e.face * 2, e.y - 80, 2, "#111827"); circ(x0 + 8 + e.face * 2, e.y - 80, 2, "#111827");
        rect(x0 - 8, e.y - 68, 16, 4, "#7f1d1d"); rect(x0 - 22, e.y - 98, 44, 5, foeT.c2);
      }
      cx.globalAlpha = 1;
    }
    P.forEach((p, i) => {
      if (p.out || p.dead > 0) return;
      if (p.inv > 0 && Math.floor(g.t * 14) % 2) cx.globalAlpha = 0.4;
      guy(p.x - cam, p.y, p.face, p.ax * p.face, p.ay, p.crouch, { c1: team.c1, c2: team.c2 }, p.skin, p.hair, p.run, [10, 7, 9, 4][i], null);
      cx.globalAlpha = 1;
      txt(p.name.slice(0, 10), p.x - cam, p.y - (p.crouch ? 26 : 40), 7, p.human && p.human.id === me ? "#fde047" : "#e5e7eb", "center");
    });
    for (const b of B) {
      const x0 = b.x - cam;
      if (b.k === "g") { rect(x0 - 2, b.y - 3, 4, 6, "#dc2626"); rect(x0 - 1, b.y - 5, 2, 2, "#fde047"); }
      else if (b.k === "bottle") rect(x0 - 2, b.y - 3, 3, 6, "#15803d");
      else if (b.k === "bomb") circ(x0, b.y, 3, "#111827");
      else if (b.k === "wave") { rect(x0 - 8, b.y - 4, 16, 8, "rgba(250,204,21,.8)"); }
      else if (b.k === "ball") circ(x0, b.y, 4, "#f97316");
      else if (b.k === "r") { rect(x0 - 4, b.y - 2, 8, 4, "#f59e0b"); rect(x0 - 8 * Math.sign(b.vx || 1), b.y - 1, 4, 2, "#fde047"); }
      else rect(x0 - 2, b.y - 1, 4, 2, b.f ? "#fde047" : "#f87171");
    }
    for (const f of FX) {
      const x0 = f.x - cam;
      if (f.k === "boom") { const k = 1 - f.t / 0.45; circ(x0, f.y, f.r * (0.4 + k * 0.7), `rgba(251,146,60,${1 - k})`); circ(x0, f.y, f.r * 0.5 * (1 - k), "rgba(254,240,138,.9)"); }
      else if (f.k === "fly") { rect(x0 - 4, f.y - 8, 8, 14, f.c); }
      else if (f.k === "pts") txt(f.s, x0, f.y - (0.9 - f.t) * 20, 9, "#fde047", "center");
      else if (f.k === "glass") { rect(x0 - 4, f.y, 2, 2, "#86efac"); rect(x0 + 2, f.y - 1, 2, 2, "#86efac"); }
    }
    cx.restore();
    P.forEach((p, i) => {
      const x0 = 6 + i * 118; rect(x0, 4, 112, 22, "rgba(5,7,13,.65)"); rect(x0, 4, 3, 22, team.c1);
      txt(p.name.slice(0, 11) + (p.human ? "" : " ·bot"), x0 + 6, 13, 7, p.human && p.human.id === me ? "#fde047" : "#e5e7eb");
      txt(p.out ? "OUT" : "♥".repeat(Math.max(0, p.lives)) + `  ${p.wpn}  ✸${p.gren}`, x0 + 6, 23, 8, p.out ? "#f87171" : "#fca5a5");
    });
    txt(String(g.score).padStart(6, "0"), W - 6, 40, 12, "#fde047", "right");
    rect(W / 2 - 60, 34, 120, 3, "rgba(255,255,255,.2)"); rect(W / 2 - 60, 34, 120 * clamp(g.cam / BOSS_AT, 0, 1), 3, team.c2 === "#f8fafc" ? team.c1 : team.c2);
    if (g.boss) { const fr = g.boss.max ? g.boss.hp / g.boss.max : g.boss.hp; rect(W / 2 - 100, 44, 200, 6, "#1f2937"); rect(W / 2 - 100, 44, 200 * clamp(fr, 0, 1), 6, "#ef4444"); txt("MASCOT-MECH", W / 2, 58, 8, "#fca5a5", "center"); }
    if (g.msgT > 0 && g.msg) { rect(0, 116, W, 26, "rgba(5,7,13,.6)"); txt(g.msg, W / 2, 134, 13, "#fde047", "center"); }
    if (g.over) {
      rect(W / 2 - 150, 120, 300, 104, "rgba(5,7,13,.86)"); rect(W / 2 - 150, 120, 300, 4, g.result === "VICTOIRE" ? "#22c55e" : "#ef4444");
      txt(g.result === "VICTOIRE" ? "VICTOIRE !" : "DÉFAITE", W / 2, 152, 22, g.result === "VICTOIRE" ? "#86efac" : "#fca5a5", "center");
      txt(`${team.city} ${away ? "à" : "vs"} ${foeT.city} · score ${g.score}`, W / 2, 176, 10, "#e5e7eb", "center");
      txt(online ? (window.againLine ? window.againLine() : "tap to play again") : window.TouchPad && TouchPad.on ? "tap: play again · ☰ menu" : "Space: play again · Esc menu", W / 2, 204, 9, "#a7b0c0", "center");
    }
  };
  g.dbg = () => ({ cam: Math.round(g.cam), P: P.map((p) => [Math.round(p.x), Math.round(p.y), p.lives, p.wpn, !!p.human]), E: E.length, B: B.length, boss: !!g.boss, place: place.city, foe: foeT.city });
  g.dbgSkip = (x) => { g.cam = Math.min(x, BOSS_AT); for (const p of P) p.x = g.cam + 60 + p.i * 20; for (const w of WAVES) if (w.x < g.cam) w.done = true; };
  return g;
}
