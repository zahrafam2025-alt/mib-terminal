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
    try {
      const r = await fetch(A.url("/api/arcade"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return r.ok ? await r.json() : null;
    } catch (e) { return null; }
  };
  A.scores = async () => { try { return await (await fetch(A.url("/api/arcade"), { cache: "no-store" })).json(); } catch (e) { return null; } };
  window.ARC = A;
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
