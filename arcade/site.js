(function () {
  "use strict";
  const A = Object.assign({
    api: "",
    net: "",
    names: false,
    sounds: true,
    sfx: "",
    music: true,
    lan: true,
    pages: { hub: "/arcade", strike: "/arcade/strike", empire: "/arcade/empire" },
  }, window.ARC_CONFIG || {});
  if (A.net === "auto") A.net = A.api.replace(/^http/, "ws") + "/arcade/net";
  A.online = !!A.net;
  A.url = (p) => A.api + p;
  const netAuto = (window.ARC_CONFIG || {}).net === "auto";
  A.pick = async (force) => {
    if (!A.names || !A.api || !/^https?:/.test(location.protocol)) return;
    const ok = async (u) => { try { const c = new AbortController(), t = setTimeout(() => c.abort(), 4000); const r = await fetch(u + "/api/arcade", { cache: "no-store", signal: c.signal }); clearTimeout(t); return r.ok; } catch (e) { return false; } };
    let main = A.main || A.api, backup = A.backup || "";
    try {
      if (!A.main) { const j = await (await fetch("/arcade/api.json", { cache: "no-store" })).json(); if (/^https:\/\/[a-z0-9.-]+\.workers\.dev$/.test(j.api || "")) main = j.api; if (/^https:\/\/[a-z0-9.-]+\.workers\.dev$/.test(j.backup || "")) backup = j.backup; }
    } catch (e) {}
    A.main = main; A.backup = backup;
    let pick = main;
    try { const c = JSON.parse(sessionStorage.getItem("arcade-pick") || "null"); if (!force && c && Date.now() - c.t < 120000 && (c.u === main || c.u === backup)) pick = c.u; else if (backup && !(await ok(main)) && await ok(backup)) pick = backup; } catch (e) { if (backup && !(await ok(main)) && await ok(backup)) pick = backup; }
    try { sessionStorage.setItem("arcade-pick", JSON.stringify({ u: pick, t: Date.now() })); } catch (e) {}
    A.api = pick; if (netAuto) A.net = pick.replace(/^http/, "ws") + "/arcade/net";
  };
  A.ready = A.pick();
  A.soundIndex = (game) => A.sounds ? "/arcade/sounds/" + game : A.sfx ? A.sfx + game + ".json" : "";
  A.soundBase = (game) => A.sounds ? "/arcade/sounds/" + game + "/" : A.sfx + game + "/";
  A.page = (k) => A.pages[k] || "/arcade";
  A.getName = () => { try { return localStorage.getItem("arcade-name") || ""; } catch (e) { return ""; } };
  A.setName = (n) => {
    n = String(n || "").replace(/[^\p{L}\p{N} _.\-]/gu, "").trim().slice(0, 16);
    try { if (n) localStorage.setItem("arcade-name", n); } catch (e) {}
    return n;
  };
  A.post = async (game, field, value) => {
    const body = { game, field, value };
    if (A.names) { const n = A.getName(); if (!n) return null; body.name = n; }
    await A.ready;
    for (let k = 0; k < 2; k++) {
      try {
        const r = await fetch(A.url("/api/arcade"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (r.ok) return await r.json();
      } catch (e) {}
      if (!k) await A.pick(true);
    }
    return null;
  };
  A.scores = async () => {
    await A.ready;
    for (let k = 0; k < 2; k++) { try { const r = await fetch(A.url("/api/arcade"), { cache: "no-store" }); if (r.ok) return await r.json(); } catch (e) {} if (!k) await A.pick(true); }
    return null;
  };
  window.ARC = A;
  if (A.names && "serviceWorker" in navigator && location.protocol === "https:") addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('a[href="/arcade"]').forEach((a) => { a.href = A.page("hub"); });
    if (!A.lan) ["bHost", "bJoin"].forEach((id) => { const b = document.getElementById(id); if (b) b.style.display = "none"; });
    if (A.online) {
      const words = [[/LAN GAME/g, "ONLINE GAME"], [/, on the same network/g, ""], [/Games on your network:/g, "Open games:"],
        [/Players can only join from your home network\./g, "Anyone with the room code can join, from anywhere."], [/bots or LAN/g, "bots or online"],
        [/LAN: /g, "ONLINE: "], [/the game server on this PC/g, "the game server"], [/the host's PC\. Check you are on the same network and try again\./g, "the host. Try again."]];
      const walk = (n) => { if (n.nodeType === 3) { let t = n.nodeValue; for (const [a, b] of words) t = t.replace(a, b); n.nodeValue = t; } else n.childNodes.forEach(walk); };
      walk(document.body);
      const al = window.alert; window.alert = (m) => { let t = String(m); for (const [a, b] of words) t = t.replace(a, b); al(t); };
    }
  });
})();
