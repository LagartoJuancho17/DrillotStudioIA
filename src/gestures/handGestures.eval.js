/* Eval de generalización del control por gestos.

   Los tests prueban casos puntuales. Esto barre miles de manos sintéticas
   (pose × rotación × escala × posición × ruido) y mide tasas, con umbrales
   que tienen que cumplirse. Es determinístico (ruido con semilla), así que
   no es flaky, pero es más lento que los tests: correr con
     npm run eval:gestures

   Qué mide:
   1. Clasificación geométrica de pose (sin ayuda del clasificador).
   2. Scroll fantasma: mano quieta con temblor no debe mover el carrusel.
   3. Fidelidad: un barrido de la mano produce scroll en la dirección correcta.
   4. Entradas falsas: abrir y cerrar rápido nunca entra; sostener siempre entra. */

import { createHandTracker, isFistGeometry } from "./handGestures.js";
import { hand, rng } from "./fixtures.js";

const THRESHOLDS = {
  poseAccuracy: 0.98,
  ghostScrollRate: 0.02,
  directionAccuracy: 0.99,
  falseEnterRate: 0,
  holdEnterRate: 1,
};

const rand = rng(2026);
const pick = (lo, hi) => lo + rand() * (hi - lo);

function placement(noise) {
  return {
    cx: pick(0.25, 0.75),
    cy: pick(0.4, 0.85),
    scale: pick(0.45, 1.6),
    angle: pick(-60, 60),
    noise,
    rand,
  };
}

/* 1. Pose */
const expected = { open: false, relaxed: false, fist: true, looseFist: true };
let poseOk = 0;
let poseN = 0;
const poseMiss = {};
for (const [pose, isFist] of Object.entries(expected)) {
  for (let i = 0; i < 1500; i++) {
    const noise = pick(0, 0.006);
    const ok = isFistGeometry(hand(pose, placement(noise))) === isFist;
    poseN += 1;
    if (ok) poseOk += 1;
    else poseMiss[pose] = (poseMiss[pose] ?? 0) + 1;
  }
}
const poseAccuracy = poseOk / poseN;

/* 2. Scroll fantasma: 3 s de mano quieta con temblor realista (~0.002) */
let ghostFrames = 0;
let ghostN = 0;
for (let trial = 0; trial < 200; trial++) {
  const tr = createHandTracker();
  const base = placement(0);
  for (let i = 0; i < 90; i++) {
    const r = tr.update({ landmarks: hand("open", { ...base, noise: 0.002, rand }) }, i * 33);
    if (i > 0) {
      ghostN += 1;
      if (r.delta !== 0) ghostFrames += 1;
    }
  }
}
const ghostScrollRate = ghostFrames / ghostN;

/* 3. Dirección: barridos de 0.15-0.4 de alto de imagen en ~0.5 s */
let dirOk = 0;
let dirN = 0;
for (let trial = 0; trial < 400; trial++) {
  const tr = createHandTracker();
  const base = placement(0);
  const span = pick(0.15, 0.4) * (trial % 2 ? 1 : -1); // + = baja la mano
  const startY = 0.62 - span / 2;
  let total = 0;
  for (let i = 0; i <= 15; i++) {
    const cy = startY + (span * i) / 15;
    total += tr.update({ landmarks: hand("open", { ...base, cy, noise: 0.002, rand }) }, i * 33).delta;
  }
  dirN += 1;
  // bajar la mano retrocede (delta < 0), subirla avanza
  if (Math.sign(total) === -Math.sign(span)) dirOk += 1;
}
const directionAccuracy = dirOk / dirN;

/* 4. Entradas: puños de 100-300 ms nunca entran; de 600 ms siempre */
let falseEnters = 0;
let holdEnters = 0;
const trials = 300;
for (let trial = 0; trial < trials; trial++) {
  const base = placement(0);
  const f = (pose) => ({ landmarks: hand(pose, { ...base, noise: 0.002, rand }) });

  const quick = createHandTracker();
  const quickFrames = Math.round(pick(100, 300) / 33);
  const seq = [f("open"), f("open"), ...Array.from({ length: quickFrames }, () => f("fist")), f("open"), f("open"), f("open")];
  if (seq.some((fr, i) => quick.update(fr, i * 33).enter)) falseEnters += 1;

  const hold = createHandTracker();
  const seq2 = [f("open"), f("open"), ...Array.from({ length: 20 }, () => f("fist"))];
  if (seq2.some((fr, i) => hold.update(fr, i * 33).enter)) holdEnters += 1;
}
const falseEnterRate = falseEnters / trials;
const holdEnterRate = holdEnters / trials;

const rows = [
  ["poseAccuracy", poseAccuracy, ">=", THRESHOLDS.poseAccuracy],
  ["ghostScrollRate", ghostScrollRate, "<=", THRESHOLDS.ghostScrollRate],
  ["directionAccuracy", directionAccuracy, ">=", THRESHOLDS.directionAccuracy],
  ["falseEnterRate", falseEnterRate, "<=", THRESHOLDS.falseEnterRate],
  ["holdEnterRate", holdEnterRate, ">=", THRESHOLDS.holdEnterRate],
];

let failed = 0;
for (const [name, value, op, limit] of rows) {
  const pass = op === ">=" ? value >= limit : value <= limit;
  if (!pass) failed += 1;
  console.log(`${pass ? "PASS" : "FAIL"}  ${name.padEnd(18)} ${value.toFixed(4)}  (${op} ${limit})`);
}
if (Object.keys(poseMiss).length) console.log("pose misses:", poseMiss);
process.exit(failed ? 1 : 0);
