"use strict";
function Goal(online = null) {
  const X0 = 20, X1 = 460, Y0 = 40, Y1 = 340, MY = (Y0 + Y1) / 2, MOUTH = 34, PR = 9, BR = 5, WIN = 5, TIME = 120;
  const COL = ["#ef4444", "#3b82f6"], NAMES = ["RED", "BLUE"];
  const host = !online || online.host, me = online ? online.me : 0;
  const humans = online ? online.players.slice(0, 4) : [{ id: 0, name: (window.ARC && ARC.getName()) || "YOU" }];
  const BOTN = ["Zizou", "Ronnie", "Leo", "Kylian", "Cristiano", "Thierry"];
  const P = [0, 1, 2, 3].map((i) => ({ i, team: i % 2, human: i < humans.length ? humans[i] : null, name: i < humans.length ? humans[i].name : BOTN[i] + " (bot)",
    x: 0, y: 0, vx: 0, vy: 0, fx: i % 2 ? -1 : 1, fy: 0, stam: 1, kickT: 0, in: { mx: 0, my: 0, sp: false, k: 0 }, lastK: 0 }));
  const ball = { x: 240, y: MY, vx: 0, vy: 0 };
  const g = { id: "goal", score: 0, over: false, t: 0, s: [0, 0], pause: 1.5, msg: "KICK OFF!", result: null, sendT: 0, net: null,
    help: "arrows / W A S D run · Space shoot · Enter or Shift sprint · run into the ball to dribble · first to 5 · Esc menu" };
  function kickoff() {
    const spots = [[150, MY - 40], [330, MY + 40], [90, MY + 50], [390, MY - 50]];
    P.forEach((p, i) => { p.x = spots[i][0]; p.y = spots[i][1]; p.vx = p.vy = 0; p.fx = p.team ? -1 : 1; p.fy = 0; });
    Object.assign(ball, { x: 240, y: MY, vx: 0, vy: 0 });
  }
  kickoff();
  const mine = () => P.find((p) => p.human && p.human.id === me);
  function bot(p) {
    const gx = p.team ? X0 : X1, own = p.team ? X1 : X0, mate = P.find((q) => q !== p && q.team === p.team);
    const near = Math.hypot(ball.x - p.x, ball.y - p.y) <= Math.hypot(ball.x - mate.x, ball.y - mate.y) || mate.human;
    let tx, ty;
    if (near) {
      const walled = ball.y < Y0 + 22 || ball.y > Y1 - 22 || ((ball.x < X0 + 22 || ball.x > X1 - 22) && Math.abs(ball.y - MY) > MOUTH);
      const aimX = walled ? 240 : gx, aimY = walled ? MY : MY + (Math.random() - 0.5) * 2;
      const a = Math.atan2(aimY - ball.y, aimX - ball.x);
      tx = ball.x - Math.cos(a) * 14; ty = ball.y - Math.sin(a) * 14;
      const d = Math.hypot(ball.x - p.x, ball.y - p.y), align = Math.cos(Math.atan2(ball.y - p.y, ball.x - p.x) - a);
      p.stuck = d < 20 ? (p.stuck || 0) + 1 / 60 : 0;
      if (d < 18 && (align > 0.6 || (align > 0.2 && Math.abs(ball.x - gx) < 140) || p.stuck > 1.5) && p.kickT <= 0) { p.fx = Math.cos(a); p.fy = Math.sin(a) + (Math.random() - 0.5) * 0.3; p.in.k++; }
      else if (d < 30) { tx = ball.x; ty = ball.y; }
    } else { tx = own + (p.team ? -60 : 60); ty = clamp(ball.y, MY - MOUTH - 10, MY + MOUTH + 10); }
    const dx = tx - p.x, dy = ty - p.y, L = Math.hypot(dx, dy);
    p.in.mx = L > 4 ? dx / L : 0; p.in.my = L > 4 ? dy / L : 0; p.in.sp = near && L > 60;
  }
  function step(dt) {
    for (const p of P) {
      if (!p.human) bot(p);
      else if (p.human.id === me) { p.in.mx = (held("ArrowRight", "KeyD") ? 1 : 0) - (held("ArrowLeft", "KeyA") ? 1 : 0); p.in.my = (held("ArrowDown", "KeyS") ? 1 : 0) - (held("ArrowUp", "KeyW") ? 1 : 0);
        p.in.sp = held("Enter", "ShiftLeft", "ShiftRight"); if (pressed("Space")) p.in.k++; }
      const L = Math.hypot(p.in.mx, p.in.my), sprint = p.in.sp && p.stam > 0.05 && L > 0;
      p.stam = clamp(p.stam + (sprint ? -0.9 : 0.35) * dt, 0, 1);
      const sp = (p.human ? 1 : 0.88) * (sprint ? 165 : 112);
      const wx = L ? p.in.mx / L * sp : 0, wy = L ? p.in.my / L * sp : 0;
      p.vx += (wx - p.vx) * Math.min(1, dt * 10); p.vy += (wy - p.vy) * Math.min(1, dt * 10);
      if (L) { p.fx = p.in.mx / L; p.fy = p.in.my / L; }
      p.x = clamp(p.x + p.vx * dt, X0 + PR, X1 - PR); p.y = clamp(p.y + p.vy * dt, Y0 + PR, Y1 - PR);
      p.kickT -= dt;
      if (p.in.k > p.lastK) {
        p.lastK = p.in.k;
        const d = Math.hypot(ball.x - p.x, ball.y - p.y);
        if (d < PR + BR + 9 && p.kickT <= 0) { const n = Math.hypot(p.fx, p.fy) || 1; ball.vx = p.fx / n * 390 + p.vx * 0.3; ball.vy = p.fy / n * 390 + p.vy * 0.3; p.kickT = 0.25; tone(140, 0.08, "triangle", 0.12, -60); noise(0.05, 0.08, 2400); }
      }
    }
    for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) {
      const A = P[a], B = P[b], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy);
      if (d > 0 && d < PR * 2) { const k = (PR * 2 - d) / 2 / d; A.x -= dx * k; A.y -= dy * k; B.x += dx * k; B.y += dy * k; }
    }
    for (const p of P) {
      const dx = ball.x - p.x, dy = ball.y - p.y, d = Math.hypot(dx, dy);
      if (d > 0 && d < PR + BR) {
        ball.x = p.x + dx / d * (PR + BR); ball.y = p.y + dy / d * (PR + BR);
        const vn = ball.vx * dx / d + ball.vy * dy / d, pn = p.vx * dx / d + p.vy * dy / d;
        if (vn < 0) { ball.vx -= dx / d * vn * 1.6; ball.vy -= dy / d * vn * 1.6; }
        const vn2 = ball.vx * dx / d + ball.vy * dy / d;
        if (vn2 < pn * 1.1) { ball.vx += dx / d * (pn * 1.15 - vn2); ball.vy += dy / d * (pn * 1.15 - vn2); }
      }
    }
    ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    const fr = Math.exp(-1.15 * dt); ball.vx *= fr; ball.vy *= fr;
    if (ball.y < Y0 + BR) { ball.y = Y0 + BR; ball.vy = Math.abs(ball.vy) * 0.8; }
    if (ball.y > Y1 - BR) { ball.y = Y1 - BR; ball.vy = -Math.abs(ball.vy) * 0.8; }
    const inMouth = Math.abs(ball.y - MY) < MOUTH;
    if (ball.x < X0 + BR && !inMouth) { ball.x = X0 + BR; ball.vx = Math.abs(ball.vx) * 0.8; }
    if (ball.x > X1 - BR && !inMouth) { ball.x = X1 - BR; ball.vx = -Math.abs(ball.vx) * 0.8; }
    if (ball.x < X0 - 6) scored(1); else if (ball.x > X1 + 6) scored(0);
  }
  function scored(team) {
    g.s[team]++; g.pause = 1.6; g.msg = `GOAL! ${NAMES[team]} ${g.s[0]} : ${g.s[1]}`;
    [523, 659, 784].forEach((f, i) => tone(f, 0.14, "square", 0.06, 0, i * 0.08)); noise(0.5, 0.06, 900);
    if (g.s[team] >= WIN) end(); else kickoff();
  }
  function end() {
    g.over = true; g.pause = 0;
    const my = mine(), mt = my ? my.team : 0, won = g.s[mt] > g.s[1 - mt], draw = g.s[0] === g.s[1];
    g.score = g.s[mt] * 100 + (won ? 500 : draw ? 200 : 0);
    g.result = [draw ? "A DRAW!" : `${NAMES[g.s[0] > g.s[1] ? 0 : 1]} WINS ${g.s[0]} : ${g.s[1]}`, P.map((p) => `${p.name} ${NAMES[p.team]}`).join(" · ")];
    if (won) SFX.win(); else SFX.over();
  }
  g.setSlot = (i, id, name) => { const p = P[i]; if (!p) return; p.human = { id, name }; p.name = name; p.lastK = p.in.k = 0; };
  g.netInput = (id, m) => { const p = P.find((q) => q.human && q.human.id === id); if (p) { p.in.mx = clamp(+m.mx || 0, -1, 1); p.in.my = clamp(+m.my || 0, -1, 1); p.in.sp = !!m.sp; p.in.k = Math.max(p.in.k, +m.k || 0); } };
  g.netState = (id, m) => { if (!host) g.net = m; };
  let guestK = 0;
  g.update = (dt) => {
    if (!host) {
      if (pressed("Space")) guestK++;
      g.sendT -= dt;
      if (g.sendT <= 0) { g.sendT = 0.05; online.send({ t: "in", mx: (held("ArrowRight", "KeyD") ? 1 : 0) - (held("ArrowLeft", "KeyA") ? 1 : 0), my: (held("ArrowDown", "KeyS") ? 1 : 0) - (held("ArrowUp", "KeyW") ? 1 : 0), sp: held("Enter", "ShiftLeft", "ShiftRight"), k: guestK }); }
      const m = g.net; if (!m) return;
      const k = Math.min(1, dt * 15);
      ball.x += (m.b[0] - ball.x) * k; ball.y += (m.b[1] - ball.y) * k;
      m.p.forEach((q, i) => { const p = P[i]; p.x += (q[0] - p.x) * k; p.y += (q[1] - p.y) * k; p.fx = q[2]; p.fy = q[3]; p.stam = q[4]; });
      if (m.s[0] + m.s[1] > g.s[0] + g.s[1]) [523, 659, 784].forEach((f, i) => tone(f, 0.14, "square", 0.06, 0, i * 0.08));
      g.s = m.s; g.t = m.tm; g.msg = m.msg; g.pause = m.pause;
      if (m.over && !g.over) { g.over = true; const my = mine(), mt = my ? my.team : 0; g.score = g.s[mt] * 100 + (g.s[mt] > g.s[1 - mt] ? 500 : g.s[0] === g.s[1] ? 200 : 0); g.result = m.result; }
      return;
    }
    if (g.pause > 0) { g.pause -= dt; for (const p of P) if (p.human && p.human.id === me && pressed("Space")) p.in.k++; }
    else { g.t += dt; step(dt); if (g.t >= TIME && !g.over) end(); }
    if (online) {
      g.sendT -= dt;
      if (g.sendT <= 0) { g.sendT = 0.05; online.send({ t: "st", b: [Math.round(ball.x * 10) / 10, Math.round(ball.y * 10) / 10], p: P.map((p) => [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10, +p.fx.toFixed(2), +p.fy.toFixed(2), +p.stam.toFixed(2)]),
        s: g.s, tm: g.t, msg: g.msg, pause: g.pause, over: g.over, result: g.result }); }
    }
  };
  g.draw = () => {
    for (let i = 0; i < 11; i++) rect(X0 + i * (X1 - X0) / 11, Y0, (X1 - X0) / 11 + 1, Y1 - Y0, i % 2 ? "#15803d" : "#16a34a");
    rect(0, 0, W, Y0, "#0d1020"); rect(0, Y1, W, H - Y1, "#0d1020"); rect(0, Y0, X0, Y1 - Y0, "#0d1020"); rect(X1, Y0, W - X1, Y1 - Y0, "#0d1020");
    cx.strokeStyle = "rgba(255,255,255,.8)"; cx.lineWidth = 1.5;
    cx.strokeRect(X0, Y0, X1 - X0, Y1 - Y0); cx.beginPath(); cx.moveTo(240, Y0); cx.lineTo(240, Y1); cx.stroke();
    cx.beginPath(); cx.arc(240, MY, 34, 0, Math.PI * 2); cx.stroke();
    cx.strokeRect(X0, MY - 60, 40, 120); cx.strokeRect(X1 - 40, MY - 60, 40, 120);
    rect(X0 - 12, MY - MOUTH, 12, MOUTH * 2, "rgba(239,68,68,.35)"); rect(X1, MY - MOUTH, 12, MOUTH * 2, "rgba(59,130,246,.35)");
    cx.strokeRect(X0 - 12, MY - MOUTH, 12, MOUTH * 2); cx.strokeRect(X1, MY - MOUTH, 12, MOUTH * 2);
    for (const p of P) {
      circ(p.x + 2, p.y + 3, PR, "rgba(0,0,0,.25)"); circ(p.x, p.y, PR, COL[p.team]);
      circ(p.x + p.fx * 6, p.y + p.fy * 6, 3, "#f8fafc");
      if (p.human && p.human.id === me) { cx.strokeStyle = "#fde047"; cx.lineWidth = 2; cx.beginPath(); cx.arc(p.x, p.y, PR + 3, 0, Math.PI * 2); cx.stroke(); rect(p.x - 10, p.y + PR + 4, 20 * p.stam, 2, "#fde047"); }
      txt(p.name.replace(" (bot)", ""), p.x, p.y - PR - 3, 7, p.human ? "#fff" : "#cbd5e1", "center");
    }
    circ(ball.x + 2, ball.y + 2, BR, "rgba(0,0,0,.3)"); circ(ball.x, ball.y, BR, "#f8fafc"); circ(ball.x - 1, ball.y - 1, 2, "#111827");
    txt(`RED ${g.s[0]}`, 160, 26, 16, COL[0], "center"); txt(`${g.s[1]} BLUE`, 320, 26, 16, COL[1], "center");
    const left = Math.max(0, TIME - g.t); txt(`${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, "0")}`, 240, 26, 14, "#f8fafc", "center");
    if (g.pause > 0 && !g.over) txt(g.msg, 240, 120, 18, "#fde047", "center");
    if (g.over && g.result) banner(["FULL TIME", ...g.result], online ? "Esc: back to the online room" : "Space play again · Esc menu");
  };
  g.dbg = () => ({ ball: [ball.x, ball.y, ball.vx, ball.vy].map((v) => Math.round(v)), p: P.map((p) => [Math.round(p.x), Math.round(p.y)]) });
  return g;
}
