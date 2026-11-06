/* Lógica pura del control por gestos: de landmarks de MediaPipe a acciones.

   No toca la cámara, el DOM ni React. Recibe un frame por vez y devuelve qué
   hacer con el carrusel. Por eso se puede testear con `node --test` sin
   navegador (ver handGestures.test.js).

   Landmarks de MediaPipe Hands, 21 puntos normalizados a [0, 1]:
     0 muñeca · 1-4 pulgar · 5-8 índice · 9-12 medio · 13-16 anular · 17-20 meñique
   En cada dedo: MCP (nudillo), PIP, DIP, TIP (punta). */

export const WRIST = 0;
export const FINGERS = [
  { name: "index", mcp: 5, tip: 8 },
  { name: "middle", mcp: 9, tip: 12 },
  { name: "ring", mcp: 13, tip: 16 },
  { name: "pinky", mcp: 17, tip: 20 },
];
const PALM = [0, 5, 9, 13, 17];

export const DEFAULTS = {
  /* Un dedo está cerrado cuando la punta queda más cerca de la muñeca que
     CURL_RATIO veces su nudillo. Mano abierta da ~1.8-2.0, puño ~0.8-1.1. */
  curlRatio: 1.3,
  /* Dedos cerrados (de 4, sin contar el pulgar) para considerar puño. */
  curledFingers: 3,
  /* Confianza mínima del clasificador de MediaPipe para "Closed_Fist". */
  fistScore: 0.55,
  /* Cuánto hay que sostener el puño para entrar. Evita entradas al pasar por
     un puño a medias mientras se mueve la mano. */
  holdMs: 450,
  /* Frames seguidos con la misma pose antes de aceptar el cambio. Filtra el
     parpadeo del clasificador en la transición abierta/cerrada. */
  stableFrames: 2,
  /* Suavizado exponencial de la posición de la palma (0 = congelado, 1 = crudo). */
  smoothing: 0.55,
  /* Movimiento mínimo por frame (en unidades normalizadas) para scrollear.
     Debajo de esto es temblor de la mano o ruido del modelo. */
  deadzone: 0.0015,
};

const dist = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));

/* Centro de la palma: muñeca y nudillos. No usa las puntas, así que cerrar
   la mano casi no lo mueve y el puño no se lee como scroll. */
export function palmCenter(landmarks) {
  let x = 0;
  let y = 0;
  for (const i of PALM) {
    x += landmarks[i].x;
    y += landmarks[i].y;
  }
  return { x: x / PALM.length, y: y / PALM.length };
}

/* Relación punta-muñeca / nudillo-muñeca de cada dedo. Es independiente de la
   escala y de la rotación en el plano: da lo mismo la mano cerca o lejos de la
   cámara, derecha o inclinada. */
export function curlRatios(landmarks) {
  const wrist = landmarks[WRIST];
  return FINGERS.map(({ mcp, tip }) => {
    const base = dist(landmarks[mcp], wrist);
    return base > 1e-6 ? dist(landmarks[tip], wrist) / base : Infinity;
  });
}

export function isFistGeometry(landmarks, opts = DEFAULTS) {
  if (!landmarks || landmarks.length < 21) return false;
  const curled = curlRatios(landmarks).filter((r) => r < opts.curlRatio).length;
  return curled >= opts.curledFingers;
}

/* Pose de la mano en un frame: "fist" o "open".
   Manda el clasificador de MediaPipe cuando opina con confianza; la geometría
   decide cuando el clasificador no reconoce nada ("None") o no está. */
export function classifyPose(frame, opts = DEFAULTS) {
  const g = frame.gesture;
  if (g && g.name && g.name !== "None") {
    if (g.name === "Closed_Fist" && g.score >= opts.fistScore) return "fist";
    if (g.name !== "Closed_Fist") return "open";
  }
  return isFistGeometry(frame.landmarks, opts) ? "fist" : "open";
}

/* Máquina de estados del control.

   update(frame, tMs) con frame = null (no hay mano) o
   { landmarks, gesture?: { name, score } } devuelve:
     delta     desplazamiento normalizado para el carrusel (+ = siguiente)
     release   la mano dejó de scrollear: hay que hacer snap al más cercano
     enter     el puño se sostuvo holdMs: entrar al proyecto activo
     pose      "none" | "open" | "fist"
     progress  0..1 del puño sostenido, para la UI

   Eje: "y" para el carrusel vertical, "x" para el horizontal. En "x" se espeja
   porque la imagen de la cámara llega sin espejar y la persona se ve como en
   un espejo. Subir la mano (o llevarla a la izquierda) avanza, igual que
   arrastrar con el dedo en touch. */
export function createHandTracker(options = {}) {
  const opts = { ...DEFAULTS, ...options };
  let axis = opts.axis ?? "y";

  let pose = "none"; // pose aceptada
  let candidate = null; // pose nueva esperando confirmarse
  let candidateCount = 0;
  let smoothPos = null; // posición suavizada de la palma en el eje
  let holdStart = null;
  let fired = false; // ya entró con este puño; se rearma al abrir la mano

  const axisValue = (p) => (axis === "x" ? 1 - p.x : p.y);

  const result = (extra = {}) => ({
    delta: 0,
    release: false,
    enter: false,
    pose,
    progress: 0,
    ...extra,
  });

  function reset() {
    pose = "none";
    candidate = null;
    candidateCount = 0;
    smoothPos = null;
    holdStart = null;
    fired = false;
  }

  function setAxis(next) {
    if (next === axis) return;
    axis = next;
    smoothPos = null; // el valor viejo es de otro eje: rebasear sin salto
  }

  function update(frame, t) {
    if (!frame || !frame.landmarks || frame.landmarks.length < 21) {
      const wasOpen = pose === "open";
      reset();
      return result({ release: wasOpen });
    }

    /* Confirmación de pose: un cambio necesita stableFrames frames seguidos.
       La primera aparición de la mano se acepta enseguida. */
    const raw = classifyPose(frame, opts);
    let changed = false;
    let prev = pose;
    if (pose === "none") {
      pose = raw;
      changed = true;
      candidate = null;
      candidateCount = 0;
    } else if (raw !== pose) {
      if (raw === candidate) candidateCount += 1;
      else {
        candidate = raw;
        candidateCount = 1;
      }
      if (candidateCount >= opts.stableFrames) {
        pose = raw;
        changed = true;
        candidate = null;
        candidateCount = 0;
      }
    } else {
      candidate = null;
      candidateCount = 0;
    }

    const pos = axisValue(palmCenter(frame.landmarks));

    if (pose === "fist") {
      smoothPos = null; // al volver a abrir, se rebasea sin saltar
      if (changed) holdStart = t;
      const release = changed && prev === "open";
      if (fired) return result({ release, progress: 1 });
      const progress = Math.min(1, (t - holdStart) / opts.holdMs);
      if (progress >= 1) {
        fired = true;
        return result({ release, enter: true, progress: 1 });
      }
      return result({ release, progress });
    }

    // pose === "open"
    holdStart = null;
    fired = false;
    /* Mano recién aparecida o recién abierta: rebasear sin salto. Lo mismo
       mientras un puño espera confirmarse: cerrar la mano no debe scrollear,
       ni siquiera lo que el suavizado todavía venía arrastrando. */
    if (smoothPos == null || candidate === "fist") {
      smoothPos = pos;
      return result();
    }
    const next = smoothPos + (pos - smoothPos) * opts.smoothing;
    const step = smoothPos - next; // subir (y menor) da positivo: avanzar
    smoothPos = next;
    if (Math.abs(step) < opts.deadzone) return result();
    return result({ delta: step });
  }

  return { update, reset, setAxis, get pose() { return pose; } };
}
