// The driving scene: a full-screen backdrop (John Doe in a car, on a busy road) plus the gas gauge.
// It only reacts to what the game tells it; it has no game logic of its own.
// Everything is drawn with inline SVG and CSS, no image files.

const REDUCED = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const MAX_SPACES = 35; // the finish line: 7 questions x 5 spaces

// Sky colours for the day's journey: sunrise on question 1 to dusk on question 7, night on the results screen.
const SKY = [
  ["#ff9f80", "#ffe3b8"], // 0 sunrise
  ["#7cc2ff", "#e8f5ff"], // 1 morning
  ["#5db3ff", "#dff3ff"], // 2
  ["#4aa6ff", "#cfeaff"], // 3 noon
  ["#69a8e6", "#ffe6bd"], // 4 afternoon
  ["#f39a69", "#ffd9a0"], // 5 golden hour
  ["#5b4b8f", "#f08a5d"], // 6 dusk
  ["#060a22", "#28325f"], // 7 night
];
// Where the sun (or moon) sits for each phase, as [left %, top %].
const ORB = [[10, 52], [24, 34], [40, 20], [56, 12], [70, 20], [82, 36], [90, 52], [76, 18]];

// How the traffic and speed feel after an answer of each level: speed 0..1, density 0..1.
const MOODS = {
  johndoe: { speed: 1, density: 0.08, text: "Green lights all the way. Everyone agrees!" },
  joe: { speed: 0.8, density: 0.25, text: "Cruising with the crowd" },
  neighbor: { speed: 0.55, density: 0.5, text: "Moving along" },
  stranger: { speed: 0.3, density: 0.75, text: "Taking the back roads" },
  alien: { speed: 0.08, density: 1, text: "All alone out here. Slow going." },
  imposter: { speed: 0.05, density: 0.8, text: "Wrong exit. No gas." },
  nothing: { speed: 0.02, density: 0.6, text: "Stalled out" },
  idle: { speed: 0.3, density: 0.5, text: "" },
};

const CAR_COLORS = ["#d9534f", "#4f8fd9", "#5cb85c", "#9b59b6", "#e8e8ec", "#2c3e50", "#e67e22", "#16a085", "#c0c3cc"];

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A repeating city skyline as a data-URI SVG (4:1, so the CSS can scale it). `lights` draws only lit windows.
function skyline(seed, minH, maxH, fill, lights) {
  const rand = rng(seed), W = 480, H = 120;
  let x = 0, body = "";
  while (x < W) {
    const w = Math.min(W - x, 20 + Math.floor(rand() * 30)), h = minH + Math.floor(rand() * (maxH - minH));
    if (!lights) {
      body += `<rect x="${x}" y="${H - h}" width="${w - 2}" height="${h}" fill="${fill}"/>`;
    } else {
      for (let wy = H - h + 8; wy < H - 6; wy += 11)
        for (let wx = x + 4; wx < x + w - 8; wx += 9) if (rand() < 0.45) body += `<rect x="${wx}" y="${wy}" width="4" height="5" fill="#ffd66b"/>`;
    }
    x += w;
  }
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`)}")`;
}

// Side-view car facing right. kind: "sedan" | "van". `driver` adds John Doe at the wheel.
function carSVG(kind, color, driver = false) {
  const body =
    kind === "van"
      ? "M6 36 L6 14 Q6 10 11 10 L84 10 Q90 10 94 15 L108 26 Q114 28 114 33 L114 36 Z"
      : "M6 36 L6 30 Q6 26 12 25 L30 23 L41 12 Q43 10 47 10 L77 10 Q81 10 84 13 L93 23 L108 26 Q114 27 114 33 L114 36 Z";
  const windows =
    kind === "van"
      ? `<path d="M60 14 L84 14 Q88 14 90 17 L99 26 L60 26 Z" fill="#cfe9ff"/><rect x="14" y="14" width="40" height="12" rx="2" fill="#cfe9ff"/>`
      : `<path d="M45 14 L77 14 L88 24 L36 24 Z" fill="#cfe9ff"/><path d="M62 14 L62 24" stroke="${color}" stroke-width="2"/>`;
  const person = driver
    ? `<circle cx="70" cy="18.5" r="5" fill="#f1c9a5"/><path d="M64.5 16.5 Q70 11 75.5 16.5 Z" fill="#2c3e50"/><rect x="69" y="17.5" width="8" height="2.4" rx="1" fill="#1d2433"/><path d="M60 24 Q64 21 68 24 Z" fill="#e8742a"/>`
    : "";
  return `<svg viewBox="0 0 120 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="${body}" fill="${color}"/>${windows}${person}
    <rect class="tail" x="3" y="27" width="5" height="5" rx="1.5" fill="#7a1f1f"/>
    <rect class="head" x="111" y="27" width="5" height="4" rx="1.5" fill="#ffe9a3"/>
    <g class="wheel"><circle cx="30" cy="36" r="8.5" fill="#1b1d24"/><g class="hub"><circle cx="30" cy="36" r="4" fill="#aeb4c0"/><path d="M30 32 V40 M26 36 H34" stroke="#59606d" stroke-width="1.4"/></g></g>
    <g class="wheel"><circle cx="92" cy="36" r="8.5" fill="#1b1d24"/><g class="hub"><circle cx="92" cy="36" r="4" fill="#aeb4c0"/><path d="M92 32 V40 M88 36 H96" stroke="#59606d" stroke-width="1.4"/></g></g>
  </svg>`;
}

export function createScene(root, fuelEl) {
  const rand = rng(7);
  root.innerHTML = `
    ${SKY.map(([a, b], i) => `<div class="sky" data-p="${i}" style="background:linear-gradient(${a},${b})"></div>`).join("")}
    <div class="stars"></div>
    <div class="orb"></div>
    <div class="skyline far"></div>
    <div class="skyline near"></div>
    <div class="skyline lights"></div>
    <div class="road"><div class="dash"></div></div>
    <div class="finish"></div>
    <div class="traffic"></div>
    <div class="convoy">
      <div class="ahead"></div>
      <div class="player">${carSVG("sedan", "#f2b632", true)}</div>
    </div>
    <div class="speedlines"></div>
    <div class="caption"></div>`;
  // set via the DOM (the data URIs contain quotes, which would break an HTML attribute)
  root.querySelector(".skyline.far").style.backgroundImage = skyline(3, 18, 52, "#9fb0c8", false);
  root.querySelector(".skyline.near").style.backgroundImage = skyline(11, 26, 78, "#5f6f8a", false);
  root.querySelector(".skyline.lights").style.backgroundImage = skyline(11, 26, 78, "", true);
  // a handful of stars, spread over the whole sky
  const stars = Array.from({ length: 60 }, () => `${Math.round(rand() * 1600)}px ${Math.round(rand() * 420)}px 0 ${rand() < 0.3 ? 1 : 0}px #fff`).join(",");
  root.querySelector(".stars").style.cssText = `box-shadow:${stars}`;

  const $ = (s) => root.querySelector(s);
  const traffic = $(".traffic"), ahead = $(".ahead"), caption = $(".caption"), player = $(".player"), orb = $(".orb");
  const skies = [...root.querySelectorAll(".sky")];

  // cars stuck ahead of John Doe in his lane
  const aheadCars = Array.from({ length: 3 }, (_, i) => {
    const el = document.createElement("div");
    el.className = "car ahead-car";
    el.innerHTML = carSVG(i === 1 ? "van" : "sedan", CAR_COLORS[(i * 3 + 1) % CAR_COLORS.length]);
    ahead.append(el);
    return el;
  });

  const state = { speed: MOODS.idle.speed, density: MOODS.idle.density, phase: 0, timer: null };

  function apply() {
    const s = Math.max(0, Math.min(1, state.speed));
    const moving = s > 0.03 && !REDUCED;
    const set = (k, v) => root.style.setProperty(k, v);
    set("--road-dur", `${(0.28 + (1 - s) * 2.6).toFixed(2)}s`);
    set("--near-dur", `${(7 + (1 - s) * 60).toFixed(1)}s`);
    set("--far-dur", `${(16 + (1 - s) * 120).toFixed(1)}s`);
    set("--wheel-dur", `${(0.2 + (1 - s) * 2.2).toFixed(2)}s`);
    root.classList.toggle("moving", moving);
    root.classList.toggle("fast", s > 0.7);
    root.classList.toggle("jam", s < 0.35);
    const k = Math.round(state.density * 3 - 0.01);
    const gap = state.density > 0.7 ? 1.02 : 1.3; // in car lengths
    aheadCars.forEach((el, i) => {
      el.classList.toggle("show", i < Math.max(0, k));
      el.style.left = `calc(var(--car-w) * ${(1.04 + i * gap).toFixed(2)})`;
    });
  }

  function spawn() {
    if (!root.isConnected || REDUCED) return;
    const d = state.density, s = state.speed;
    if (state.speed > 0.03 && traffic.children.length < (d > 0.7 ? 8 : 5) && Math.random() < 0.35 + d * 0.65) {
      const el = document.createElement("div");
      el.className = "car pass-car";
      el.innerHTML = carSVG(Math.random() < 0.25 ? "van" : "sedan", CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)]);
      el.style.animationDuration = `${(6 / (0.25 + s * 1.2) * (0.85 + Math.random() * 0.4)).toFixed(2)}s`;
      el.addEventListener("animationend", () => el.remove());
      traffic.append(el);
    }
    clearTimeout(state.timer);
    state.timer = setTimeout(spawn, 500 + (1 - d) * 2600 * (0.7 + Math.random() * 0.6));
  }

  let captionTimer = null;
  function say(text) {
    caption.textContent = text;
    caption.classList.toggle("on", !!text);
    clearTimeout(captionTimer);
    if (text) captionTimer = setTimeout(() => caption.classList.remove("on"), 4500);
  }

  const gauge = fuelEl && {
    fill: fuelEl.querySelector(".fuel-fill"),
    pct: fuelEl.querySelector(".fuel-pct"),
    pop: fuelEl.querySelector(".fuel-pop"),
    dist: fuelEl.querySelector(".dist-n"),
  };

  const api = {
    setPhase(i) {
      state.phase = Math.max(0, Math.min(SKY.length - 1, i));
      skies.forEach((el, n) => el.classList.toggle("on", n === state.phase));
      const [x, y] = ORB[state.phase];
      orb.style.left = `${x}%`;
      orb.style.top = `${y}%`;
      root.classList.toggle("night", state.phase >= 7);
      root.classList.toggle("dusk", state.phase >= 5);
    },
    // How far the car has driven, in spaces (0..35). The car slides to its new spot along the road.
    setDistance(spaces, { animate = true } = {}) {
      const n = Math.max(0, Math.min(MAX_SPACES, spaces));
      if (!animate) root.classList.add("no-slide");
      root.style.setProperty("--p", String(n / MAX_SPACES));
      if (!animate) { void root.offsetWidth; root.classList.remove("no-slide"); }
      if (gauge && gauge.dist) gauge.dist.textContent = String(n);
      root.classList.toggle("arrived", n >= MAX_SPACES);
    },
    // react to an answer: level id from the game ("johndoe", "alien", "imposter", "nothing", ...)
    react(level, { quiet = false } = {}) {
      const m = MOODS[level] || MOODS.idle;
      const rate = (0.25 + m.speed * 1.2) / (0.25 + state.speed * 1.2);
      for (const car of traffic.children) for (const a of car.getAnimations()) a.playbackRate = Math.max(0.2, Math.min(8, (a.playbackRate || 1) * rate));
      state.speed = m.speed;
      state.density = m.density;
      apply();
      say(quiet ? "" : m.text);
      player.classList.remove("hop");
      void player.offsetWidth;
      if (m.speed > 0.7) player.classList.add("hop");
    },
    idle() {
      state.speed = MOODS.idle.speed;
      state.density = MOODS.idle.density;
      apply();
      say("");
    },
    // pct: 0..100 of a full tank. gained: points just earned, shown as a pop.
    setFuel(pct, { animate = true, gained = 0 } = {}) {
      if (!gauge) return;
      const p = Math.max(0, Math.min(100, Math.round(pct)));
      if (!animate) gauge.fill.style.transition = "none";
      gauge.fill.style.width = `${p}%`;
      if (!animate) { void gauge.fill.offsetWidth; gauge.fill.style.transition = ""; }
      gauge.pct.textContent = `${p}%`;
      fuelEl.setAttribute("aria-valuenow", String(p));
      fuelEl.setAttribute("aria-valuetext", `${p} percent full`);
      fuelEl.classList.toggle("low", p < 15);
      fuelEl.dataset.level = p < 15 ? "low" : p < 50 ? "mid" : "high";
      if (gained > 0 && animate) {
        gauge.pop.textContent = `+${gained}`;
        gauge.pop.classList.remove("go");
        void gauge.pop.offsetWidth;
        gauge.pop.classList.add("go");
      }
    },
  };

  api.setPhase(0);
  api.setDistance(0, { animate: false });
  api.idle();
  spawn();
  return api;
}
