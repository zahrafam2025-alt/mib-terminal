"use strict";
const Net = {
  url(q) { const A = window.ARC; return (A && A.net ? A.net : (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/arcade/net") + "?" + new URLSearchParams(q); },
  async rooms(game) { try { return await (await fetch((window.ARC ? ARC.url("") : "") + "/api/arcade/rooms?game=" + game, { cache: "no-store" })).json(); } catch (e) { return []; } },
  open(q, on) {
    const c = { ws: new WebSocket(Net.url(q)), you: null, room: null, live: false };
    let ka = null;
    c.ws.onopen = () => { ka = setInterval(() => { if (c.ws.readyState === 1) c.ws.send("#ping"); }, 10000); };
    c.ws.onmessage = (e) => {
      const s = e.data;
      if (s[0] === "#") { const m = JSON.parse(s.slice(1)); if (m.t === "hello") { c.you = m.you; c.room = m.room; c.live = true; } if (on[m.t]) on[m.t](m); return; }
      if (!on.msg) return;
      if (q.role === "host") { const i = s.indexOf("|"); on.msg(JSON.parse(s.slice(i + 1)), +s.slice(0, i)); }
      else on.msg(JSON.parse(s));
    };
    c.ws.onclose = () => {
      clearInterval(ka); c.live = false;
      if (c.room === null && !c.quit && on.fail) on.fail();
      if (on.close) on.close();
    };
    c.close = () => { c.quit = true; try { c.ws.close(); } catch (e) {} };
    return c;
  },
  host(game, name, on) {
    const c = Net.open({ game, role: "host", name }, on);
    c.send = (to, obj) => { if (c.ws.readyState === 1) c.ws.send(to + "|" + JSON.stringify(obj)); };
    c.started = () => { if (c.ws.readyState === 1) c.ws.send("*|#started"); };
    return c;
  },
  join(game, room, name, on) {
    const c = Net.open({ game, role: "join", room, name }, on);
    c.send = (obj) => { if (c.ws.readyState === 1) c.ws.send(JSON.stringify(obj)); };
    return c;
  },
};
