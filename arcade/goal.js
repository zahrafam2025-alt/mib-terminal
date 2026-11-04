"use strict";
function Goal(online = null) {
  const X0 = 20, X1 = 460, Y0 = 40, Y1 = 340, MY = (Y0 + Y1) / 2, MOUTH = 34, PR = 9, BR = 5, WIN = 5, TIME = 120;
  const COL = ["#ef4444", "#3b82f6"], NAMES = ["RED", "BLUE"];
  const host = !online || online.host, me = online ? online.me : 0;
  const humans = online ? online.players.slice(0, 4) : [{ id: 0, name: (window.ARC && ARC.getName()) || "YOU" }];
  const BOTN = ["Zizou", "Ronnie", "Leo", "Kylian", "Cristiano", "Thierry"];
  const P = [0, 1, 2, 3].map((i) => ({ i, team: i % 2, human: i < humans.length ? humans[i] : null, name: i < humans.length ? humans[i].name : BOTN[i] + " (bot)",
    x: 0, y: 0, vx: 0, vy: 0, fx: i % 2 ? -1 : 1, fy: 0, stam: 1, kickT: 0, in: { mx: 0, my: 0, sp: false, k: 0, t: 0 }, lastK: 0, lastT: 0, dashT: 0, tackT: 0, dazed: 0 }));
  let stuckT = 0;
  const ball = { x: 240, y: MY, vx: 0, vy: 0 };
  const g = { id: "goal", score: 0, over: false, t: 0, s: [0, 0], pause: 1.5, msg: "KICK OFF!", result: null, sendT: 0, net: null,
    help: "arrows / W A S D run · Space shoot · Shift sprint · Enter or X tackle · run into the ball to dribble · first to 5 · Esc menu" };
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
    const foe = P.find((q) => q.team !== p.team && Math.hypot(q.x - ball.x, q.y - ball.y) < PR + BR + 6);
    if (foe && Math.hypot(foe.x - p.x, foe.y - p.y) < 60 && Math.random() < 0.02) p.in.t++;
    const dx = tx - p.x, dy = ty - p.y, L = Math.hypot(dx, dy);
    p.in.mx = L > 4 ? dx / L : 0; p.in.my = L > 4 ? dy / L : 0; p.in.sp = near && L > 60;
  }
  function step(dt) {
    for (const p of P) {
      if (!p.human) bot(p);
      else if (p.human.id === me) { p.in.mx = (held("ArrowRight", "KeyD") ? 1 : 0) - (held("ArrowLeft", "KeyA") ? 1 : 0); p.in.my = (held("ArrowDown", "KeyS") ? 1 : 0) - (held("ArrowUp", "KeyW") ? 1 : 0);
        const ts = window.TSTICK; p.in.sp = held("ShiftLeft", "ShiftRight") || !!(ts && Math.hypot(ts.x, ts.y) > 0.92); if (pressed("Space")) p.in.k++; if (pressed("Enter", "KeyX")) p.in.t++; }
      const L = Math.hypot(p.in.mx, p.in.my), sprint = p.in.sp && p.stam > 0.05 && L > 0;
      p.stam = clamp(p.stam + (sprint ? -0.9 : 0.35) * dt, 0, 1);
      p.dazed = Math.max(0, p.dazed - dt); p.dashT = Math.max(0, p.dashT - dt); p.tackT -= dt;
      if (p.in.t > p.lastT) {
        p.lastT = p.in.t;
        if (p.tackT <= 0 && !p.dazed) {
          const opp = P.filter((q) => q.team !== p.team).sort((a, b) => Math.hypot(a.x - ball.x, a.y - ball.y) - Math.hypot(b.x - ball.x, b.y - ball.y))[0];
          const tg = opp && Math.hypot(opp.x - ball.x, opp.y - ball.y) < 40 && Math.hypot(opp.x - p.x, opp.y - p.y) < 120 ? opp : ball, dx = tg.x - p.x, dy = tg.y - p.y, d = Math.hypot(dx, dy) || 1;
          p.dashT = 0.28; p.tackT = 1.1; p.vx = dx / d * 330; p.vy = dy / d * 330; p.fx = dx / d; p.fy = dy / d; p.target = tg === ball ? null : tg;
          noise(0.12, 0.06, 900);
        }
      }
      if (p.dashT > 0) {
        if (p.target && Math.hypot(p.target.x - p.x, p.target.y - p.y) < PR * 2 + 5) {
          const q = p.target; q.dazed = 0.7; p.target = null; p.dashT = 0;
          if (Math.hypot(ball.x - q.x, ball.y - q.y) < PR + BR + 12) { ball.vx = p.fx * 150 + (Math.random() - 0.5) * 60; ball.vy = p.fy * 150 + (Math.random() - 0.5) * 60; }
          tone(110, 0.1, "square", 0.08, -40);
        }
        p.x = clamp(p.x + p.vx * dt, X0 + PR, X1 - PR); p.y = clamp(p.y + p.vy * dt, Y0 + PR, Y1 - PR); p.kickT -= dt;
        continue;
      }
      const sp = (p.human ? 1 : 0.88) * (sprint ? 165 : 112) * (p.dazed ? 0.35 : 1);
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
    const nearWall = ball.y < Y0 + 14 || ball.y > Y1 - 14 || ((ball.x < X0 + 14 || ball.x > X1 - 14) && Math.abs(ball.y - MY) > MOUTH);
    stuckT = Math.hypot(ball.vx, ball.vy) < 60 ? stuckT + dt * (nearWall ? 1 : 0.72) : 0;
    if (stuckT > 2.5) {
      stuckT = 0; const a = Math.atan2(MY - ball.y, 240 - ball.x) + (Math.random() - 0.5) * 2.2, sp = 190 + Math.random() * 110;
      ball.x += Math.cos(a) * 16; ball.y += Math.sin(a) * 16; ball.vx = Math.cos(a) * sp; ball.vy = Math.sin(a) * sp;
      for (const p of P) if (Math.hypot(p.x - ball.x, p.y - ball.y) < PR + BR + 10) { p.x -= Math.cos(a) * 12; p.y -= Math.sin(a) * 12; }
      g.msg = nearWall ? "THROW-IN" : "LOOSE BALL!"; tone(660, 0.08, "square", 0.05);
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
  g.netInput = (id, m) => { const p = P.find((q) => q.human && q.human.id === id); if (p) { p.in.mx = clamp(+m.mx || 0, -1, 1); p.in.my = clamp(+m.my || 0, -1, 1); p.in.sp = !!m.sp; p.in.k = Math.max(p.in.k, +m.k || 0); p.in.t = Math.max(p.in.t, +m.tk || 0); } };
  g.netState = (id, m) => { if (!host) g.net = m; };
  let guestK = 0, guestT = 0;
  g.update = (dt) => {
    if (!host) {
      if (pressed("Space")) guestK++;
      if (pressed("Enter", "KeyX")) guestT++;
      g.sendT -= dt;
      if (g.sendT <= 0) { g.sendT = 0.05; online.send({ t: "in", mx: (held("ArrowRight", "KeyD") ? 1 : 0) - (held("ArrowLeft", "KeyA") ? 1 : 0), my: (held("ArrowDown", "KeyS") ? 1 : 0) - (held("ArrowUp", "KeyW") ? 1 : 0), sp: held("ShiftLeft", "ShiftRight") || !!(window.TSTICK && Math.hypot(window.TSTICK.x, window.TSTICK.y) > 0.92), k: guestK, tk: guestT }); }
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
  const stand = (f) => pic(W, H, (x) => {
    const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#111827"); bg.addColorStop(0.5, "#0b1220"); bg.addColorStop(1, "#111827"); x.fillStyle = bg; x.fillRect(0, 0, W, H);
    const KIT = ["#ef4444", "#3b82f6", "#f8fafc", "#fde047", "#ef4444", "#3b82f6", "#a3a3a3", "#f97316"];
    let n = 7 + f;
    const fans = (x0, y0, x1, y1) => { for (let yy = y0; yy < y1; yy += 4) for (let xx = x0; xx < x1; xx += 4) { n = (n * 1103515245 + 12345) & 0x7fffffff; x.fillStyle = KIT[n % KIT.length]; x.globalAlpha = 0.45 + (n % 5) / 10; x.fillRect(xx + (n % 2), yy + ((n >> 3) % 2) * (f ? 1 : 0), 2, 2); } x.globalAlpha = 1; };
    fans(4, 2, W - 4, Y0 - 8); fans(4, Y1 + 9, W - 4, H - 2);
    for (let i = 0; i < 12; i++) { x.fillStyle = i % 2 ? "#1e3a8a" : "#7f1d1d"; x.fillRect(X0 + i * (X1 - X0) / 12, Y0 - 7, (X1 - X0) / 12 - 1, 5); x.fillRect(X0 + i * (X1 - X0) / 12, Y1 + 2, (X1 - X0) / 12 - 1, 5); }
    x.fillStyle = "rgba(255,255,255,.75)"; x.font = "bold 4px Consolas, monospace"; x.textAlign = "center";
    for (let i = 0; i < 12; i++) { x.fillText("MIB ARCADE", X0 + (i + 0.5) * (X1 - X0) / 12, Y0 - 3.2); x.fillText("MIB ARCADE", X0 + (i + 0.5) * (X1 - X0) / 12, Y1 + 5.8); }
    for (let i = 0; i < 11; i++) { x.fillStyle = i % 2 ? "#15803d" : "#16a34a"; x.fillRect(X0 + i * (X1 - X0) / 11, Y0, (X1 - X0) / 11 + 1, Y1 - Y0); }
    for (let i = 0; i < 1800; i++) { n = (n * 1103515245 + 12345) & 0x7fffffff; x.fillStyle = n % 3 ? "rgba(0,0,0,.07)" : "rgba(255,255,255,.06)"; x.fillRect(X0 + (n % 1000) / 1000 * (X1 - X0), Y0 + ((n >> 10) % 1000) / 1000 * (Y1 - Y0), 1, 1.5); }
    const light = x.createRadialGradient(240, MY, 40, 240, MY, 300); light.addColorStop(0, "rgba(255,255,255,.08)"); light.addColorStop(1, "rgba(0,0,0,.28)"); x.fillStyle = light; x.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    x.strokeStyle = "rgba(255,255,255,.85)"; x.lineWidth = 1.5;
    x.strokeRect(X0, Y0, X1 - X0, Y1 - Y0); x.beginPath(); x.moveTo(240, Y0); x.lineTo(240, Y1); x.stroke();
    x.beginPath(); x.arc(240, MY, 34, 0, Math.PI * 2); x.stroke(); x.fillStyle = "#fff"; x.beginPath(); x.arc(240, MY, 2, 0, 6.3); x.fill();
    x.strokeRect(X0, MY - 60, 40, 120); x.strokeRect(X1 - 40, MY - 60, 40, 120); x.strokeRect(X0, MY - 28, 14, 56); x.strokeRect(X1 - 14, MY - 28, 14, 56);
    x.beginPath(); x.arc(X0 + 30, MY, 1.6, 0, 6.3); x.fill(); x.beginPath(); x.arc(X1 - 30, MY, 1.6, 0, 6.3); x.fill();
    x.beginPath(); x.arc(X0 + 40, MY, 16, -1.1, 1.1); x.stroke(); x.beginPath(); x.arc(X1 - 40, MY, 16, Math.PI - 1.1, Math.PI + 1.1); x.stroke();
    for (const [cxx, cyy, a0] of [[X0, Y0, 0], [X1, Y0, Math.PI / 2], [X1, Y1, Math.PI], [X0, Y1, -Math.PI / 2]]) { x.beginPath(); x.arc(cxx, cyy, 6, a0, a0 + Math.PI / 2); x.stroke(); }
    for (const [gx, c] of [[X0 - 12, "#ef4444"], [X1, "#3b82f6"]]) {
      x.fillStyle = c + "33"; x.fillRect(gx, MY - MOUTH, 12, MOUTH * 2);
      x.strokeStyle = "rgba(255,255,255,.35)"; x.lineWidth = 0.5;
      for (let k = 3; k < 12; k += 3) { x.beginPath(); x.moveTo(gx + k, MY - MOUTH); x.lineTo(gx + k, MY + MOUTH); x.stroke(); }
      for (let k = -MOUTH + 4; k < MOUTH; k += 4) { x.beginPath(); x.moveTo(gx, MY + k); x.lineTo(gx + 12, MY + k); x.stroke(); }
      x.strokeStyle = "#fff"; x.lineWidth = 2; x.strokeRect(gx, MY - MOUTH, 12, MOUTH * 2);
    }
  });
  const STAND = [stand(0), stand(1)];
  const SHIRT = {};
  const shirt = (c) => SHIRT[c] || (SHIRT[c] = pic(22, 22, (x) => {
    const gr = x.createRadialGradient(9, 8, 1, 11, 11, 11); gr.addColorStop(0, shadeHex(c, 1.45)); gr.addColorStop(0.7, c); gr.addColorStop(1, shadeHex(c, 0.55));
    x.fillStyle = gr; x.beginPath(); x.ellipse(11, 11, 9, 10, 0, 0, 6.3); x.fill();
    x.fillStyle = "rgba(255,255,255,.75)"; x.fillRect(10, 2, 2, 18);
    x.fillStyle = "#3b2416"; x.beginPath(); x.arc(11, 11, 4.2, 0, 6.3); x.fill(); x.fillStyle = "#c68642"; x.beginPath(); x.arc(11.6, 11, 3.3, 0, 6.3); x.fill();
  }));
  let ballRot = 0, crowdT = 0;
  g.draw = () => {
    crowdT += 1 / 60; const cheer = g.pause > 0 && /GOAL/i.test(g.msg || "");
    cx.drawImage(STAND[Math.floor(crowdT * (cheer ? 8 : 1.5)) % 2], 0, 0, W, H);
    for (const p of P) {
      cx.fillStyle = "rgba(0,0,0,.28)"; cx.beginPath(); cx.ellipse(p.x + 3, p.y + 4, PR + 1, PR - 2, 0, 0, 6.3); cx.fill();
      if (p.human && p.human.id === me) { cx.strokeStyle = "#fde047"; cx.lineWidth = 2; cx.beginPath(); cx.arc(p.x, p.y, PR + 4, 0, Math.PI * 2); cx.stroke(); rect(p.x - 10, p.y + PR + 5, 20, 2, "rgba(0,0,0,.4)"); rect(p.x - 10, p.y + PR + 5, 20 * p.stam, 2, "#fde047"); }
      cx.save(); cx.translate(p.x, p.y); cx.rotate(Math.atan2(p.fy, p.fx)); cx.drawImage(shirt(COL[p.team]), -11, -11, 22, 22); cx.restore();
      txt(p.name.replace(" (bot)", ""), p.x, p.y - PR - 4, 7, p.human ? "#fff" : "#cbd5e1", "center");
    }
    const sp = Math.hypot(ball.vx, ball.vy); ballRot += sp / 60 / BR;
    if (sp > 120) { cx.globalAlpha = 0.25; circ(ball.x - ball.vx * 0.03, ball.y - ball.vy * 0.03, BR * 0.8, "#fff"); circ(ball.x - ball.vx * 0.06, ball.y - ball.vy * 0.06, BR * 0.6, "#fff"); cx.globalAlpha = 1; }
    circ(ball.x + 2.5, ball.y + 3, BR, "rgba(0,0,0,.35)"); circ(ball.x, ball.y, BR, "#f8fafc");
    cx.save(); cx.beginPath(); cx.arc(ball.x, ball.y, BR, 0, 6.3); cx.clip(); cx.fillStyle = "#111827";
    for (let k = 0; k < 3; k++) { const a = ballRot + k * 2.1; cx.beginPath(); cx.arc(ball.x + Math.cos(a) * 2.6, ball.y + Math.sin(a) * 2.6, 1.5, 0, 6.3); cx.fill(); }
    cx.restore(); circ(ball.x - 1.5, ball.y - 1.5, 1.2, "rgba(255,255,255,.9)");
    cx.fillStyle = "rgba(5,8,16,.85)"; cx.fillRect(150, 10, 180, 22);
    rect(150, 10, 60, 22, COL[0]); rect(270, 10, 60, 22, COL[1]);
    txt(`RED ${g.s[0]}`, 180, 26, 13, "#fff", "center"); txt(`${g.s[1]} BLUE`, 300, 26, 13, "#fff", "center");
    const left = Math.max(0, TIME - g.t); txt(`${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, "0")}`, 240, 26, 13, "#fde047", "center");
    if (g.pause > 0 && !g.over) { txt(g.msg, 241, 121, 20, "rgba(0,0,0,.6)", "center"); txt(g.msg, 240, 120, 20, "#fde047", "center"); }
    if (g.over && g.result) banner(["FULL TIME", ...g.result], online ? (window.againLine ? againLine() : "Tap to play again") : "Space play again · Esc menu");
  };
  g.dbg = () => ({ ball: [ball.x, ball.y, ball.vx, ball.vy].map((v) => Math.round(v)), p: P.map((p) => [Math.round(p.x), Math.round(p.y)]) });
  return g;
}
