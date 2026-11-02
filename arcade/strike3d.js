"use strict";
const S3 = { ready: false, failed: "", built: "", players: new Map(), t: 0 };
window.S3 = S3;
let T3 = null;

const WEAK_GPU = /intel|uhd|hd graphics|iris|swiftshader|llvmpipe|software|basic render|mali|adreno|powervr|apple gpu|videocore/i;
function S3pref() { try { return localStorage.getItem("strike-quality") || "auto"; } catch (e) { return "auto"; } }
function S3gpu() {
  try {
    const c = document.createElement("canvas"), g = c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl");
    if (!g) return { name: "", v2: false };
    const x = g.getExtension("WEBGL_debug_renderer_info"), name = String((x && g.getParameter(x.UNMASKED_RENDERER_WEBGL)) || g.getParameter(g.RENDERER) || "");
    const v2 = typeof WebGL2RenderingContext !== "undefined" && g instanceof WebGL2RenderingContext;
    const l = g.getExtension("WEBGL_lose_context"); if (l) l.loseContext();
    return { name, v2 };
  } catch (e) { return { name: "", v2: false }; }
}
function mstd(o) {
  if (S3.q !== "low") return new T3.MeshStandardMaterial(o);
  const p = Object.assign({}, o); for (const k of ["roughness", "metalness", "normalMap", "normalScale", "envMap", "envMapIntensity"]) delete p[k];
  return new T3.MeshLambertMaterial(p);
}

const S3rand = (() => { let s = 1234567; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
function rbox(w, h, d, r = 0.2, seg = 3) {
  const g = new T3.BoxGeometry(w, h, d, seg, seg, seg), p = g.attributes.position, v = new T3.Vector3();
  const R = Math.min(r * Math.min(w, h, d), w / 2, h / 2, d / 2), hx = w / 2 - R, hy = h / 2 - R, hz = d / 2 - R;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const ix = Math.max(-hx, Math.min(hx, v.x)), iy = Math.max(-hy, Math.min(hy, v.y)), iz = Math.max(-hz, Math.min(hz, v.z));
    const n = new T3.Vector3(v.x - ix, v.y - iy, v.z - iz); if (n.lengthSq() < 1e-12) n.set(0, 1, 0); n.normalize();
    p.setXYZ(i, ix + n.x * R, iy + n.y * R, iz + n.z * R);
  }
  g.computeVertexNormals(); return g;
}
function canvas(n) { const c = document.createElement("canvas"); c.width = c.height = n; c.getContext("2d", { willReadFrequently: true }); return c; }
function noiseField(n, cell, oct = 4, seed = 1) {
  const out = new Float32Array(n * n); let amp = 1, tot = 0;
  for (let o = 0; o < oct; o++) {
    const g = Math.max(1, Math.round(n / cell)), grid = new Float32Array(g * g);
    let s = seed * 9973 + o * 7919; for (let i = 0; i < grid.length; i++) { s = (s * 16807) % 2147483647; grid[i] = s / 2147483647; }
    const st = n / g;
    for (let y = 0; y < n; y++) {
      const fy = y / st, y0 = Math.floor(fy) % g, y1 = (y0 + 1) % g, ty = fy - Math.floor(fy), sy = ty * ty * (3 - 2 * ty);
      for (let x = 0; x < n; x++) {
        const fx = x / st, x0 = Math.floor(fx) % g, x1 = (x0 + 1) % g, tx = fx - Math.floor(fx), sx = tx * tx * (3 - 2 * tx);
        const a = grid[y0 * g + x0] + (grid[y0 * g + x1] - grid[y0 * g + x0]) * sx, b = grid[y1 * g + x0] + (grid[y1 * g + x1] - grid[y1 * g + x0]) * sx;
        out[y * n + x] += (a + (b - a) * sy) * amp;
      }
    }
    tot += amp; amp *= 0.5; cell /= 2; if (cell < 1) break;
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}
function material(name, n, paint, o = {}) {
  const c = canvas(n), x = c.getContext("2d"); paint(x, n);
  if (S3.q === "low") { const map = new T3.CanvasTexture(c); map.wrapS = map.wrapT = T3.RepeatWrapping; map.anisotropy = S3.aniso; map.colorSpace = T3.SRGBColorSpace;
    return new T3.MeshLambertMaterial({ map, vertexColors: true, name }); }
  const img = x.getImageData(0, 0, n, n).data, h = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) h[i] = (img[i * 4] * 0.3 + img[i * 4 + 1] * 0.59 + img[i * 4 + 2] * 0.11) / 255;
  if (o.height) { const e = o.height(n); for (let i = 0; i < n * n; i++) h[i] = h[i] * (1 - o.hmix) + e[i] * o.hmix; }
  const nc = canvas(n), nx = nc.getContext("2d"), nd = nx.createImageData(n, n), k = o.bump || 2.5;
  for (let y = 0; y < n; y++) for (let x2 = 0; x2 < n; x2++) {
    const l = h[y * n + (x2 + n - 1) % n], r = h[y * n + (x2 + 1) % n], u = h[((y + n - 1) % n) * n + x2], d = h[((y + 1) % n) * n + x2];
    let vx = (l - r) * k, vy = (d - u) * k, vz = 1; const L = Math.hypot(vx, vy, vz); vx /= L; vy /= L; vz /= L;
    const j = (y * n + x2) * 4; nd.data[j] = (vx * 0.5 + 0.5) * 255; nd.data[j + 1] = (vy * 0.5 + 0.5) * 255; nd.data[j + 2] = (vz * 0.5 + 0.5) * 255; nd.data[j + 3] = 255;
  }
  nx.putImageData(nd, 0, 0);
  const map = new T3.CanvasTexture(c), nmap = new T3.CanvasTexture(nc);
  for (const t of [map, nmap]) { t.wrapS = t.wrapT = T3.RepeatWrapping; t.anisotropy = S3.aniso; }
  map.colorSpace = T3.SRGBColorSpace;
  return new T3.MeshStandardMaterial({ map, normalMap: nmap, normalScale: new T3.Vector2(o.ns || 1, o.ns || 1), roughness: o.rough ?? 0.9,
    metalness: o.metal ?? 0, vertexColors: true, name });
}
function speckle(x, n, base, count, alpha, size = 2) {
  x.fillStyle = base; x.fillRect(0, 0, n, n);
  for (let i = 0; i < count; i++) { const v = Math.random(); x.fillStyle = v > 0.5 ? `rgba(255,250,235,${alpha * Math.random()})` : `rgba(30,20,10,${alpha * Math.random()})`; x.fillRect(Math.random() * n, Math.random() * n, size, size); }
}
function blotches(x, n, cols, k = 0.5, cell = 64, seed = 3) {
  const f = noiseField(n, cell, 4, seed), img = x.getImageData(0, 0, n, n);
  for (let i = 0; i < n * n; i++) { const v = f[i]; const c = cols[Math.min(cols.length - 1, Math.floor(v * cols.length))]; const m = k * Math.abs(v - 0.5) * 2;
    img.data[i * 4] = img.data[i * 4] * (1 - m) + c[0] * m; img.data[i * 4 + 1] = img.data[i * 4 + 1] * (1 - m) + c[1] * m; img.data[i * 4 + 2] = img.data[i * 4 + 2] * (1 - m) + c[2] * m; }
  x.putImageData(img, 0, 0);
}
function cracks(x, n, count, col = "rgba(70,50,30,.35)") {
  x.strokeStyle = col; x.lineWidth = 1;
  for (let i = 0; i < count; i++) { let px = Math.random() * n, py = Math.random() * n; x.beginPath(); x.moveTo(px, py); for (let j = 0; j < 7; j++) { px += (Math.random() - 0.5) * 26; py += Math.random() * 18; x.lineTo(px, py); } x.stroke(); }
}

function makeMaterials() {
  const N = S3.texN, M = [];
  M[0] = material("sand", N, (x, n) => { speckle(x, n, "#c9a46a", n * 14, 0.22, 1.5); blotches(x, n, [[176, 140, 92], [214, 182, 128], [196, 160, 105]], 0.45, n / 4, 5);
    x.strokeStyle = "rgba(120,90,50,.10)"; for (let i = 0; i < 18; i++) { const y = Math.random() * n; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(n / 3, y + 8, n * 2 / 3, y - 8, n, y); x.stroke(); }
    for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(${150 + Math.random() * 40},${120 + Math.random() * 30},${85},.5)`; x.beginPath(); x.ellipse(Math.random() * n, Math.random() * n, 0.8 + Math.random() * 1.5, 0.8 + Math.random() * 1.2, 0, 0, 6.3); x.fill(); } }, { rough: 0.97, bump: 1.6 });
  M[1] = material("plaster", N, (x, n) => { speckle(x, n, "#d9c49b", n * 10, 0.12); blotches(x, n, [[196, 168, 120], [224, 206, 168], [205, 180, 136]], 0.55, n / 3, 7);
    blotches(x, n, [[170, 140, 100], [228, 212, 178]], 0.35, n / 8, 41);
    cracks(x, n, 3, "rgba(90,70,45,.22)"); }, { rough: 0.93, bump: 2.2 });
  M[2] = material("crate", N, (x, n) => {
    const p = n / 6; for (let i = 0; i < 6; i++) { const s = 0.85 + Math.random() * 0.2; x.fillStyle = `rgb(${160 * s | 0},${112 * s | 0},${62 * s | 0})`; x.fillRect(0, i * p, n, p - 2);
      x.strokeStyle = "rgba(80,50,20,.25)"; for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(0, i * p + Math.random() * p); x.bezierCurveTo(n / 3, i * p + Math.random() * p, n * 2 / 3, i * p + Math.random() * p, n, i * p + Math.random() * p); x.stroke(); } }
    x.fillStyle = "#3d2810"; for (let i = 1; i < 6; i++) x.fillRect(0, i * p - 2, n, 2);
    const f = n * 0.09; x.fillStyle = "#7a5126"; x.fillRect(0, 0, n, f); x.fillRect(0, n - f, n, f); x.fillRect(0, 0, f, n); x.fillRect(n - f, 0, f, n);
    x.save(); x.translate(n / 2, n / 2); x.rotate(Math.atan2(n - 2 * f, n - 2 * f)); x.fillRect(-n * 0.66, -f / 2, n * 1.32, f); x.restore();
    x.strokeStyle = "#2b1a08"; x.lineWidth = 3; x.strokeRect(f, f, n - 2 * f, n - 2 * f); x.strokeRect(1.5, 1.5, n - 3, n - 3);
    x.fillStyle = "#222"; for (const [a, b] of [[f / 2, f / 2], [n - f / 2, f / 2], [f / 2, n - f / 2], [n - f / 2, n - f / 2]]) { x.beginPath(); x.arc(a, b, 3, 0, 6.3); x.fill(); }
    x.globalAlpha = 0.55; x.fillStyle = "#2a1a0a"; x.font = `bold ${n / 10}px Consolas, monospace`; x.textAlign = "center"; x.fillText("MIB", n / 2, n * 0.78); x.font = `${n / 16}px Consolas, monospace`; x.fillText("FRAGILE ▲ 40 KG", n / 2, n * 0.86); x.globalAlpha = 1; }, { rough: 0.85, bump: 2.8 });
  M[3] = material("concrete", N, (x, n) => { speckle(x, n, "#8f9194", n * 18, 0.18, 1.5); blotches(x, n, [[120, 122, 124], [160, 160, 158], [135, 136, 135]], 0.5, n / 3, 11);
    x.strokeStyle = "rgba(40,40,40,.35)"; x.lineWidth = 2; x.beginPath(); x.moveTo(0, n / 2); x.lineTo(n, n / 2); x.moveTo(n / 2, 0); x.lineTo(n / 2, n / 2); x.moveTo(n / 4, n / 2); x.lineTo(n / 4, n); x.stroke();
    x.fillStyle = "rgba(30,30,30,.35)"; for (const [a, b] of [[n / 6, n / 4], [n * 5 / 6, n / 4], [n / 2.5, n * 0.75], [n * 0.9, n * 0.75]]) { x.beginPath(); x.arc(a, b, 3, 0, 6.3); x.fill(); }
    x.fillStyle = "rgba(60,50,40,.12)"; for (let i = 0; i < 6; i++) x.fillRect(Math.random() * n, 0, 2 + Math.random() * 5, n); }, { rough: 0.92, bump: 2 });
  M[4] = material("metal", N, (x, n) => { x.fillStyle = "#5c6873"; x.fillRect(0, 0, n, n); for (let i = 0; i < n * 2; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? 255 : 0},${Math.random() < 0.5 ? 255 : 0},255,.05)`; x.fillRect(0, Math.random() * n, n, 1); }
    blotches(x, n, [[70, 60, 50], [110, 70, 40]], 0.35, n / 4, 13);
    x.strokeStyle = "rgba(20,25,30,.6)"; x.lineWidth = 3; x.strokeRect(2, 2, n - 4, n / 2 - 4); x.strokeRect(2, n / 2 + 2, n - 4, n / 2 - 4);
    x.fillStyle = "#3a434c"; for (let i = 0; i < 8; i++) for (const yy of [8, n / 2 - 8, n / 2 + 8, n - 8]) { x.beginPath(); x.arc(8 + i * (n - 16) / 7, yy, 3.5, 0, 6.3); x.fill(); } }, { rough: 0.5, metal: 0.6, bump: 3 });
  const sign = (L) => (x, n) => { M[1].map.image && x.drawImage(M[1].map.image, 0, 0, n, n); x.fillStyle = "rgba(200,60,15,.92)"; x.font = `bold ${n * 0.72}px Impact, "Arial Black", sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(L, n / 2, n * 0.56);
    x.strokeStyle = "rgba(200,60,15,.9)"; x.lineWidth = n / 24; x.beginPath(); x.moveTo(n * 0.68, n * 0.9); x.lineTo(n * 0.92, n * 0.9); x.lineTo(n * 0.85, n * 0.84); x.moveTo(n * 0.92, n * 0.9); x.lineTo(n * 0.85, n * 0.96); x.stroke();
    blotches(x, n, [[190, 170, 140]], 0.25, n / 4, L.charCodeAt(0)); };
  M[5] = material("signA", N, sign("A"), { rough: 0.9, bump: 1.2 });
  M[6] = material("signB", N, sign("B"), { rough: 0.9, bump: 1.2 });
  M[7] = material("white", N, (x, n) => { speckle(x, n, "#e8e5de", n * 6, 0.08); blotches(x, n, [[200, 196, 188], [235, 232, 226]], 0.4, n / 3, 17); cracks(x, n, 3, "rgba(90,90,90,.25)"); }, { rough: 0.85, bump: 1.4 });
  M[8] = material("cobble", N, (x, n) => { x.fillStyle = "#4e463d"; x.fillRect(0, 0, n, n); const s = n / 8;
    for (let j = 0; j < 8; j++) for (let i = 0; i < 9; i++) { const k = 0.75 + Math.random() * 0.4, o = (j % 2) * s / 2, g = x.createRadialGradient(i * s + o - s * 0.15, j * s + s * 0.35, 1, i * s + o, j * s + s / 2, s * 0.55);
      g.addColorStop(0, `rgb(${178 * k | 0},${166 * k | 0},${146 * k | 0})`); g.addColorStop(1, `rgb(${110 * k | 0},${100 * k | 0},${86 * k | 0})`); x.fillStyle = g;
      x.beginPath(); x.ellipse(((i * s + o) % (n + s)), j * s + s / 2, s * 0.46, s * 0.42, Math.random() * 0.4, 0, 6.3); x.fill(); } }, { rough: 0.9, bump: 4 });
  M[9] = material("terra", N, (x, n) => { speckle(x, n, "#c98f63", n * 10, 0.12); blotches(x, n, [[180, 110, 70], [220, 160, 115], [200, 130, 90]], 0.5, n / 3, 19); cracks(x, n, 5, "rgba(90,50,30,.3)"); }, { rough: 0.92, bump: 2 });
  M[10] = material("roof", N, (x, n) => { x.fillStyle = "#6e2c18"; x.fillRect(0, 0, n, n); const r = n / 8;
    for (let j = 0; j < 8; j++) for (let i = -1; i < 9; i++) { const k = 0.8 + Math.random() * 0.35, g = x.createLinearGradient(0, j * r, 0, j * r + r); g.addColorStop(0, `rgb(${190 * k | 0},${86 * k | 0},${50 * k | 0})`); g.addColorStop(1, `rgb(${120 * k | 0},${50 * k | 0},${28 * k | 0})`);
      x.fillStyle = g; x.beginPath(); x.ellipse(i * r + (j % 2) * r / 2 + r / 2, j * r + r * 0.55, r * 0.47, r * 0.6, 0, Math.PI, 0); x.fill(); } }, { rough: 0.8, bump: 4 });
  M[11] = material("wood", N, (x, n) => { const p = n / 8; for (let i = 0; i < 8; i++) { const k = 0.8 + Math.random() * 0.3; x.fillStyle = `rgb(${140 * k | 0},${96 * k | 0},${58 * k | 0})`; x.fillRect(i * p, 0, p - 2, n);
    x.strokeStyle = "rgba(60,35,15,.3)"; for (let g = 0; g < 5; g++) { x.beginPath(); const gx = i * p + Math.random() * p; x.moveTo(gx, 0); x.bezierCurveTo(gx + 6, n / 3, gx - 6, n * 2 / 3, gx, n); x.stroke(); } x.fillStyle = "#2d1a0b"; x.fillRect(i * p + p - 2, 0, 2, n); } }, { rough: 0.8, bump: 2.5 });
  M[12] = material("asphalt", N, (x, n) => { speckle(x, n, "#3b3e43", n * 30, 0.25, 1.2); blotches(x, n, [[50, 52, 56], [70, 72, 76]], 0.4, n / 3, 23); cracks(x, n, 4, "rgba(15,15,15,.6)"); x.fillStyle = "rgba(230,220,180,.55)"; x.fillRect(n * 0.48, 0, n * 0.04, n * 0.4); }, { rough: 0.95, bump: 1.8 });
  M[13] = material("hazard", N, (x, n) => { x.fillStyle = "#e7b913"; x.fillRect(0, 0, n, n); x.fillStyle = "#18181b"; for (let i = -4; i < 8; i++) { x.beginPath(); x.moveTo(i * n / 4, 0); x.lineTo(i * n / 4 + n / 8, 0); x.lineTo(i * n / 4 + n / 8 + n, n); x.lineTo(i * n / 4 + n, n); x.fill(); }
    blotches(x, n, [[90, 80, 60]], 0.3, n / 4, 29); }, { rough: 0.7, bump: 1 });
  M[14] = material("grass", N, (x, n) => { speckle(x, n, "#4c7a33", 0, 0); blotches(x, n, [[60, 100, 40], [95, 130, 55], [110, 100, 60]], 0.6, n / 4, 31);
    for (let i = 0; i < n * 8; i++) { x.strokeStyle = `rgba(${40 + Math.random() * 60},${90 + Math.random() * 70},${30},.6)`; const a = Math.random() * n, b = Math.random() * n; x.beginPath(); x.moveTo(a, b); x.lineTo(a + Math.random() * 3 - 1.5, b - 3 - Math.random() * 4); x.stroke(); } }, { rough: 0.95, bump: 2 });
  M[15] = material("ribbed", N, (x, n) => { x.fillStyle = "#d8d8dc"; x.fillRect(0, 0, n, n); for (let i = 0; i < 12; i++) { const g = x.createLinearGradient(i * n / 12, 0, (i + 1) * n / 12, 0); g.addColorStop(0, "#9b9ba3"); g.addColorStop(0.5, "#f0f0f4"); g.addColorStop(1, "#9b9ba3"); x.fillStyle = g; x.fillRect(i * n / 12, 0, n / 12, n); }
    blotches(x, n, [[120, 80, 50], [90, 60, 40]], 0.35, n / 4, 37); }, { rough: 0.55, metal: 0.35, bump: 4 });
  M[16] = material("glass", 64, (x, n) => { const g = x.createLinearGradient(0, 0, n, n); g.addColorStop(0, "#2b3542"); g.addColorStop(0.5, "#475569"); g.addColorStop(1, "#1e2530"); x.fillStyle = g; x.fillRect(0, 0, n, n); }, { rough: 0.15, metal: 0.4, bump: 0.2 });
  M[17] = material("frame", 64, (x, n) => { speckle(x, n, "#5b3b22", 200, 0.2); }, { rough: 0.8, bump: 1 });
  return M;
}
const UVFIT = new Set([2, 5, 6]), UVSCALE = { 0: 4, 1: 3.5, 9: 3.5, 7: 3.5, 12: 4, 8: 2.2, 10: 2.5, 14: 3.5 };

function boxGeoms(boxes, groups) {
  for (const b of boxes) {
    const [x0, y0, z0, x1, y1, z1, m, shade, col] = b, sc = UVSCALE[m] || 2.5, fit = UVFIT.has(m), c0 = shade || 1;
    const tint = col ? [col[0] * 1.6, col[1] * 1.6, col[2] * 1.6] : [1, 1, 1];
    const G = groups[m] || (groups[m] = { p: [], n: [], u: [], c: [], i: [] });
    const F = [[[[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], 2, 1, -1], [[[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], 2, 1, 1],
               [[[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0], 0, 2, 1], [[[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], 0, 2, 1],
               [[[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], 0, 1, 1], [[[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], 0, 1, -1]];
    for (const [ps, n, ua, va, us] of F) {
      if (n[1] < 0 && y0 <= 0.001) continue;
      const vert = n[1] === 0, h = y1 - y0, cut = vert && h > 1.3 && y0 < 0.5 ? Math.min(y1, y0 + 1.1) : null;
      const quads = cut ? [[y0, cut, 0.58, 1], [cut, y1, 1, 1]] : [[y0, y1, vert && y0 < 0.5 ? 0.62 : 1, 1]];
      for (const [ya, yb, ka, kb] of quads) {
        const base = G.p.length / 3;
        ps.forEach((p0, i) => {
          const p = [p0[0], vert ? (i < 2 ? ya : yb) : p0[1], p0[2]];
          G.p.push(p[0], p[1], p[2]); G.n.push(n[0], n[1], n[2]);
          let u, v;
          if (fit) { u = [0, 1, 1, 0][i]; v = vert ? (p[1] - y0) / Math.max(1e-6, h) : [0, 0, 1, 1][i]; if (!vert) v = [0, 0, 1, 1][i]; }
          else { u = p[ua] * us / sc; v = p[va] / sc; }
          G.u.push(u, v);
          const k = (vert ? (i < 2 ? ka : kb) : 1) * c0;
          G.c.push(tint[0] * k, tint[1] * k, tint[2] * k);
        });
        G.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
    }
  }
}
function dressing() {
  const out = [], outer = (b) => b[0] <= -32.5 || b[3] >= 32.5 || b[2] <= -36.5 || b[5] >= 36.5;
  for (const b of BOX) {
    const [x0, y0, z0, x1, y1, z1, m] = b, h = y1 - y0, w = x1 - x0, d = z1 - z0;
    if (y1 <= 0.01) continue;
    if ([1, 9, 7].includes(m) && h >= 2.4 && !outer(b)) {
      const e1 = 0.06 + S3rand() * 0.02, e2 = 0.03 + S3rand() * 0.012, top = y1 + 0.04 + S3rand() * 0.012;
      out.push([x0 - e1, y1 - 0.14, z0 - e1, x1 + e1, top, z1 + e1, 3, 1.05]);
      out.push([x0 - e2, y0, z0 - e2, x1 + e2, y0 + 0.3 + S3rand() * 0.04, z1 + e2, 3, 0.8]);
      if (h >= 4.5 && (w >= 6 || d >= 6)) for (const face of [0, 1, 2, 3]) {
        const along = face < 2 ? w : d, n = Math.floor((along - 2) / 3.6);
        for (let k = 0; k < n; k++) {
          const c = (face < 2 ? x0 : z0) + 1 + (along - 2) * (k + 0.5) / n + (S3rand() - 0.5) * 0.4, wy0 = Math.min(y1 - 1.6, 2.3), wy1 = wy0 + 1.25;
          if (S3rand() < 0.25) continue;
          const t = 0.06, fw = 0.55;
          if (face === 0) { out.push([c - fw - 0.08, wy0 - 0.08, z1, c + fw + 0.08, wy1 + 0.08, z1 + t, 17, 1]); out.push([c - fw, wy0, z1 + t * 0.4, c + fw, wy1, z1 + t + 0.005, 16, 1]); }
          if (face === 1) { out.push([c - fw - 0.08, wy0 - 0.08, z0 - t, c + fw + 0.08, wy1 + 0.08, z0, 17, 1]); out.push([c - fw, wy0, z0 - t - 0.005, c + fw, wy1, z0 - t * 0.4, 16, 1]); }
          if (face === 2) { out.push([x1, wy0 - 0.08, c - fw - 0.08, x1 + t, wy1 + 0.08, c + fw + 0.08, 17, 1]); out.push([x1 + t * 0.4, wy0, c - fw, x1 + t + 0.005, wy1, c + fw, 16, 1]); }
          if (face === 3) { out.push([x0 - t, wy0 - 0.08, c - fw - 0.08, x0, wy1 + 0.08, c + fw + 0.08, 17, 1]); out.push([x0 - t - 0.005, wy0, c - fw, x0 - t * 0.4, wy1, c + fw, 16, 1]); }
        }
      }
    }
    if (m === 2 && h < 2.5) out.push([x0 + 0.02, y1, z0 + 0.02, x1 - 0.02, y1 + 0.004, z1 - 0.02, 2, 0.85]);
  }
  return out;
}
function buildMap() {
  if (S3.mapGroup) { S3.scene.remove(S3.mapGroup); S3.mapGroup.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
  const groups = {}; boxGeoms(BOX, groups); boxGeoms(dressing(), groups);
  const grp = new T3.Group();
  for (const [m, G] of Object.entries(groups)) {
    const g = new T3.BufferGeometry();
    g.setAttribute("position", new T3.Float32BufferAttribute(G.p, 3)); g.setAttribute("normal", new T3.Float32BufferAttribute(G.n, 3));
    g.setAttribute("uv", new T3.Float32BufferAttribute(G.u, 2)); g.setAttribute("color", new T3.Float32BufferAttribute(G.c, 3)); g.setIndex(G.i);
    g.computeTangents && false; g.computeBoundingSphere();
    const mesh = new T3.Mesh(g, S3.mats[m] || S3.mats[1]); mesh.castShadow = +m !== 0 && +m !== 12 && +m !== 8 && +m !== 14; mesh.receiveShadow = true;
    grp.add(mesh);
  }
  S3.scene.add(grp); S3.mapGroup = grp; S3.built = MAPN;
  const sky = new T3.Color().setRGB(SKY[0], SKY[1], SKY[2], T3.SRGBColorSpace);
  S3.scene.fog.color.copy(sky); S3.skyMat.uniforms.uHorizon.value.copy(sky);
  const warm = MAPN === "reactor" ? 0xf2f0ea : 0xffe2b6; S3.sun.color.set(warm);
  S3.sun.intensity = MAPN === "reactor" ? 2.3 : 2.9; S3.hemi.intensity = MAPN === "reactor" ? 1.15 : 1.0;
  if (S3.decals) { S3.decals.count = 0; S3.decalN = 0; }
}

function faceTex(skin, beard) {
  const c = canvas(256), x = c.getContext("2d"); x.fillStyle = skin; x.fillRect(0, 0, 256, 256);
  const cx = 192, ey = 112;
  if (beard) { x.fillStyle = "rgba(40,28,18,.45)"; x.beginPath(); x.ellipse(cx, 160, 30, 26, 0, 0, Math.PI); x.fill(); }
  x.fillStyle = "rgba(0,0,0,.18)"; x.beginPath(); x.ellipse(cx, ey + 4, 30, 9, 0, 0, 6.3); x.fill();
  for (const sx of [-13, 13]) { x.fillStyle = "#f2efe8"; x.beginPath(); x.ellipse(cx + sx, ey, 6, 3.6, 0, 0, 6.3); x.fill();
    x.fillStyle = "#3b2a1c"; x.beginPath(); x.arc(cx + sx, ey, 2.6, 0, 6.3); x.fill(); x.fillStyle = "#111"; x.beginPath(); x.arc(cx + sx, ey, 1.2, 0, 6.3); x.fill();
    x.strokeStyle = "#3a2716"; x.lineWidth = 3; x.beginPath(); x.moveTo(cx + sx - 8, ey - 9); x.quadraticCurveTo(cx + sx, ey - 12, cx + sx + 8, ey - 9); x.stroke(); }
  x.fillStyle = "rgba(0,0,0,.16)"; x.beginPath(); x.moveTo(cx - 3, ey + 6); x.lineTo(cx - 6, ey + 26); x.lineTo(cx + 5, ey + 27); x.fill();
  x.strokeStyle = "#7a3f30"; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - 9, ey + 38); x.quadraticCurveTo(cx, ey + 41, cx + 9, ey + 38); x.stroke();
  x.fillStyle = "rgba(0,0,0,.12)"; x.fillRect(0, 0, 256, 40);
  const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t;
}
function teamMats(team) {
  const camo = (base, spots) => { const c = canvas(128), x = c.getContext("2d"); x.fillStyle = base; x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 60; i++) { x.fillStyle = spots[i % spots.length]; x.beginPath(); x.ellipse(Math.random() * 128, Math.random() * 128, 5 + Math.random() * 14, 3 + Math.random() * 8, Math.random() * 3, 0, 6.3); x.fill(); }
    const t = new T3.CanvasTexture(c); t.wrapS = t.wrapT = T3.RepeatWrapping; t.colorSpace = T3.SRGBColorSpace; t.repeat.set(2, 2); return t; };
  const std = (o) => mstd(Object.assign({ roughness: 0.85 }, o));
  return team === 0 ? {
    cloth: std({ map: camo("#a08a62", ["#8c7550", "#b39d72", "#7a6646"]) }), vest: std({ color: 0x4f4128, roughness: 0.9 }), pouch: std({ color: 0x3e331f }),
    head: std({ color: 0x1d1b19, roughness: 0.95 }), skin: std({ color: 0xc58f63, roughness: 0.7 }), boot: std({ color: 0x2a2017 }), glove: std({ color: 0x2a251f }),
    helm: std({ color: 0x3b3221 }), lens: std({ color: 0x111111, roughness: 0.2, metalness: 0.6 }) } : {
    cloth: std({ map: camo("#34445c", ["#2a384c", "#405269", "#2e3b4f"]) }), vest: std({ color: 0x1b2433, roughness: 0.9 }), pouch: std({ color: 0x141b27 }),
    head: std({ map: faceTex("#b98557", true), roughness: 0.7 }), skin: std({ color: 0xb98557, roughness: 0.7 }), boot: std({ color: 0x111317 }), glove: std({ color: 0x15171c }),
    helm: std({ color: 0x1f2633, roughness: 0.6 }), lens: std({ color: 0x0e1622, roughness: 0.15, metalness: 0.7 }) };
}
function part(geo, mat, parent, x = 0, y = 0, z = 0) { const m = new T3.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
function joint(parent, x, y, z) { const g = new T3.Group(); g.position.set(x, y, z); parent.add(g); return g; }
function makeSoldier(team) {
  const M = S3.tm[team], G = S3.geo, root = new T3.Group(), hips = joint(root, 0, 0.88, 0);
  const s = { root, hips, team };
  for (const side of [-1, 1]) {
    const hip = joint(hips, side * 0.1, 0, 0); part(G.thigh, M.cloth, hip, 0, -0.2, 0);
    const knee = joint(hip, 0, -0.42, 0); part(G.kneepad, M.pouch, knee, 0, 0.0, -0.06); part(G.shin, M.cloth, knee, 0, -0.2, 0);
    part(G.boot, M.boot, knee, 0, -0.41, -0.04);
    s[side < 0 ? "hipL" : "hipR"] = hip; s[side < 0 ? "kneeL" : "kneeR"] = knee;
  }
  part(G.belt, M.pouch, hips, 0, 0.02, 0);
  const spine = joint(hips, 0, 0.02, 0); s.spine = spine;
  part(G.torso, M.cloth, spine, 0, 0.3, 0); part(G.vest, M.vest, spine, 0, 0.36, 0);
  for (const [px, py] of [[-0.12, 0.24], [0, 0.24], [0.12, 0.24]]) part(G.pouch, M.pouch, spine, px, py, -0.185);
  part(G.pack, M.pouch, spine, 0, 0.36, 0.185);
  part(G.neck, M.skin, spine, 0, 0.66, 0);
  const head = joint(spine, 0, 0.79, 0); s.head = head;
  part(G.head, M.head, head, 0, 0, 0);
  if (team === 0) { part(G.eyes, M.skin, head, 0, 0.025, -0.075); part(G.goggle, M.lens, head, 0, 0.035, -0.105); part(G.cap, M.helm, head, 0, 0.08, 0); part(G.brim, M.helm, head, 0, 0.075, -0.1); }
  else { part(G.helmet, M.helm, head, 0, 0.03, 0); part(G.goggle, M.lens, head, 0, 0.02, -0.11); part(G.chin, M.helm, head, 0, -0.085, -0.02); }
  const shR = joint(spine, 0.235, 0.55, 0), shL = joint(spine, -0.235, 0.55, 0);
  part(G.pad, M.cloth, spine, 0.215, 0.56, 0); part(G.pad, M.cloth, spine, -0.215, 0.56, 0);
  part(G.upper, M.cloth, shR, 0, -0.13, 0); const elR = joint(shR, 0, -0.27, 0); part(G.fore, M.cloth, elR, 0, -0.12, 0); part(G.hand, M.glove, elR, 0, -0.26, 0);
  part(G.upper, M.cloth, shL, 0, -0.13, 0); const elL = joint(shL, 0, -0.27, 0); part(G.fore, M.cloth, elL, 0, -0.12, 0); part(G.hand, M.glove, elL, 0, -0.26, 0);
  Object.assign(s, { shR, shL, elR, elL });
  const gunMount = joint(spine, 0.07, 0.45, -0.26); gunMount.matrixAutoUpdate = true; s.gunMount = gunMount; s.gunKind = "";
  const fl = new T3.Sprite(S3.flashMat); fl.scale.set(0.35, 0.35, 1); fl.visible = false; s.flash = fl; S3.scene.add(fl);
  const box = new T3.Mesh(G.cbox, S3.boxMat); box.position.y = 0.5; box.castShadow = true; box.visible = false; root.add(box); s.box = box;
  root.traverse((o) => { if (o.isMesh) o.frustumCulled = true; });
  S3.scene.add(root);
  return s;
}
function soldierGeoms() {
  const cap = (r, l) => new T3.CapsuleGeometry(r, l, 4, 10);
  const G = {
    thigh: cap(0.092, 0.24), shin: cap(0.074, 0.26), boot: rbox(0.13, 0.12, 0.29, 0.35), kneepad: rbox(0.12, 0.11, 0.06, 0.4),
    belt: rbox(0.41, 0.1, 0.28, 0.4), torso: (() => { const g = cap(0.17, 0.32); g.scale(1.3, 1, 0.84); return g; })(),
    vest: rbox(0.47, 0.44, 0.34, 0.25), pouch: rbox(0.1, 0.12, 0.06, 0.3), pack: rbox(0.32, 0.34, 0.13, 0.3), pad: new T3.SphereGeometry(0.088, 12, 10),
    neck: new T3.CylinderGeometry(0.055, 0.06, 0.1, 10), head: (() => { const g = new T3.SphereGeometry(0.115, 18, 14); g.scale(0.95, 1.12, 1.02); return g; })(),
    eyes: (() => { const g = new T3.CylinderGeometry(0.112, 0.112, 0.045, 18, 1, true, -0.9, 1.8); g.rotateY(Math.PI); return g; })(),
    goggle: rbox(0.2, 0.05, 0.03, 0.4), cap: (() => { const g = new T3.SphereGeometry(0.122, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, 0.75, 1.05); return g; })(),
    brim: (() => { const g = new T3.CylinderGeometry(0.1, 0.1, 0.012, 16, 1, false, -Math.PI / 2, Math.PI); g.rotateY(Math.PI / 2); g.scale(1, 1, 0.8); return g; })(),
    helmet: (() => { const g = new T3.SphereGeometry(0.142, 18, 10, 0, Math.PI * 2, 0, Math.PI / 1.85); g.scale(1, 0.92, 1.08); return g; })(),
    chin: rbox(0.16, 0.03, 0.12, 0.4),
    upper: cap(0.07, 0.15), fore: cap(0.06, 0.16), hand: rbox(0.085, 0.095, 0.1, 0.45),
    cbox: rbox(1.0, 1.0, 1.0, 0.03, 2),
  };
  return G;
}
const SUPPORT = { mg: [0.0, -0.02, -0.3], rifle: [0, -0.04, -0.34], sniper: [0, -0.05, -0.36], smg: [0, -0.09, -0.2], shotgun: [0, -0.03, -0.3], pistol: [-0.025, -0.06, 0.0], heavy: [-0.025, -0.07, 0.0] };
let POLE_R = null, POLE_L = null, DOWN = null;
function ik(sh, el, S, Tg, pole, a = 0.27, b = 0.26) {
  const d = Tg.clone().sub(S); const L = Math.min(a + b - 1e-3, Math.max(Math.abs(a - b) + 1e-3, d.length())); d.normalize();
  const A = Math.acos(Math.max(-1, Math.min(1, (a * a + L * L - b * b) / (2 * a * L))));
  const pn = pole.clone().sub(d.clone().multiplyScalar(pole.dot(d))).normalize();
  const up = d.clone().multiplyScalar(Math.cos(A)).add(pn.multiplyScalar(Math.sin(A)));
  sh.quaternion.setFromUnitVectors(DOWN, up);
  const E = S.clone().addScaledVector(up, a), f = Tg.clone().sub(E).normalize().applyQuaternion(sh.quaternion.clone().invert());
  el.quaternion.setFromUnitVectors(DOWN, f);
}
function poseSoldier(s, p, dt, hidden) {
  const alive = p.alive, R = s.root;
  R.visible = !hidden;
  if (hidden) { s.flash.visible = false; return; }
  if (alive && p.box) { s.box.visible = true; s.hips.visible = false; R.position.set(p.x, p.y, p.z); R.rotation.set(0, p.yaw, 0); s.flash.visible = false; return; }
  s.box.visible = false; s.hips.visible = true;
  const sp = Math.min(1, Math.hypot(p.vx || 0, p.vz || 0) / 4.5), ph = (p.phase || 0) * 2.2;
  if (!alive) {
    s.deadT = (s.deadT || 0) + dt; const k = Math.min(1, s.deadT / 0.45), e = 1 - (1 - k) * (1 - k);
    R.position.set(p.x, p.y + 0.12 * e, p.z); R.rotation.set(0, p.yaw, 0); s.hips.rotation.set(e * 1.45, 0, e * 0.2);
    s.hips.position.y = 0.88 - 0.7 * e; s.spine.rotation.set(-0.1 * e, 0, 0);
    for (const k2 of ["hipL", "hipR"]) s[k2].rotation.x = -0.25 * e; for (const k2 of ["kneeL", "kneeR"]) s[k2].rotation.x = 0.35 * e;
    s.shR.rotation.set(-2.6 * e, 0, -0.5 * e); s.shL.rotation.set(-2.4 * e, 0, 0.6 * e); s.elR.rotation.set(-0.3 * e, 0, 0); s.elL.rotation.set(-0.3 * e, 0, 0);
    s.gunMount.visible = e < 0.5; s.flash.visible = false; return;
  }
  s.deadT = 0; s.gunMount.visible = true;
  R.position.set(p.x, p.y, p.z); R.rotation.set(0, p.yaw, 0); s.hips.rotation.set(0, 0, 0);
  const cr = !!p.crouch, sw = Math.sin(ph) * 0.55 * sp;
  s.hips.position.y = cr ? 0.55 : 0.88 + Math.abs(Math.cos(ph)) * 0.03 * sp;
  if (cr) { s.hipL.rotation.x = 1.2; s.kneeL.rotation.x = -1.75; s.hipR.rotation.x = 0.25 + sw * 0.1; s.kneeR.rotation.x = -1.45; }
  else { s.hipL.rotation.x = sw; s.hipR.rotation.x = -sw; s.kneeL.rotation.x = -(Math.max(0, -Math.sin(ph)) * 0.95 * sp + 0.06); s.kneeR.rotation.x = -(Math.max(0, Math.sin(ph)) * 0.95 * sp + 0.06); }
  const pitch = Math.max(-1.2, Math.min(1.2, p.pitch || 0));
  s.spine.rotation.set(pitch * 0.45 + (cr ? 0.15 : 0.05), 0, 0); s.head.rotation.set(pitch * 0.4, 0, 0);
  const wk = typeof wpnOf === "function" ? wpnOf(p) : "rifle";
  s.gunMount.rotation.set(pitch * 0.55, 0, 0); s.gunMount.updateMatrix();
  if (s.gunKind !== wk) { s.gunMount.clear(); const g = makeGun(wk, false); s.gunMount.add(g); s.gunKind = wk; s.muzzle = g.userData.muzzle; }
  const grip = new T3.Vector3(0, -0.04, 0.03).applyMatrix4(s.gunMount.matrix), fore = SUPPORT[wk];
  ik(s.shR, s.elR, s.shR.position, grip, POLE_R);
  ik(s.shL, s.elL, s.shL.position, fore ? new T3.Vector3(...fore).applyMatrix4(s.gunMount.matrix) : new T3.Vector3(-0.16, 0.28, -0.12), POLE_L);
  const fire = (p.fireFx || 0) > 0 && wk !== "knife" && wk !== "nade";
  s.flash.visible = fire;
  if (fire && s.muzzle) { s.muzzle.getWorldPosition(s.flash.position); s.flash.material.rotation = S3rand() * 6.28; S3.flashLight(s.flash.position); }
}

function gunMats() {
  const std = (o) => mstd(Object.assign({ roughness: 0.5 }, o));
  const woodTex = (() => { const c = canvas(128), x = c.getContext("2d"); x.fillStyle = "#6b3f1f"; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(${30 + Math.random() * 40},${15 + Math.random() * 20},5,.45)`; x.beginPath(); const y = Math.random() * 128; x.moveTo(0, y); x.bezierCurveTo(40, y + 6, 80, y - 6, 128, y + 2); x.stroke(); } const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t; })();
  return { steel: std({ color: 0x4a4e55, metalness: 0.7, roughness: 0.35 }), blued: std({ color: 0x30343b, metalness: 0.75, roughness: 0.3 }), poly: std({ color: 0x2c2e31, roughness: 0.7 }),
    wood: std({ map: woodTex, roughness: 0.6 }), tan: std({ color: 0x6a5a40, roughness: 0.7 }), glass: std({ color: 0x3355aa, metalness: 1, roughness: 0.05 }),
    blade: std({ color: 0xc9ccd2, metalness: 0.95, roughness: 0.18 }), olive: std({ color: 0x3f4a2a, roughness: 0.6 }), brass: std({ color: 0xc8a24a, metalness: 0.9, roughness: 0.3 }),
    red: mstd({ color: 0xff2020, emissive: 0xff0000, emissiveIntensity: 2 }), tape: std({ color: 0x7a6a4a, roughness: 0.9 }) };
}
function makeGun(kind, hi) {
  const M = S3.gm, g = new T3.Group(), seg = hi ? 3 : 2;
  const P = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new T3.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = !hi; g.add(m); return m; };
  const B = (w, h, d, mat, x, y, z, r = 0.3, rx = 0) => P(rbox(w, h, d, r, seg), mat, x, y, z, rx);
  const C = (r1, r2, len, mat, x, y, z) => P(new T3.CylinderGeometry(r1, r2, len, hi ? 16 : 8).rotateX(Math.PI / 2), mat, x, y, z);
  const muzzle = new T3.Object3D(); g.add(muzzle);
  if (kind === "rifle") {
    B(0.05, 0.085, 0.34, M.steel, 0, 0.0, -0.06); B(0.052, 0.06, 0.26, M.wood, 0, -0.012, -0.34, 0.45); C(0.012, 0.012, 0.3, M.blued, 0, 0.012, -0.6);
    C(0.008, 0.008, 0.26, M.steel, 0, 0.042, -0.36); B(0.012, 0.05, 0.02, M.steel, 0, 0.045, -0.7); C(0.018, 0.016, 0.06, M.steel, 0, 0.012, -0.77);
    B(0.042, 0.1, 0.26, M.wood, 0, -0.025, 0.21, 0.35); B(0.034, 0.1, 0.05, M.wood, 0, -0.09, 0.03, 0.4, 0.28); B(0.03, 0.03, 0.06, M.steel, 0, 0.052, -0.02);
    for (let i = 0; i < 5; i++) B(0.03, 0.05, 0.055, M.steel, 0, -0.06 - i * 0.04, -0.13 - i * 0.017 - i * i * 0.004, 0.25, -0.12 - i * 0.07);
    P(new T3.TorusGeometry(0.03, 0.005, 6, 12, Math.PI), M.steel, 0, -0.05, -0.04, 0, Math.PI / 2, Math.PI); muzzle.position.set(0, 0.012, -0.82);
  } else if (kind === "sniper") {
    B(0.055, 0.075, 0.42, M.olive, 0, 0, -0.08); C(0.016, 0.013, 0.62, M.blued, 0, 0.012, -0.6); B(0.045, 0.11, 0.36, M.olive, 0, -0.03, 0.27, 0.3); B(0.03, 0.04, 0.15, M.olive, 0, 0.045, 0.24);
    C(0.024, 0.024, 0.3, M.blued, 0, 0.085, -0.1); C(0.032, 0.026, 0.07, M.blued, 0, 0.085, -0.28); C(0.03, 0.024, 0.06, M.blued, 0, 0.085, 0.06); C(0.022, 0.022, 0.005, M.glass, 0, 0.085, -0.316);
    B(0.02, 0.04, 0.03, M.blued, 0, 0.05, -0.1); C(0.006, 0.006, 0.05, M.steel, 0.04, 0.02, 0.02).rotation.set(0, Math.PI / 2, 0); B(0.034, 0.1, 0.05, M.poly, 0, -0.09, 0.06, 0.4, 0.3);
    B(0.04, 0.06, 0.09, M.blued, 0, -0.06, -0.1); muzzle.position.set(0, 0.012, -0.92);
  } else if (kind === "smg") {
    B(0.045, 0.075, 0.26, M.poly, 0, 0, -0.06); C(0.011, 0.011, 0.12, M.blued, 0, 0.012, -0.25); B(0.028, 0.17, 0.045, M.steel, 0, -0.11, -0.1, 0.2); B(0.032, 0.09, 0.045, M.poly, 0, -0.08, 0.04, 0.4, 0.25);
    B(0.03, 0.08, 0.04, M.poly, 0, -0.07, -0.2, 0.4); B(0.008, 0.03, 0.2, M.steel, 0.02, 0.0, 0.14); B(0.008, 0.03, 0.2, M.steel, -0.02, 0.0, 0.14); B(0.05, 0.06, 0.02, M.steel, 0, 0, 0.24);
    B(0.02, 0.025, 0.03, M.steel, 0, 0.045, -0.15); muzzle.position.set(0, 0.012, -0.32);
  } else if (kind === "shotgun") {
    B(0.05, 0.08, 0.24, M.blued, 0, 0, -0.04); C(0.014, 0.014, 0.5, M.blued, 0, 0.022, -0.42); C(0.012, 0.012, 0.42, M.blued, 0, -0.012, -0.36); B(0.05, 0.05, 0.16, M.wood, 0, -0.012, -0.3, 0.45);
    B(0.044, 0.1, 0.3, M.wood, 0, -0.03, 0.22, 0.35); B(0.034, 0.08, 0.05, M.wood, 0, -0.08, 0.06, 0.4, 0.35); B(0.012, 0.012, 0.012, M.brass, 0, 0.04, -0.66); muzzle.position.set(0, 0.022, -0.68);
  } else if (kind === "pistol" || kind === "heavy") {
    const k = kind === "heavy" ? 1.25 : 1;
    B(0.03 * k, 0.034 * k, 0.19 * k, M.blued, 0, 0.03, -0.07 * k, 0.25); B(0.028 * k, 0.022, 0.16 * k, M.poly, 0, 0.004, -0.06 * k); B(0.03 * k, 0.11 * k, 0.045 * k, M.poly, 0, -0.045, 0.01, 0.35, 0.28);
    P(new T3.TorusGeometry(0.022, 0.004, 6, 10, Math.PI), M.poly, 0, -0.008, -0.04, 0, Math.PI / 2, Math.PI); B(0.006, 0.012, 0.01, M.steel, 0, 0.052, -0.15 * k); muzzle.position.set(0, 0.03, -0.17 * k);
  } else if (kind === "mg") {
    B(0.07, 0.1, 0.34, M.blued, 0, 0, -0.04); C(0.03, 0.03, 0.5, M.steel, 0, 0.01, -0.46);
    for (let i = 0; i < 6; i++) C(0.034, 0.034, 0.012, M.blued, 0, 0.01, -0.27 - i * 0.075);
    C(0.012, 0.012, 0.16, M.blued, 0, 0.01, -0.78); C(0.02, 0.016, 0.05, M.steel, 0, 0.01, -0.87);
    B(0.09, 0.09, 0.12, M.olive, 0.085, -0.02, -0.02, 0.15); B(0.03, 0.012, 0.08, M.brass, 0.045, 0.03, -0.02, 0.2);
    if (!hi) B(0.2, 0.15, 0.012, M.olive, 0, 0.06, -0.3, 0.1);
    B(0.03, 0.04, 0.1, M.poly, -0.03, -0.05, 0.14, 0.4); B(0.03, 0.04, 0.1, M.poly, 0.03, -0.05, 0.14, 0.4);
    B(0.02, 0.2, 0.02, M.steel, 0, -0.14, -0.2, 0.3); B(0.36, 0.02, 0.02, M.steel, 0, -0.24, -0.2, 0.3);
    for (const sx of [-0.18, 0.18]) { const wh = P(new T3.TorusGeometry(0.07, 0.022, 8, hi ? 18 : 10), M.poly, sx, -0.24, -0.2, 0, Math.PI / 2, 0); wh.userData.wheel = true;
      P(new T3.CylinderGeometry(0.02, 0.02, 0.03, 8).rotateZ(Math.PI / 2), M.steel, sx, -0.24, -0.2); }
    muzzle.position.set(0, 0.01, -0.9);
  } else if (kind === "knife") {
    const sh = new T3.Shape(); sh.moveTo(0, 0); sh.lineTo(0.2, 0.004); sh.lineTo(0.235, 0.022); sh.lineTo(0.19, 0.034); sh.lineTo(0, 0.03); sh.lineTo(0, 0);
    const bl = new T3.ExtrudeGeometry(sh, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1 }); bl.rotateY(Math.PI / 2); bl.translate(-0.002, -0.017, -0.02);
    P(bl, M.blade, 0, 0, 0); B(0.012, 0.05, 0.016, M.steel, 0, 0, -0.02); P(new T3.CapsuleGeometry(0.014, 0.08, 3, 8).rotateX(Math.PI / 2), M.poly, 0, -0.002, 0.05); muzzle.position.set(0, 0, -0.24);
  } else if (kind === "nade") {
    const s = new T3.SphereGeometry(0.034, 12, 10); s.scale(1, 1.2, 1); P(s, M.olive, 0, 0, 0); C(0.012, 0.012, 0.03, M.steel, 0, 0.045, 0).rotation.set(0, 0, 0);
    B(0.012, 0.05, 0.008, M.steel, 0.012, 0.03, 0); P(new T3.TorusGeometry(0.012, 0.0025, 6, 12), M.steel, -0.02, 0.06, 0);
  }
  g.userData.muzzle = muzzle;
  return g;
}
function makeCharge() {
  const M = S3.gm, g = new T3.Group();
  const add = (geo, mat, x, y, z) => { const m = new T3.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  for (let i = 0; i < 3; i++) add(rbox(0.09, 0.07, 0.26, 0.25), M.tape, -0.1 + i * 0.1, 0.035, 0);
  add(rbox(0.3, 0.012, 0.05, 0.3), M.poly, 0, 0.075, -0.06); add(rbox(0.3, 0.012, 0.05, 0.3), M.poly, 0, 0.075, 0.08);
  add(rbox(0.12, 0.03, 0.09, 0.2), M.poly, 0, 0.09, 0.0); add(rbox(0.08, 0.004, 0.035, 0.2), mstd({ color: 0x0b2a12, emissive: 0x1f8f3a, emissiveIntensity: 0.6 }), 0, 0.106, -0.01);
  const led = add(new T3.SphereGeometry(0.01, 8, 6), M.red, 0.045, 0.108, 0.03); g.userData.led = led;
  for (let i = 0; i < 4; i++) { const c = new T3.Mesh(new T3.TorusGeometry(0.05 + i * 0.008, 0.003, 4, 12, Math.PI), mstd({ color: [0xb91c1c, 0x1d4ed8, 0xeab308, 0x16a34a][i] })); c.position.set(-0.05 + i * 0.03, 0.08, 0.02); c.rotation.set(0, Math.PI / 2, 0); g.add(c); }
  return g;
}

function makeViewModel() {
  const vs = new T3.Scene(), vc = new T3.PerspectiveCamera(56, 1, 0.01, 10);
  vs.add(new T3.HemisphereLight(0xdde8ff, 0x6b5a45, 1.4)); const d = new T3.DirectionalLight(0xfff0dd, 2.2); d.position.set(0.5, 1, 0.3); vs.add(d);
  const rig = new T3.Group(); vs.add(rig);
  S3.vs = vs; S3.vc = vc; S3.vrig = rig; S3.vkind = ""; S3.vkick = 0; S3.vsway = [0, 0]; S3.vdraw = 0; S3.shells = [];
  const fl = new T3.Sprite(S3.flashMat.clone()); fl.scale.set(0.12, 0.12, 1); fl.visible = false; vs.add(fl); S3.vflash = fl;
}
function viewArms(team, kind) {
  const M = S3.tm[team], g = new T3.Group(), Y = new T3.Vector3(0, 1, 0);
  const limb = (a, b, r, mat) => { const A = new T3.Vector3(...a), B = new T3.Vector3(...b), d = B.clone().sub(A), L = d.length();
    const m = new T3.Mesh(new T3.CapsuleGeometry(r, Math.max(0.01, L - 2 * r), 5, 12), mat); m.position.copy(A).lerp(B, 0.5); m.quaternion.setFromUnitVectors(Y, d.normalize()); g.add(m); return m; };
  const hand = (p, rx = 0) => { const h = new T3.Mesh(rbox(0.075, 0.085, 0.105, 0.45, 3), M.glove); h.position.set(...p); h.rotation.x = rx; g.add(h); };
  limb([0.14, -0.26, 0.34], [0.01, -0.06, 0.05], 0.05, M.cloth); hand([0, -0.045, 0.02], 0.3);
  const f = SUPPORT[kind];
  if (f) { limb([-0.24, -0.27, 0.12], [f[0] - 0.01, f[1] - 0.03, f[2] + 0.04], 0.048, M.cloth); hand([f[0], f[1] - 0.012, f[2]], 0.1); }
  else if (kind === "knife" || kind === "nade") { limb([-0.3, -0.34, 0.2], [-0.22, -0.2, -0.05], 0.048, M.cloth); hand([-0.22, -0.18, -0.08]); }
  return g;
}
function setViewGun(kind, team) {
  const r = S3.vrig; r.clear();
  const gun = makeGun(kind, true); r.add(gun); r.add(viewArms(team, kind));
  S3.vgun = gun; S3.vkind = kind + team; S3.vdraw = 0.35; S3.vmuzzle = gun.userData.muzzle;
  r.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; } });
}
function drawViewModel(p, dt) {
  const wk = wpnOf(p), w = WPN[wk] || {};
  if (S3.vkind !== wk + p.team) setViewGun(wk, p.team);
  const sp = Math.min(1, Math.hypot(p.vx, p.vz) / 5), ph = (p.phase || 0) * 2.2;
  S3.vdraw = Math.max(0, S3.vdraw - dt);
  if ((p.fireFx || 0) > (S3.lastFire || 0) + 0.001 && wk !== "nade") { S3.vkick = wk === "knife" ? 1 : Math.min(1.4, S3.vkick + (wk === "sniper" || wk === "shotgun" ? 1 : 0.55));
    if (wk !== "knife") { S3.flashT = 0.05; if (wk !== "shotgun" || S3.shells.length < 30) spawnShell(); } }
  S3.lastFire = p.fireFx || 0;
  S3.vkick *= Math.exp(-dt * (wk === "sniper" ? 6 : 13));
  const rl = p.rT > 0 && w.reload ? 1 - p.rT / w.reload : -1;
  const rk = rl >= 0 ? Math.sin(Math.min(1, rl) * Math.PI) : 0;
  const bobX = Math.sin(ph) * 0.012 * sp, bobY = -Math.abs(Math.cos(ph)) * 0.01 * sp;
  S3.vsway[0] *= Math.exp(-dt * 8); S3.vsway[1] *= Math.exp(-dt * 8);
  const r = S3.vrig, dr = S3.vdraw / 0.35, crouch = p.crouch ? 0.012 : 0;
  const one = wk === "pistol" || wk === "heavy", far = one ? -0.36 : wk === "mg" ? -0.24 : -0.3;
  r.position.set((one ? 0.11 : 0.12) + bobX - S3.vsway[0] * 0.02, (one ? -0.12 : wk === "mg" ? -0.17 : -0.13) + bobY - dr * 0.2 - rk * 0.08 - crouch + S3.vsway[1] * 0.02, far + S3.vkick * 0.05);
  r.rotation.set(S3.vkick * (wk === "knife" ? -0.3 : 0.09) + rk * 0.5 + dr * 0.6, -0.09 + S3.vsway[0] * 0.05 + (wk === "knife" ? S3.vkick * 0.5 : 0), rk * 0.5 - S3.vsway[0] * 0.03);
  r.scale.setScalar(0.72);
  S3.flashT = (S3.flashT || 0) - dt;
  const f = S3.vflash; f.visible = S3.flashT > 0 && wk !== "knife";
  if (f.visible && S3.vmuzzle) { S3.vmuzzle.getWorldPosition(f.position); f.material.rotation = S3rand() * 6.28; f.scale.setScalar(wk === "sniper" || wk === "shotgun" ? 0.2 : 0.13); }
  for (const s of S3.shells) { s.t -= dt; s.v[1] -= 3.2 * dt; s.m.position.x += s.v[0] * dt; s.m.position.y += s.v[1] * dt; s.m.position.z += s.v[2] * dt; s.m.rotation.x += 14 * dt; s.m.rotation.z += 9 * dt; s.m.visible = s.t > 0; }
  S3.shells = S3.shells.filter((s) => { if (s.t <= 0) S3.vs.remove(s.m); return s.t > 0; });
}
function spawnShell() {
  const m = new T3.Mesh(S3.geo.shell, S3.gm.brass); m.position.set(0.2, -0.13, -0.42); S3.vs.add(m);
  S3.shells.push({ m, t: 0.55, v: [0.9 + S3rand() * 0.4, 0.9 + S3rand() * 0.5, 0.25] });
}

function makeFx() {
  const soft = (r, g, b) => { const c = canvas(64), x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, `rgba(${r},${g},${b},1)`); gr.addColorStop(0.45, `rgba(${r},${g},${b},.55)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t; };
  const flash = (() => { const c = canvas(128), x = c.getContext("2d"); x.translate(64, 64);
    for (let i = 0; i < 7; i++) { x.rotate(Math.PI * 2 / 7); const g = x.createLinearGradient(0, 0, 0, -60); g.addColorStop(0, "rgba(255,240,190,1)"); g.addColorStop(1, "rgba(255,150,40,0)"); x.fillStyle = g; x.beginPath(); x.moveTo(-7, 0); x.lineTo(0, -58 - Math.random() * 6); x.lineTo(7, 0); x.fill(); }
    const g = x.createRadialGradient(0, 0, 0, 0, 0, 30); g.addColorStop(0, "rgba(255,255,230,1)"); g.addColorStop(1, "rgba(255,170,60,0)"); x.fillStyle = g; x.fillRect(-32, -32, 64, 64);
    const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t; })();
  S3.flashMat = new T3.SpriteMaterial({ map: flash, blending: T3.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
  S3.smokeTex = soft(255, 255, 255); S3.fireTex = soft(255, 190, 90);
  const hole = (() => { const c = canvas(64), x = c.getContext("2d"); const g = x.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, "rgba(10,8,6,1)"); g.addColorStop(0.25, "rgba(25,20,15,.95)"); g.addColorStop(0.5, "rgba(60,50,40,.45)"); g.addColorStop(1, "rgba(60,50,40,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    x.strokeStyle = "rgba(20,15,10,.6)"; for (let i = 0; i < 6; i++) { const a = Math.random() * 6.3; x.beginPath(); x.moveTo(32 + Math.cos(a) * 6, 32 + Math.sin(a) * 6); x.lineTo(32 + Math.cos(a) * (14 + Math.random() * 12), 32 + Math.sin(a) * (14 + Math.random() * 12)); x.stroke(); }
    const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t; })();
  const dg = new T3.PlaneGeometry(0.1, 0.1);
  S3.decals = new T3.InstancedMesh(dg, mstd({ map: hole, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, roughness: 1 }), 160);
  S3.decals.count = 0; S3.decalN = 0; S3.decals.frustumCulled = false; S3.scene.add(S3.decals);
  S3.tracerGeo = new T3.BoxGeometry(1, 1, 1); S3.tracerMat = new T3.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.85, blending: T3.AdditiveBlending, depthWrite: false, fog: false });
  S3.tracers = []; for (let i = 0; i < 24; i++) { const m = new T3.Mesh(S3.tracerGeo, S3.tracerMat); m.visible = false; S3.scene.add(m); S3.tracers.push(m); }
  S3.bits = new T3.InstancedMesh(new T3.IcosahedronGeometry(0.5, 0), new T3.MeshBasicMaterial({ color: 0xffffff }), 500);
  S3.bits.instanceMatrix.setUsage(T3.DynamicDrawUsage); S3.bits.count = 0; S3.bits.frustumCulled = false; S3.scene.add(S3.bits);
  S3.bits.instanceColor = new T3.InstancedBufferAttribute(new Float32Array(500 * 3), 3);
  S3.puffs = [];
  S3.lights = [0, 1].map(() => { const l = new T3.PointLight(0xffb060, 0, 9, 2); if (S3.q !== "low") S3.scene.add(l); return { l, t: 0 }; });
  S3.flashLight = (pos, big) => { const k = S3.lights.reduce((a, b) => (a.t < b.t ? a : b)); k.l.position.copy(pos); k.l.intensity = big ? 120 : 9; k.l.distance = big ? 40 : 8; k.t = big ? 0.35 : 0.05; };
  S3.chargeObj = makeCharge(); S3.chargeObj.visible = false; S3.scene.add(S3.chargeObj);
  S3.backCharge = makeCharge(); S3.backCharge.visible = false; S3.backCharge.scale.setScalar(0.8); S3.scene.add(S3.backCharge);
  S3.nadeObjs = [];
}
function puff(x, y, z, o) {
  const mat = new T3.SpriteMaterial({ map: o.fire ? S3.fireTex : S3.smokeTex, color: o.col || 0xffffff, transparent: true, depthWrite: false, opacity: o.a ?? 0.8,
    blending: o.fire ? T3.AdditiveBlending : T3.NormalBlending });
  const s = new T3.Sprite(mat); s.position.set(x, y, z); s.scale.setScalar(o.s0 || 0.3); S3.scene.add(s);
  S3.puffs.push({ s, t: 0, life: o.life || 1, s0: o.s0 || 0.3, s1: o.s1 || 1, v: o.v || [0, 0.4, 0], a: o.a ?? 0.8 });
  if (S3.puffs.length > (S3.q === "low" ? 50 : 140)) { const q = S3.puffs.shift(); S3.scene.remove(q.s); q.s.material.dispose(); }
}
window.S3hit = (x, y, z, flesh, ax, sign) => {
  if (!S3.ready) return;
  if (flesh) { for (let i = 0; i < 3; i++) puff(x, y, z, { col: 0x8a0d0d, s0: 0.08, s1: 0.45, life: 0.45, a: 0.85, v: [(S3rand() - 0.5) * 0.6, 0.2, (S3rand() - 0.5) * 0.6] }); return; }
  if (ax < 0) return;
  const n = new T3.Vector3(ax === 0 ? sign : 0, ax === 1 ? sign : 0, ax === 2 ? sign : 0), m = new T3.Matrix4(), q = new T3.Quaternion().setFromUnitVectors(new T3.Vector3(0, 0, 1), n);
  const pos = new T3.Vector3(x, y, z).addScaledVector(n, 0.004), sc = 0.75 + S3rand() * 0.5;
  m.compose(pos, q.multiply(new T3.Quaternion().setFromAxisAngle(new T3.Vector3(0, 0, 1), S3rand() * 6.28)), new T3.Vector3(sc, sc, sc));
  S3.decals.setMatrixAt(S3.decalN % 160, m); S3.decalN++; S3.decals.count = Math.min(160, S3.decalN); S3.decals.instanceMatrix.needsUpdate = true;
  const dust = MAPN === "reactor" ? 0xb4b4b4 : 0xcdb894;
  puff(pos.x, pos.y, pos.z, { col: dust, s0: 0.06, s1: 0.5, life: 0.6, a: 0.6, v: [n.x * 0.6, 0.25 + n.y * 0.5, n.z * 0.6] });
};
window.S3boom = (x, y, z, big) => {
  if (!S3.ready) return;
  const k = big ? 2.2 : 1;
  for (let i = 0; i < (big ? 10 : 5); i++) puff(x + (S3rand() - 0.5) * k, y + S3rand() * k * 0.6, z + (S3rand() - 0.5) * k, { fire: true, s0: 0.6 * k, s1: 3.2 * k, life: 0.5 + S3rand() * 0.3, a: 1, v: [(S3rand() - 0.5) * 2, 1.5 + S3rand() * 2, (S3rand() - 0.5) * 2] });
  for (let i = 0; i < (big ? 18 : 9); i++) puff(x + (S3rand() - 0.5) * k, y + S3rand() * k, z + (S3rand() - 0.5) * k, { col: 0x55504a, s0: 0.8 * k, s1: 5 * k, life: 2.5 + S3rand() * 2, a: 0.7, v: [(S3rand() - 0.5) * 1.2, 0.8 + S3rand() * 1.4, (S3rand() - 0.5) * 1.2] });
  S3.flashLight(new T3.Vector3(x, y + 1, z), true); S3.shake = Math.max(S3.shake || 0, big ? 0.9 : 0.4);
};

function S3init() {
  if (S3.ready || S3.failed) return;
  T3 = window.THREE;
  if (!T3) return;
  try {
    const pref = S3pref(), gpu = S3gpu(), phone = /Mobi|iPhone|iPad|Android/i.test(navigator.userAgent);
    S3.gpu = gpu.name; S3.auto = pref !== "low" && pref !== "high";
    S3.q = pref === "high" ? "high" : pref === "low" ? "low" : (WEAK_GPU.test(gpu.name) || !gpu.v2 || phone) ? "low" : "high";
    const low = S3.q === "low";
    let r = null, why = "", last = null;
    const onErr = (e) => { if (e && e.statusMessage) why = e.statusMessage; };
    glc.addEventListener("webglcontextcreationerror", onErr);
    const tries = [{ antialias: true, powerPreference: "high-performance" }, { antialias: true }, { antialias: false }, { antialias: false, powerPreference: "low-power", precision: "mediump" }];
    if (low) tries.unshift({ antialias: false, powerPreference: "high-performance" });
    for (const a of tries) {
      try { r = new T3.WebGLRenderer(Object.assign({ canvas: glc }, a)); break; } catch (e) { last = e; }
    }
    glc.removeEventListener("webglcontextcreationerror", onErr);
    if (!r) throw new Error(`${(last && last.message) || "no WebGL"}${why ? " · the browser says: " + why : ""} · in Firefox: Settings → General → Performance → tick "Use hardware acceleration when available", or about:support → Graphics → WebGL shows why`);
    S3.gl = r.capabilities.isWebGL2 ? "WebGL 2" : "WebGL 1";
    S3.prMax = Math.min(low ? 1 : 1.5, devicePixelRatio || 1); S3.scale = low ? 0.8 : 1;
    r.setPixelRatio(S3.prMax * S3.scale); r.setSize(innerWidth, innerHeight, false);
    r.shadowMap.enabled = !low; r.shadowMap.type = T3.PCFSoftShadowMap; r.toneMapping = T3.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
    r.outputColorSpace = T3.SRGBColorSpace; r.autoClear = false;
    S3.renderer = r; S3.aniso = Math.min(8, r.capabilities.getMaxAnisotropy()); S3.texN = low ? 128 : 256;
    const sc = new T3.Scene(); sc.fog = new T3.Fog(0xd9c7a0, 45, 210); S3.scene = sc;
    S3.cam = new T3.PerspectiveCamera(60, innerWidth / innerHeight, 0.05, 600); S3.cam.rotation.order = "YXZ";
    S3.hemi = new T3.HemisphereLight(0xcfe0ff, 0x9c7c55, 1.0); sc.add(S3.hemi);
    const sun = new T3.DirectionalLight(0xffe2b6, 2.9); sun.position.set(-26, 52, 34); sun.castShadow = !low;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 5, far: 140 });
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.035; sun.shadow.camera.updateProjectionMatrix(); sc.add(sun); sc.add(sun.target); S3.sun = sun;
    sc.add(new T3.AmbientLight(0xffffff, 0.12));
    S3.skyMat = new T3.ShaderMaterial({ side: T3.BackSide, depthWrite: false, fog: false, uniforms: { uHorizon: { value: new T3.Color(0xd9c7a0) }, uZenith: { value: new T3.Color(0x2f62b8) }, uSun: { value: new T3.Vector3(-26, 52, 34).normalize() } },
      vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: `uniform vec3 uHorizon,uZenith,uSun; varying vec3 vD;
        float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
        float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
        float fbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=0.5; } return s; }
        void main(){ float e=max(vD.y,0.0); vec3 c=mix(uHorizon,uZenith,pow(e,0.55));
          float sd=max(dot(vD,uSun),0.0); c+=vec3(1.0,0.85,0.6)*pow(sd,180.0)*2.5+vec3(1.0,0.8,0.5)*pow(sd,8.0)*0.25;
          if(vD.y>0.0){ vec2 uv=vD.xz/(vD.y+0.12)*1.6; float cl=smoothstep(0.52,0.85,fbm(uv)); c=mix(c,vec3(1.0,0.98,0.95),cl*0.75*smoothstep(0.0,0.25,e)); }
          if(vD.y<0.0) c=uHorizon*0.92; gl_FragColor=vec4(c,1.0); }` });
    S3.skyLow = new T3.ShaderMaterial({ side: T3.BackSide, depthWrite: false, fog: false, uniforms: S3.skyMat.uniforms, vertexShader: S3.skyMat.vertexShader,
      fragmentShader: `uniform vec3 uHorizon,uZenith,uSun; varying vec3 vD;
        void main(){ float e=max(vD.y,0.0); vec3 c=mix(uHorizon,uZenith,sqrt(e)); float sd=max(dot(vD,uSun),0.0); c+=vec3(1.0,0.85,0.6)*pow(sd,64.0);
          if(vD.y<0.0) c=uHorizon*0.92; gl_FragColor=vec4(c,1.0); }` });
    const sky = new T3.Mesh(new T3.SphereGeometry(400, 32, 16), low ? S3.skyLow : S3.skyMat); sky.frustumCulled = false; sc.add(sky); S3.sky = sky;
    POLE_R = new T3.Vector3(0.7, -1, 0.25).normalize(); POLE_L = new T3.Vector3(-0.8, -1, 0.1).normalize(); DOWN = new T3.Vector3(0, -1, 0);
    S3.mats = makeMaterials(); S3.boxMat = (() => { const m = S3.mats[2].clone(); m.color = new T3.Color(0xd8b98a); return m; })();
    S3.geo = soldierGeoms(); S3.geo.shell = new T3.CylinderGeometry(0.005, 0.005, 0.022, 8);
    S3.tm = [teamMats(0), teamMats(1)]; S3.gm = gunMats();
    makeFx(); makeViewModel();
    r.info.autoReset = false;
    glc.addEventListener("webglcontextlost", () => { S3.lost = (S3.lost || 0) + 1; if (window.showFatal) showFatal("the graphics driver reset the 3D view, restoring it (if it stays black, pick Graphics: Low in this menu)"); });
    S3.ready = true; S3.readyAt = performance.now();
    if (typeof resize === "function") resize();
  } catch (e) {
    S3.failed = String(e && e.message || e); showFatal("The 3D view could not start: " + S3.failed);
  }
}
function S3resize() { if (!S3.renderer) return; S3.renderer.setSize(innerWidth, innerHeight, false); }
function S3setScale(k) { S3.scale = Math.max(0.5, Math.min(1, k)); S3.renderer.setPixelRatio(S3.prMax * S3.scale); S3.renderer.setSize(innerWidth, innerHeight, false); }
function S3lower(why) {
  if (S3.q === "low" || !S3.ready) return;
  S3.q = "low"; S3.lowWhy = why; S3.prMax = Math.min(1, S3.prMax);
  const r = S3.renderer; r.shadowMap.enabled = false; S3.sun.castShadow = false; S3.sky.material = S3.skyLow;
  const conv = new Map(), lam = (m) => {
    if (!m || !m.isMeshStandardMaterial) return m;
    let L = conv.get(m);
    if (!L) { L = new T3.MeshLambertMaterial({ map: m.map, color: m.color, emissive: m.emissive, emissiveIntensity: m.emissiveIntensity, vertexColors: m.vertexColors, transparent: m.transparent,
      opacity: m.opacity, depthWrite: m.depthWrite, side: m.side, polygonOffset: m.polygonOffset, polygonOffsetFactor: m.polygonOffsetFactor, alphaTest: m.alphaTest, name: m.name }); conv.set(m, L); }
    return L;
  };
  for (const sc of [S3.scene, S3.vs]) if (sc) sc.traverse((o) => { if (o.isMesh) o.material = Array.isArray(o.material) ? o.material.map(lam) : lam(o.material); });
  for (const L of S3.lights) S3.scene.remove(L.l);
  S3.mats = S3.mats.map(lam); S3.boxMat = lam(S3.boxMat);
  const each = (o) => { for (const k of Object.keys(o)) o[k] = lam(o[k]); };
  S3.tm.forEach(each); each(S3.gm);
  S3setScale(Math.min(S3.scale, 0.8)); S3.slowT = 0;
  if (typeof resize === "function") resize();
}
function S3pace() {
  const now = performance.now(), f = S3.lastNow ? Math.min(0.25, (now - S3.lastNow) / 1000) : 1 / 60; S3.lastNow = now;
  if (document.hidden || now - S3.readyAt < 3000 || now - (S3.builtAt || 0) < 2500) { S3.slowT = S3.fastT = 0; return; }
  S3.ft = S3.ft ? S3.ft * 0.9 + f * 0.1 : f; S3.fps = Math.round(1 / S3.ft);
  S3.slowT = S3.ft > 0.0215 ? (S3.slowT || 0) + f : 0;
  S3.fastT = S3.ft < 0.0135 ? (S3.fastT || 0) + f : 0;
  if (S3.slowT > 1) { S3.slowT = 0; if (S3.auto && S3.q === "high") S3lower("slow frames"); else if (S3.scale > 0.5) S3setScale(S3.scale - 0.1); }
  if (S3.fastT > 4 && S3.scale < 1) { S3.fastT = 0; S3setScale(S3.scale + 0.1); }
}
function S3blackCheck() {
  S3.frameN = (S3.frameN || 0) + 1;
  if ((S3.checks || 0) >= 6 || performance.now() - (S3.builtAt || 1e15) < 1500 || S3.frameN % 20) return;
  const gl = S3.renderer.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(4); let lit = 0;
  for (const [u, v] of [[0.5, 0.5], [0.2, 0.8], [0.8, 0.8], [0.3, 0.3], [0.7, 0.3]]) { gl.readPixels(Math.floor(w * u), Math.floor(h * v), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); if (px[0] + px[1] + px[2] > 6) lit++; }
  S3.checks = (S3.checks || 0) + 1; S3.blackN = (S3.blackN || 0) + (lit ? 0 : 1);
  if (S3.blackN === 3) { if (S3.q === "high") S3lower("black picture"); if (window.showFatal) showFatal("the 3D view drew a black picture on this computer's graphics; switched to Graphics: Low"); }
}
window.addEventListener("three", () => { if (window.__threeErr) { S3.failed = window.__threeErr; showFatal("The 3D engine could not be loaded (no internet? it comes from cdnjs.cloudflare.com): " + window.__threeErr); } else S3init(); });
if (window.THREE) S3init();
addEventListener("mousemove", (e) => { if (S3.vsway && typeof locked !== "undefined" && locked) { S3.vsway[0] = Math.max(-1, Math.min(1, S3.vsway[0] + e.movementX * 0.004)); S3.vsway[1] = Math.max(-1, Math.min(1, S3.vsway[1] + e.movementY * 0.004)); } });

function render(dt) {
  if (!S3.ready) { S3init(); if (!S3.ready) return; }
  if (S3.built !== MAPN) { buildMap(); S3.builtAt = performance.now(); }
  S3.t += dt; S3pace();
  const r = S3.renderer, cam = S3.cam;
  const asp = innerWidth / Math.max(1, innerHeight);
  let eye, yaw, pitch, camP = null, scoped = false;
  if (W) {
    const c = camera(); camP = c.p; eye = c.e; yaw = c.yaw; pitch = c.pitch;
    scoped = c.p === ME && ME && ME.scoped && WPN[wpnOf(ME)] && WPN[wpnOf(ME)].scope;
  } else {
    const a = S3.t * 0.05; eye = [Math.sin(a) * 26, 13 + Math.sin(S3.t * 0.13) * 2, Math.cos(a) * 30]; yaw = a; pitch = -0.32;
  }
  S3.shake = Math.max(0, (S3.shake || 0) - dt * 1.5);
  const sh = S3.shake * 0.04;
  cam.position.set(eye[0] + (S3rand() - 0.5) * sh, eye[1] + (S3rand() - 0.5) * sh, eye[2]);
  cam.rotation.set(pitch, yaw, 0);
  const hfov = scoped ? 20 : 90;
  cam.fov = 2 * Math.atan(Math.tan(hfov * Math.PI / 360) / asp) * 180 / Math.PI; cam.aspect = asp; cam.updateProjectionMatrix();
  S3.sky.position.copy(cam.position);
  S3.sun.position.set(cam.position.x - 26, 52, cam.position.z + 34); S3.sun.target.position.set(cam.position.x, 0, cam.position.z);
  const seen = new Set();
  for (const p of (W ? W.players : [])) {
    let s = S3.players.get(p.id);
    if (!s || s.team !== p.team) { if (s) { S3.scene.remove(s.root); S3.scene.remove(s.flash); } s = makeSoldier(p.team); S3.players.set(p.id, s); }
    seen.add(p.id);
    poseSoldier(s, p, dt, p === camP && p.alive);
  }
  for (const [id, s] of S3.players) if (!seen.has(id)) { S3.scene.remove(s.root); S3.scene.remove(s.flash); S3.players.delete(id); }
  const ch = W ? W.charge : null, co = S3.chargeObj;
  co.visible = !!ch && (ch.s === "planted" || ch.s === "dropped");
  if (co.visible) { co.position.set(ch.x, ch.y + 0.01, ch.z); co.userData.led.visible = ch.s !== "planted" || Math.floor(performance.now() / (ch.t < 10 ? 120 : 400)) % 2 === 0; }
  const carrier = W && W.players.find((p) => p.charge && p.alive && p !== camP);
  S3.backCharge.visible = !!carrier;
  if (carrier) { const s = S3.players.get(carrier.id); if (s) { s.spine.updateWorldMatrix(true, false); S3.backCharge.position.set(0, 0.3, 0.26).applyMatrix4(s.spine.matrixWorld); S3.backCharge.rotation.set(Math.PI / 2, carrier.yaw, 0); } }
  const nades = W ? W.nades : [];
  while (S3.nadeObjs.length < nades.length) { const g = makeGun("nade", false); g.scale.setScalar(1.3); S3.scene.add(g); S3.nadeObjs.push(g); }
  S3.nadeObjs.forEach((g, i) => { g.visible = i < nades.length; if (g.visible) { g.position.set(nades[i].x, nades[i].y, nades[i].z); g.rotation.x += dt * 9; } });
  S3.tracers.forEach((m, i) => { const t = FX.tracers[i]; m.visible = !!t; if (!t) return;
    const V = S3.tv || (S3.tv = [0, 0, 0, 0].map(() => new T3.Vector3())), a = V[0].fromArray(t.a), b = V[1].fromArray(t.b), k = Math.max(0, t.t / 0.07);
    const from = V[2].copy(a).lerp(b, 0.1 + (1 - k) * 0.5), to = V[3].copy(a).lerp(b, Math.min(1, 0.35 + (1 - k) * 0.65));
    m.position.copy(from).lerp(to, 0.5); m.lookAt(to); m.scale.set(0.012, 0.012, Math.max(0.05, from.distanceTo(to))); });
  const bits = S3.bits, M4 = S3.m4 || (S3.m4 = new T3.Matrix4()), col = S3.col || (S3.col = new T3.Color()); let n = 0;
  for (const q of FX.parts) { if (n >= 500) break; M4.makeScale(q.s, q.s, q.s); M4.setPosition(q.x, q.y, q.z); bits.setMatrixAt(n, M4); col.setRGB(q.c[0], q.c[1], q.c[2]); bits.setColorAt(n, col); n++; }
  bits.count = n; bits.instanceMatrix.needsUpdate = true; if (bits.instanceColor) bits.instanceColor.needsUpdate = true;
  for (const q of S3.puffs) { q.t += dt; const k = q.t / q.life; q.s.position.x += q.v[0] * dt; q.s.position.y += q.v[1] * dt; q.s.position.z += q.v[2] * dt; q.v[1] *= Math.exp(-dt * 0.6);
    q.s.scale.setScalar(q.s0 + (q.s1 - q.s0) * (1 - Math.pow(1 - Math.min(1, k), 2))); q.s.material.opacity = q.a * Math.max(0, 1 - k); }
  S3.puffs = S3.puffs.filter((q) => { if (q.t < q.life) return true; S3.scene.remove(q.s); q.s.material.dispose(); return false; });
  for (const L of S3.lights) { L.t -= dt; if (L.t <= 0) L.l.intensity = 0; else L.l.intensity *= Math.exp(-dt * 18); }
  r.info.reset(); r.setClearColor(S3.scene.fog.color, 1); r.clear(); r.render(S3.scene, cam); S3blackCheck();
  if (camP && camP.alive && !scoped && !camP.box) {
    S3.vc.aspect = asp; S3.vc.updateProjectionMatrix(); drawViewModel(camP, dt);
    r.clearDepth(); r.render(S3.vs, S3.vc);
  }
}
