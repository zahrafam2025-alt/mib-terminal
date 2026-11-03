"use strict";
const Net = {
  url(q) { const A = window.ARC; return (A && A.net ? A.net : (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/arcade/net") + "?" + new URLSearchParams(q); },
  async rooms(game) { try { return await (await fetch((window.ARC ? ARC.url("") : "") + "/api/arcade/rooms?game=" + game, { cache: "no-store" })).json(); } catch (e) { return []; } },
  note(text, ms = 3000) {
    let d = document.getElementById("net-note");
    if (!d) { d = document.createElement("div"); d.id = "net-note"; d.style.cssText = "position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:200;background:rgba(15,18,30,.92);color:#fde047;border:1px solid #fbbf24;border-radius:10px;padding:7px 14px;font:600 13px system-ui,sans-serif;pointer-events:none;max-width:90vw;text-align:center"; document.body.appendChild(d); }
    d.textContent = text; d.style.display = "block"; clearTimeout(d._t); if (ms) d._t = setTimeout(() => { d.style.display = "none"; }, ms);
  },
  cid() {
    try { let v = localStorage.getItem("arcade-cid"); if (!v) { v = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); localStorage.setItem("arcade-cid", v); } return v; }
    catch (e) { return Net._cid || (Net._cid = Math.random().toString(36).slice(2, 12)); }
  },
  adminKey() { try { return localStorage.getItem("arcade-admin") || ""; } catch (e) { return ""; } },
  open(q, on) {
    if (q.role === "join") { q.cid = Net.cid(); const a = Net.adminKey(); if (a) q.admin = a; }
    const c = { ws: null, you: null, room: null, key: null, live: false, quit: false, lost: 0, q: Object.assign({}, q) };
    const connect = () => {
      const ws = new WebSocket(Net.url(c.q)); c.ws = ws;
      let ka = null;
      let heard = Date.now(), pingAt = 0, tickAt = Date.now();
      ws.onopen = () => { heard = Date.now(); tickAt = Date.now(); ka = setInterval(() => {
        const now = Date.now(), late = now - tickAt > 6000; tickAt = now;
        if (ws.readyState !== 1) return;
        if (late) { pingAt = now; ws.send("#ping"); return; }
        if (pingAt && heard < pingAt) {
          if (now - pingAt > 12000) { try { ws.close(); } catch (e) {} if (ws.onclose) { const f = ws.onclose; ws.onclose = null; f(); } }
          return;
        }
        pingAt = now; ws.send("#ping");
      }, 3000); };
      ws.onmessage = (e) => {
        if (c.ws !== ws) return;
        heard = Date.now();
        const s = e.data;
        if (s === '#{"t":"pong"}') return;
        if (s[0] === "#") {
          const m = JSON.parse(s.slice(1));
          if (m.t === "hello") {
            const again = c.room !== null; c.you = m.you; c.room = m.room; c.key = m.key || c.key; c.live = true;
            if (again) { c.lost = 0; Net.note("Back online", 2000); if (on.found) on.found(m); return; }
          }
          if (m.t === "error" && c.room !== null) { c.quit = true; if (on.close) on.close(); return; }
          if (m.t === "kicked") { c.quit = true; Net.note("You were removed from this game", 6000); if (on.close) on.close(); return; }
          if (m.t === "closed") { c.quit = true; if (m.why === "admin") Net.note("This game was closed by the admin", 6000); }
          if (m.t === "away") Net.note(m.id === 0 ? "The host lost their connection: waiting for them (up to 90 s)…" : "A player lost their connection: their place is kept 90 s", m.id === 0 ? 0 : 4000);
          if (m.t === "back") Net.note(m.id === 0 ? "The host is back" : "A player is back", 2500);
          if (on[m.t]) on[m.t](m);
          return;
        }
        const i = q.role === "host" ? s.indexOf("|") : -1, o = JSON.parse(s.slice(i + 1));
        if (o && o.__taunt !== undefined) { Net.hearTaunt(o); if (q.role === "host" && !o.d) c.send("*", o); return; }
        if (!on.msg) return;
        if (q.role === "host") on.msg(o, +s.slice(0, i));
        else on.msg(o);
      };
      ws.onclose = () => {
        clearInterval(ka);
        if (c.ws !== ws) return;
        c.live = false;
        if (c.quit) { if (on.close) on.close(); return; }
        if (c.room === null) { if (on.fail) on.fail(); if (on.close) on.close(); return; }
        if (!c.lost) { c.lost = Date.now(); Net.note("Connection lost: reconnecting…", 0); if (on.lost) on.lost(); }
        if (Date.now() - c.lost > 90000) { c.quit = true; Net.note("Could not reconnect", 4000); if (on.close) on.close(); return; }
        c.q = Object.assign({}, q, q.role === "host" ? { room: c.room, key: c.key } : { room: c.room, rejoin: c.you, key: c.key });
        setTimeout(() => { if (!c.quit && c.ws === ws) connect(); }, 1500);
      };
    };
    connect();
    Net.conns.add(c);
    document.addEventListener("visibilitychange", () => { if (!document.hidden && c.lost && !c.quit && c.ws && c.ws.readyState > 1) connect(); });
    c.close = () => { c.quit = true; Net.conns.delete(c); try { c.ws.close(); } catch (e) {} };
    return c;
  },
  host(game, name, on) {
    const c = Net.open({ game, role: "host", name }, on);
    c.send = (to, obj) => { if (c.ws && c.ws.readyState === 1) c.ws.send(to + "|" + JSON.stringify(obj)); };
    c.started = () => { if (c.ws && c.ws.readyState === 1) c.ws.send("*|#started"); };
    return c;
  },
  join(game, room, name, on) {
    const c = Net.open({ game, role: "join", room, name }, on);
    c.send = (obj) => { if (c.ws && c.ws.readyState === 1) c.ws.send(JSON.stringify(obj)); };
    c.sendAll = (obj) => { if (c.ws && c.ws.readyState === 1) c.ws.send("#all|" + JSON.stringify(obj)); };
    return c;
  },
  conns: new Set(),
  TAUNTS: [
    { g: 0, l: "fr", s: "C'est colossal !", p: 0.9 }, { g: 0, l: "en", s: "Colossal!", p: 0.7, r: 0.8 }, { g: 0, l: "fr", s: "Colossââââl !", p: 0.6, r: 0.75 },
    { g: 1, l: "en", s: "Respect my authoritah!", p: 1.7 }, { g: 1, l: "en", s: "Screw you guys, I'm going home!", p: 1.7 }, { g: 1, l: "en", s: "Whatever! I do what I want!", p: 1.7 },
    { g: 1, l: "en", s: "Sweeet!", p: 1.8 }, { g: 1, l: "en", s: "Seriously, you guys!", p: 1.7 },
    { g: 2, l: "fr", s: "Roberrrrt, j'suis tachéééée !", p: 1.4, r: 0.9 }, { g: 2, l: "fr", s: "La boulette dans ta tête !", p: 0.8 }, { g: 2, l: "fr", s: "Mokkori !", p: 1.2 },
    { g: 2, l: "fr", s: "Même pas mal !", p: 1.1 },
  ],
  voice(lang) {
    const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    return vs.find((v) => v.lang.toLowerCase().startsWith(lang) && /Google|Natural|Online|Denise|Henri|Aria|Guy|Samantha|Daniel/i.test(v.name)) || vs.find((v) => v.lang.toLowerCase().startsWith(lang)) || null;
  },
  sayTaunt(i, who) {
    const t = Net.TAUNTS[i]; if (!t) return;
    Net.note((who ? who + ": " : "") + t.s.replace(/r{3,}/g, "rrr"), 2500);
    try { const u = new SpeechSynthesisUtterance(t.s), v = Net.voice(t.l); if (v) u.voice = v; u.lang = t.l === "fr" ? "fr-FR" : "en-US"; u.pitch = t.p || 1; u.rate = t.r || 1; u.volume = 1; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {}
  },
  hearTaunt(o) { if (Date.now() - (Net._heard.get(o.n) || 0) < 1500) return; Net._heard.set(o.n, Date.now()); Net.sayTaunt(o.__taunt, o.n); },
  _heard: new Map(), _last: 0,
  taunt(group) {
    if (Date.now() - Net._last < 2000) return; Net._last = Date.now();
    const all = Net.TAUNTS.map((t, i) => [t, i]).filter(([t]) => t.g === group), i = all[Math.floor(Math.random() * all.length)][1];
    const name = (window.ARC && ARC.getName && ARC.getName()) || "Player", o = { __taunt: i, n: name, d: 1 };
    Net.sayTaunt(i, "");
    for (const c of Net.conns) { if (!c.ws || c.ws.readyState !== 1) continue; if (c.sendAll) c.sendAll(o); else c.send("*", o); }
  },
};
addEventListener("keydown", (e) => {
  const g = { F2: 0, F3: 1, F4: 2 }[e.code];
  if (g === undefined || (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))) return;
  e.preventDefault(); Net.taunt(g);
}, true);
