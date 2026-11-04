"use strict";
function Tennis(online = null) {
  const X0 = 50, X1 = 430, Y0 = 84, Y1 = 306, NX = 240, MY = (Y0 + Y1) / 2, NETH = 9, G = 520, PR = 8, WIN = 7;
  const AX0 = 6, AX1 = 474, AY0 = 50, AY1 = 352;
  const COL = ["#f97316", "#22d3ee"], NAMES = ["ORANGE", "BLUE"];
  const host = !online || online.host, me = online ? online.me : 0;
  const humans = online ? online.players.slice(0, 4) : [{ id: 0, name: (window.ARC && ARC.getName()) || "YOU" }];
  let OPT = {}; try { OPT = (online && online.opt) || JSON.parse(localStorage.getItem("arcade-sheet-tennis") || "{}"); } catch (e) {}
  const SIZE = humans.length > 2 || OPT.size !== "1" ? 2 : 1, N = SIZE * 2;
  const seats = new Array(N).fill(null);
  if (OPT.side === "together" && humans.length <= SIZE) humans.forEach((h, k) => { seats[k * 2] = h; });
  else humans.slice(0, N).forEach((h, k) => { seats[k] = h; });
  const BOTN = ["Rafa", "Serena", "Roger", "Venus", "Novak", "Andy"];
  const ITEMS = ["🍌", "🔥", "🍄", "❄️", "💣", "🌀"];
  const P = [...Array(N).keys()].map((i) => ({ i, team: i % 2, human: seats[i], name: seats[i] ? seats[i].name : BOTN[i] + " (bot)",
    x: 0, y: 0, vx: 0, vy: 0, fx: i % 2 ? -1 : 1, fy: 0, in: { mx: 0, my: 0, k: 0, b: 0 }, lastK: 0, lastB: 0, swingT: 0, swingA: 0,
    item: -1, charged: "", giantT: 0, frozenT: 0, dazed: 0, spin: 0, diveT: 0, downT: 0, err: seats[i] ? 0 : 45 }));
  const ball = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, last: -1, bounces: 0, fire: false, bomb: false, curve: 0, t: 0, held: true };
  const boxes = [], peels = [], fx = [];
  const g = { id: "tennis", own: true, score: 0, over: false, s: [0, 0], pause: 1.2, msg: "FIRST TO 7!", flash: "", flashT: 0, result: null, sendT: 0, net: null,
    help: "arrows / W A S D move · Space swing (and serve) · Enter or X: item, or dive · first to 7 · Esc menu" };
  let server = 0, serveT = 0, rally = 0, boxT = 6;
  const say = (s, t = 1.2) => { g.flash = s; g.flashT = t; };
  const mine = () => P.find((p) => p.human && p.human.id === me);
  function setUp() {
    const spots = [[110, MY - 45], [370, MY + 45], [175, MY + 50], [305, MY - 50]];
    P.forEach((p, i) => { p.x = spots[i][0]; p.y = spots[i][1]; p.vx = p.vy = 0; p.fx = p.team ? -1 : 1; p.fy = 0; p.diveT = p.downT = p.dazed = 0; p.swingT = 0; });
    const sv = P[server]; sv.x = sv.team ? X1 + 8 : X0 - 8; sv.y = MY + (server > 1 ? 40 : -40);
    Object.assign(ball, { x: sv.x + (sv.team ? -9 : 9), y: sv.y, z: 14, vx: 0, vy: 0, vz: 0, last: -1, bounces: 0, fire: false, bomb: false, curve: 0, held: true });
    serveT = 0; rally = 0; peels.length = 0;
  }
  setUp();
  function landing(team) {
    let x = ball.x, y = ball.y, z = ball.z, vx = ball.vx, vy = ball.vy, vz = ball.vz;
    for (let i = 0; i < 90; i++) {
      vz -= G / 30; x += vx / 30; y += vy / 30; z += vz / 30;
      if (z <= 0) { z = 0; vz = -vz * 0.62; vx *= 0.82; vy *= 0.82; }
      if ((team ? x > NX + 6 : x < NX - 6) && z < 16 && vz < 40) return [x, y];
    }
    return [team ? 360 : 120, MY];
  }
  function shoot(p, serve = false) {
    const opp = P.filter((q) => q.team !== p.team), side = p.team ? -1 : 1;
    const deep = serve ? 0.55 + Math.random() * 0.35 : 0.35 + Math.random() * 0.6;
    let tx = NX + side * (25 + deep * (X1 - NX - 35)), ty;
    if (p.human && Math.abs(p.in.my) > 0.3) ty = p.in.my < 0 ? Y0 + 22 : Y1 - 22;
    else { const oy = opp.reduce((a, q) => a + q.y, 0) / opp.length; ty = oy > MY ? Y0 + 20 + Math.random() * 60 : Y1 - 20 - Math.random() * 60; }
    const reach = p.giantT > 0 ? 38 : 27, q = 1 - Math.min(1, Math.hypot(ball.x - p.x, ball.y - p.y) / reach);
    if (!serve && q < 0.25) { tx += (Math.random() - 0.3) * 70 * side; ty += (Math.random() - 0.5) * 90; }
    if (!p.human) { tx += (Math.random() - 0.5) * p.err; ty += (Math.random() - 0.5) * p.err; }
    const smash = !serve && ball.z > 17, kind = p.charged; p.charged = "";
    let sp = (serve ? 230 : 205) + Math.min(80, rally * 6) + (smash ? 140 : 0);
    if (kind === "fire") sp = 440;
    if (ball.fire && !serve) { sp *= 0.55; p.dazed = 0.9; p.spin = 1; p.vx -= side * 160; say("BURNT!"); boom(p.x, p.y, "#f97316", 10); }
    const dist = Math.hypot(tx - ball.x, ty - ball.y), T = Math.max(0.35, dist / sp);
    let vz = (0.5 * G * T * T - ball.z) / T;
    const tn = Math.abs((NX - ball.x) / ((tx - ball.x) / T || 1));
    if (tn > 0 && tn < T) { const zn = ball.z + vz * tn - 0.5 * G * tn * tn; if (zn < NETH + 3 && !(q < 0.12 && Math.random() < 0.5)) vz += (NETH + 3 - zn) / tn; }
    Object.assign(ball, { vx: (tx - ball.x) / T, vy: (ty - ball.y) / T, vz, last: p.team, bounces: 0, held: false, fire: kind === "fire", bomb: kind === "bomb", curve: kind === "curve" ? 260 : 0, t: 0 });
    p.swingT = 0; rally++;
    tone(smash || kind === "fire" ? 120 : 190, 0.07, "triangle", 0.14, -70); noise(0.04, 0.09, smash ? 1500 : 3200);
    if (smash) say("SMASH!", 0.8); else if (kind === "fire") say("FIREBALL!", 0.8); else if (kind === "bomb") say("BOMB BALL!", 0.8); else if (kind === "curve") say("WOBBLE SHOT!", 0.8);
    if (rally === 10) say("WHAT A RALLY!");
  }
  function boom(x, y, c, n) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.3, s = 30 + Math.random() * 90; fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0.6, c }); } }
  function point(team, why) {
    g.s[team]++; g.pause = 1.6; ball.held = true;
    g.msg = `${why}  ${NAMES[0]} ${g.s[0]} : ${g.s[1]} ${NAMES[1]}`;
    if (team === (mine() || P[0]).team) [523, 659, 784].forEach((f, i) => tone(f, 0.12, "square", 0.05, 0, i * 0.07)); else [330, 262].forEach((f, i) => tone(f, 0.16, "square", 0.05, 0, i * 0.1));
    noise(0.6, 0.05, 700);
    if (g.s[team] >= WIN) { end(); return; }
    const n = g.s[0] + g.s[1]; server = Math.floor(n / 2) % N;
    setUp();
  }
  function end() {
    g.over = true; g.pause = 0;
    const my = mine(), mt = my ? my.team : 0, won = g.s[mt] > g.s[1 - mt];
    g.score = g.s[mt] * 100 + (won ? 500 : 0);
    g.result = [`${NAMES[g.s[0] > g.s[1] ? 0 : 1]} WINS ${g.s[0]} : ${g.s[1]}`, P.map((p) => `${p.name} ${NAMES[p.team]}`).join(" · ")];
    if (won) SFX.win(); else SFX.over();
  }
  function useItem(p) {
    const it = ITEMS[p.item]; p.item = -1;
    const foes = P.filter((q) => q.team !== p.team);
    if (it === "🍌") { foes.forEach((q) => peels.push({ x: clamp(q.x + (Math.random() - 0.5) * 50, AX0 + 10, AX1 - 10), y: clamp(q.y + (Math.random() - 0.5) * 50, AY0 + 10, AY1 - 10) })); say("BANANAS!", 0.8); }
    else if (it === "🔥") p.charged = "fire";
    else if (it === "🍄") { p.giantT = 8; say("GIANT RACKET!", 0.8); }
    else if (it === "❄️") { foes.forEach((q) => { q.frozenT = 3; }); say("FROZEN!", 0.8); }
    else if (it === "💣") p.charged = "bomb";
    else if (it === "🌀") p.charged = "curve";
    tone(880, 0.06, "square", 0.05); tone(1320, 0.06, "square", 0.05, 0, 0.06);
  }
  function giveItem(p) {
    const behind = g.s[1 - p.team] - g.s[p.team], r = Math.random();
    p.item = behind >= 2 ? (r < 0.35 ? 1 : r < 0.6 ? 4 : r < 0.8 ? 3 : 2) : behind <= -2 ? (r < 0.45 ? 0 : r < 0.75 ? 5 : r < 0.9 ? 2 : 3) : Math.floor(r * ITEMS.length);
    tone(660, 0.05, "square", 0.05); tone(990, 0.08, "square", 0.05, 0, 0.05);
  }
  function bot(p) {
    const mate = P.find((q) => q !== p && q.team === p.team), coming = !ball.held && ball.last !== p.team;
    let tx = p.team ? 350 : 130, ty = MY + (p.i > 1 ? 40 : -40);
    if (coming) {
      const [lx, ly] = landing(p.team);
      const dMe = Math.hypot(lx - p.x, ly - p.y), dMate = mate ? Math.hypot(lx - mate.x, ly - mate.y) : 1e9;
      const mine2 = !mate || (mate.human ? dMe + 70 < dMate || mate.downT > 0 || mate.dazed > 0 : dMe <= dMate);
      if (mine2) { tx = lx + (p.team ? 7 : -7); ty = ly; }
      if (p.item >= 0 && Math.random() < 0.004) useItem(p);
      const d = Math.hypot(ball.x - p.x, ball.y - p.y);
      if (d < (p.giantT > 0 ? 28 : 18) && ball.z < 26 && Math.random() < 0.5) p.in.k++;
      if (mine2 && d > 26 && d < 46 && ball.z < 10 && ball.vz < 0 && Math.random() < 0.02) p.in.b++;
    } else if (p.item >= 0 && Math.random() < 0.006) useItem(p);
    const dx = tx - p.x, dy = ty - p.y, L = Math.hypot(dx, dy);
    p.in.mx = L > 3 ? dx / L : 0; p.in.my = L > 3 ? dy / L : 0;
  }
  function step(dt) {
    if (ball.held) {
      const sv = P[server]; ball.x = sv.x + (sv.team ? -9 : 9); ball.y = sv.y; ball.z = 14 + Math.sin(serveT * 5) * 3; serveT += dt;
      if (!sv.human ? serveT > 1.1 : serveT > 8) shoot(sv, true);
    }
    for (const p of P) {
      if (!p.human) bot(p);
      else if (p.human.id === me) {
        const ts = window.TSTICK; p.in.mx = (held("ArrowRight", "KeyD") ? 1 : 0) - (held("ArrowLeft", "KeyA") ? 1 : 0); p.in.my = (held("ArrowDown", "KeyS") ? 1 : 0) - (held("ArrowUp", "KeyW") ? 1 : 0);
        if (ts && Math.hypot(ts.x, ts.y) > 0.3) { p.in.mx = ts.x; p.in.my = ts.y; }
        if (pressed("Space")) p.in.k++; if (pressed("Enter", "KeyX")) p.in.b++;
      }
      p.giantT = Math.max(0, p.giantT - dt); p.frozenT = Math.max(0, p.frozenT - dt); p.dazed = Math.max(0, p.dazed - dt); p.downT = Math.max(0, p.downT - dt);
      p.swingT = Math.max(0, p.swingT - dt); p.spin = Math.max(0, p.spin - dt);
      if (p.in.k > p.lastK && ball.held && P[server] === p) { p.lastK = p.in.k; shoot(p, true); }
      if (p.in.k > p.lastK) { p.lastK = p.in.k; if (!p.downT && !p.dazed) { p.swingT = 0.42; p.swingA = 1; } }
      if (p.in.b > p.lastB) {
        p.lastB = p.in.b;
        if (p.item >= 0) useItem(p);
        else if (!p.downT && !p.diveT && !p.dazed) {
          const dx = ball.x - p.x, dy = ball.y - p.y, d = Math.hypot(dx, dy) || 1;
          p.diveT = 0.28; p.vx = dx / d * 270; p.vy = dy / d * 270; p.fx = dx / d; p.fy = dy / d; p.swingT = 0.32; noise(0.15, 0.05, 600);
        }
      }
      if (p.diveT > 0) { p.diveT -= dt; if (p.diveT <= 0) p.downT = 0.55; }
      else if (p.downT > 0 || p.dazed > 0) { p.vx *= 0.85; p.vy *= 0.85; }
      else {
        let mx = p.in.mx, my = p.in.my;
        const L = Math.hypot(mx, my), sp = (p.human ? 135 : 118) * (p.frozenT > 0 ? 0.4 : 1);
        const wx = L > 0.05 ? mx / Math.max(1, L) * sp : 0, wy = L > 0.05 ? my / Math.max(1, L) * sp : 0;
        p.vx += (wx - p.vx) * Math.min(1, dt * 12); p.vy += (wy - p.vy) * Math.min(1, dt * 12);
        if (L > 0.2) { p.fx = mx / L; p.fy = my / L; }
      }
      p.x = clamp(p.x + p.vx * dt, AX0 + PR, AX1 - PR); p.y = clamp(p.y + p.vy * dt, AY0 + PR, AY1 - PR);
      if (p.team === 0 && p.x > NX - PR) p.x = NX - PR; if (p.team === 1 && p.x < NX + PR) p.x = NX + PR;
      for (const pl of peels) if (!pl.gone && Math.hypot(pl.x - p.x, pl.y - p.y) < 10) { pl.gone = true; p.dazed = 1.1; p.spin = 1.1; say(`${p.name.replace(" (bot)", "")} SLIPPED!`, 0.9); tone(700, 0.25, "sawtooth", 0.05, -500); }
      for (const b of boxes) if (!b.gone && p.item < 0 && Math.hypot(b.x - p.x, b.y - p.y) < 14) { b.gone = true; giveItem(p); }
      const reach = (p.giantT > 0 ? 38 : 27) + (p.diveT > 0 ? 8 : 0);
      if (p.swingT > 0 && !ball.held && ball.last !== p.team && ball.z < (p.giantT > 0 ? 42 : 32) && Math.hypot(ball.x - p.x, ball.y - p.y) < reach && (p.team ? ball.x > NX - 4 : ball.x < NX + 4)) shoot(p);
    }
    for (let i = peels.length - 1; i >= 0; i--) if (peels[i].gone) peels.splice(i, 1);
    for (let i = boxes.length - 1; i >= 0; i--) if (boxes[i].gone) boxes.splice(i, 1);
    if ((boxT -= dt) <= 0) { boxT = 6 + Math.random() * 5; if (boxes.length < 2) { const side = Math.random() < 0.5; boxes.push({ x: side ? 90 + Math.random() * 120 : 270 + Math.random() * 120, y: Y0 + 20 + Math.random() * (Y1 - Y0 - 40) }); } }
    if (ball.held) return;
    const ox = ball.x; ball.t += dt;
    ball.vz -= G * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.z += ball.vz * dt;
    if (ball.curve) ball.y += Math.sin(ball.t * 11) * ball.curve * dt;
    if (ball.fire) fx.push({ x: ball.x, y: ball.y - ball.z * 0.7, vx: (Math.random() - 0.5) * 20, vy: -20, t: 0.3, c: Math.random() < 0.5 ? "#f97316" : "#fde047" });
    if ((ox - NX) * (ball.x - NX) < 0 && ball.z < NETH) {
      ball.x = NX + (ox < NX ? -3 : 3); ball.vx *= -0.15; ball.vy *= 0.3; tone(90, 0.12, "triangle", 0.1);
      point(1 - ball.last, "NET!"); return;
    }
    if (ball.z <= 0 && ball.vz < 0) {
      ball.z = 0; const side = ball.x < NX ? 0 : 1, inCourt = ball.x >= X0 && ball.x <= X1 && ball.y >= Y0 && ball.y <= Y1;
      tone(300, 0.03, "triangle", 0.08);
      if (ball.bomb) {
        ball.bomb = false; boom(ball.x, ball.y, "#fde047", 26); boom(ball.x, ball.y, "#ef4444", 16); noise(0.5, 0.15, 400); say("BOOM!", 0.9);
        for (const q of P) { const d = Math.hypot(q.x - ball.x, q.y - ball.y); if (d < 48) { q.dazed = 1.3; q.spin = 1.3; q.vx += (q.x - ball.x) / (d || 1) * 220; q.vy += (q.y - ball.y) / (d || 1) * 220; } }
      }
      if (side === ball.last) { point(1 - ball.last, "OOPS!"); return; }
      if (ball.bounces === 0 && !inCourt) { point(1 - ball.last, "OUT!"); return; }
      ball.bounces++;
      if (ball.bounces >= 2) { point(ball.last, rally <= 1 ? "ACE!" : rally >= 10 ? "WHAT A RALLY!" : "WINNER!"); return; }
      ball.vz = -ball.vz * 0.62; ball.vx *= 0.82; ball.vy *= 0.82; ball.fire = false;
    }
    if (ball.x < -40 || ball.x > W + 40 || ball.y < -40 || ball.y > H + 40) point(ball.bounces ? ball.last : 1 - ball.last, ball.bounces ? "WINNER!" : "OUT!");
  }
  g.setSlot = (i, id, name) => { const p = P[i]; if (!p) return; p.human = { id, name }; p.name = name; p.lastK = p.in.k = 0; p.lastB = p.in.b = 0; };
  g.netInput = (id, m) => { const p = P.find((q) => q.human && q.human.id === id); if (p) { p.in.mx = clamp(+m.mx || 0, -1, 1); p.in.my = clamp(+m.my || 0, -1, 1); p.in.k = Math.max(p.in.k, +m.k || 0); p.in.b = Math.max(p.in.b, +m.b || 0); } };
  g.netState = (id, m) => { if (!host) g.net = m; };
  let guestK = 0, guestB = 0;
  g.update = (dt) => {
    for (const f of fx) { f.t -= dt; f.x += f.vx * dt; f.y += f.vy * dt; }
    for (let i = fx.length - 1; i >= 0; i--) if (fx[i].t <= 0) fx.splice(i, 1);
    g.flashT = Math.max(0, g.flashT - dt);
    if (!host) {
      if (pressed("Space")) guestK++; if (pressed("Enter", "KeyX")) guestB++;
      g.sendT -= dt;
      if (g.sendT <= 0) {
        g.sendT = 0.05; const ts = window.TSTICK, st = ts && Math.hypot(ts.x, ts.y) > 0.3;
        online.send({ t: "in", mx: st ? ts.x : (held("ArrowRight", "KeyD") ? 1 : 0) - (held("ArrowLeft", "KeyA") ? 1 : 0), my: st ? ts.y : (held("ArrowDown", "KeyS") ? 1 : 0) - (held("ArrowUp", "KeyW") ? 1 : 0), k: guestK, b: guestB });
      }
      const m = g.net; if (!m) return;
      const k = Math.min(1, dt * 15);
      ball.x += (m.b[0] - ball.x) * k; ball.y += (m.b[1] - ball.y) * k; ball.z += (m.b[2] - ball.z) * k; ball.fire = !!m.b[3]; ball.bomb = !!m.b[4];
      m.p.forEach((q, i) => { const p = P[i]; p.x += (q[0] - p.x) * k; p.y += (q[1] - p.y) * k; p.fx = q[2]; p.fy = q[3]; p.swingT = q[4]; p.dazed = q[5]; p.item = q[6]; p.giantT = q[7]; p.frozenT = q[8]; p.downT = q[9]; p.charged = q[10] || ""; p.spin = q[5]; });
      boxes.length = 0; (m.bx || []).forEach(([x, y]) => boxes.push({ x, y })); peels.length = 0; (m.pl || []).forEach(([x, y]) => peels.push({ x, y }));
      if (m.s[0] + m.s[1] > g.s[0] + g.s[1]) noise(0.6, 0.05, 700);
      if (m.fl && m.fl !== g.flash) say(m.fl, 1);
      g.s = m.s; g.msg = m.msg; g.pause = m.pause;
      if (m.over && !g.over) { g.over = true; const my = mine(), mt = my ? my.team : 0; g.score = g.s[mt] * 100 + (g.s[mt] > g.s[1 - mt] ? 500 : 0); g.result = m.result; }
      return;
    }
    if (g.pause > 0) g.pause -= dt; else if (!g.over) step(dt);
    if (online) {
      g.sendT -= dt;
      if (g.sendT <= 0) {
        g.sendT = 0.05; const r = (v) => Math.round(v * 10) / 10;
        online.send({ t: "st", b: [r(ball.x), r(ball.y), r(ball.z), ball.fire ? 1 : 0, ball.bomb ? 1 : 0],
          p: P.map((p) => [r(p.x), r(p.y), +p.fx.toFixed(2), +p.fy.toFixed(2), +p.swingT.toFixed(2), +p.dazed.toFixed(2), p.item, +p.giantT.toFixed(1), +p.frozenT.toFixed(1), +p.downT.toFixed(2), p.charged]),
          bx: boxes.map((b) => [r(b.x), r(b.y)]), pl: peels.map((b) => [r(b.x), r(b.y)]), fl: g.flashT > 0 ? g.flash : "", s: g.s, msg: g.msg, pause: g.pause, over: g.over, result: g.result });
      }
    }
  };
  const stand = (f) => pic(W, H, (x) => {
    const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#0f172a"); bg.addColorStop(1, "#111827"); x.fillStyle = bg; x.fillRect(0, 0, W, H);
    const KIT = ["#f97316", "#22d3ee", "#f8fafc", "#fde047", "#a3e635", "#f472b6", "#94a3b8"];
    let n = 11 + f;
    const fans = (x0, y0, x1, y1) => { for (let yy = y0; yy < y1; yy += 4) for (let xx = x0; xx < x1; xx += 4) { n = (n * 1103515245 + 12345) & 0x7fffffff; x.fillStyle = KIT[n % KIT.length]; x.globalAlpha = 0.4 + (n % 5) / 10; x.fillRect(xx + (n % 2), yy + ((n >> 3) % 2) * (f ? 1 : 0), 2, 2); } x.globalAlpha = 1; };
    fans(4, 2, W - 4, AY0 - 10); fans(4, AY1 + 4, W - 4, H - 2);
    x.fillStyle = "#166534"; x.fillRect(AX0, AY0 - 6, AX1 - AX0, AY1 - AY0 + 10);
    for (let i = 0; i < 1400; i++) { n = (n * 1103515245 + 12345) & 0x7fffffff; x.fillStyle = n % 3 ? "rgba(0,0,0,.08)" : "rgba(255,255,255,.05)"; x.fillRect(AX0 + (n % 1000) / 1000 * (AX1 - AX0), AY0 - 6 + ((n >> 10) % 1000) / 1000 * (AY1 - AY0 + 10), 1, 1); }
    const cg = x.createLinearGradient(0, Y0, 0, Y1); cg.addColorStop(0, "#2563eb"); cg.addColorStop(1, "#1d4ed8"); x.fillStyle = cg; x.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    const light = x.createRadialGradient(NX, MY, 30, NX, MY, 260); light.addColorStop(0, "rgba(255,255,255,.1)"); light.addColorStop(1, "rgba(0,0,0,.22)"); x.fillStyle = light; x.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    x.strokeStyle = "rgba(255,255,255,.92)"; x.lineWidth = 2; x.strokeRect(X0, Y0, X1 - X0, Y1 - Y0);
    x.lineWidth = 1.5; x.beginPath(); x.moveTo(X0, Y0 + 26); x.lineTo(X1, Y0 + 26); x.moveTo(X0, Y1 - 26); x.lineTo(X1, Y1 - 26);
    x.moveTo(NX - 95, Y0 + 26); x.lineTo(NX - 95, Y1 - 26); x.moveTo(NX + 95, Y0 + 26); x.lineTo(NX + 95, Y1 - 26); x.moveTo(NX - 95, MY); x.lineTo(NX + 95, MY);
    x.moveTo(X0, MY); x.lineTo(X0 + 6, MY); x.moveTo(X1, MY); x.lineTo(X1 - 6, MY); x.stroke();
    x.fillStyle = "rgba(255,255,255,.75)"; x.font = "bold 5px Consolas, monospace"; x.textAlign = "center";
    for (let i = 0; i < 8; i++) { x.fillText("MIB ARCADE", 30 + i * 60, AY0 - 9); x.fillText("RALLY RUMBLE", 30 + i * 60, AY1 + 9); }
  });
  const STAND = [stand(0), stand(1)];
  let crowdT = 0;
  const player = (p) => {
    const big = p.giantT > 0 ? 1.45 : 1, mineP = p.human && p.human.id === me, rot = p.spin > 0 ? p.spin * 14 : 0;
    cx.fillStyle = "rgba(0,0,0,.3)"; cx.beginPath(); cx.ellipse(p.x + 3, p.y + 4, PR * big + 1, (PR - 2) * big, 0, 0, 6.3); cx.fill();
    if (mineP) { cx.strokeStyle = "#fde047"; cx.lineWidth = 2; cx.beginPath(); cx.arc(p.x, p.y, PR * big + 4, 0, 6.3); cx.stroke(); }
    cx.save(); cx.translate(p.x, p.y);
    const face = Math.atan2(p.fy, p.fx) + rot, lying = p.downT > 0 || p.diveT > 0;
    cx.rotate(face); if (lying) cx.scale(1.35, 0.8);
    const body = p.frozenT > 0 ? "#bae6fd" : COL[p.team];
    const gr = cx.createRadialGradient(-2, -2, 1, 0, 0, PR * big + 2); gr.addColorStop(0, shadeHex(body, 1.4)); gr.addColorStop(1, shadeHex(body, 0.6));
    cx.fillStyle = gr; cx.beginPath(); cx.ellipse(0, 0, PR * big, (PR + 1) * big, 0, 0, 6.3); cx.fill();
    cx.fillStyle = "#3b2416"; cx.beginPath(); cx.arc(0, 0, 3.6 * big, 0, 6.3); cx.fill(); cx.fillStyle = "#e0ac69"; cx.beginPath(); cx.arc(0.6, 0, 2.8 * big, 0, 6.3); cx.fill();
    const sw = p.swingT > 0 ? (1 - p.swingT / 0.32) * 2.6 - 1.3 : -0.9, rl = 13 * big;
    cx.rotate(sw); cx.strokeStyle = "#e5e7eb"; cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(0, PR * big - 1); cx.lineTo(0, PR * big + rl * 0.45); cx.stroke();
    cx.strokeStyle = p.charged === "fire" ? "#f97316" : p.charged === "bomb" ? "#111" : "#fde047"; cx.lineWidth = 1.8;
    cx.beginPath(); cx.ellipse(0, PR * big + rl * 0.75, 4.5 * big, 6 * big, 0, 0, 6.3); cx.stroke();
    cx.restore();
    if (p.dazed > 0 || p.downT > 0) for (let k = 0; k < 3; k++) { const a = crowdT * 6 + k * 2.1; txt("★", p.x + Math.cos(a) * 10, p.y - 12 + Math.sin(a) * 3, 7, "#fde047", "center"); }
    txt(p.name.replace(" (bot)", ""), p.x, p.y - PR * big - 6, 7, p.human ? "#fff" : "#cbd5e1", "center");
    if (p.item >= 0) txt(ITEMS[p.item], p.x + PR * big + 7, p.y - PR * big - 2, 10, "#fff", "center");
  };
  g.draw = () => {
    crowdT += 1 / 60; const cheer = g.pause > 0;
    cx.drawImage(STAND[Math.floor(crowdT * (cheer ? 8 : 1.5)) % 2], 0, 0, W, H);
    for (const b of boxes) { const hue = (crowdT * 200) % 360, bob = Math.sin(crowdT * 5 + b.x) * 2; rect(b.x - 7, b.y - 7 + bob, 14, 14, `hsl(${hue},85%,55%)`); txt("?", b.x, b.y + 4 + bob, 11, "#fff", "center"); }
    for (const pl of peels) txt("🍌", pl.x, pl.y + 4, 11, "#fff", "center");
    const back = P.filter((p) => p.y < MY + 0), front = P.filter((p) => p.y >= MY);
    back.forEach(player);
    cx.fillStyle = "rgba(0,0,0,.25)"; cx.fillRect(NX + 1, Y0 - 6, 4, Y1 - Y0 + 12);
    cx.fillStyle = "rgba(15,23,42,.75)"; cx.fillRect(NX - 1.5, Y0 - 8, 3, Y1 - Y0 + 16);
    cx.fillStyle = "#f8fafc"; cx.fillRect(NX - 1.5, Y0 - 8, 3, 2); for (let y = Y0 - 6; y < Y1 + 8; y += 6) cx.fillRect(NX - 0.5, y, 1, 3);
    rect(NX - 3, Y0 - 12, 6, 6, "#9ca3af"); rect(NX - 3, Y1 + 6, 6, 6, "#9ca3af");
    front.forEach(player);
    circ(ball.x + 1, ball.y + 1, 3, "rgba(0,0,0,.35)");
    const by = ball.y - ball.z * 0.7;
    if (ball.bomb) { circ(ball.x, by, 4.5, "#111827"); circ(ball.x + 3, by - 4, 1.5, Math.floor(crowdT * 12) % 2 ? "#fde047" : "#ef4444"); }
    else { circ(ball.x, by, 3.4, ball.fire ? "#fb923c" : "#d9f99d"); cx.strokeStyle = "rgba(255,255,255,.8)"; cx.lineWidth = 0.7; cx.beginPath(); cx.arc(ball.x - 1.5, by, 2.4, -1, 1); cx.stroke(); }
    for (const f of fx) { cx.globalAlpha = Math.max(0, f.t / 0.6); circ(f.x, f.y, 2, f.c); } cx.globalAlpha = 1;
    cx.fillStyle = "rgba(5,8,16,.85)"; cx.fillRect(150, 8, 180, 22); rect(150, 8, 66, 22, COL[0]); rect(264, 8, 66, 22, COL[1]);
    txt(`${NAMES[0]} ${g.s[0]}`, 183, 24, 11, "#fff", "center"); txt(`${g.s[1]} ${NAMES[1]}`, 297, 24, 11, "#fff", "center"); txt(`to ${WIN}`, 240, 24, 10, "#fde047", "center");
    const my = mine(); if (my && my.item >= 0) txt(`${ITEMS[my.item]} ready: ${window.TouchPad && TouchPad.on ? "B" : "Enter"}`, 474, 24, 10, "#fde047", "right");
    if (ball.held && P[server].human && P[server].human.id === me && !g.over && g.pause <= 0) txt(window.TouchPad && TouchPad.on ? "A: SERVE" : "SPACE: SERVE", 240, 344, 12, "#fde047", "center");
    if (g.flashT > 0) { const s = 1 + (1 - Math.min(1, g.flashT)) * 0.2; txt(g.flash, 241, 61, Math.round(16 * s), "rgba(0,0,0,.6)", "center"); txt(g.flash, 240, 60, Math.round(16 * s), "#fde047", "center"); }
    if (g.pause > 0 && !g.over) { txt(g.msg, 241, 191, 15, "rgba(0,0,0,.6)", "center"); txt(g.msg, 240, 190, 15, "#fde047", "center"); }
    if (g.over && g.result) banner(["GAME, SET, MATCH", ...g.result], online ? (window.againLine ? againLine() : "Tap to play again") : "Space play again · Esc menu");
  };
  g.dbg = () => ({ ball: [ball.x, ball.y, ball.z].map((v) => Math.round(v)), held: ball.held, last: ball.last, rally, s: g.s.slice(), p: P.map((p) => [Math.round(p.x), Math.round(p.y), p.item]) });
  return g;
}
