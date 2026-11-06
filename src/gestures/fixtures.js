/* Manos sintéticas con la forma de los landmarks de MediaPipe.

   Las usan los tests, el eval y el simulador de desarrollo
   (window.__handControl en dev), así los tres hablan de la misma mano.

   Se arman en un sistema local (muñeca en el origen, dedos hacia -y, que en
   la imagen es "arriba") y después se rotan, escalan y ubican. */

const FINGER_X = [-0.06, -0.02, 0.02, 0.06]; // índice, medio, anular, meñique
const MCP_Y = -0.2;

function openFinger(x) {
  // MCP, PIP, DIP, TIP en línea recta hacia arriba
  return [
    { x, y: MCP_Y, z: 0 },
    { x, y: MCP_Y - 0.06, z: -0.01 },
    { x, y: MCP_Y - 0.1, z: -0.015 },
    { x, y: MCP_Y - 0.135, z: -0.02 },
  ];
}

function curledFinger(x) {
  // PIP apenas sobre el nudillo, la punta vuelve hacia la palma y adelante
  return [
    { x, y: MCP_Y, z: 0 },
    { x, y: MCP_Y - 0.04, z: -0.04 },
    { x, y: MCP_Y + 0.0, z: -0.07 },
    { x, y: MCP_Y + 0.05, z: -0.05 },
  ];
}

function halfFinger(x) {
  // mano relajada: dedos algo flexionados pero no cerrados
  return [
    { x, y: MCP_Y, z: 0 },
    { x, y: MCP_Y - 0.055, z: -0.02 },
    { x, y: MCP_Y - 0.085, z: -0.04 },
    { x, y: MCP_Y - 0.1, z: -0.06 },
  ];
}

function thumb(open) {
  return open
    ? [
        { x: -0.05, y: -0.04, z: -0.01 },
        { x: -0.1, y: -0.08, z: -0.02 },
        { x: -0.14, y: -0.11, z: -0.03 },
        { x: -0.17, y: -0.13, z: -0.035 },
      ]
    : [
        { x: -0.05, y: -0.04, z: -0.01 },
        { x: -0.08, y: -0.09, z: -0.03 },
        { x: -0.06, y: -0.13, z: -0.06 },
        { x: -0.03, y: -0.14, z: -0.07 },
      ];
}

/* kinds por dedo: "open" | "curled" | "half" */
function buildLocal(kinds, thumbOpen) {
  const pts = [{ x: 0, y: 0, z: 0 }, ...thumb(thumbOpen)];
  const make = { open: openFinger, curled: curledFinger, half: halfFinger };
  kinds.forEach((k, i) => pts.push(...make[k](FINGER_X[i])));
  return pts;
}

export const POSES = {
  open: () => buildLocal(["open", "open", "open", "open"], true),
  fist: () => buildLocal(["curled", "curled", "curled", "curled"], false),
  relaxed: () => buildLocal(["half", "half", "half", "half"], true),
  // Puño con el meñique suelto: sigue siendo puño (3 de 4)
  looseFist: () => buildLocal(["curled", "curled", "curled", "half"], false),
  // Señalar con el índice: la geometría lo lee como puño (3 de 4 cerrados)
  pointing: () => buildLocal(["open", "curled", "curled", "curled"], false),
  victory: () => buildLocal(["open", "open", "curled", "curled"], false),
};

/* PRNG determinístico (mulberry32) para que el ruido sea reproducible. */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rand) {
  const u = Math.max(rand(), 1e-12);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* Ubica una pose en la imagen.
   cx, cy: posición de la muñeca · scale: tamaño · angle: rotación en grados
   noise: desvío del ruido gaussiano por coordenada · rand: generador */
export function placeHand(local, { cx = 0.5, cy = 0.75, scale = 1, angle = 0, noise = 0, rand } = {}) {
  const a = (angle * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const r = rand ?? rng(7);
  return local.map((p) => {
    const x = p.x * scale;
    const y = p.y * scale;
    return {
      x: cx + x * cos - y * sin + (noise ? gauss(r) * noise : 0),
      y: cy + x * sin + y * cos + (noise ? gauss(r) * noise : 0),
      z: p.z * scale + (noise ? gauss(r) * noise : 0),
    };
  });
}

export const hand = (pose, placement) => placeHand(POSES[pose](), placement);
