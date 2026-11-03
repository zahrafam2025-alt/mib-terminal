"use strict";
const Net = {
  url(q) { const A = window.ARC; return (A && A.net ? A.net : (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/arcade/net") + "?" + new URLSearchParams(q); },
  async rooms(game) { try { return await (await fetch((window.ARC ? ARC.url("") : "") + "/api/arcade/rooms?game=" + game, { cache: "no-store" })).json(); } catch (e) { return []; } },
  note(text, ms = 3000) {
    let d = document.getElementById("net-note");
    if (!d) { d = document.createElement("div"); d.id = "net-note"; d.style.cssText = "position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:200;background:rgba(15,18,30,.92);color:#fde047;border:1px solid #fbbf24;border-radius:10px;padding:7px 14px;font:600 13px system-ui,sans-serif;pointer-events:none;max-width:90vw;text-align:center"; document.body.appendChild(d); }
    d.textContent = text; d.style.display = "block"; clearTimeout(d._t); if (ms) d._t = setTimeout(() => { d.style.display = "none"; }, ms);
  },
  open(q, on) {
    const c = { ws: null, you: null, room: null, key: null, live: false, quit: false, lost: 0, q: Object.assign({}, q) };
    const connect = () => {
      const ws = new WebSocket(Net.url(c.q)); c.ws = ws;
      let ka = null;
      let heard = Date.now();
      ws.onopen = () => { heard = Date.now(); ka = setInterval(() => {
        if (ws.readyState !== 1) return;
        if (Date.now() - heard > 12000) { try { ws.close(); } catch (e) {} if (ws.onclose) { const f = ws.onclose; ws.onclose = null; f(); } return; }
        ws.send("#ping");
      }, 4000); };
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
          if (m.t === "away") Net.note(m.id === 0 ? "The host lost their connection: waiting for them (up to 90 s)…" : "A player lost their connection: their place is kept 90 s", m.id === 0 ? 0 : 4000);
          if (m.t === "back") Net.note(m.id === 0 ? "The host is back" : "A player is back", 2500);
          if (on[m.t]) on[m.t](m);
          return;
        }
        if (!on.msg) return;
        if (q.role === "host") { const i = s.indexOf("|"); on.msg(JSON.parse(s.slice(i + 1)), +s.slice(0, i)); }
        else on.msg(JSON.parse(s));
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
    document.addEventListener("visibilitychange", () => { if (!document.hidden && c.lost && !c.quit && c.ws && c.ws.readyState > 1) connect(); });
    c.close = () => { c.quit = true; try { c.ws.close(); } catch (e) {} };
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
    return c;
  },
};
