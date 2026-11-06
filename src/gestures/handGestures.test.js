import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyPose,
  createHandTracker,
  curlRatios,
  isFistGeometry,
  palmCenter,
} from "./handGestures.js";
import { hand } from "./fixtures.js";

const frame = (pose, placement, gesture) => ({ landmarks: hand(pose, placement), gesture });

/* Corre una secuencia de frames a 30 fps y junta los resultados. */
function run(tracker, frames, { t0 = 0, dt = 33 } = {}) {
  return frames.map((f, i) => tracker.update(f, t0 + i * dt));
}

test("curl ratio: open fingers are far, fist fingers are near", () => {
  for (const r of curlRatios(hand("open"))) assert.ok(r > 1.6, `open ratio ${r}`);
  for (const r of curlRatios(hand("fist"))) assert.ok(r < 1.1, `fist ratio ${r}`);
});

test("geometry: open, relaxed are not fist; fist and loose fist are", () => {
  assert.equal(isFistGeometry(hand("open")), false);
  assert.equal(isFistGeometry(hand("relaxed")), false);
  assert.equal(isFistGeometry(hand("fist")), true);
  assert.equal(isFistGeometry(hand("looseFist")), true);
});

test("geometry is scale and rotation invariant", () => {
  for (const scale of [0.4, 1, 1.8]) {
    for (const angle of [-70, 0, 70]) {
      assert.equal(isFistGeometry(hand("fist", { scale, angle })), true, `fist s${scale} a${angle}`);
      assert.equal(isFistGeometry(hand("open", { scale, angle })), false, `open s${scale} a${angle}`);
    }
  }
});

test("geometry rejects incomplete landmark arrays", () => {
  assert.equal(isFistGeometry([]), false);
  assert.equal(isFistGeometry(null), false);
});

test("classifier wins when confident, geometry decides on None", () => {
  const open = hand("open");
  const fist = hand("fist");
  assert.equal(classifyPose({ landmarks: open, gesture: { name: "Closed_Fist", score: 0.9 } }), "fist");
  assert.equal(classifyPose({ landmarks: fist, gesture: { name: "Open_Palm", score: 0.9 } }), "open");
  // Pointing_Up es mano "abierta" para el control aunque la geometría diga puño
  assert.equal(classifyPose({ landmarks: hand("pointing"), gesture: { name: "Pointing_Up", score: 0.8 } }), "open");
  assert.equal(classifyPose({ landmarks: fist, gesture: { name: "None", score: 0.6 } }), "fist");
  assert.equal(classifyPose({ landmarks: open, gesture: { name: "None", score: 0.6 } }), "open");
  // Closed_Fist con poca confianza: decide la geometría
  assert.equal(classifyPose({ landmarks: open, gesture: { name: "Closed_Fist", score: 0.3 } }), "open");
  assert.equal(classifyPose({ landmarks: fist, gesture: { name: "Closed_Fist", score: 0.3 } }), "fist");
});

test("palm center ignores finger tips", () => {
  const a = palmCenter(hand("open"));
  const b = palmCenter(hand("fist"));
  assert.ok(Math.abs(a.y - b.y) < 1e-9 && Math.abs(a.x - b.x) < 1e-9);
});

test("first frame of a hand never scrolls", () => {
  const tr = createHandTracker();
  const [r] = run(tr, [frame("open", { cy: 0.2 })]);
  assert.equal(r.delta, 0);
  assert.equal(r.pose, "open");
});

test("moving the hand up scrolls forward, down scrolls back", () => {
  const up = createHandTracker();
  const ys = [0.8, 0.75, 0.7, 0.65, 0.6, 0.55];
  const upTotal = run(up, ys.map((cy) => frame("open", { cy }))).reduce((s, r) => s + r.delta, 0);
  assert.ok(upTotal > 0.1, `up total ${upTotal}`);

  const down = createHandTracker();
  const downTotal = run(down, [...ys].reverse().map((cy) => frame("open", { cy }))).reduce((s, r) => s + r.delta, 0);
  assert.ok(downTotal < -0.1, `down total ${downTotal}`);
});

test("horizontal axis is mirrored: hand to the user's left (image right) goes forward", () => {
  const tr = createHandTracker({ axis: "x" });
  const xs = [0.3, 0.35, 0.4, 0.45, 0.5];
  const total = run(tr, xs.map((cx) => frame("open", { cx }))).reduce((s, r) => s + r.delta, 0);
  assert.ok(total > 0.05, `total ${total}`);
});

test("a still hand with jitter does not scroll", () => {
  const tr = createHandTracker();
  const frames = [];
  for (let i = 0; i < 60; i++) frames.push(frame("open", { cy: 0.6 + (i % 2 ? 0.0008 : -0.0008) }));
  const moved = run(tr, frames).filter((r) => r.delta !== 0).length;
  assert.equal(moved, 0);
});

test("holding a fist enters exactly once after holdMs", () => {
  const tr = createHandTracker({ holdMs: 450 });
  const frames = [frame("open"), frame("open"), ...Array.from({ length: 30 }, () => frame("fist"))];
  const res = run(tr, frames);
  const enters = res.filter((r) => r.enter);
  assert.equal(enters.length, 1);
  const enterIdx = res.findIndex((r) => r.enter);
  const fistIdx = res.findIndex((r) => r.pose === "fist");
  const heldMs = (enterIdx - fistIdx) * 33;
  assert.ok(heldMs >= 450 && heldMs < 520, `held ${heldMs}ms`);
});

test("a brief fist does not enter", () => {
  const tr = createHandTracker({ holdMs: 450 });
  const frames = [frame("open"), ...Array.from({ length: 8 }, () => frame("fist")), ...Array.from({ length: 10 }, () => frame("open"))];
  assert.equal(run(tr, frames).some((r) => r.enter), false);
});

test("fist re-arms only after opening the hand", () => {
  const tr = createHandTracker({ holdMs: 200 });
  const fists = (n) => Array.from({ length: n }, () => frame("fist"));
  const opens = (n) => Array.from({ length: n }, () => frame("open"));
  const res = run(tr, [...opens(2), ...fists(30), ...opens(4), ...fists(30)]);
  assert.equal(res.filter((r) => r.enter).length, 2);
});

test("single-frame classifier flicker does not change pose", () => {
  const tr = createHandTracker();
  const res = run(tr, [frame("open"), frame("open"), frame("fist"), frame("open"), frame("open")]);
  assert.ok(res.every((r) => r.pose === "open"));
});

test("closing the hand releases scrolling and does not scroll", () => {
  const tr = createHandTracker();
  const res = run(tr, [frame("open", { cy: 0.7 }), frame("open", { cy: 0.65 }), frame("fist", { cy: 0.65 }), frame("fist", { cy: 0.65 })]);
  assert.equal(res[3].release, true);
  assert.equal(res[2].delta, 0);
  assert.equal(res[3].delta, 0);
});

test("losing the hand while scrolling releases; losing it while idle does not", () => {
  const tr = createHandTracker();
  const res = run(tr, [frame("open"), null]);
  assert.equal(res[1].release, true);
  assert.equal(res[1].pose, "none");
  const again = run(tr, [null]);
  assert.equal(again[0].release, false);
});

test("re-opening after a fist rebases without a jump", () => {
  const tr = createHandTracker({ holdMs: 10000 });
  const res = run(tr, [
    frame("open", { cy: 0.8 }),
    frame("fist", { cy: 0.8 }),
    frame("fist", { cy: 0.4 }), // mueve la mano con el puño cerrado
    frame("open", { cy: 0.4 }),
    frame("open", { cy: 0.4 }),
    frame("open", { cy: 0.4 }),
  ]);
  assert.ok(res.every((r) => Math.abs(r.delta) < 1e-9), JSON.stringify(res.map((r) => r.delta)));
});

test("switching axis rebases without a jump", () => {
  const tr = createHandTracker();
  tr.update(frame("open", { cx: 0.2, cy: 0.5 }), 0);
  tr.setAxis("x");
  const r = tr.update(frame("open", { cx: 0.2, cy: 0.5 }), 33);
  assert.equal(r.delta, 0);
});
