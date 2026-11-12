// The driving scene, in third person: you're behind the wheel looking down the road, the car ahead of you.
// An obstacle on the road is the timer. It appears on the horizon when a question starts and reaches your
// bumper when time runs out. Answer for points and the car swerves around it; run out of time (or score
// nothing) and you hit it. Drawn on a canvas, no image files. The scene only reacts to what the game tells
// it; it has no game logic of its own.
import { carDataURI, carById } from "./cars.js";
import { ANIMALS, HEIGHT_M, draw as drawAnimal } from "./animals.js";

const REDUCED = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const MAX_SPACES = 35;

// ---------- time of day: sunrise on question 1, dusk on question 7, night on the results ----------
const PHASES = [
  { top: "#ff9f80", bot: "#ffe3b8", gA: "#6b9a4a", gB: "#66934a", rA: "#585d6b", rB: "#535867", far: "#c9a79b", near: "#8e8296", amb: 0, lit: 0, star: 0 },
  { top: "#7cc2ff", bot: "#e8f5ff", gA: "#4fa24a", gB: "#4a9a46", rA: "#4f5565", rB: "#4a505f", far: "#b3c4d9", near: "#7f90aa", amb: 0, lit: 0, star: 0 },
  { top: "#5db3ff", bot: "#dff3ff", gA: "#4a9b46", gB: "#459342", rA: "#4d5262", rB: "#484d5c", far: "#a9bdd6", near: "#74869f", amb: 0, lit: 0, star: 0 },
  { top: "#4aa6ff", bot: "#cfeaff", gA: "#48a043", gB: "#439a3f", rA: "#4b505f", rB: "#464b5a", far: "#a0b6d2", near: "#6c7f99", amb: 0, lit: 0, star: 0 },
  { top: "#69a8e6", bot: "#ffe6bd", gA: "#5a9a45", gB: "#559241", rA: "#4e5262", rB: "#494d5c", far: "#b9b2b3", near: "#7a7f94", amb: 0.04, lit: 0, star: 0 },
  { top: "#f39a69", bot: "#ffd9a0", gA: "#76894a", gB: "#718346", rA: "#575867", rB: "#525363", far: "#c79a8a", near: "#8a7488", amb: 0.12, lit: 0.15, star: 0.15 },
  { top: "#5b4b8f", bot: "#f08a5d", gA: "#3f5b45", gB: "#3b5641", rA: "#444656", rB: "#3f4151", far: "#7c6385", near: "#4d4668", amb: 0.25, lit: 0.5, star: 0.5 },
  { top: "#060a22", bot: "#28325f", gA: "#15261f", gB: "#12221b", rA: "#1b1e2a", rB: "#171a26", far: "#1e2745", near: "#101731", amb: 0.5, lit: 1, star: 1 },
];
const SUN = [[0.1, 0.42], [0.24, 0.26], [0.4, 0.14], [0.56, 0.08], [0.72, 0.14], [0.84, 0.26], [0.9, 0.4], [0.74, 0.12]]; // [x, y as share of sky]

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (a) => "#" + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const mixHex = (a, b, t) => { const A = rgb(a), B = rgb(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const ease = (t) => t * t * (3 - 2 * t);
const easeIn = (t) => t * t;

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- geometry ----------
// z is distance ahead of the camera. A point at lateral position wx (-1..1 across the road) and distance z is at
//   x = cx + wx * rw / z   and   y = horizon + (H - horizon) / z
const Z_CAR = 1.18; // where the player's car sits
const Z_START = 30; // where the obstacle appears (near the horizon)
const BASE_SPEED = (Z_START - Z_CAR) / 25; // road units per second: an obstacle reaches the car in a 25 second question
const SEG = 1.6;
const Z_NEAR = 0.7;
const Z_FAR = 70;

// the obstacle is a farm animal, a bigger one with each question: chicken, turkey, goat, sheep, pig, horse, cow
const OBSTACLES = ANIMALS;
// The car is drawn 1.84 half-lane-units wide (0.92 of a lane) and its body is 72% of that image, which is a real 1.8 m: so 1 m = 0.736 u.
const M_PER_U = 0.736;

export function createScene(root, fuelEl) {
  const rand = rng(11);
  const canvas = document.createElement("canvas");
  root.replaceChildren(canvas);
  const ctx = canvas.getContext("2d");

  let W = 0, H = 0, DPR = 1, hy = 0, cx = 0, rw = 0, hyWanted = null;
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = root.clientWidth || window.innerWidth;
    H = root.clientHeight || window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    hy = hyWanted == null ? H * 0.46 : Math.max(H * 0.34, Math.min(H * 0.78, hyWanted));
    cx = W / 2;
    rw = Math.min(W * 0.5, 400); // half the road's width where it reaches the bottom of the screen
  }
  window.addEventListener("resize", resize);
  resize();

  // ---------- images ----------
  const imgCache = new Map();
  function img(car, opts, key) {
    const k = key || `${car.id}:${opts?.damage || 0}`;
    let im = imgCache.get(k);
    if (!im) {
      im = new Image();
      im.src = carDataURI(car, opts);
      imgCache.set(k, im);
    }
    return im;
  }
  const TRAFFIC_COLORS = ["#d9534f", "#4f8fd9", "#5cb85c", "#9b59b6", "#e8e8ec", "#2c3e50", "#e67e22", "#16a085", "#c0c3cc"];
  const trafficImg = (color, van) => img({ id: "t" + color + (van ? "v" : ""), shape: van ? "wagon" : "sedan", color }, {}, "t" + color + (van ? "v" : ""));

  // ---------- state ----------
  const S = {
    car: carById("rusty"),
    damage: 0,
    phase: 0,
    pal: { ...PHASES[0] },
    camZ: 0,
    boost: 0,
    brake: 0,
    flame: 0,
    shake: 0,
    flash: 0,
    px: 0, // player's lateral position (world units, lanes are at -0.667, 0, 0.667)
    targetX: 0,
    tilt: 0,
    wobble: 0,
    t: 0,
    obs: null, // { kind, mode: "timer"|"pass"|"hit"|"knock", z, startedAt, durationMs, held, heldFrac, t0, zFrom, ... }
    items: [], // roadside scenery
    traffic: [], // cars in the side lanes
    particles: [],
    nextItemZ: 1.5,
    nextTrafficZ: 12,
    cap: null, // { text, bad, t0 }: the big message drawn on the road
    obsIndex: 0,
  };

  // skyline
  const sky = (seed, minH, maxH) => { const r = rng(seed), out = []; let x = 0; while (x < 2200) { const w = 24 + r() * 42; out.push({ x, w, h: minH + r() * (maxH - minH), win: Math.floor(r() * 65535) }); x += w - 4; } return out; };
  const skyFar = sky(3, 20, 70), skyNear = sky(11, 30, 105);
  const stars = Array.from({ length: 70 }, () => ({ x: rand(), y: rand() * 0.9, r: 0.5 + rand() * 1.2 }));

  function spawnItem(wz) {
    const side = rand() < 0.5 ? -1 : 1;
    const k = rand();
    const kind = k < 0.4 ? "tree" : k < 0.75 ? "building" : k < 0.9 ? "lamp" : "sign";
    S.items.push({ wz, side, dx: 0.1 + rand() * 0.9, kind, w: 0.5 + rand() * 0.7, h: 0.8 + rand() * 1.8, tone: rand(), win: Math.floor(rand() * 65535) });
  }
  function seedWorld() {
    S.items = []; S.traffic = [];
    for (let z = 1.5; z < Z_FAR; z += 1.1 + rand() * 1.6) { spawnItem(S.camZ + z); S.nextItemZ = S.camZ + z + 1.2; }
    S.nextTrafficZ = S.camZ + 14;
  }
  seedWorld();

  // ---------- drawing helpers ----------
  const X = (wx, z) => cx + (wx * rw) / z;
  const Y = (z) => hy + (H - hy) / z;
  function quad(xl0, xr0, y0, xl1, xr1, y1) {
    ctx.beginPath(); ctx.moveTo(xl0, y0); ctx.lineTo(xr0, y0); ctx.lineTo(xr1, y1); ctx.lineTo(xl1, y1); ctx.closePath(); ctx.fill();
  }
  function strip(wa, wb, z0, z1) { quad(X(wa, z0), X(wb, z0), Y(z0), X(wa, z1), X(wb, z1), Y(z1)); }

  function drawSky(p) {
    const g = ctx.createLinearGradient(0, 0, 0, hy + 30);
    g.addColorStop(0, p.top); g.addColorStop(1, p.bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, hy + 30);
    if (p.star > 0.02) {
      ctx.fillStyle = `rgba(255,255,255,${p.star})`;
      for (const s of stars) { ctx.beginPath(); ctx.arc(s.x * W, s.y * hy * 0.9, s.r, 0, 7); ctx.fill(); }
    }
    // sun or moon
    const [sx, sy] = SUN[S.sunI], r = Math.max(22, H * 0.045);
    const night = S.phase >= 7, px = sx * W, py = sy * hy;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, r * 3.2);
    grad.addColorStop(0, night ? "rgba(223,230,245,.5)" : "rgba(255,226,120,.6)"); grad.addColorStop(1, "rgba(255,226,120,0)");
    ctx.fillStyle = grad; ctx.fillRect(px - r * 3.2, py - r * 3.2, r * 6.4, r * 6.4);
    ctx.fillStyle = night ? "#eef2fb" : "#ffe27a"; ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill();
  }

  function drawSkyline(p) {
    const off = -S.px * 26;
    const layer = (arr, color, scale, parallax) => {
      ctx.fillStyle = color;
      const k = (H / 800) * scale;
      const base = hy + 2;
      const shift = ((off * parallax) % 2200 + 2200) % 2200;
      for (const b of arr) {
        let x = b.x - shift; if (x < -b.w) x += 2200; if (x > W) continue;
        ctx.fillRect(x, base - b.h * k, b.w, b.h * k + 4);
        if (p.lit > 0.05 && scale >= 1) {
          ctx.fillStyle = `rgba(255,214,107,${p.lit * 0.9})`;
          for (let i = 0; i < 16; i++) if (b.win & (1 << i)) ctx.fillRect(x + 6 + (i % 4) * (b.w / 4.4), base - b.h * k + 8 + Math.floor(i / 4) * 14 * k, 3.5 * k + 1, 5 * k + 1);
          ctx.fillStyle = color;
        }
      }
    };
    layer(skyFar, p.far, 0.8, 0.5);
    layer(skyNear, p.near, 1.0, 1);
  }

  function drawRoad(p) {
    ctx.fillStyle = p.gA; ctx.fillRect(0, hy, W, H - hy);
    const off = S.camZ % SEG, base = Math.floor(S.camZ / SEG), N = Math.ceil((Z_FAR - Z_NEAR) / SEG) + 2;
    for (let k = N - 1; k >= 0; k--) {
      const z0 = Math.max(Z_NEAR + k * SEG - off, 0.35), z1 = Z_NEAR + (k + 1) * SEG - off;
      if (z1 <= z0) continue;
      const odd = (base + k) & 1;
      ctx.fillStyle = odd ? p.gB : p.gA;
      ctx.fillRect(0, Y(z1), W, Y(z0) - Y(z1) + 1);
      ctx.fillStyle = odd ? p.rB : p.rA; strip(-1, 1, z0, z1);
      ctx.fillStyle = odd ? "#d9473c" : "#f1f1f1"; strip(-1.09, -1, z0, z1); strip(1, 1.09, z0, z1);
      ctx.fillStyle = "#f1f1f1"; strip(-0.965, -0.935, z0, z1); strip(0.935, 0.965, z0, z1);
      if (!odd) { ctx.fillStyle = "#f7e9a6"; strip(-0.343, -0.323, z0, z1); strip(0.323, 0.343, z0, z1); }
    }
    // horizon haze
    const hz = ctx.createLinearGradient(0, hy - 8, 0, hy + 70);
    hz.addColorStop(0, "rgba(255,255,255,0)"); hz.addColorStop(0.15, mixHex(p.bot, "#ffffff", 0.0) + "88"); hz.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hz; ctx.fillRect(0, hy - 8, W, 80);
    // headlight pool on the road ahead at dusk and night
    if (p.amb > 0.2) {
      const a = (p.amb - 0.2) * 0.5, beam = ctx.createLinearGradient(0, H, 0, hy + 40);
      beam.addColorStop(0, `rgba(255,244,180,${a})`); beam.addColorStop(1, "rgba(255,244,180,0)");
      ctx.fillStyle = beam;
      ctx.beginPath(); ctx.moveTo(X(S.px - 0.4, Z_CAR), Y(Z_CAR)); ctx.lineTo(X(S.px + 0.4, Z_CAR), Y(Z_CAR)); ctx.lineTo(X(S.px + 0.9, 14), Y(14)); ctx.lineTo(X(S.px - 0.9, 14), Y(14)); ctx.closePath(); ctx.fill();
    }
  }

  function drawItem(it, z, p) {
    const u = rw / z, x = cx + it.side * (1.14 + it.dx) * u, y = Y(z);
    if (y > H + 200) return;
    const night = p.lit;
    if (it.kind === "building") {
      const w = (0.5 + it.w * 0.6) * u, h = (0.9 + it.h * 0.7) * u;
      const bx = x + it.side * w / 2;
      ctx.fillStyle = mixHex(p.near, "#ffffff", it.tone * 0.12);
      ctx.fillRect(bx - w / 2, y - h, w, h);
      ctx.fillStyle = "rgba(0,0,0,.12)"; ctx.fillRect(bx - w / 2, y - h, w * 0.18, h);
      ctx.fillStyle = night > 0.05 ? `rgba(255,214,107,${0.2 + night * 0.7})` : "rgba(210,232,255,.55)";
      for (let i = 0; i < 16; i++) if (it.win & (1 << i) || night < 0.05) ctx.fillRect(bx - w / 2 + w * 0.12 + (i % 4) * w * 0.22, y - h + h * 0.08 + Math.floor(i / 4) * h * 0.22, w * 0.12, h * 0.1);
    } else if (it.kind === "tree") {
      const s = (0.45 + it.w * 0.6) * u;
      ctx.fillStyle = "#5b3a21"; ctx.fillRect(x - s * 0.06, y - s * 0.55, s * 0.12, s * 0.55);
      ctx.fillStyle = mixHex(p.gA, "#0b2a10", 0.35 + it.tone * 0.2);
      ctx.beginPath(); ctx.arc(x, y - s * 0.78, s * 0.42, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(x - s * 0.22, y - s * 0.6, s * 0.28, 0, 7); ctx.arc(x + s * 0.22, y - s * 0.6, s * 0.28, 0, 7); ctx.fill();
    } else if (it.kind === "lamp") {
      const h = 1.5 * u;
      ctx.fillStyle = "#3b4150"; ctx.fillRect(x - u * 0.025, y - h, u * 0.05, h);
      ctx.fillRect(x - it.side * u * 0.3, y - h, it.side * u * 0.3, u * 0.04);
      const lx = x - it.side * u * 0.3;
      ctx.fillStyle = night > 0.05 ? "#fff1a8" : "#cfd6e4"; ctx.beginPath(); ctx.arc(lx, y - h + u * 0.07, u * 0.07, 0, 7); ctx.fill();
      if (night > 0.1) { const g = ctx.createRadialGradient(lx, y - h, 0, lx, y - h, u * 0.7); g.addColorStop(0, `rgba(255,236,150,${night * 0.55})`); g.addColorStop(1, "rgba(255,236,150,0)"); ctx.fillStyle = g; ctx.fillRect(lx - u * 0.7, y - h - u * 0.7, u * 1.4, u * 1.4); }
    } else {
      const h = 1.3 * u, w = 0.9 * u;
      ctx.fillStyle = "#3b4150"; ctx.fillRect(x - u * 0.03, y - h, u * 0.06, h);
      ctx.fillStyle = ["#e8453c", "#2e6fe0", "#f2b632"][Math.floor(it.tone * 3)]; ctx.fillRect(x - w / 2, y - h - u * 0.5, w, u * 0.5);
      ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillRect(x - w * 0.4, y - h - u * 0.38, w * 0.8, u * 0.07); ctx.fillRect(x - w * 0.4, y - h - u * 0.22, w * 0.5, u * 0.07);
    }
  }

  function drawSprite(im, wx, z, widthLanes = 0.82, tilt = 0, extraY = 0) {
    if (!im || !im.complete || !im.naturalWidth) return null;
    const laneW = (2 * rw) / z / 3, w = laneW * widthLanes, h = (w * 128) / 200;
    const x = X(wx, z), yb = Y(z) + extraY;
    ctx.save();
    ctx.translate(x, yb);
    if (tilt) ctx.rotate(tilt);
    ctx.drawImage(im, -w / 2, -h * (110 / 128), w, h);
    ctx.restore();
    return { x, y: yb, w, h };
  }

  function drawObstacle(o, z) {
    const u = rw / z / 3, x = X(0, z), y = Y(z);
    ctx.save();
    ctx.translate(x, y);
    if (o.mode === "knock") {
      const t = clamp((S.t - o.t0) / 0.9, 0, 1);
      ctx.translate(o.vx * t * u * 6, -t * u * 5 + t * t * u * 3);
      ctx.rotate(o.spin * t * 7);
      ctx.globalAlpha = 1 - t * t;
    }
    if (o.mode === "knock") { ctx.restore(); return; } // it is gone: the splat is on the car now
    // the last second: it sees what is coming
    const left = (o.held ? o.heldFrac : o.frac ?? 1) * (o.durationMs || 25000) / 1000;
    const fear = o.mode === "hit" || (o.mode === "timer" && left <= 1);
    if (fear && !REDUCED) ctx.translate(Math.sin(S.t * 70) * u * 0.05, 0); // trembling
    drawAnimal(ctx, o.kind, 0, 0, u * M_PER_U * (HEIGHT_M[o.kind] ?? 1), { fear }); // true to scale with the car
    ctx.restore();
  }

  function drawPlayer(p) {
    const im = img(S.car, { damage: S.damage });
    const bob = REDUCED ? 0 : Math.sin(S.t * 14) * (0.6 + S.boost) * (1 - S.brake);
    const lane = (2 * rw) / Z_CAR / 3;
    ctx.save();
    // shadow
    ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(X(S.px, Z_CAR), Y(Z_CAR) + 3, lane * 0.46, lane * 0.07, 0, 0, 7); ctx.fill();
    const sp = drawSprite(im, S.px, Z_CAR, 0.92, S.tilt + S.wobble, bob);
    // nitro flames out of the exhaust after a big score
    if (sp && S.flame > 0.05 && !REDUCED) {
      for (const dx of [-0.2, 0.2]) {
        const fx = sp.x + dx * sp.w * 1.1, fy = sp.y - sp.h * 0.2, len = sp.h * (0.5 + 0.5 * S.flame) * (0.8 + Math.random() * 0.4);
        const g = ctx.createLinearGradient(fx, fy, fx, fy + len); g.addColorStop(0, "rgba(255,247,170,.95)"); g.addColorStop(0.4, "rgba(255,150,40,.85)"); g.addColorStop(1, "rgba(255,80,20,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(fx - sp.w * 0.05, fy); ctx.lineTo(fx + sp.w * 0.05, fy); ctx.lineTo(fx, fy + len); ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
    return sp;
  }

  function emit(x, y, type, n) {
    for (let i = 0; i < n; i++) {
      S.particles.push(type === "smoke"
        ? { x: x + (Math.random() - 0.5) * 30, y, vx: (Math.random() - 0.5) * 22, vy: -30 - Math.random() * 40, life: 0, max: 1.2 + Math.random() * 0.9, r: 7 + Math.random() * 9, type }
        : type === "blood" ? { x, y, vx: (Math.random() - 0.5) * 380, vy: -60 - Math.random() * 260, life: 0, max: 0.6 + Math.random() * 0.5, r: 2 + Math.random() * 3.5, type }
        : { x, y, vx: (Math.random() - 0.5) * 320, vy: -80 - Math.random() * 220, life: 0, max: 0.5 + Math.random() * 0.4, r: 1.6, type });
    }
  }

  // ---------- the frame ----------
  let last = performance.now();
  function frame(now) {
    if (!root.isConnected) return;
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt);
    render();
  }

  function update(dt) {
    S.t += dt;
    // palette eases toward the current time of day
    const target = PHASES[S.phase], k = 1 - Math.exp(-dt * 2.2);
    for (const key of Object.keys(target)) S.pal[key] = typeof target[key] === "number" ? S.pal[key] + (target[key] - S.pal[key]) * k : mixHex(S.pal[key], target[key], k);

    const motion = !REDUCED;
    S.boost *= Math.exp(-dt * 1.6);
    S.brake *= Math.exp(-dt * 1.1);
    S.flame *= Math.exp(-dt * 1.8);
    S.shake *= Math.exp(-dt * 5);
    S.flash *= Math.exp(-dt * 9);
    S.wobble *= Math.exp(-dt * 3);
    const speed = BASE_SPEED * (1 + S.boost * 2.2) * (1 - S.brake);
    if (motion) S.camZ += speed * dt;

    // lateral motion of the car (swerve and recover)
    S.px += (S.targetX - S.px) * (1 - Math.exp(-dt * (motion ? 8 : 60)));
    S.tilt = clamp((S.px - S.targetX) * 0.55 + (S.targetX - S.px) * 0.0, -0.25, 0.25) * (motion ? 1 : 0);

    // scenery and traffic
    while (S.camZ + Z_FAR > S.nextItemZ) { spawnItem(S.nextItemZ); S.nextItemZ += 1.1 + rand() * 2; }
    S.items = S.items.filter((it) => it.wz - S.camZ > 0.5);
    while (motion && S.camZ + Z_FAR - 6 > S.nextTrafficZ) {
      if (S.traffic.length < 3) S.traffic.push({ wz: S.nextTrafficZ, lane: rand() < 0.5 ? -1 : 1, v: BASE_SPEED * (0.45 + rand() * 0.35), color: TRAFFIC_COLORS[Math.floor(rand() * TRAFFIC_COLORS.length)], van: rand() < 0.25 });
      S.nextTrafficZ += 14 + rand() * 18;
    }
    for (const c of S.traffic) c.wz += c.v * dt * (motion ? 1 : 0);
    S.traffic = S.traffic.filter((c) => c.wz - S.camZ > 0.55 && !c.gone);
    for (const c of S.traffic) if (c.fade) { c.fade -= dt * 3; if (c.fade <= 0) c.gone = true; }

    // the obstacle: its distance is the timer
    const o = S.obs;
    if (o) {
      if (o.mode === "timer") {
        const frac = o.held ? o.heldFrac : clamp(1 - (Date.now() - o.startedAt) / o.durationMs, 0, 1);
        o.frac = frac;
        o.z = Z_CAR + (Z_START - Z_CAR) * frac;
      } else if (o.mode === "pass") {
        const t = clamp((S.t - o.t0) / 0.95, 0, 1);
        o.z = o.zFrom + (0.4 - o.zFrom) * easeIn(t);
        if (t >= 1) { S.targetX = 0; S.obs = null; }
        else if (t > 0.62) S.targetX = 0;
      } else if (o.mode === "hit") {
        const t = clamp((S.t - o.t0) / 0.55, 0, 1);
        o.z = o.zFrom + (Z_CAR + 0.05 - o.zFrom) * easeIn(t);
        if (t >= 1) impact(o);
      } else if (o.mode === "knock") {
        if (S.t - o.t0 > 0.9) S.obs = null;
      }
    }

    // damage smoke
    if (S.damage >= 2 && motion && Math.random() < 0.18 * S.damage) { const sp = carPos(); if (sp) emit(sp.x, sp.y - sp.h * 0.7, "smoke", 1); }
    for (const p of S.particles) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.type === "spark" || p.type === "blood") p.vy += 700 * dt; }
    S.particles = S.particles.filter((p) => p.life < p.max);
  }

  const carPos = () => { const lane = (2 * rw) / Z_CAR / 3, w = lane * 0.92; return { x: X(S.px, Z_CAR), y: Y(Z_CAR), w, h: (w * 128) / 200 }; };

  function impact(o) {
    if (o.pendingDamage != null) { S.damage = o.pendingDamage; img(S.car, { damage: S.damage }); }
    o.mode = "knock"; o.t0 = S.t; o.vx = Math.random() < 0.5 ? -1 : 1; o.spin = (Math.random() - 0.5) * 2;
    if (!REDUCED) {
      S.shake = 1; S.flash = 0.7; S.brake = 1; S.wobble = (Math.random() < 0.5 ? -1 : 1) * 0.16;
      const sp = carPos(); emit(sp.x, sp.y - sp.h * 0.6, "smoke", 8); emit(sp.x, sp.y - sp.h * 0.6, "blood", 34);
    }
  }

  function render() {
    const p = S.pal;
    ctx.save();
    if (S.shake > 0.02) ctx.translate((Math.random() - 0.5) * 18 * S.shake, (Math.random() - 0.5) * 14 * S.shake);
    drawSky(p);
    drawSkyline(p);
    drawRoad(p);
    // scenery, traffic and the obstacle, far to near
    const list = [];
    for (const it of S.items) list.push({ z: it.wz - S.camZ, it });
    for (const c of S.traffic) list.push({ z: c.wz - S.camZ, c });
    if (S.obs) list.push({ z: S.obs.z, o: S.obs });
    list.sort((a, b) => b.z - a.z);
    for (const e of list) {
      if (e.z <= 0.45) continue;
      if (e.it) drawItem(e.it, e.z, p);
      else if (e.c) { ctx.globalAlpha = e.c.fade ? Math.max(0, e.c.fade) : 1; drawSprite(trafficImg(e.c.color, e.c.van), e.c.lane * 0.667, e.z, 0.8); ctx.globalAlpha = 1; }
      else drawObstacle(e.o, e.z);
    }
    // the countdown, made easy to read: a danger strip down the lane that deepens as time runs out
    // (the pulsing hazard sign over the obstacle was removed: it was too distracting)
    const wo = S.obs;
    if (wo && wo.mode === "timer" && wo.z > Z_CAR + 0.2) {
      const frac = wo.frac ?? 1, a = 0.07 + 0.3 * (1 - frac);
      ctx.fillStyle = `rgba(255,60,40,${a})`;
      ctx.beginPath(); ctx.moveTo(X(-0.28, Z_CAR + 0.1), Y(Z_CAR + 0.1)); ctx.lineTo(X(0.28, Z_CAR + 0.1), Y(Z_CAR + 0.1)); ctx.lineTo(X(0.28, wo.z), Y(wo.z)); ctx.lineTo(X(-0.28, wo.z), Y(wo.z)); ctx.closePath(); ctx.fill();
    }
    // dusk and night darken everything except the car
    if (p.amb > 0.01) { ctx.fillStyle = `rgba(4,8,34,${p.amb})`; ctx.fillRect(0, 0, W, H); }
    drawPlayer(p);
    // speed lines after a big score
    if (S.boost > 0.25 && !REDUCED) {
      ctx.strokeStyle = `rgba(255,255,255,${clamp(S.boost, 0, 0.7) * 0.5})`; ctx.lineWidth = 2;
      for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2 + S.t * 0.2, r0 = Math.min(W, H) * 0.35, r1 = r0 * (1.5 + Math.sin(i * 7.1 + S.t * 30) * 0.2); ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, hy + Math.sin(a) * r0 * 0.7); ctx.lineTo(cx + Math.cos(a) * r1, hy + Math.sin(a) * r1 * 0.7); ctx.stroke(); }
    }
    for (const q of S.particles) {
      const t = q.life / q.max;
      if (q.type === "smoke") { ctx.fillStyle = `rgba(60,60,66,${0.5 * (1 - t)})`; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (1 + t * 1.4), 0, 7); ctx.fill(); }
      else if (q.type === "blood") { ctx.strokeStyle = `rgba(${170 - t * 40},14,24,${1 - t * 0.6})`; ctx.lineWidth = q.r * (1 - t * 0.4); ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.vx * 0.035, q.y - q.vy * 0.035); ctx.stroke(); } // a short streak, not a ball
      else { ctx.fillStyle = `rgba(255,${200 - t * 120},60,${1 - t})`; ctx.fillRect(q.x, q.y, q.r * 2, q.r * 2); }
    }
    ctx.restore();
    // big message above the car
    if (S.cap) {
      const age = S.t - S.cap.t0;
      if (age > 2.4) S.cap = null;
      else {
        const a = age < 0.15 ? age / 0.15 : age > 1.8 ? Math.max(0, 1 - (age - 1.8) / 0.6) : 1;
        const size = clamp(W * 0.075, 24, 48), y = Y(Z_CAR) - (2 * rw) / Z_CAR / 3 * 0.92 * 0.62 - 26 - Math.min(age, 0.4) * 30;
        ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "center"; ctx.font = `900 ${size}px system-ui, sans-serif`; ctx.lineJoin = "round";
        ctx.lineWidth = size * 0.2; ctx.strokeStyle = "rgba(10,12,24,.85)"; ctx.strokeText(S.cap.text, cx + S.px * rw / Z_CAR, y);
        ctx.fillStyle = S.cap.bad ? "#ff5a4a" : "#6dff9c"; ctx.fillText(S.cap.text, cx + S.px * rw / Z_CAR, y); ctx.restore();
      }
    }
    if (S.flash > 0.02) { ctx.fillStyle = `rgba(255,70,50,${S.flash * 0.45})`; ctx.fillRect(0, 0, W, H); }
  }

  function say(text, bad = false) { S.cap = text ? { text, bad, t0: S.t } : null; }

  // ---------- what the game can tell the scene ----------
  const api = {
    setPhase(i) { S.phase = clamp(i, 0, PHASES.length - 1); S.sunI = S.phase; root.classList.toggle("night", S.phase >= 7); },
    setCar(id) { S.car = carById(id); img(S.car, { damage: S.damage }); },
    // cumulative crashes today (0..4 shows more damage); resets overnight
    setDamage(n) { S.damage = clamp(n | 0, 0, 4); img(S.car, { damage: S.damage }); },
    // A question has started: put an obstacle on the horizon. It reaches the car when the time is up.
    beginQuestion({ startedAt, durationMs, index = 0 }) {
      S.obs = { kind: OBSTACLES[index % OBSTACLES.length], mode: "timer", z: Z_START, startedAt, durationMs, held: false, frac: 1 };
      S.targetX = 0;
    },
    hold() { const o = S.obs; if (o && o.mode === "timer") { o.heldFrac = clamp(1 - (Date.now() - o.startedAt) / o.durationMs, 0, 1); o.held = true; } }, // answer submitted, being checked
    resume() { if (S.obs && S.obs.mode === "timer") S.obs.held = false; },
    clearObstacle() { S.obs = null; S.targetX = 0; },
    // The result is in. ok = the answer scored: swerve around the obstacle. Otherwise hit it.
    resolve(ok, { spaces = 1, damage = S.damage } = {}) {
      const o = S.obs;
      if (!o) { if (!ok) S.damage = clamp(damage, 0, 4); return; }
      o.mode = ok ? "pass" : "hit"; o.t0 = S.t; o.zFrom = o.z; o.held = false;
      if (ok) {
        const dir = Math.random() < 0.5 ? -1 : 1;
        for (const c of S.traffic) if (c.lane === dir && c.wz - S.camZ < 9) c.fade = 1; // clear the lane we swerve into
        S.targetX = dir * 0.667;
        if (REDUCED) S.px = S.targetX; // calm: swerve instantly, no speed boost or flames
        else { S.boost = Math.max(S.boost, 0.12 + spaces * 0.085); S.flame = spaces >= 4 ? 1 : 0; }
      } else {
        o.pendingDamage = clamp(damage, 0, 4); // the splat shows up on the car when it actually hits
        if (REDUCED) { impact(o); }
      }
    },
    say,
    // Move the horizon down so the road starts below the game panel (px from the top; null = default).
    setHorizon(y) { hyWanted = y; resize(); },
    // for tests
    state: () => ({ horizon: hy, obstacleY: S.obs ? Y(S.obs.z) : null, obstacleZ: S.obs ? S.obs.z : null, obstacleMode: S.obs ? S.obs.mode : null, obstacleKind: S.obs ? S.obs.kind : null, carX: S.px, targetX: S.targetX, damage: S.damage, boost: S.boost, phase: S.phase, car: S.car.id, particles: S.particles.length }),
  };

  S.sunI = 0;
  api.setPhase(0);
  requestAnimationFrame(frame);
  return api;
}
