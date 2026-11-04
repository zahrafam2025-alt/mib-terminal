"use strict";
const FIGHTERS = [
  { n: "EXCELSIOR MAN", col: "#1e3a8a", skin: "#f1c27d", h: 1, spd: 1, pow: 1, reach: 1, sp: "proj", spn: "THE GRAPH", say: "The planet is in DANGER!", cape: "#dc2626" },
  { n: "LE GARÇON CHARIOT", col: "#b91c1c", skin: "#f5d0a9", h: 0.85, spd: 1.05, pow: 0.95, reach: 0.9, sp: "dash", spn: "CHARGE !", say: "C'est MON goûter !", box: true },
  { n: "GROS PANDA", col: "#f8fafc", skin: "#f8fafc", h: 1.12, spd: 0.85, pow: 1.15, reach: 1, sp: "grab", spn: "BAMBOO SLAM", say: "*munch munch*", panda: true },
  { n: "LE COLOSSE", col: "#64748b", skin: "#a8a29e", h: 1.32, spd: 0.75, pow: 1.3, reach: 1.15, sp: "quake", spn: "GROUND POUND", say: "GRRRRR.", big: true },
  { n: "NICO SAUCISSON", col: "#2563eb", skin: "#f1c27d", h: 1, spd: 1.1, pow: 0.95, reach: 1.05, sp: "long", spn: "SALAMI SWING", say: "Mademoiselle, un verre ?", salami: true },
  { n: "ROBERT LE LOURDAUD", col: "#78350f", skin: "#e0ac69", h: 1.15, spd: 0.85, pow: 1.2, reach: 1, sp: "dash", spn: "BULLDOZER", say: "Pas lourd : costaud !", tank: true },
  { n: "KENJI LE SURVIVANT", col: "#1f2937", skin: "#e0ac69", h: 1.05, spd: 1.05, pow: 1.05, reach: 1, sp: "flurry", spn: "100 POINGS", say: "Tu es déjà mort.", vest: true },
  { n: "MICHEL KAL", col: "#4d7c0f", skin: "#f1c27d", h: 1, spd: 1, pow: 0.95, reach: 1, sp: "stun", spn: "FLASH INFO", say: "En direct du front !", helmet: true },
  { n: "MONSIEUR PEIGNOIR", col: "#f9a8d4", skin: "#f1c27d", h: 1, spd: 0.9, pow: 1, reach: 1, sp: "proj", spn: "CHAUSSON VOLANT", say: "Encore cinq minutes…", robe: true },
  { n: "OURS", col: "#7c4a21", skin: "#7c4a21", h: 1.2, spd: 0.85, pow: 1.2, reach: 1.05, sp: "grab", spn: "CÂLIN D'OURS", say: "ROOAAAR !", bear: true },
  { n: "MOUSTACHE", col: "#dc2626", skin: "#f1c27d", h: 1.05, spd: 0.95, pow: 1.15, reach: 1, sp: "upper", spn: "UPPERCUT MOUSTACHU", say: "Admirez ces biceps !", stache: true },
  { n: "SABRISTI", col: "#7c3aed", skin: "#e0ac69", h: 1.3, spd: 1, pow: 0.9, reach: 1.35, sp: "long", spn: "BRAS ÉLASTIQUE", say: "Trop grand pour toi.", thin: true },
  { n: "RIGOLUS", col: "#facc15", skin: "#fef3c7", h: 0.95, spd: 1.1, pow: 0.9, reach: 1, sp: "stun", spn: "TARTE À LA CRÈME", say: "Pouet pouet !", clown: true },
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
  const F = [mk(0), mk(1)], shots = [], sparks = [];
  const g = { id: "fight", own: true, score: 0, over: false, phase: "select", round: 1, tm: ROUND, msg: "", msgT: 0, result: null, sendT: 0, net: null,
    help: "arrows: walk, jump, crouch (walk away = block) · Space punch (3 = combo) · Enter/X kick · A+B or E special · Esc menu" };
  const mine = () => F.find((f) => f.human && f.human.id === me);
  const say = (s, t = 1.4) => { g.msg = s; g.msgT = t; };
  function place() {
    F[0].x = 150; F[1].x = 330;
    for (const f of F) Object.assign(f, { y: FLOOR, vx: 0, vy: 0, hp: 100, st: "idle", t: 0, combo: 0, dizzy: 0, down: 0, doom: 0 });
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
    let mv = L ? -1 : R ? 1 : U ? -7 : D ? 7 : 0;
    if (!mv && ts && f.stickT <= 0 && Math.hypot(ts.x, ts.y) > 0.6) { mv = Math.abs(ts.x) > Math.abs(ts.y) ? Math.sign(ts.x) : Math.sign(ts.y) * 7; f.stickT = 0.22; }
    if (mv) { f.cur = (f.cur + mv + FIGHTERS.length * 3) % FIGHTERS.length; tone(520, 0.03, "square", 0.03); }
    if (pressed("Space", "Enter")) { f.c = f.cur; f.ok = true; tone(780, 0.08, "square", 0.05); }
  }
  function bot(f, o, dt) {
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
      tone(300, 0.04, "square", 0.05); sparks.push({ x: (att.x + def.x) / 2, y: def.y - 60, t: 0.2, c: "#93c5fd" }); return;
    }
    def.hp -= dmg; def.vx = Math.sign(def.x - att.x) * kb; def.st = "hit"; def.t = stun; att.meter = Math.min(100, att.meter + 9); def.meter = Math.min(100, def.meter + 6);
    noise(0.07, 0.12, 1800); tone(120 + Math.random() * 60, 0.06, "square", 0.08, -40);
    for (let k = 0; k < 6; k++) sparks.push({ x: (att.x + def.x) / 2 + (Math.random() - 0.5) * 16, y: def.y - 50 - Math.random() * 40, t: 0.3, c: Math.random() < 0.5 ? "#fde047" : "#fff", vx: (Math.random() - 0.5) * 200, vy: -Math.random() * 160 });
  }
  function special(f, o) {
    const C = FIGHTERS[f.c], d = Math.sign(o.x - f.x) || f.face, ad = Math.abs(o.x - f.x);
    f.meter -= 50; f.st = "special"; f.t = 0.5; say(C.spn, 1); tone(220, 0.25, "sawtooth", 0.06, 400);
    if (C.sp === "proj") shots.push({ o: f, x: f.x + d * 30, y: f.y - 70 * C.h, vx: d * 300, kind: f.c === 0 ? "graph" : "slipper", t: 2 });
    else if (C.sp === "stun") shots.push({ o: f, x: f.x + d * 30, y: f.y - 70 * C.h, vx: d * 340, kind: f.c === 7 ? "flash" : "pie", t: 0.7 });
    else if (C.sp === "dash") { f.vx = d * 520; f.dash = 0.35; f.t = 0.45; }
    else if (C.sp === "grab") { if (ad < 80 * C.reach && o.y >= FLOOR - 5) { hit(f, o, 18 * C.pow, 260, 0.6, "grab"); o.down = 0.9; o.vy = -300; } }
    else if (C.sp === "quake") { sparks.push({ x: f.x, y: FLOOR, t: 0.5, c: "#a8a29e", ring: 1 }); if (o.y >= FLOOR - 5 && ad < 190) { hit(f, o, 14 * C.pow, 220, 0.5, "quake"); o.down = 0.8; } noise(0.4, 0.15, 300); }
    else if (C.sp === "long") { if (ad < 130 * C.reach) hit(f, o, 16 * C.pow, 240, 0.45, "long"); f.swing = 0.35; }
    else if (C.sp === "flurry") { if (ad < 85 * C.reach) { hit(f, o, 8, 60, 0.9, "flurry"); o.doom = 1.2; f.pose = 1.6; } f.flurry = 0.6; }
    else if (C.sp === "upper") { if (ad < 75 * C.reach) { hit(f, o, 16 * C.pow, 120, 0.7, "upper"); o.vy = -520; } }
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
    const free = f.t <= 0 && !f.dizzy && !f.down && f.st !== "ko" && f.st !== "win", ground = f.y >= FLOOR;
    if (free && (f.sReq || (Math.abs(f.aT - f.bT) < 0.15 && Math.max(f.aT, f.bT) > nowT - 0.2 && !f.usedAB))) {
      f.sReq = false; f.usedAB = true;
      if (f.meter >= 50) special(f, o); else { say("PAS ASSEZ D'ÉNERGIE", 0.6); }
    } else if (free && f.aT > nowT - 0.12 && !f.usedA) {
      f.usedA = true; f.combo = f.comboT > 0 ? f.combo + 1 : 1; f.comboT = 0.5; f.st = "punch"; f.t = f.combo >= 3 ? 0.36 : 0.24; f.hitDone = false;
    } else if (free && f.bT > nowT - 0.12 && !f.usedB) { f.usedB = true; f.st = "kick"; f.t = 0.4; f.hitDone = false; }
    if (f.aT < nowT - 0.12) f.usedA = false; if (f.bT < nowT - 0.12) f.usedB = false; if (Math.max(f.aT, f.bT) < nowT - 0.3) f.usedAB = false;
    const d = Math.sign(o.x - f.x) || f.face, ad = Math.abs(o.x - f.x), dy = Math.abs((o.y - 50) - (f.y - 50));
    if (f.st === "punch" && !f.hitDone && f.t < (f.combo >= 3 ? 0.24 : 0.16)) { f.hitDone = true; if (ad < 62 * C.reach && dy < 70) { const fin = f.combo >= 3; hit(f, o, (fin ? 11 : 5) * C.pow, fin ? 260 : 70, fin ? 0.45 : 0.22, "punch"); if (fin) { say("COMBO !", 0.6); f.combo = 0; } } }
    if (f.st === "kick" && !f.hitDone && f.t < 0.24) { f.hitDone = true; if (ad < 78 * C.reach && dy < 80) hit(f, o, 9 * C.pow, 170, 0.32, "kick"); }
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
    f.x = clamp(f.x, X0, X1);
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
        if (s.kind === "pie" || s.kind === "flash") { hit(s.o, o, 6, 60, 0.3, "stun"); if (o.st === "hit") { o.dizzy = 1.3; say(s.kind === "pie" ? "SPLATCH !" : "AVEUGLÉ !", 0.7); } }
        else hit(s.o, o, 14 * FIGHTERS[s.o.c].pow, 200, 0.4, "proj");
      }
    }
    for (let i = shots.length - 1; i >= 0; i--) if (shots[i].gone || shots[i].t <= 0 || shots[i].x < 0 || shots[i].x > W) shots.splice(i, 1);
    const ko = F.find((f) => f.hp <= 0), late = g.tm <= 0;
    if (ko || late) {
      const w = ko ? F.find((f) => f !== ko) : F[0].hp === F[1].hp ? null : F[0].hp > F[1].hp ? F[0] : F[1];
      if (ko) { ko.st = "ko"; ko.hp = 0; } if (w) { w.wins++; w.st = "win"; }
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
    g.msgT = Math.max(0, g.msgT - dt);
    if (!host) {
      const ts = window.TSTICK; let mx = (held("ArrowRight", "KeyD") ? 1 : 0) - (held("ArrowLeft", "KeyA") ? 1 : 0), my = (held("ArrowDown", "KeyS") ? 1 : 0) - (held("ArrowUp", "KeyW") ? 1 : 0);
      if (ts && Math.hypot(ts.x, ts.y) > 0.35) { mx = Math.abs(ts.x) > 0.35 ? Math.sign(ts.x) : 0; my = ts.y < -0.55 ? -1 : ts.y > 0.55 ? 1 : 0; }
      const m = g.net, myF = m ? m.f.findIndex((q, i) => F[i].human && F[i].human.id === me) : -1;
      if (m && m.ph === "select" && myF >= 0 && !m.f[myF][9]) {
        const L = pressed("ArrowLeft", "KeyA"), R = pressed("ArrowRight", "KeyD"), U = pressed("ArrowUp", "KeyW"), D = pressed("ArrowDown", "KeyS");
        g.stT = (g.stT || 0) - dt; let mv = L ? -1 : R ? 1 : U ? -7 : D ? 7 : 0;
        if (!mv && ts && g.stT <= 0 && Math.hypot(ts.x, ts.y) > 0.6) { mv = Math.abs(ts.x) > Math.abs(ts.y) ? Math.sign(ts.x) : Math.sign(ts.y) * 7; g.stT = 0.22; }
        if (mv) gCur = (gCur + mv + FIGHTERS.length * 3) % FIGHTERS.length;
        if (pressed("Space", "Enter")) gPick = gCur;
      } else { if (pressed("Space")) gA++; if (pressed("Enter", "KeyX")) gB++; if (pressed("KeyE")) gS++; }
      g.sendT -= dt; if (g.sendT <= 0) { g.sendT = 0.05; online.send({ t: "in", mx, my, a: gA, b: gB, s: gS, cur: gCur, pick: gPick }); }
      if (!m) return;
      const k = Math.min(1, dt * 18);
      g.phase = m.ph; g.round = m.rd; g.tm = m.tm; if (m.msg && m.msg !== g.msg) say(m.msg, 1.2);
      m.f.forEach((q, i) => { const f = F[i]; f.x += (q[0] - f.x) * k; f.y += (q[1] - f.y) * k; [, , f.face, f.st, f.hp, f.meter, f.c, f.cur, f.wins, f.ok, f.dizzy, f.down, f.pose, f.combo] = q; });
      shots.length = 0; (m.sh || []).forEach(([x, y, kind]) => shots.push({ x, y, kind }));
      if (myF >= 0 && F[myF]) F[myF].cur = m.ph === "select" && !F[myF].ok ? gCur : F[myF].cur;
      if (m.over && !g.over) { g.over = true; g.result = m.result; const my = mine(); g.score = my ? my.wins * 200 + (m.result && my.wins >= WIN ? 600 : 0) + Math.max(0, Math.round(my.hp)) : 0; }
      return;
    }
    if (g.phase === "select") { selectStep(F[0]); selectStep(F[1]); if (F.every((f) => f.ok)) { g.phase = "fight"; place(); } }
    else if (g.phase === "fight") step(dt);
    if (online) {
      g.sendT -= dt;
      if (g.sendT <= 0) {
        g.sendT = 0.05; const r = (v) => Math.round(v);
        online.send({ t: "st", ph: g.phase, rd: g.round, tm: +g.tm.toFixed(1), msg: g.msgT > 0 ? g.msg : "", over: g.over, result: g.result,
          f: F.map((f) => [r(f.x), r(f.y), f.face, f.st, Math.round(f.hp), Math.round(f.meter), f.c, f.cur, f.wins, f.ok, +f.dizzy.toFixed(1), +f.down.toFixed(1), +(f.pose || 0).toFixed(1), f.combo]),
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
  function drawFighter(f, sel) {
    const C = FIGHTERS[f.c < 0 ? f.cur : f.c], s = C.h * (sel ? 1.2 : 1), fx = f.face, t = performance.now() / 1000;
    const x = f.x, y = f.y, crouch = f.st === "crouch" ? 0.75 : 1, lie = f.down > 0 || f.st === "ko";
    cx.fillStyle = "rgba(0,0,0,.35)"; cx.beginPath(); cx.ellipse(x, FLOOR + 3, 26 * s, 6, 0, 0, 6.3); cx.fill();
    cx.save(); cx.translate(x, y);
    if (lie) { cx.rotate(-fx * Math.PI / 2 * 0.9); cx.translate(0, 12); }
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
  }
  const bar = (x, y, w, v, c, right) => { rect(x, y, w, 12, "#111827"); const ww = w * clamp(v / 100, 0, 1); rect(right ? x + w - ww : x, y, ww, 12, c); cx.strokeStyle = "#e5e7eb"; cx.lineWidth = 1; cx.strokeRect(x, y, w, 12); };
  g.draw = () => {
    cx.drawImage(ARENA, 0, 0, W, H);
    if (g.phase === "select") {
      rect(0, 0, W, H, "rgba(5,8,16,.72)");
      txt("CHOISIS TON COMBATTANT", W / 2, 34, 16, "#fde047", "center");
      FIGHTERS.forEach((C, k) => {
        const col = k % 7, row = Math.floor(k / 7), bx = 14 + col * 66 + (row ? 33 : 0), by = 52 + row * 92;
        const hereA = F[0].cur === k, hereB = F[1].cur === k && F[1].human;
        rect(bx, by, 60, 84, hereA || hereB ? "#334155" : "#141827"); if (hereA) { cx.strokeStyle = "#fb923c"; cx.lineWidth = 2; cx.strokeRect(bx, by, 60, 84); } if (hereB) { cx.strokeStyle = "#60a5fa"; cx.lineWidth = 2; cx.strokeRect(bx + 2, by + 2, 56, 80); }
        cx.save(); cx.beginPath(); cx.rect(bx, by, 60, 84); cx.clip(); drawFighter({ c: k, cur: k, face: 1, x: bx + 30, y: by + 92, st: "idle", t: 0, dizzy: 0, down: 0 }, false); cx.restore();
        cx.font = "bold 6.5px Consolas, monospace"; cx.fillStyle = "#e5e7eb"; cx.textAlign = "center"; cx.fillText(C.n.length > 14 ? C.n.slice(0, 14) : C.n, bx + 30, by + 82);
      });
      F.forEach((f, i) => { const C = FIGHTERS[f.cur]; txt(`${f.name}: ${C.n}${f.ok ? " ✔" : ""}`, i ? W - 12 : 12, 260, 11, i ? "#60a5fa" : "#fb923c", i ? "right" : "left"); txt(`spécial : ${C.spn}`, i ? W - 12 : 12, 274, 9, "#cbd5e1", i ? "right" : "left"); });
      txt(window.TouchPad && TouchPad.on ? "stick : choisir · A : valider" : "flèches : choisir · Espace : valider", W / 2, 300, 10, "#94a3b8", "center");
      return;
    }
    for (const s of shots) {
      if (s.kind === "graph") { rect(s.x - 16, s.y - 12, 32, 24, "#f8fafc"); cx.strokeStyle = "#dc2626"; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(s.x - 12, s.y + 8); cx.lineTo(s.x - 2, s.y + 4); cx.lineTo(s.x + 4, s.y - 2); cx.lineTo(s.x + 13, s.y - 11); cx.stroke(); }
      else if (s.kind === "slipper") { cx.fillStyle = "#f472b6"; cx.beginPath(); cx.ellipse(s.x, s.y, 12, 6, performance.now() / 80, 0, 6.3); cx.fill(); }
      else if (s.kind === "pie") { circ(s.x, s.y, 10, "#fef3c7"); circ(s.x, s.y - 4, 7, "#fff"); circ(s.x, s.y - 9, 3, "#dc2626"); }
      else if (s.kind === "flash") { const gl = cx.createRadialGradient(s.x, s.y, 2, s.x, s.y, 30); gl.addColorStop(0, "rgba(255,255,255,1)"); gl.addColorStop(1, "rgba(255,255,255,0)"); cx.fillStyle = gl; cx.fillRect(s.x - 30, s.y - 30, 60, 60); }
    }
    F.forEach((f) => drawFighter(f, false));
    for (const s of sparks) { cx.globalAlpha = clamp(s.t / 0.3, 0, 1); if (s.ring) { cx.strokeStyle = s.c; cx.lineWidth = 4; cx.beginPath(); cx.ellipse(s.x, s.y, (0.5 - s.t) * 400, (0.5 - s.t) * 40, 0, 0, 6.3); cx.stroke(); } else circ(s.x, s.y, 3, s.c); } cx.globalAlpha = 1;
    bar(12, 12, 190, F[0].hp, "#22c55e", false); bar(W - 202, 12, 190, F[1].hp, "#22c55e", true);
    rect(12, 27, 190 * F[0].meter / 100, 4, F[0].meter >= 50 ? "#fde047" : "#a16207"); rect(W - 12 - 190 * F[1].meter / 100, 27, 190 * F[1].meter / 100, 4, F[1].meter >= 50 ? "#fde047" : "#a16207");
    txt(`${F[0].name} · ${FIGHTERS[F[0].c].n}`, 12, 44, 9, "#fb923c"); txt(`${FIGHTERS[F[1].c].n} · ${F[1].name}`, W - 12, 44, 9, "#60a5fa", "right");
    for (let k = 0; k < WIN; k++) { circ(214 - k * 10, 18, 3.5, F[0].wins > k ? "#fde047" : "#334155"); circ(W - 214 + k * 10, 18, 3.5, F[1].wins > k ? "#fde047" : "#334155"); }
    txt(String(Math.max(0, Math.ceil(g.tm))), W / 2, 26, 18, "#f8fafc", "center");
    if (g.msgT > 0) { const k = 1 + (1 - Math.min(1, g.msgT)) * 0.15; txt(g.msg, W / 2 + 2, 152, Math.round(26 * k), "rgba(0,0,0,.6)", "center"); txt(g.msg, W / 2, 150, Math.round(26 * k), "#fde047", "center"); }
    if (g.freeze > 0 && g.after && g.phase !== "select") txt(`« ${g.after} »`, W / 2, 178, 11, "#f8fafc", "center");
    if (g.over && g.result) banner(["FIN DU COMBAT", ...g.result], online ? (window.againLine ? againLine() : "Tap to play again") : "Space : revanche · Esc : menu");
  };
  g.dbg = () => ({ phase: g.phase, f: F.map((f) => [Math.round(f.x), Math.round(f.hp), f.c, f.wins, f.st]) });
  return g;
}
