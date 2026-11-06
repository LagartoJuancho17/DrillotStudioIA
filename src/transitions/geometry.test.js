import { test } from "node:test";
import assert from "node:assert/strict";
import { coverBox, frameStyle, lerpRect, viewportRect } from "./geometry.js";
import { rng } from "../gestures/fixtures.js";

const EPS = 1e-6;
const covers = (box, rect) =>
  box.x <= rect.x + EPS &&
  box.y <= rect.y + EPS &&
  box.x + box.w >= rect.x + rect.w - EPS &&
  box.y + box.h >= rect.y + rect.h - EPS;

test("cover of a wide image in a tall rect fills the height and overflows sideways", () => {
  const rect = { x: 100, y: 50, w: 200, h: 400 };
  const box = coverBox(rect, 16 / 9);
  assert.equal(box.h, 400);
  assert.ok(Math.abs(box.w - (400 * 16) / 9) < EPS);
  assert.ok(covers(box, rect));
  // centrada
  assert.ok(Math.abs(box.x + box.w / 2 - (rect.x + rect.w / 2)) < EPS);
});

test("cover of a tall image in a wide rect fills the width", () => {
  const rect = { x: 0, y: 0, w: 1200, h: 600 };
  const box = coverBox(rect, 9 / 16);
  assert.equal(box.w, 1200);
  assert.ok(covers(box, rect));
});

test("same aspect: the box is the rect", () => {
  const rect = { x: 10, y: 20, w: 300, h: 150 };
  assert.deepEqual(coverBox(rect, 2), rect);
});

test("bad aspect falls back to the rect's own aspect", () => {
  const rect = { x: 0, y: 0, w: 300, h: 150 };
  for (const a of [0, NaN, Infinity, -1]) assert.deepEqual(coverBox(rect, a), rect);
});

test("property: cover always covers, is centered and is minimal (2000 random cases)", () => {
  const r = rng(42);
  for (let i = 0; i < 2000; i++) {
    const rect = { x: r() * 800 - 200, y: r() * 600 - 200, w: 20 + r() * 1600, h: 20 + r() * 1200 };
    const aspect = 0.3 + r() * 3;
    const box = coverBox(rect, aspect);
    assert.ok(covers(box, rect), `case ${i}`);
    // una de las dos dimensiones coincide: no sobra escala
    assert.ok(Math.abs(box.w - rect.w) < 1e-6 || Math.abs(box.h - rect.h) < 1e-6, `minimal ${i}`);
    assert.ok(Math.abs(box.w / box.h - aspect) < 1e-6, `aspect ${i}`);
  }
});

test("property: every interpolated frame of a transition still covers its window", () => {
  const r = rng(7);
  const vw = 1440;
  const vh = 900;
  for (let i = 0; i < 300; i++) {
    const from = { x: r() * 900, y: r() * 600, w: 80 + r() * 500, h: 80 + r() * 400 };
    const to = viewportRect(vw, vh);
    const aspect = 0.5 + r() * 2;
    for (let s = 0; s <= 20; s++) {
      const rect = lerpRect(from, to, s / 20);
      const { box } = frameStyle(rect, { vw, vh, aspect, baseW: 1000, zoom: 1 + r() * 0.2 });
      assert.ok(covers(box, rect), `case ${i} step ${s}`);
    }
  }
});

test("frameStyle clips to the window and clamps offscreen edges to 0", () => {
  const { clipPath } = frameStyle({ x: 100, y: 50, w: 200, h: 100 }, { vw: 1000, vh: 800, aspect: 2, baseW: 200 });
  assert.equal(clipPath, "inset(50px 700px 650px 100px)");
  // ventana que se sale por abajo (portada bajo el pliegue)
  const below = frameStyle({ x: 0, y: 700, w: 1000, h: 400 }, { vw: 1000, vh: 800, aspect: 2.5, baseW: 1000 });
  assert.equal(below.clipPath, "inset(700px 0px 0px 0px)");
});

test("frameStyle scale maps the base width to the cover width", () => {
  const { transform } = frameStyle({ x: 0, y: 0, w: 400, h: 200 }, { vw: 1000, vh: 800, aspect: 2, baseW: 800 });
  assert.equal(transform, "translate3d(0px, 0px, 0) scale(0.50000)");
});

test("zoom grows the image around the window center", () => {
  const rect = { x: 0, y: 0, w: 400, h: 200 };
  const { box } = frameStyle(rect, { vw: 1000, vh: 800, aspect: 2, baseW: 400, zoom: 1.5 });
  assert.equal(box.w, 600);
  assert.equal(box.x + box.w / 2, 200);
  assert.equal(box.y + box.h / 2, 100);
});
