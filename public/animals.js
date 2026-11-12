// Cartoon farm animals seen head-on, for the obstacle on the road. Each is drawn in a 100-unit-tall box:
// feet at y = 0 (the road), top of the animal at about y = -100, centred on x = 0.
// draw(ctx, kind, x, y, h, { fear }): puts the feet at (x, y) and scales the animal to h pixels tall.
// fear = true is the last second before it gets hit: wide eyes, raised brows, an open mouth and a sweat drop.
export const ANIMALS = ["chicken", "turkey", "goat", "sheep", "pig", "horse", "cow"];
// How big each animal is drawn next to the others (1 = the biggest), roughly following their real sizes.
export const SIZE = { chicken: 0.34, turkey: 0.46, goat: 0.6, sheep: 0.66, pig: 0.7, horse: 0.96, cow: 1 };
const O = "#2a2630";

// Where each animal's eyes and mouth are, so the scared face can be drawn over the calm one: eyes [x, y, radius], mouth [x, y, rx, ry].
const FACE = {
  chicken: { eyes: [[-7, -77, 3], [7, -77, 3]], mouth: [0, -65, 4.5, 5.5] },
  turkey: { eyes: [[-5, -80, 2.6], [5, -80, 2.6]], mouth: [0, -71, 3.6, 4.6] },
  goat: { eyes: [[-6, -76, 3], [6, -76, 3]], mouth: [0, -60, 5, 5.2] },
  sheep: { eyes: [[-5, -63, 3], [5, -63, 3]], mouth: [0, -52, 4.4, 4.8] },
  pig: { eyes: [[-10, -58, 2.6], [10, -58, 2.6]], mouth: [0, -37, 7, 5] },
  horse: { eyes: [[-10, -84, 2.6], [10, -84, 2.6]], mouth: [0, -58, 6, 6.5] },
  cow: { eyes: [[-8, -72, 3], [8, -72, 3]], mouth: [0, -55, 7, 5.5] },
};

export function draw(ctx, kind, x, y, h, { fear = false } = {}) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(h / 100, h / 100);
  ctx.lineJoin = "round"; ctx.lineCap = "round";
  const E = (cx, cy, rx, ry, f, rot = 0, line = true) => { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, rot, 0, 7); ctx.fillStyle = f; ctx.fill(); if (line) { ctx.lineWidth = 2; ctx.strokeStyle = O; ctx.stroke(); } };
  const R = (x0, y0, w, hh, f, r = 3) => { ctx.beginPath(); ctx.roundRect(x0, y0, w, hh, r); ctx.fillStyle = f; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = O; ctx.stroke(); };
  const T = (pts, f) => { ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); ctx.fillStyle = f; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = O; ctx.stroke(); };
  const L = (a, b, c, d, col, w) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); };
  const eye = (cx, cy, r = 3) => { E(cx, cy, r, r, "#fff", 0, false); E(cx + 0.3, cy + 0.3, r * 0.55, r * 0.55, O, 0, false); };
  E(0, 0, 40, 6, "rgba(0,0,0,.28)", 0, false); // shadow on the road

  if (kind === "chicken") {
    L(-9, -22, -9, -3, "#e9902a", 4); L(9, -22, 9, -3, "#e9902a", 4);
    [-9, 9].forEach((s) => { L(s, -3, s - 6, 0, "#e9902a", 3); L(s, -3, s, 0, "#e9902a", 3); L(s, -3, s + 6, 0, "#e9902a", 3); });
    E(0, -42, 26, 24, "#f7f1e4"); E(-24, -40, 8, 16, "#e7dcc6", 0.3); E(24, -40, 8, 16, "#e7dcc6", -0.3);
    E(0, -73, 14, 14, "#f7f1e4");
    E(-6, -88, 5, 6, "#d83a34"); E(0, -91, 6, 7, "#d83a34"); E(6, -88, 5, 6, "#d83a34");
    E(0, -60, 3.5, 6, "#d83a34");
    T([[-6, -70], [6, -70], [0, -61]], "#f1a02a");
    eye(-7, -77, 3); eye(7, -77, 3);
  } else if (kind === "turkey") {
    for (let i = -3; i <= 3; i++) { ctx.save(); ctx.translate(0, -48); ctx.rotate(i * 0.34); E(0, -34, 9, 32, i % 2 ? "#c79b56" : "#8a5a2b"); ctx.restore(); }
    L(-10, -22, -10, -3, "#e9902a", 4); L(10, -22, 10, -3, "#e9902a", 4);
    [-10, 10].forEach((s) => { L(s, -3, s - 6, 0, "#e9902a", 3); L(s, -3, s, 0, "#e9902a", 3); L(s, -3, s + 6, 0, "#e9902a", 3); });
    E(0, -40, 28, 26, "#7a4a25"); E(0, -33, 19, 16, "#a2703a");
    E(0, -64, 8, 15, "#6f9cc7"); E(0, -78, 10, 10, "#6f9cc7");
    E(0, -64, 4.5, 9, "#d63a3a"); T([[-3, -76], [3, -76], [0, -69]], "#f1a02a");
    eye(-5, -80, 2.6); eye(5, -80, 2.6);
  } else if (kind === "goat") {
    ctx.strokeStyle = O; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-8, -86); ctx.quadraticCurveTo(-22, -92, -16, -108); ctx.moveTo(8, -86); ctx.quadraticCurveTo(22, -92, 16, -108); ctx.stroke();
    ctx.strokeStyle = "#9a8760"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-8, -86); ctx.quadraticCurveTo(-22, -92, -16, -108); ctx.moveTo(8, -86); ctx.quadraticCurveTo(22, -92, 16, -108); ctx.stroke();
    E(0, -45, 29, 22, "#d9c7a3");
    R(-22, -28, 9, 26, "#cbb892", 3); R(13, -28, 9, 26, "#cbb892", 3); R(-22, -6, 9, 6, "#3a3036", 2); R(13, -6, 9, 6, "#3a3036", 2);
    E(-19, -76, 11, 5, "#cbb892", -0.35); E(19, -76, 11, 5, "#cbb892", 0.35);
    E(0, -72, 14, 17, "#e5d6b4"); E(0, -62, 9.5, 8, "#f2e8d0");
    T([[-4, -55], [4, -55], [0, -44]], "#fff");
    [-6, 6].forEach((s) => { E(s, -76, 3.4, 2.6, "#e8d34a", 0, true); L(s, -77.5, s, -74.5, O, 1.6); });
    E(-3, -63, 1.4, 1.1, O, 0, false); E(3, -63, 1.4, 1.1, O, 0, false);
  } else if (kind === "sheep") {
    R(-22, -26, 9, 24, "#3b3640", 3); R(13, -26, 9, 24, "#3b3640", 3);
    [[-18, -50, 15], [0, -56, 17], [18, -50, 15], [-10, -36, 15], [10, -36, 15], [0, -44, 17]].forEach(([a, b, r]) => E(a, b, r, r, "#f6f4ee"));
    E(-18, -62, 8, 4, "#4a4550", -0.35); E(18, -62, 8, 4, "#4a4550", 0.35);
    E(0, -60, 12, 15, "#4a4550"); E(0, -76, 11, 9, "#f6f4ee");
    eye(-5, -63, 3); eye(5, -63, 3); E(0, -52, 5, 3.5, "#6a6470", 0, false);
  } else if (kind === "pig") {
    R(-24, -18, 11, 16, "#e88ea0", 3); R(13, -18, 11, 16, "#e88ea0", 3); R(-24, -5, 11, 5, "#3a3036", 2); R(13, -5, 11, 5, "#3a3036", 2);
    E(0, -42, 33, 27, "#f4a6b5");
    E(-19, -72, 10, 9, "#e88ea0", -0.6); E(19, -72, 10, 9, "#e88ea0", 0.6);
    E(0, -52, 23, 21, "#f7b4c1");
    E(0, -44, 12, 9, "#f08aa0"); E(-4, -44, 2, 3, O, 0, false); E(4, -44, 2, 3, O, 0, false);
    E(-10, -58, 2.6, 2.6, O, 0, false); E(10, -58, 2.6, 2.6, O, 0, false);
  } else if (kind === "horse") {
    R(-21, -34, 12, 32, "#8a5a35", 4); R(9, -34, 12, 32, "#8a5a35", 4); R(-21, -8, 12, 8, "#2f2a30", 2); R(9, -8, 12, 8, "#2f2a30", 2);
    E(0, -46, 29, 25, "#9a6538");
    T([[-17, -58], [17, -58], [11, -88], [-11, -88]], "#9a6538"); // neck
    T([[-14, -62], [-9, -62], [-7, -94], [-13, -90]], "#3a2416"); T([[14, -62], [9, -62], [7, -94], [13, -90]], "#3a2416"); // mane on both sides
    T([[-11, -102], [-5, -92], [-14, -92]], "#8a5a35"); T([[11, -102], [5, -92], [14, -92]], "#8a5a35"); // ears
    E(0, -78, 11, 20, "#a86f3d"); E(0, -82, 3, 14, "#f3e9dc", 0, false); // head and blaze
    E(0, -60, 9, 8, "#c79468"); E(-4, -60, 1.6, 2.2, O, 0, false); E(4, -60, 1.6, 2.2, O, 0, false);
    eye(-10, -84, 2.4); eye(10, -84, 2.4);
    E(0, -95, 5, 3.5, "#3a2416", 0, false); // forelock
  } else if (kind === "cow") {
    R(-24, -30, 11, 28, "#fbfbfb", 3); R(13, -30, 11, 28, "#fbfbfb", 3); R(-24, -8, 11, 8, "#2f2a30", 2); R(13, -8, 11, 8, "#2f2a30", 2);
    E(0, -48, 34, 29, "#fbfbfb"); E(-20, -55, 10, 8, "#2b2b2b", 0.3, false); E(22, -40, 9, 11, "#2b2b2b", -0.2, false);
    ctx.strokeStyle = O; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-10, -84); ctx.quadraticCurveTo(-20, -86, -22, -97); ctx.moveTo(10, -84); ctx.quadraticCurveTo(20, -86, 22, -97); ctx.stroke();
    ctx.strokeStyle = "#f1e6c8"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-10, -84); ctx.quadraticCurveTo(-20, -86, -22, -97); ctx.moveTo(10, -84); ctx.quadraticCurveTo(20, -86, 22, -97); ctx.stroke();
    E(-24, -76, 10, 5, "#fbfbfb", -0.3); E(24, -76, 10, 5, "#fbfbfb", 0.3); E(-24, -76, 5, 2.5, "#f3b0bb", -0.3, false); E(24, -76, 5, 2.5, "#f3b0bb", 0.3, false);
    E(0, -68, 18, 19, "#fbfbfb"); E(-9, -76, 6, 8, "#2b2b2b", 0.2, false);
    E(0, -58, 13, 9.5, "#f3b0bb"); E(-4.5, -58, 2, 2.8, "#c97f8d", 0, false); E(4.5, -58, 2, 2.8, "#c97f8d", 0, false);
    eye(-8, -72, 3); eye(8, -72, 3);
  }
  if (fear && FACE[kind]) {
    const f = FACE[kind];
    f.eyes.forEach(([ex, ey, r], i) => {
      const dir = i === 0 ? -1 : 1;
      E(ex, ey, r * 1.7, r * 1.7, "#fff"); E(ex, ey + 0.4, r * 0.5, r * 0.5, O, 0, false); // wide eyes, tiny pupils
      L(ex - dir * r * 1.7, ey - r * 2.4, ex + dir * r * 1.1, ey - r * 3.3, O, 1.8); // brows raised in the middle
    });
    const [mx, my, rx, ry] = f.mouth;
    E(mx, my, rx, ry, "#5a1420"); E(mx, my + ry * 0.5, rx * 0.6, ry * 0.4, "#e0707f", 0, false); // open mouth and tongue
    const [sx, sy] = [f.eyes[1][0] + 11, f.eyes[1][1] - 8]; // a sweat drop
    ctx.beginPath(); ctx.moveTo(sx, sy - 6); ctx.quadraticCurveTo(sx + 5, sy + 1, sx, sy + 4); ctx.quadraticCurveTo(sx - 5, sy + 1, sx, sy - 6); ctx.fillStyle = "#8fd6ff"; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = O; ctx.stroke();
  }
  ctx.restore();
}
