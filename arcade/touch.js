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

  const iOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = navigator.standalone === true || matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches;
  T.iOS = iOS; T.standalone = standalone;
  T.canFull = () => !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
  T.isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement) || standalone;
  T.full = () => {
    if (T.isFull()) return;
    const el = document.documentElement, rq = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!rq) { if (iOS) T.homeTip(true); return; }
    try {
      const p = rq.call(el, { navigationUI: "hide" });
      const lock = () => { try { const o = screen.orientation && screen.orientation.lock && screen.orientation.lock("landscape"); if (o && o.catch) o.catch(() => {}); } catch (e) {} };
      if (p && p.then) p.then(lock, () => {}); else lock();
    } catch (e) {}
  };
  T.exitFull = () => { try { const ex = document.exitFullscreen || document.webkitExitFullscreen; if ((document.fullscreenElement || document.webkitFullscreenElement) && ex) { const p = ex.call(document); if (p && p.catch) p.catch(() => {}); } } catch (e) {} };
  T.toggleFull = () => { if (document.fullscreenElement || document.webkitFullscreenElement) T.exitFull(); else T.full(); };
  T.homeTip = (force) => {
    if (!iOS || standalone) return;
    try { if (!force && localStorage.getItem("arcade-hometip")) return; localStorage.setItem("arcade-hometip", "1"); } catch (e) {}
    if (document.getElementById("tp-tip")) return;
    const d = document.createElement("div"); d.id = "tp-tip";
    d.innerHTML = '<b>Full screen on iPhone</b><br>Safari cannot hide its bars. Tap <b>Share</b> <span style="font-size:18px">⬆︎</span>, then <b>Add to Home Screen</b>, and open the arcade from that icon: it plays like an app, full screen, with no swipe-back.<br><button>OK</button>';
    d.querySelector("button").onclick = () => d.remove();
    document.body.appendChild(d);
  };
  T.mobile = () => {
    if (!on) return;
    let vp = document.querySelector('meta[name="viewport"]');
    if (!vp) { vp = document.createElement("meta"); vp.name = "viewport"; document.head.appendChild(vp); }
    vp.content = "width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover";
    const s = document.createElement("style");
    s.textContent = `html,body{overscroll-behavior:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation;-webkit-text-size-adjust:100%}
canvas{touch-action:none}input,select,textarea{-webkit-user-select:auto;user-select:auto;font-size:16px!important}
#tp-rot{position:fixed;inset:0;z-index:100;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#05070d;color:#fbbf24;font:700 20px system-ui;text-align:center;padding:20px}
#tp-rot span{font-size:64px;animation:tprot 2s ease-in-out infinite}@keyframes tprot{0%,30%{transform:rotate(0)}60%,100%{transform:rotate(-90deg)}}
@media (orientation:portrait){#tp-rot{display:flex}}
#tp-tip{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:101;width:min(440px,92vw);background:#141827;border:1px solid #fbbf24;border-radius:12px;padding:12px 14px;color:#e5e7eb;font:14px/1.45 system-ui}
#tp-tip button{margin-top:8px;float:right;padding:6px 16px}`;
    document.head.appendChild(s);
    const r = document.createElement("div"); r.id = "tp-rot"; r.innerHTML = "<span>📱</span>Turn your phone sideways to play"; document.body.appendChild(r);
    for (const ev of ["gesturestart", "gesturechange", "gestureend"]) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
    document.addEventListener("dblclick", (e) => e.preventDefault(), { passive: false });
    let lastEnd = 0;
    document.addEventListener("touchend", (e) => { const now = Date.now(), t = e.target; if (now - lastEnd < 350 && !(t.closest && t.closest("input,select,textarea,a"))) e.preventDefault(); lastEnd = now; }, { passive: false });
    document.addEventListener("touchmove", (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
    setTimeout(() => T.homeTip(false), 1500);
  };
  T.soundButton = (isOn, set, pos) => {
    const b = T.button(isOn() ? "🔊" : "🔇", pos || { left: 12, top: 12 }, 44, () => { set(!isOn()); b.textContent = isOn() ? "🔊" : "🔇"; });
    b.style.fontSize = "20px";
    return b;
  };
  const ACS = [], Orig = window.AudioContext || window.webkitAudioContext;
  if (on && Orig) {
    const Wrapped = function (...a) { const c = new Orig(...a); ACS.push(c); return c; };
    Wrapped.prototype = Orig.prototype;
    window.AudioContext = Wrapped; window.webkitAudioContext = Wrapped;
  }
  let unlocked = false;
  const SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
  T.wakeSound = () => {
    try { if (navigator.audioSession && navigator.audioSession.type !== "playback") navigator.audioSession.type = "playback"; } catch (e) {}
    for (const c of ACS) { try { if (c.state !== "running" && c.state !== "closed") c.resume(); } catch (e) {} }
    if (!unlocked) { unlocked = true; try { const a = new Audio(SILENT); a.setAttribute("playsinline", ""); const p = a.play(); if (p && p.catch) p.catch(() => { unlocked = false; }); } catch (e) { unlocked = false; } }
  };
  if (on) for (const ev of ["touchend", "click", "pointerup", "keydown"]) document.addEventListener(ev, T.wakeSound, { capture: true, passive: true });
  window.TouchPad = T;
  if (on) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", T.mobile); else T.mobile(); }
})();
