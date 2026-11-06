/* Carga del GestureRecognizer de MediaPipe.

   GestureRecognizer y no HandLandmarker: devuelve los mismos 21 landmarks y
   además clasifica la pose ("Closed_Fist", "Open_Palm", ...) con un modelo
   entrenado, que es más confiable que la geometría sola para detectar el puño.

   - El runtime WASM sale de node_modules vía `?url`: Vite lo copia al build y
     funciona sin internet. Sólo se importa la variante SIMD (todos los
     navegadores actuales la soportan); las otras dos no entran al build.
   - El modelo (~8MB) no va a git. Si existe public/models/gesture_recognizer.task
     (lo baja `npm run hands:model`) se usa ese, para presentar offline. Si
     no, se pide al bucket oficial de Google.
   - Todo esto es un import dinámico: el resto del sitio no paga MediaPipe
     hasta que alguien activa las manos. */

import wasmLoaderPath from "@mediapipe/tasks-vision/vision_wasm_internal.js?url";
import wasmBinaryPath from "@mediapipe/tasks-vision/vision_wasm_internal.wasm?url";

export const LOCAL_MODEL = "/models/gesture_recognizer.task";
export const REMOTE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";

/* El dev server y la mayoría de los hostings responden index.html con 200
   para cualquier ruta que no existe (fallback de SPA), así que `ok` solo no
   alcanza: hay que mirar que no sea HTML. */
async function resolveModel() {
  try {
    const res = await fetch(LOCAL_MODEL, { method: "HEAD" });
    const type = res.headers.get("content-type") || "";
    if (res.ok && !type.includes("text/html")) return LOCAL_MODEL;
  } catch {
    /* sin modelo local */
  }
  return REMOTE_MODEL;
}

let pending = null;

export function loadRecognizer() {
  if (pending) return pending;
  pending = (async () => {
    const { GestureRecognizer } = await import("@mediapipe/tasks-vision");
    const fileset = { wasmLoaderPath, wasmBinaryPath };
    const modelAssetPath = await resolveModel();
    const make = (delegate) =>
      GestureRecognizer.createFromOptions(fileset, {
        baseOptions: { modelAssetPath, delegate },
        runningMode: "VIDEO",
        numHands: 1,
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });
    let recognizer;
    let delegate = "GPU";
    try {
      recognizer = await make("GPU");
    } catch (err) {
      console.warn("[hands] GPU delegate failed, falling back to CPU", err);
      delegate = "CPU";
      recognizer = await make("CPU");
    }
    console.info(`[hands] recognizer ready (${delegate}, model: ${modelAssetPath === LOCAL_MODEL ? "local" : "remote"})`);
    return recognizer;
  })();
  // Si falló, permitir reintentar en vez de quedar con la promesa rota
  pending.catch(() => {
    pending = null;
  });
  return pending;
}

/* Resultado de MediaPipe → frame del tracker (o null si no hay mano). */
export function toFrame(result) {
  const landmarks = result?.landmarks?.[0];
  if (!landmarks || landmarks.length < 21) return null;
  const top = result.gestures?.[0]?.[0];
  return {
    landmarks,
    gesture: top ? { name: top.categoryName, score: top.score } : undefined,
  };
}
