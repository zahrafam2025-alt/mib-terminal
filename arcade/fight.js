"use strict";
const FIGHTERS = [
  { n: "EXCELSIOR MAN", col: "#1e3a8a", skin: "#f1c27d", h: 1, spd: 1, pow: 1, reach: 1, sp: "proj", spn: "THE GRAPH", say: "The planet is in DANGER!", cape: "#dc2626" },
  { n: "LE GARÇON CHARIOT", col: "#b91c1c", skin: "#f5d0a9", h: 0.85, spd: 1.05, pow: 0.95, reach: 0.9, sp: "dash", spn: "CHARGE !", say: "C'est MON goûter !", box: true },
  { n: "GROS PANDA", col: "#f8fafc", skin: "#f8fafc", h: 1.12, spd: 0.85, pow: 1.15, reach: 1, sp: "grab", spn: "BAMBOO SLAM", say: "*munch munch*", panda: true },
  { n: "LE COLOSSE", col: "#64748b", skin: "#a8a29e", h: 1.32, spd: 0.75, pow: 1.3, reach: 1.15, sp: "quake", spn: "GROUND POUND", say: "GRRRRR.", big: true },
  { n: "NICO SAUCISSON", col: "#2563eb", skin: "#f1c27d", h: 1, spd: 1.1, pow: 0.95, reach: 1.05, sp: "proj", spn: "PISTOLET À BOUCHON", say: "Mademoiselle, un verre ?", salami: true },
  { n: "ROBERT LE LOURDAUD", col: "#78350f", skin: "#e0ac69", h: 1.15, spd: 0.85, pow: 1.2, reach: 1, sp: "dash", spn: "BULLDOZER", say: "Pas lourd : costaud !", tank: true },
  { n: "KENJI LE SURVIVANT", col: "#1f2937", skin: "#e0ac69", h: 1.05, spd: 1.05, pow: 1.05, reach: 1, sp: "flurry", spn: "100 POINGS", say: "Tu es déjà mort.", vest: true },
  { n: "MICHEL KAL", col: "#4d7c0f", skin: "#f1c27d", h: 1, spd: 1, pow: 0.95, reach: 1, sp: "stun", spn: "FLASH INFO", say: "En direct du front !", helmet: true },
  { n: "MONSIEUR PEIGNOIR", col: "#f9a8d4", skin: "#f1c27d", h: 1, spd: 0.9, pow: 1, reach: 1, sp: "proj", spn: "CHAUSSON VOLANT", say: "Encore cinq minutes…", robe: true },
  { n: "OURS", col: "#7c4a21", skin: "#7c4a21", h: 1.2, spd: 0.85, pow: 1.2, reach: 1.05, sp: "grab", spn: "CÂLIN D'OURS", say: "ROOAAAR !", bear: true },
  { n: "MOUSTACHE", col: "#dc2626", skin: "#f1c27d", h: 1.05, spd: 0.95, pow: 1.15, reach: 1, sp: "upper", spn: "UPPERCUT MOUSTACHU", say: "Admirez ces biceps !", stache: true },
  { n: "SABRISTI", col: "#7c3aed", skin: "#e0ac69", h: 1.3, spd: 1, pow: 0.9, reach: 1.35, sp: "long", spn: "BRAS ÉLASTIQUE", say: "Trop grand pour toi.", thin: true },
  { n: "RIGOLUS", col: "#facc15", skin: "#fef3c7", h: 0.95, spd: 1.1, pow: 0.9, reach: 1, sp: "stun", spn: "TARTE À LA CRÈME", say: "Pouet pouet !", clown: true },
];
const MOVES = [
  { p: ["POINTEUR LASER", 1.35, 5, 0.26, 80, 0.22, "", "stick"], k: ["COUP DE CAPE", 1.1, 9, 0.4, 230, 0.32, "", "cape"], c: ["UNE VÉRITÉ QUI DÉRANGE", 11, "push"] },
  { p: ["BOUCLIER EN CARTON", 0.9, 6, 0.24, 120, 0.25, "", "shield"], k: ["ROUE QUI ÉCRASE", 1.05, 8, 0.4, 90, 0.3, "down", "wheel"], c: ["CAPRICE !", 9, "push"] },
  { p: ["PATTE MOLLE", 1, 8, 0.34, 140, 0.3, "", "paw"], k: ["ROULADE", 1.2, 10, 0.5, 200, 0.35, "lunge", "roll"], c: ["COUP DE BAMBOU", 12, "dizzy"] },
  { p: ["MASSUE", 1.15, 10, 0.42, 220, 0.4, "", "club"], k: ["ÉCRASE-PIED", 0.9, 9, 0.45, 40, 0.3, "down", "stomp"], c: ["GRRROAR", 6, "dizzy"] },
  { p: ["COUP DE SAUCISSON", 1.3, 6, 0.26, 100, 0.24, "", "salami"], k: ["CLIN D'ŒIL", 1.1, 4, 0.35, 30, 0.2, "dizzy", "wink"], c: ["CROSSE DE PISTOLET", 11, "push"] },
  { p: ["GROSSE GIFLE", 1, 8, 0.32, 180, 0.32, "", "slap"], k: ["COUP DE BIDE", 0.95, 10, 0.42, 280, 0.35, "", "belly"], c: ["COUP DE BOULE", 12, "dizzy"] },
  { p: ["JAB ÉCLAIR", 1, 4, 0.16, 50, 0.18, "multi", "fist"], k: ["COUP DE PIED VOLANT", 1.25, 10, 0.45, 220, 0.35, "lunge", "flykick"], c: ["POINT VITAL", 9, "dizzy"] },
  { p: ["COUP DE MICRO", 1.1, 6, 0.26, 100, 0.25, "", "mic"], k: ["RANGERS", 1.05, 9, 0.4, 200, 0.32, "", "boot"], c: ["QUESTION PIÈGE", 8, "dizzy"] },
  { p: ["CEINTURE FOUET", 1.4, 5, 0.3, 90, 0.25, "", "belt"], k: ["CHAUSSON CLAQUE", 1, 8, 0.38, 160, 0.3, "", "slipper"], c: ["BÂILLEMENT", 5, "sleep"] },
  { p: ["GRIFFES", 1.05, 4, 0.3, 60, 0.22, "multi", "claw"], k: ["COUP DE PATTE", 1.15, 10, 0.42, 240, 0.34, "", "paw"], c: ["ROOOAR", 7, "dizzy"] },
  { p: ["HALTÈRE", 1.05, 9, 0.38, 200, 0.34, "", "dumbbell"], k: ["FLEX !", 0.9, 7, 0.4, 260, 0.3, "", "flex"], c: ["FOUET MOUSTACHE", 11, "launch"] },
  { p: ["BRAS LONG", 1.6, 5, 0.3, 80, 0.22, "", "longarm"], k: ["GRAND COMPAS", 1.55, 8, 0.42, 180, 0.3, "", "longleg"], c: ["PLIAGE SURPRISE", 10, "push"] },
  { p: ["FLEUR À EAU", 1.8, 3, 0.3, 30, 0.2, "squirt", "flower"], k: ["GROSSE CHAUSSURE", 1.1, 9, 0.4, 260, 0.32, "", "bigshoe"], c: ["POUET !", 7, "dizzy"] },
];
function Fight(online = null) {
  const FLOOR = 300, X0 = 26, X1 = 454, G = 1100, ROUND = 60, WIN = 2;
  const host = !online || online.host, me = online ? online.me : 0;
  const humans = online ? online.players.slice(0, 2) : [{ id: 0, name: (window.ARC && ARC.getName()) || "YOU" }];
  let opt = {}; try { opt = (online && online.opt) || JSON.parse(localStorage.getItem("arcade-sheet-fight") || "{}"); } catch (e) {}
  const DIFF = +(opt.diff || 1);
  const mk = (i) => ({ i, human: humans[i] || null, name: humans[i] ? humans[i].name : "CPU", c: -1, cur: i ? 7 : 0, ok: false,
    x: 0, y: FLOOR, vx: 0, vy: 0, face: 1, hp: 100, meter: 0, st: "idle", t: 0, combo: 0, comboT: 0, dizzy: 0, down: 0, hitDone: false,
    in: { mx: 0, my: 0, a: 0, b: 0, s: 0 }, la: 0, lb: 0, ls: 0, aT: -9, bT: -9, wins: 0, react: 0, plan: "", doom: 0 });
  const F = [mk(0), mk(1)], shots = [], sparks = [], pops = [];
  const WORDS = ["PAF !", "BIM !", "VLAN !", "POW !", "SBAM !", "TCHAC !", "BONK !", "SPLATCH !", "BOING !", "CRAC !"];
  const pop = (x, y, big, word) => { pops.push({ x, y, t: big ? 0.9 : 0.6, big: !!big, w: word || WORDS[Math.floor(Math.random() * WORDS.length)], r: (Math.random() - 0.5) * 0.5 }); if (pops.length > 6) pops.shift(); g.shake = Math.max(g.shake || 0, big ? 0.35 : 0.12); };
  const speak = (text, c) => {
    try {
      if (typeof sound !== "undefined" && !sound) return;
      const u = new SpeechSynthesisUtterance(text.replace(/\*/g, "")); u.lang = "fr-FR";
      const v = speechSynthesis.getVoices().find((x) => /^fr/i.test(x.lang)); if (v) u.voice = v;
      u.pitch = [0.9, 1.6, 0.8, 0.4, 1.1, 0.6, 0.8, 1, 0.7, 0.3, 0.9, 1.2, 1.8][c] || 1; u.rate = c === 8 ? 0.7 : 1.05;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) {}
  };
  const trombone = () => [392, 370, 349, 294].forEach((f, i) => tone(f, i === 3 ? 0.7 : 0.28, "sawtooth", 0.05, i === 3 ? -40 : 0, i * 0.3));
  const g = { id: "fight", own: true, score: 0, over: false, phase: "select", round: 1, tm: ROUND, msg: "", msgT: 0, result: null, sendT: 0, net: null,
    help: "arrows: walk, jump, crouch (walk away = block) · Space punch (3 = combo) · Enter/X kick · A+B or E special · block (walk away) then A or B = COUNTER · Esc menu" };
  const mine = () => F.find((f) => f.human && f.human.id === me);
  const say = (s, t = 1.4) => { g.msg = s; g.msgT = t; };
  function place() {
    F[0].x = 150; F[1].x = 330;
    for (const f of F) Object.assign(f, { y: FLOOR, vx: 0, vy: 0, hp: 100, st: "idle", t: 0, combo: 0, dizzy: 0, down: 0, doom: 0, fly: 0, spinA: 0, parryT: 0 });
    shots.length = 0; g.tm = ROUND; say(`ROUND ${g.round}`, 1.2); setTimeout(() => { if (g.phase === "fight") say("FIGHT !", 0.8); }, 1000);
    g.freeze = 1.6;
  }
  function selectStep(f) {
    if (f.ok) return;
    if (!f.human) { if (F[1 - f.i].human && !F[1 - f.i].ok) return;
      const others = [...FIGHTERS.keys()].filter((k) => k !== F[1 - f.i].c); f.c = f.cur = others[Math.floor(Math.random() * others.length)]; f.ok = true; return; }
    if (f.human.id !== me) return;
    const L = pressed("ArrowLeft", "KeyA"), R = pressed("ArrowRight", "KeyD"), U = pressed("ArrowUp", "KeyW"), D = pressed("ArrowDown", "KeyS");
    const ts = window.TSTICK; f.stickT = (f.stickT || 0) - 1 / 60;
    let mv = L ? -1 : R ? 1 : U ? -4 : D ? 4 : 0;
    if (!mv && ts && f.stickT <= 0 && Math.hypot(ts.x, ts.y) > 0.6) { mv = Math.abs(ts.x) > Math.abs(ts.y) ? Math.sign(ts.x) : Math.sign(ts.y) * 4; f.stickT = 0.22; }
    if (mv) { f.cur = (f.cur + mv + FIGHTERS.length * 3) % FIGHTERS.length; tone(520, 0.03, "square", 0.03); }
    if (pressed("Space", "Enter")) { f.c = f.cur; f.ok = true; tone(780, 0.08, "square", 0.05); }
  }
  function bot(f, o, dt) {
    if (f.parryT > 0 && !f.triedParry) { f.triedParry = true; if (Math.random() < [0.08, 0.25, 0.5][DIFF]) { f.in.a++; return; } }
    if (!(f.parryT > 0)) f.triedParry = false;
    f.react -= dt; if (f.react > 0) return; f.react = [0.32, 0.2, 0.11][DIFF] + Math.random() * 0.08;
    const d = o.x - f.x, ad = Math.abs(d), C = FIGHTERS[f.c], reach = 58 * C.reach;
    f.in.mx = 0; f.in.my = 0;
    const threat = (o.st === "punch" || o.st === "kick" || o.st === "special") && ad < 110;
    if (threat && Math.random() < [0.15, 0.4, 0.65][DIFF]) { f.in.mx = -Math.sign(d); return; }
    if (f.meter >= 50 && Math.random() < 0.35 && (C.sp === "proj" || C.sp === "stun" ? ad > 90 : ad < reach * 1.5)) { f.in.s++; return; }
    if (ad > reach * 0.9) { f.in.mx = Math.sign(d); if (Math.random() < 0.04) f.in.my = -1; return; }
    if (Math.random() < 0.55) f.in.a++; else if (Math.random() < 0.6) f.in.b++; else f.in.mx = -Math.sign(d) * (Math.random() < 0.5 ? 1 : 0);
  }
  function hit(att, def, dmg, kb, stun, kind) {
    const away = def.in.mx !== 0 && Math.sign(def.in.mx) === -Math.sign(att.x - def.x);
    const blocking = def.y >= FLOOR && !def.dizzy && !def.down && (def.st === "block" || (away && ["idle", "walk", "crouch"].includes(def.st)));
    if (blocking && kind !== "grab" && kind !== "quake") {
      def.hp -= dmg * 0.15; def.vx = Math.sign(def.x - att.x) * kb * 0.4; def.st = "block"; def.t = 0.18; att.meter = Math.min(100, att.meter + 3);
      def.parryT = 0.6; def.parryFrom = att;
      tone(300, 0.04, "square", 0.05); sparks.push({ x: (att.x + def.x) / 2, y: def.y - 60, t: 0.2, c: "#93c5fd" }); return;
    }
    def.hp -= dmg; def.vx = Math.sign(def.x - att.x) * kb; def.st = "hit"; def.t = stun;
    pop((att.x + def.x) / 2, def.y - 70 - Math.random() * 20, dmg >= 12 || kind === "grab" || kind === "quake" || kind === "dash", kind === "proj" && dmg < 5 ? "SPLASH !" : null); att.meter = Math.min(100, att.meter + 9); def.meter = Math.min(100, def.meter + 6);
    noise(0.07, 0.12, 1800); tone(120 + Math.random() * 60, 0.06, "square", 0.08, -40);
    for (let k = 0; k < 6; k++) sparks.push({ x: (att.x + def.x) / 2 + (Math.random() - 0.5) * 16, y: def.y - 50 - Math.random() * 40, t: 0.3, c: Math.random() < 0.5 ? "#fde047" : "#fff", vx: (Math.random() - 0.5) * 200, vy: -Math.random() * 160 });
  }
  function effect(o, fx) {
    if (fx === "down") o.down = 0.6; else if (fx === "dizzy") o.dizzy = Math.max(o.dizzy, 0.9); else if (fx === "launch") o.vy = -450;
    else if (fx === "sleep") { o.dizzy = Math.max(o.dizzy, 1.6); o.zzz = 1.6; }
  }
  function special(f, o) {
    const C = FIGHTERS[f.c], d = Math.sign(o.x - f.x) || f.face, ad = Math.abs(o.x - f.x);
    f.meter -= 50; f.st = "special"; f.t = 0.5; say(C.spn, 1); tone(220, 0.25, "sawtooth", 0.06, 400);
    if (C.sp === "proj") shots.push({ o: f, x: f.x + d * 30, y: f.y - 70 * C.h, vx: d * 300, kind: { 0: "graph", 4: "cork", 8: "slipper" }[f.c] || "graph", t: 2 });
    else if (C.sp === "stun") shots.push({ o: f, x: f.x + d * 30, y: f.y - 70 * C.h, vx: d * 340, kind: f.c === 7 ? "flash" : "pie", t: 0.7 });
    else if (C.sp === "dash") { f.vx = d * 520; f.dash = 0.35; f.t = 0.45; }
    else if (C.sp === "grab") { if (ad < 80 * C.reach && o.y >= FLOOR - 5) { hit(f, o, 18 * C.pow, 260, 0.6, "grab"); o.down = 0.9; o.vy = -300; } }
    else if (C.sp === "quake") { sparks.push({ x: f.x, y: FLOOR, t: 0.5, c: "#a8a29e", ring: 1 }); if (o.y >= FLOOR - 5 && ad < 190) { hit(f, o, 14 * C.pow, 220, 0.5, "quake"); o.down = 0.8; } noise(0.4, 0.15, 300); }
    else if (C.sp === "long") { if (ad < 130 * C.reach) hit(f, o, 16 * C.pow, 240, 0.45, "long"); f.swing = 0.35; }
    else if (C.sp === "flurry") { if (ad < 85 * C.reach) { hit(f, o, 8, 60, 0.9, "flurry"); o.doom = 1.2; f.pose = 1.6; } f.flurry = 0.6; }
    else if (C.sp === "upper") { if (ad < 75 * C.reach) { hit(f, o, 16 * C.pow, 120, 0.7, "upper"); o.vy = -520; } }
  }
  function startMove(f, mv) {
    const C = FIGHTERS[f.c], M = MOVES[f.c][mv], fin = mv === "p" && f.combo >= 3;
    f.st = mv === "p" ? "punch" : "kick"; f.mv = mv; f.dur = M[3] + (fin ? 0.12 : 0); f.t = f.dur; f.hitDone = false; f.hit2 = false;
    f.label = fin ? "COMBO ! " + M[0] : M[0]; f.labelT = 0.7;
    if (M[6] === "lunge") f.vx = f.face * 320;
    if (M[6] === "squirt") { shots.push({ o: f, x: f.x + f.face * 30, y: f.y - 62 * C.h, vx: f.face * 380, kind: "water", t: 0.45 }); f.hitDone = true; f.hit2 = true; }
  }
  function counter(f) {
    const a = f.parryFrom, C = FIGHTERS[f.c], M = MOVES[f.c].c;
    f.parryT = 0; f.usedA = f.usedB = true; f.st = "special"; f.t = 0.32; f.label = "CONTRE : " + M[0]; f.labelT = 1; say("CONTRE !", 0.7);
    g.slow = 0.6; pop(f.x + f.face * 30, f.y - 90, true, "CONTRE !");
    if (a && Math.abs(a.x - f.x) < 125) {
      a.st = "hit"; a.t = 0.5; a.hp -= M[1] * C.pow; a.vx = Math.sign(a.x - f.x) * (M[2] === "push" ? 360 : 160); effect(a, M[2]);
      f.meter = Math.min(100, f.meter + 10); noise(0.1, 0.14, 1400); tone(660, 0.1, "square", 0.07, 300);
      for (let k = 0; k < 8; k++) sparks.push({ x: (a.x + f.x) / 2, y: a.y - 60, t: 0.35, c: "#38bdf8", vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 200 });
    }
  }
  function fighter(f, o, dt) {
    const C = FIGHTERS[f.c];
    if (f.human && f.human.id === me) {
      const ts = window.TSTICK; f.in.mx = (held("ArrowRight", "KeyD") ? 1 : 0) - (held("ArrowLeft", "KeyA") ? 1 : 0); f.in.my = (held("ArrowDown", "KeyS") ? 1 : 0) - (held("ArrowUp", "KeyW") ? 1 : 0);
      if (ts && Math.hypot(ts.x, ts.y) > 0.35) { f.in.mx = Math.abs(ts.x) > 0.35 ? Math.sign(ts.x) : 0; f.in.my = ts.y < -0.55 ? -1 : ts.y > 0.55 ? 1 : 0; }
      if (pressed("Space")) f.in.a++; if (pressed("Enter", "KeyX")) f.in.b++; if (pressed("KeyE")) f.in.s++;
    } else if (!f.human) bot(f, o, dt);
    f.t -= dt; f.comboT -= dt; f.dizzy = Math.max(0, f.dizzy - dt); f.down = Math.max(0, f.down - dt); f.pose = Math.max(0, (f.pose || 0) - dt);
    if (f.doom > 0) { f.doom -= dt; if (f.doom <= 0) { f.hp -= 18; f.vy = -260; f.down = 0.8; say("…BOUM !", 0.8); noise(0.5, 0.2, 500); for (let k = 0; k < 14; k++) sparks.push({ x: f.x, y: f.y - 60, t: 0.5, c: "#f97316", vx: (Math.random() - 0.5) * 300, vy: -Math.random() * 300 }); } }
    const nowT = performance.now() / 1000;
    if (f.in.a > f.la) { f.la = f.in.a; f.aT = nowT; } if (f.in.b > f.lb) { f.lb = f.in.b; f.bT = nowT; } if (f.in.s > f.ls) { f.ls = f.in.s; f.sReq = true; }
    if (f.parryT > 0) { f.parryT -= dt; if (Math.max(f.aT, f.bT) > nowT - 0.06 && !f.usedA && !f.usedB && !f.dizzy && !f.down) counter(f); }
    f.labelT = Math.max(0, (f.labelT || 0) - dt); f.zzz = Math.max(0, (f.zzz || 0) - dt);
    const free = f.t <= 0 && !f.dizzy && !f.down && f.st !== "ko" && f.st !== "win", ground = f.y >= FLOOR;
    if (free && (f.sReq || (Math.abs(f.aT - f.bT) < 0.15 && Math.max(f.aT, f.bT) > nowT - 0.2 && !f.usedAB))) {
      f.sReq = false; f.usedAB = true;
      if (f.meter >= 50) special(f, o); else { f.label = "énergie " + Math.round(f.meter) + "/50"; f.labelT = 0.8; }
    } else if (free && f.aT > nowT - 0.12 && !f.usedA) {
      f.usedA = true; f.combo = f.comboT > 0 ? f.combo + 1 : 1; f.comboT = 0.5; startMove(f, "p");
    } else if (free && f.bT > nowT - 0.12 && !f.usedB) { f.usedB = true; startMove(f, "k"); }
    if (f.aT < nowT - 0.12) f.usedA = false; if (f.bT < nowT - 0.12) f.usedB = false; if (Math.max(f.aT, f.bT) < nowT - 0.3) f.usedAB = false;
    const d = Math.sign(o.x - f.x) || f.face, ad = Math.abs(o.x - f.x), dy = Math.abs((o.y - 50) - (f.y - 50));
    if ((f.st === "punch" || f.st === "kick") && f.mv) {
      const M = MOVES[f.c][f.mv], base = f.mv === "p" ? 58 : 70, fin = f.mv === "p" && f.combo >= 3;
      const land = (big) => { if (ad < base * M[1] * C.reach && dy < 80) { hit(f, o, M[2] * C.pow * (big ? 2 : 1), M[4] * (big ? 1.4 : 1), M[5] * (big ? 1.5 : 1), f.st); if (o.st === "hit") effect(o, M[6]); } };
      if (!f.hitDone && f.t < f.dur * 0.55) { f.hitDone = true; land(fin); if (fin) { say("COMBO !", 0.6); f.combo = 0; } }
      if (M[6] === "multi" && !f.hit2 && f.t < f.dur * 0.22) { f.hit2 = true; land(false); }
    }
    if (f.dash > 0) { f.dash -= dt; if (ad < 50 && !f.hitDone) { f.hitDone = true; hit(f, o, 16 * C.pow, 300, 0.5, "dash"); f.vx *= 0.2; } }
    if (f.flurry > 0) f.flurry -= dt; if (f.swing > 0) f.swing -= dt;
    if (f.t <= 0 && ["punch", "kick", "hit", "block", "special"].includes(f.st)) f.st = "idle";
    if (!f.dizzy && !f.down && ["idle", "walk", "crouch", "jump", "block"].includes(f.st) && f.st !== "ko") {
      if (ground && f.in.my < 0) { f.vy = -440; f.st = "jump"; tone(400, 0.05, "triangle", 0.04, 200); }
      const away = f.in.mx && Math.sign(f.in.mx) === -d;
      if (ground) { f.st = f.in.my > 0 ? "crouch" : f.in.mx ? (away ? "block" : "walk") : "idle"; f.vx = f.st === "walk" || f.st === "block" ? f.in.mx * 150 * C.spd * (away ? 0.6 : 1) : f.vx * 0.7; if (f.st === "block") f.t = 0; }
      else f.vx += f.in.mx * 400 * dt;
    }
    if (!f.dash && (f.st === "hit" || f.st === "special" || f.dizzy || f.down)) f.vx *= Math.pow(0.02, dt);
    f.vy += G * dt; f.x += f.vx * dt; f.y += f.vy * dt;
    if (f.y >= FLOOR) { f.y = FLOOR; f.vy = 0; if (f.st === "jump") f.st = "idle"; }
    if (f.fly && f.st === "ko") { f.spinA = (f.spinA || 0) + dt * 14; if (f.y >= FLOOR) f.fly = 0; } else f.x = clamp(f.x, X0, X1);
    if (f.st !== "hit" && f.st !== "ko" && f.st !== "special" && f.st !== "punch" && f.st !== "kick") f.face = d;
  }
  function step(dt) {
    if (g.freeze > 0) { g.freeze -= dt; return; }
    g.tm -= dt;
    fighter(F[0], F[1], dt); fighter(F[1], F[0], dt);
    const gap = F[1].x - F[0].x; if (Math.abs(gap) < 34 && F[0].y > FLOOR - 40 && F[1].y > FLOOR - 40) { const push = (34 - Math.abs(gap)) / 2 * Math.sign(gap || 1); F[0].x -= push; F[1].x += push; }
    for (const s of shots) {
      s.t -= dt; s.x += s.vx * dt; const o = s.o === F[0] ? F[1] : F[0];
      if (!s.gone && Math.abs(s.x - o.x) < 28 && Math.abs(s.y - (o.y - 60 * FIGHTERS[o.c].h)) < 60) {
        s.gone = true;
        if (s.kind === "water") { hit(s.o, o, 3, 30, 0.2, "stun"); if (o.st === "hit") o.dizzy = Math.max(o.dizzy, 0.5); }
        else if (s.kind === "pie" || s.kind === "flash") { hit(s.o, o, 6, 60, 0.3, "stun"); if (o.st === "hit") { o.dizzy = 1.3; say(s.kind === "pie" ? "SPLATCH !" : "AVEUGLÉ !", 0.7); } }
        else hit(s.o, o, 14 * FIGHTERS[s.o.c].pow, 200, 0.4, "proj");
      }
    }
    for (let i = shots.length - 1; i >= 0; i--) if (shots[i].gone || shots[i].t <= 0 || shots[i].x < 0 || shots[i].x > W) shots.splice(i, 1);
    const ko = F.find((f) => f.hp <= 0), late = g.tm <= 0;
    if (ko || late) {
      const w = ko ? F.find((f) => f !== ko) : F[0].hp === F[1].hp ? null : F[0].hp > F[1].hp ? F[0] : F[1];
      if (ko) { ko.st = "ko"; ko.hp = 0; ko.vy = -620; ko.vx = Math.sign(ko.x - (w || ko).x || 1) * 420; ko.fly = 1; pop(ko.x, ko.y - 120, true, "BYE BYE !"); trombone(); }
      if (w) { w.wins++; w.st = "win"; setTimeout(() => speak(FIGHTERS[w.c].say, w.c), 700); }
      say(w ? (ko ? "K.O. !  " : "TEMPS !  ") + FIGHTERS[w.c].n : "ÉGALITÉ !", 2.2); SFX.over && noise(0.6, 0.08, 800);
      g.freeze = 2.4; g.after = w ? FIGHTERS[w.c].say : "";
      if (F.some((f) => f.wins >= WIN)) { setTimeout(() => end(), 2300); g.phase = "done"; }
      else { g.round++; setTimeout(() => { if (g.phase === "fight") place(); }, 2300); }
    }
  }
  function end() {
    g.over = true;
    const my = mine() || F[0], w = F[0].wins > F[1].wins ? F[0] : F[1], won = w === my;
    g.score = my.wins * 200 + (won ? 600 : 0) + Math.max(0, Math.round(my.hp));
    g.result = [`${w.name} (${FIGHTERS[w.c].n}) WINS ${Math.max(F[0].wins, F[1].wins)} : ${Math.min(F[0].wins, F[1].wins)}`, `« ${FIGHTERS[w.c].say} »`];
    if (won) SFX.win(); else SFX.over();
  }
  g.netInput = (id, m) => {
    const f = F.find((q) => q.human && q.human.id === id); if (!f) return;
    f.in.mx = clamp(+m.mx || 0, -1, 1); f.in.my = clamp(+m.my || 0, -1, 1); f.in.a = Math.max(f.in.a, +m.a || 0); f.in.b = Math.max(f.in.b, +m.b || 0); f.in.s = Math.max(f.in.s, +m.s || 0);
    if (m.cur != null) f.cur = clamp(+m.cur | 0, 0, FIGHTERS.length - 1); if (m.pick != null && !f.ok) { f.c = clamp(+m.pick | 0, 0, FIGHTERS.length - 1); f.ok = true; }
  };
  g.netState = (id, m) => { if (!host) g.net = m; };
  g.setSlot = (i, id, name) => { const f = F[i]; if (!f) return; f.human = { id, name }; f.name = name; };
  let gA = 0, gB = 0, gS = 0, gCur = 0, gPick = null;
  g.update = (dt) => {
    for (const s of sparks) { s.t -= dt; if (s.vx) { s.x += s.vx * dt; s.y += (s.vy += 600 * dt) * dt; } }
    for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].t <= 0) sparks.splice(i, 1);
    for (const q of pops) q.t -= dt; for (let i = pops.length - 1; i >= 0; i--) if (pops[i].t <= 0) pops.splice(i, 1);
    g.shake = Math.max(0, (g.shake || 0) - dt);
    g.msgT = Math.max(0, g.msgT - dt);
    if (!host) {
      const ts = window.TSTICK; let mx = (held("ArrowRight", "KeyD") ? 1 : 0) - (held("ArrowLeft", "KeyA") ? 1 : 0), my = (held("ArrowDown", "KeyS") ? 1 : 0) - (held("ArrowUp", "KeyW") ? 1 : 0);
      if (ts && Math.hypot(ts.x, ts.y) > 0.35) { mx = Math.abs(ts.x) > 0.35 ? Math.sign(ts.x) : 0; my = ts.y < -0.55 ? -1 : ts.y > 0.55 ? 1 : 0; }
      const m = g.net, myF = m ? m.f.findIndex((q, i) => F[i].human && F[i].human.id === me) : -1;
      if (m && m.ph === "select" && myF >= 0 && !m.f[myF][9]) {
        const L = pressed("ArrowLeft", "KeyA"), R = pressed("ArrowRight", "KeyD"), U = pressed("ArrowUp", "KeyW"), D = pressed("ArrowDown", "KeyS");
        g.stT = (g.stT || 0) - dt; let mv = L ? -1 : R ? 1 : U ? -4 : D ? 4 : 0;
        if (!mv && ts && g.stT <= 0 && Math.hypot(ts.x, ts.y) > 0.6) { mv = Math.abs(ts.x) > Math.abs(ts.y) ? Math.sign(ts.x) : Math.sign(ts.y) * 4; g.stT = 0.22; }
        if (mv) gCur = (gCur + mv + FIGHTERS.length * 3) % FIGHTERS.length;
        if (pressed("Space", "Enter")) gPick = gCur;
      } else { if (pressed("Space")) gA++; if (pressed("Enter", "KeyX")) gB++; if (pressed("KeyE")) gS++; }
      g.sendT -= dt; if (g.sendT <= 0) { g.sendT = 0.05; online.send({ t: "in", mx, my, a: gA, b: gB, s: gS, cur: gCur, pick: gPick }); }
      if (!m) return;
      const k = Math.min(1, dt * 18);
      g.phase = m.ph; g.round = m.rd; g.tm = m.tm; if (m.msg && m.msg !== g.msg) say(m.msg, 1.2);
      m.f.forEach((q, i) => { const f = F[i]; f.x += (q[0] - f.x) * k; f.y += (q[1] - f.y) * k; [, , f.face, f.st, f.hp, f.meter, f.c, f.cur, f.wins, f.ok, f.dizzy, f.down, f.pose, f.combo, f.label, f.labelT, f.mv, f.zzz, f.parryT, f.spinA, f.fly] = q; });
      shots.length = 0; (m.sh || []).forEach(([x, y, kind]) => shots.push({ x, y, kind }));
      pops.length = 0; (m.po || []).forEach(([x, y, w, big, t]) => pops.push({ x, y, w, big: !!big, t, r: 0 })); g.shake = m.shk || 0;
      if (myF >= 0 && F[myF]) F[myF].cur = m.ph === "select" && !F[myF].ok ? gCur : F[myF].cur;
      if (m.over && !g.over) { g.over = true; g.result = m.result; const my = mine(); g.score = my ? my.wins * 200 + (m.result && my.wins >= WIN ? 600 : 0) + Math.max(0, Math.round(my.hp)) : 0; }
      return;
    }
    if (g.phase === "select") { selectStep(F[0]); selectStep(F[1]); if (F.every((f) => f.ok)) { g.phase = "fight"; place(); } }
    else if (g.phase === "fight") { if (g.slow > 0) { g.slow -= dt; dt *= 0.35; } step(dt); }
    if (online) {
      g.sendT -= dt;
      if (g.sendT <= 0) {
        g.sendT = 0.05; const r = (v) => Math.round(v);
        online.send({ t: "st", ph: g.phase, rd: g.round, tm: +g.tm.toFixed(1), msg: g.msgT > 0 ? g.msg : "", over: g.over, result: g.result,
          f: F.map((f) => [r(f.x), r(f.y), f.face, f.st, Math.round(f.hp), Math.round(f.meter), f.c, f.cur, f.wins, f.ok, +f.dizzy.toFixed(1), +f.down.toFixed(1), +(f.pose || 0).toFixed(1), f.combo, f.labelT > 0 ? f.label : "", +(f.labelT || 0).toFixed(1), f.mv || "", +(f.zzz || 0).toFixed(1), +(f.parryT || 0).toFixed(2), +(f.spinA || 0).toFixed(1), f.fly ? 1 : 0]), po: pops.map((q) => [Math.round(q.x), Math.round(q.y), q.w, q.big ? 1 : 0, +q.t.toFixed(2)]), shk: +(g.shake || 0).toFixed(2),
          sh: shots.map((s) => [r(s.x), r(s.y), s.kind]) });
      }
    }
  };
  const ARENA = pic(W, H, (x) => {
    const sky = x.createLinearGradient(0, 0, 0, FLOOR); sky.addColorStop(0, "#1e1b4b"); sky.addColorStop(1, "#7c2d12"); x.fillStyle = sky; x.fillRect(0, 0, W, FLOOR);
    let n = 5;
    for (let yy = 120; yy < 230; yy += 5) for (let xx = 0; xx < W; xx += 5) { n = (n * 1103515245 + 12345) & 0x7fffffff; x.fillStyle = ["#f97316", "#fde047", "#f8fafc", "#60a5fa", "#a3a3a3"][n % 5]; x.globalAlpha = 0.25 + (n % 4) / 10; x.fillRect(xx + n % 3, yy, 3, 3); }
    x.globalAlpha = 1;
    for (let i = 0; i < 5; i++) { const lx = 40 + i * 100; const gl = x.createRadialGradient(lx, 40, 2, lx, 40, 90); gl.addColorStop(0, "rgba(255,240,200,.5)"); gl.addColorStop(1, "rgba(255,240,200,0)"); x.fillStyle = gl; x.fillRect(lx - 90, 0, 180, 140); }
    x.fillStyle = "#111827"; x.fillRect(0, 232, W, 14); x.fillStyle = "#fde047"; x.font = "bold 10px Consolas, monospace"; x.textAlign = "center";
    for (let i = 0; i < 4; i++) x.fillText("MIB FIGHT CLUB", 60 + i * 120, 242);
    const fl = x.createLinearGradient(0, 246, 0, H); fl.addColorStop(0, "#57534e"); fl.addColorStop(1, "#1c1917"); x.fillStyle = fl; x.fillRect(0, 246, W, H - 246);
    x.strokeStyle = "rgba(255,255,255,.08)"; for (let i = -10; i < 30; i++) { x.beginPath(); x.moveTo(i * 30, 246); x.lineTo(i * 30 - 80, H); x.stroke(); }
    x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(0, FLOOR + 2, W, 2);
  });
  const limb = (x1, y1, x2, y2, w, c) => { cx.strokeStyle = c; cx.lineWidth = w; cx.lineCap = "round"; cx.beginPath(); cx.moveTo(x1, y1); cx.lineTo(x2, y2); cx.stroke(); };
  function drawFighter(f, sel, face) {
    const C = FIGHTERS[f.c < 0 ? f.cur : f.c], s = C.h * (sel ? 1.2 : 1), fx = f.face, t = performance.now() / 1000;
    const x = f.x, y = f.y, crouch = f.st === "crouch" ? 0.75 : 1, lie = f.down > 0 || f.st === "ko";
    if (!face) { cx.fillStyle = "rgba(0,0,0,.35)"; cx.beginPath(); cx.ellipse(x, FLOOR + 3, 26 * s, 6, 0, 0, 6.3); cx.fill(); }
    cx.save(); cx.translate(x, y);
    if (f.fly && f.spinA) cx.rotate(f.spinA); else if (lie) { cx.rotate(-fx * Math.PI / 2 * 0.9); cx.translate(0, 12); }
    const bob = f.st === "idle" ? Math.sin(t * 5) * 1.5 : 0, hipY = -40 * s * crouch, shY = -78 * s * crouch + bob, headY = shY - 15 * s;
    const W1 = C.thin ? 6 : C.big || C.panda || C.bear || C.tank ? 12 : 9, body = C.col, lw = W1 * s;
    const walk = f.st === "walk" || f.st === "block" ? Math.sin(t * 12) * 10 : 0;
    if (C.cape) { cx.fillStyle = C.cape; cx.beginPath(); cx.moveTo(-fx * 4, shY); cx.quadraticCurveTo(-fx * (24 + Math.sin(t * 6) * 6) * s, hipY, -fx * (18 + Math.sin(t * 7) * 8) * s, -6); cx.lineTo(-fx * 2, hipY + 8); cx.fill(); }
    const legC = C.robe ? C.skin : C.panda ? "#111" : shadeHex(body, 0.7);
    const kick = f.st === "kick" && f.t < 0.3 && f.t > 0.08;
    limb(-4, hipY, -6 - walk * 0.6, 0, lw, legC);
    limb(4, hipY, kick ? fx * 50 * s * C.reach : 6 + walk * 0.6, kick ? hipY - 6 : 0, lw, legC);
    if (C.robe) { circ(-6, -1, 5, "#f472b6"); circ(kick ? fx * 50 * s : 6, kick ? hipY - 6 : -1, 5, "#f472b6"); }
    cx.fillStyle = body; cx.beginPath(); cx.ellipse(0, (shY + hipY) / 2, (C.thin ? 10 : C.big || C.bear || C.panda || C.tank ? 22 : 15) * s, (hipY - shY) / 2 + 6, 0, 0, 6.3); cx.fill();
    if (C.panda) { cx.fillStyle = "#111"; cx.fillRect(-18 * s, shY - 2, 36 * s, 10); }
    if (C.vest) { cx.fillStyle = "#e0ac69"; cx.beginPath(); cx.moveTo(-6, shY); cx.lineTo(6, shY); cx.lineTo(0, hipY); cx.fill(); }
    if (C.stache) { cx.fillStyle = "#fff"; for (let k = 0; k < 4; k++) cx.fillRect(-14 * s, shY + 6 + k * 9, 28 * s, 4); }
    if (C.clown) { ["#ef4444", "#22c55e", "#3b82f6"].forEach((c, k) => circ(0, shY + 8 + k * 10, 3, c)); }
    if (C.robe) { cx.strokeStyle = "#be185d"; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(-10, hipY + 4); cx.lineTo(10, hipY + 4); cx.stroke(); }
    if (C.helmet) { cx.fillStyle = "#365314"; cx.fillRect(-12 * s, shY + 10, 24 * s, 6); }
    const punch = f.st === "punch" && f.t > 0.06, armC = C.panda ? "#111" : C.bear ? body : C.robe ? C.col : shadeHex(body, 0.85);
    const ax = punch ? fx * 48 * s * C.reach : fx * 14, ay = punch ? shY + 6 : shY + 28 + (f.st === "block" ? -20 : 0);
    limb(-fx * 6, shY + 4, -fx * 10, shY + 30, lw * 0.85, armC);
    limb(fx * 4, shY + 4, ax, ay, lw * 0.85, armC); circ(ax, ay, lw * 0.75, C.bear || C.panda ? "#111" : C.skin);
    if (f.flurry > 0) for (let k = 0; k < 5; k++) circ(fx * (30 + Math.random() * 30) * s, shY + Math.random() * 30, 6, "rgba(253,224,71,.8)");
    if (C.salami) { const sw = f.swing > 0 ? -1.6 + (0.35 - f.swing) * 8 : 0.6; cx.save(); cx.translate(ax, ay); cx.rotate(fx > 0 ? sw : Math.PI - sw); cx.fillStyle = "#9f1239"; cx.beginPath(); cx.ellipse(28 * s * (f.swing > 0 ? 1.6 : 1), 0, 30 * s * (f.swing > 0 ? 1.6 : 1), 7, 0, 0, 6.3); cx.fill(); cx.fillStyle = "#fecdd3"; for (let k = 0; k < 5; k++) circ(10 + k * 9, (k % 2 ? 2 : -2), 1.5, "#fecdd3"); cx.restore(); }
    const mvP = MOVES[f.c < 0 ? f.cur : f.c] || {};
    if (f.st === "punch" && punch) prop((mvP.p || [])[7], ax, ay, fx, s);
    if (kick) prop((mvP.k || [])[7], fx * 50 * s * C.reach, hipY - 6, fx, s);
    if (f.st === "special" && C.salami) { cx.fillStyle = "#475569"; cx.fillRect(ax - (fx < 0 ? 18 : 0), ay - 4, 18, 6); cx.fillRect(ax - 2, ay, 5, 9); }
    if (C.thin && f.swing > 0) limb(fx * 4, shY + 4, fx * 120 * s, shY + 8, lw * 0.8, armC);
    if (C.stache && f.st === "special") { cx.fillStyle = "#334155"; cx.fillRect(ax - 3, ay - 16, 6, 32); circ(ax, ay - 18, 7, "#334155"); circ(ax, ay + 18, 7, "#334155"); }
    const hr = (C.big ? 14 : C.thin ? 9 : 12) * s;
    circ(0, headY, hr, C.skin);
    if (C.panda) { circ(-hr * 0.7, headY - hr * 0.8, hr * 0.38, "#111"); circ(hr * 0.7, headY - hr * 0.8, hr * 0.38, "#111"); circ(fx * hr * 0.35, headY - 1, hr * 0.28, "#111"); }
    if (C.bear) { circ(-hr * 0.7, headY - hr * 0.8, hr * 0.35, shadeHex(body, 0.7)); circ(hr * 0.7, headY - hr * 0.8, hr * 0.35, shadeHex(body, 0.7)); circ(fx * hr * 0.55, headY + 3, hr * 0.38, "#d6a77a"); }
    if (C.box) { cx.fillStyle = "#c08a4b"; cx.fillRect(-26 * s, hipY - 10, 52 * s, 28); cx.strokeStyle = "#7c5a2b"; cx.lineWidth = 2; cx.strokeRect(-26 * s, hipY - 10, 52 * s, 28); circ(-16 * s, hipY + 20, 7, "#222"); circ(16 * s, hipY + 20, 7, "#222"); txt("★", 0, hipY + 9, 12, "#fde047", "center"); cx.fillStyle = "#dc2626"; cx.fillRect(-hr, headY - hr - 3, hr * 2, 6); }
    if (C.cape) { cx.fillStyle = "#57534e"; cx.fillRect(-hr, headY - hr, hr * 2, 5); }
    if (C.tank) { cx.fillStyle = "#1c1917"; cx.fillRect(-hr, headY - hr, hr * 2, 4); }
    if (C.vest) { cx.fillStyle = "#111"; cx.beginPath(); cx.arc(0, headY - 2, hr, Math.PI, 0); cx.fill(); }
    if (C.helmet) { cx.fillStyle = "#4d7c0f"; cx.beginPath(); cx.arc(0, headY - 3, hr + 2, Math.PI, 0); cx.fill(); cx.fillStyle = "#111"; cx.fillRect(fx * hr * 0.6, headY + 2, fx * 8, 3); circ(fx * (hr + 8), headY + 3, 3, "#111"); }
    if (C.robe) { cx.fillStyle = "#94a3b8"; cx.fillRect(-hr, headY - hr * 0.7, hr * 2, 4); }
    if (C.stache) { cx.fillStyle = "#1c1917"; cx.beginPath(); cx.ellipse(fx * 3 - 7, headY + 4, 8, 3, -0.3, 0, 6.3); cx.ellipse(fx * 3 + 7, headY + 4, 8, 3, 0.3, 0, 6.3); cx.fill(); cx.beginPath(); cx.arc(0, headY - 3, hr, Math.PI, 0); cx.fill(); }
    if (C.clown) { circ(fx * hr * 0.8, headY + 1, 4, "#ef4444"); circ(-hr * 0.9, headY - hr * 0.4, 6, "#f97316"); circ(hr * 0.9, headY - hr * 0.4, 6, "#f97316"); }
    if (C.thin) { cx.fillStyle = "#1c1917"; cx.fillRect(-hr, headY - hr - 2, hr * 2, 5); }
    if (C.salami) { cx.fillStyle = "#1c1917"; cx.beginPath(); cx.arc(0, headY - 2, hr, Math.PI, 0); cx.fill(); }
    if (C.big) { cx.fillStyle = "#44403c"; cx.fillRect(-hr * 0.8, headY - 2, hr * 1.6, 3); }
    if (!C.panda && !C.bear) circ(fx * hr * 0.45, headY - 2, 1.8, "#111");
    cx.restore();
    if (f.dizzy > 0 || f.down > 0) for (let k = 0; k < 3; k++) { const a = t * 6 + k * 2.1; txt("★", x + Math.cos(a) * 16, y - 104 * s + Math.sin(a) * 4, 9, "#fde047", "center"); }
    if (f.pose > 0) txt("Tu es déjà mort.", x, y - 120 * s, 10, "#fca5a5", "center");
    if (f.labelT > 0 && f.label) { txt(f.label, x + 1, y - 109 * s + 1, 8.5, "rgba(0,0,0,.7)", "center"); txt(f.label, x, y - 109 * s, 8.5, f.label.startsWith("CONTRE") ? "#38bdf8" : "#fde047", "center"); }
    if (f.zzz > 0) txt("Z z z", x + 14, y - 100 * s - (1.6 - f.zzz) * 12, 10, "#c4b5fd", "center");
  }
  function prop(kind, x, y, fx, s) {
    if (!kind) return;
    if (kind === "stick") limb(x, y, x + fx * 30 * s, y - 6, 2, "#e5e7eb");
    else if (kind === "shield") { cx.fillStyle = "#c08a4b"; cx.fillRect(x - 6, y - 14, 12, 28); }
    else if (kind === "club") { limb(x, y, x + fx * 26 * s, y - 20, 9, "#78350f"); }
    else if (kind === "mic") { limb(x, y, x + fx * 12, y - 6, 3, "#111"); circ(x + fx * 14, y - 7, 4, "#334155"); }
    else if (kind === "belt") { cx.strokeStyle = "#f472b6"; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(x, y); cx.quadraticCurveTo(x + fx * 20, y - 14, x + fx * 44 * s, y + 2); cx.stroke(); }
    else if (kind === "dumbbell") { limb(x - 6, y, x + 6, y, 4, "#334155"); circ(x - 8, y, 7, "#1f2937"); circ(x + 8, y, 7, "#1f2937"); }
    else if (kind === "claw") { for (let k = -1; k <= 1; k++) limb(x, y + k * 4, x + fx * 12, y + k * 6, 2, "#f8fafc"); }
    else if (kind === "longarm") limb(x, y, x + fx * 36 * s, y, 6, "#e0ac69");
    else if (kind === "flower") { circ(x + fx * 4, y - 6, 6, "#f472b6"); circ(x + fx * 4, y - 6, 2.5, "#fde047"); }
    else if (kind === "slap") circ(x + fx * 4, y, 9, "#f1c27d");
    else if (kind === "fist") { for (let k = 1; k < 4; k++) { cx.globalAlpha = 0.25 * k; circ(x - fx * k * 8, y, 5, "#fde047"); } cx.globalAlpha = 1; }
    else if (kind === "paw") circ(x, y, 10, "#3f2a1d");
    else if (kind === "bigshoe") { cx.fillStyle = "#dc2626"; cx.beginPath(); cx.ellipse(x + fx * 6, y, 16, 7, 0, 0, 6.3); cx.fill(); }
    else if (kind === "boot") { cx.fillStyle = "#1c1917"; cx.fillRect(x - 6, y - 6, 14, 10); }
    else if (kind === "slipper") { cx.fillStyle = "#f472b6"; cx.beginPath(); cx.ellipse(x, y, 10, 5, 0, 0, 6.3); cx.fill(); }
    else if (kind === "wheel") { circ(x, y, 9, "#222"); circ(x, y, 3, "#a3a3a3"); }
    else if (kind === "wink") txt(";)", x, y - 30, 14, "#f472b6", "center");
    else if (kind === "flex") txt("💪", x, y - 24, 16, "#fff", "center");
    else if (kind === "belly") circ(x - fx * 30, y - 20, 18, "rgba(120,53,15,.5)");
    else if (kind === "cape") { cx.fillStyle = "#dc2626"; cx.beginPath(); cx.moveTo(x - fx * 30, y - 40); cx.quadraticCurveTo(x, y - 30, x + fx * 10, y); cx.lineTo(x - fx * 20, y); cx.fill(); }
    else if (kind === "longleg") limb(x, y, x + fx * 30 * s, y, 7, "#5b21b6");
    else if (kind === "stomp") { cx.strokeStyle = "rgba(168,162,158,.8)"; cx.lineWidth = 3; cx.beginPath(); cx.ellipse(x, FLOOR - (y > 0 ? 0 : 0), 24, 5, 0, 0, 6.3); cx.stroke(); }
    else if (kind === "flykick" || kind === "roll") { for (let k = 1; k < 4; k++) { cx.globalAlpha = 0.2 * k; circ(x - fx * k * 10, y, 6, "#fff"); } cx.globalAlpha = 1; }
  }
  const TS = 44, tileAt = (k) => [146 + (k % 4) * (TS + 3), 44 + Math.floor(k / 4) * (TS + 3)];
  function portrait(k, bx, by, w, h) {
    const C = FIGHTERS[k], sc = Math.min(w, h * 0.9) * 0.24 / (12 * C.h);
    cx.save(); cx.beginPath(); cx.rect(bx, by, w, h); cx.clip();
    cx.translate(bx + w / 2, by + h * 0.42); cx.scale(sc, sc);
    drawFighter({ c: k, cur: k, face: 1, x: 0, y: 93 * C.h, st: "idle", t: 0, dizzy: 0, down: 0 }, false, true);
    cx.restore();
  }
  g.tap = (x, y) => {
    if (g.phase !== "select") return;
    for (let k = 0; k < FIGHTERS.length; k++) {
      const [bx, by] = tileAt(k); if (x < bx || x > bx + TS || y < by || y > by + TS) continue;
      const f = F.find((q) => q.human && q.human.id === me); if (!f || f.ok) return;
      const again = g.lastTap === k; g.lastTap = k;
      if (host) { if (again) { f.c = k; f.cur = k; f.ok = true; tone(780, 0.08, "square", 0.05); } else { f.cur = k; tone(520, 0.03, "square", 0.03); } }
      else { if (again) gPick = k; gCur = k; tone(520, 0.03, "square", 0.03); }
      return;
    }
  };
  const bar = (x, y, w, v, c, right) => { rect(x, y, w, 12, "#111827"); const ww = w * clamp(v / 100, 0, 1); rect(right ? x + w - ww : x, y, ww, 12, c); cx.strokeStyle = "#e5e7eb"; cx.lineWidth = 1; cx.strokeRect(x, y, w, 12); };
  g.draw = () => {
    const sh = g.shake > 0 ? g.shake * 14 : 0; cx.save(); if (sh) cx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
    cx.drawImage(ARENA, 0, 0, W, H);
    if (g.phase === "select") {
      rect(0, 0, W, H, "rgba(5,8,16,.8)");
      txt("CHOISIS TON COMBATTANT", W / 2, 26, 15, "#fde047", "center");
      FIGHTERS.forEach((C, k) => {
        const [bx, by] = tileAt(k), hereA = F[0].cur === k, hereB = F[1].cur === k && F[1].human;
        rect(bx, by, TS, TS, "#141827"); portrait(k, bx, by, TS, TS);
        if (hereA) { cx.strokeStyle = "#fb923c"; cx.lineWidth = 3; cx.strokeRect(bx + 1, by + 1, TS - 2, TS - 2); }
        if (hereB) { cx.strokeStyle = "#60a5fa"; cx.lineWidth = 3; cx.strokeRect(bx + 4, by + 4, TS - 8, TS - 8); }
      });
      F.forEach((f, i) => {
        const k = f.ok ? f.c : f.cur, C = FIGHTERS[k], bx = i ? W - 128 : 12, by = 44, col = i ? "#60a5fa" : "#fb923c";
        rect(bx, by, 116, 150, "#0b1020"); portrait(k, bx, by, 116, 150); cx.strokeStyle = col; cx.lineWidth = 2; cx.strokeRect(bx, by, 116, 150);
        if (f.ok) txt("PRÊT !", bx + 58, by + 16, 12, "#22c55e", "center");
        txt(C.n, bx + 58, by + 168, C.n.length > 13 ? 9 : 11, col, "center");
        txt(f.name, bx + 58, by + 182, 9, "#e5e7eb", "center");
        const M = MOVES[k]; cx.font = "7.5px Consolas, monospace"; cx.fillStyle = "#cbd5e1"; cx.textAlign = "center";
        [["A", M.p[0]], ["B", M.k[0]], ["A+B", C.spn], ["bloque + A/B", M.c[0]]].forEach(([key, n], r) => cx.fillText(key + " : " + n, bx + 58, by + 198 + r * 11));
      });
      txt(window.TouchPad && TouchPad.on ? "touche un visage pour le voir, touche-le encore pour le choisir" : "flèches ou clic : choisir · Espace ou 2e clic : valider", W / 2, H - 10, 9, "#94a3b8", "center");
      return;
    }
    for (const s of shots) {
      if (s.kind === "graph") { rect(s.x - 16, s.y - 12, 32, 24, "#f8fafc"); cx.strokeStyle = "#dc2626"; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(s.x - 12, s.y + 8); cx.lineTo(s.x - 2, s.y + 4); cx.lineTo(s.x + 4, s.y - 2); cx.lineTo(s.x + 13, s.y - 11); cx.stroke(); }
      else if (s.kind === "water") { for (let k = 0; k < 4; k++) circ(s.x - Math.sign(s.vx || 1) * k * 6, s.y + k, 3 - k * 0.5, "#7dd3fc"); }
      else if (s.kind === "cork") { cx.fillStyle = "#a16207"; cx.fillRect(s.x - 7, s.y - 4, 14, 8); cx.fillStyle = "#ca8a04"; cx.fillRect(s.x - 7, s.y - 4, 4, 8); }
      else if (s.kind === "slipper") { cx.fillStyle = "#f472b6"; cx.beginPath(); cx.ellipse(s.x, s.y, 12, 6, performance.now() / 80, 0, 6.3); cx.fill(); }
      else if (s.kind === "pie") { circ(s.x, s.y, 10, "#fef3c7"); circ(s.x, s.y - 4, 7, "#fff"); circ(s.x, s.y - 9, 3, "#dc2626"); }
      else if (s.kind === "flash") { const gl = cx.createRadialGradient(s.x, s.y, 2, s.x, s.y, 30); gl.addColorStop(0, "rgba(255,255,255,1)"); gl.addColorStop(1, "rgba(255,255,255,0)"); cx.fillStyle = gl; cx.fillRect(s.x - 30, s.y - 30, 60, 60); }
    }
    F.forEach((f) => drawFighter(f, false));
    for (const s of sparks) { cx.globalAlpha = clamp(s.t / 0.3, 0, 1); if (s.ring) { cx.strokeStyle = s.c; cx.lineWidth = 4; cx.beginPath(); cx.ellipse(s.x, s.y, (0.5 - s.t) * 400, (0.5 - s.t) * 40, 0, 0, 6.3); cx.stroke(); } else circ(s.x, s.y, 3, s.c); } cx.globalAlpha = 1;
    for (const q of pops) {
      const k = (q.big ? 1.5 : 1) * (1 + Math.max(0, q.t - (q.big ? 0.7 : 0.45)) * 3), r1 = 24 * k, r2 = 15 * k;
      cx.save(); cx.translate(q.x, q.y); cx.rotate(q.r); cx.globalAlpha = Math.min(1, q.t * 3);
      cx.beginPath(); for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10, rr = i % 2 ? r2 : r1; cx.lineTo(Math.cos(a) * rr * 1.5, Math.sin(a) * rr); }
      cx.closePath(); cx.fillStyle = q.w === "CONTRE !" ? "#38bdf8" : q.w === "BYE BYE !" ? "#f472b6" : "#fde047"; cx.fill(); cx.strokeStyle = "#dc2626"; cx.lineWidth = 3; cx.stroke();
      cx.font = `900 ${Math.round(11 * k)}px Impact, Arial Black, sans-serif`; cx.textAlign = "center"; cx.fillStyle = "#111"; cx.fillText(q.w, 0, 4 * k);
      cx.restore();
    }
    const myF = mine();
    if (myF && myF.parryT > 0 && Math.floor(performance.now() / 120) % 2 === 0) {
      const C = FIGHTERS[myF.c]; txt(window.TouchPad && TouchPad.on ? "A / B : CONTRE !" : "ESPACE / ENTRÉE : CONTRE !", myF.x, myF.y - 128 * C.h, 11, "#38bdf8", "center");
    }
    cx.restore();
    bar(12, 12, 190, F[0].hp, "#22c55e", false); bar(W - 202, 12, 190, F[1].hp, "#22c55e", true);
    rect(12, 27, 190 * F[0].meter / 100, 4, F[0].meter >= 50 ? "#fde047" : "#a16207"); rect(W - 12 - 190 * F[1].meter / 100, 27, 190 * F[1].meter / 100, 4, F[1].meter >= 50 ? "#fde047" : "#a16207");
    txt(`${F[0].name} · ${FIGHTERS[F[0].c].n}`, 12, 44, 9, "#fb923c"); txt(`${FIGHTERS[F[1].c].n} · ${F[1].name}`, W - 12, 44, 9, "#60a5fa", "right");
    for (let k = 0; k < WIN; k++) { circ(214 - k * 10, 18, 3.5, F[0].wins > k ? "#fde047" : "#334155"); circ(W - 214 + k * 10, 18, 3.5, F[1].wins > k ? "#fde047" : "#334155"); }
    txt(String(Math.max(0, Math.ceil(g.tm))), W / 2, 26, 18, "#f8fafc", "center");
    if (g.msgT > 0) { const k = 1 + (1 - Math.min(1, g.msgT)) * 0.15; txt(g.msg, W / 2 + 2, 152, Math.round(26 * k), "rgba(0,0,0,.6)", "center"); txt(g.msg, W / 2, 150, Math.round(26 * k), "#fde047", "center"); }
    if (g.freeze > 0 && g.after && g.phase !== "select") txt(`« ${g.after} »`, W / 2, 178, 11, "#f8fafc", "center");
    if (g.over && g.result) banner(["FIN DU COMBAT", ...g.result], online ? (window.againLine ? againLine() : "Tap to play again") : (window.TouchPad && TouchPad.on ? "Touche l'écran : revanche · ☰ : menu" : "Espace : revanche · Échap : menu"));
  };
  g.h2h = () => {
    if (!g.over || !F[0].human || !F[1].human || F[0].wins === F[1].wins) return null;
    const w = F[0].wins > F[1].wins ? F[0] : F[1], l = w === F[0] ? F[1] : F[0]; return { w: [w.human.id], l: [l.human.id] };
  };
  g.dbg = () => ({ phase: g.phase, f: F.map((f) => [Math.round(f.x), Math.round(f.hp), f.c, f.wins, f.st]) });
  return g;
}
