(function () {
  "use strict";
  const on = /[?&]touch=1\b/.test(location.search) || (matchMedia("(pointer: coarse)").matches && "ontouchstart" in window);
  const T = { on };
  T.key = (code, key) => ({
    down: () => dispatchEvent(new KeyboardEvent("keydown", { code, key: key || code, bubbles: true })),
    up: () => dispatchEvent(new KeyboardEvent("keyup", { code, key: key || code, bubbles: true })),
  });
  T.css = () => {
    if (document.getElementById("tp-css")) return;
    const s = document.createElement("style"); s.id = "tp-css";
    s.textContent = `.tp{position:fixed;z-index:20;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.tp-b{position:fixed;z-index:21;display:flex;align-items:center;justify-content:center;border-radius:50%;touch-action:none;user-select:none;-webkit-user-select:none;
  background:rgba(15,18,30,.45);border:2px solid rgba(255,255,255,.35);color:#fff;font:700 13px "Segoe UI",system-ui,sans-serif;letter-spacing:.04em}
.tp-b.on{background:rgba(251,191,36,.55);border-color:#fbbf24}
.tp-stick{position:fixed;z-index:21;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;border:2px solid rgba(255,255,255,.3);background:rgba(15,18,30,.25);pointer-events:none;display:none}
.tp-knob{position:absolute;left:35px;top:35px;width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.45)}`;
    document.head.appendChild(s);
  };
  T.button = (label, pos, size, down, up, parent) => {
    T.css();
    const b = document.createElement("div"); b.className = "tp-b"; b.textContent = label;
    Object.assign(b.style, { width: size + "px", height: size + "px" }, Object.fromEntries(Object.entries(pos).map(([k, v]) => [k, v + "px"])));
    let held = null;
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); if (held !== null) return; held = e.pointerId; try { b.setPointerCapture(e.pointerId); } catch (er) {} b.classList.add("on"); if (down) down(e); });
    const end = (e) => { if (held !== e.pointerId) return; held = null; b.classList.remove("on"); if (up) up(e); };
    b.addEventListener("pointerup", end); b.addEventListener("pointercancel", end);
    (parent || document.body).appendChild(b);
    return b;
  };
  T.stick = (zone, move, end) => {
    T.css();
    const ring = document.createElement("div"); ring.className = "tp-stick"; const knob = document.createElement("div"); knob.className = "tp-knob";
    ring.appendChild(knob); document.body.appendChild(ring);
    let id = null, ox = 0, oy = 0;
    zone.addEventListener("pointerdown", (e) => { if (id !== null) return; e.preventDefault(); id = e.pointerId; ox = e.clientX; oy = e.clientY; try { zone.setPointerCapture(id); } catch (er) {}
      Object.assign(ring.style, { left: ox + "px", top: oy + "px", display: "block" }); move(0, 0); });
    zone.addEventListener("pointermove", (e) => { if (e.pointerId !== id) return; let dx = (e.clientX - ox) / 50, dy = (e.clientY - oy) / 50; const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
      knob.style.left = 35 + dx * 35 + "px"; knob.style.top = 35 + dy * 35 + "px"; move(dx, dy); });
    const stop = (e) => { if (e.pointerId !== id) return; id = null; ring.style.display = "none"; knob.style.left = knob.style.top = "35px"; end(); };
    zone.addEventListener("pointerup", stop); zone.addEventListener("pointercancel", stop);
  };
  T.drag = (zone, onMove, onTap) => {
    const fingers = new Map();
    zone.addEventListener("pointerdown", (e) => { e.preventDefault(); fingers.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now() }); try { zone.setPointerCapture(e.pointerId); } catch (er) {} });
    zone.addEventListener("pointermove", (e) => { const f = fingers.get(e.pointerId); if (!f) return; onMove(e.clientX - f.x, e.clientY - f.y, e); f.x = e.clientX; f.y = e.clientY; });
    const up = (e) => { const f = fingers.get(e.pointerId); if (!f) return; fingers.delete(e.pointerId);
      if (onTap && Math.hypot(e.clientX - f.x0, e.clientY - f.y0) < 12 && performance.now() - f.t < 350) onTap(e); };
    zone.addEventListener("pointerup", up); zone.addEventListener("pointercancel", (e) => fingers.delete(e.pointerId));
  };
  T.zone = (style) => { T.css(); const z = document.createElement("div"); z.className = "tp"; Object.assign(z.style, style); document.body.appendChild(z); return z; };
  window.TouchPad = T;
})();
