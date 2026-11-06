import { useCallback, useEffect, useRef, useState } from "react";
import { createHandTracker } from "../gestures/handGestures.js";

/* Control del carrusel con las manos (MediaPipe).

   Mano abierta: subir o bajar la mano scrollea (en vista horizontal, mover a
   los costados). Puño sostenido: entra al proyecto activo.

   Igual que el carrusel, el trabajo por frame no pasa por React: el estado de
   la mano (pose, progreso del puño) se escribe como data-attributes y una
   variable CSS sobre el nodo del HUD, y los landmarks se dibujan directo en el
   canvas. React sólo se entera cuando cambia el estado de la cámara.

   status: "off" | "loading" | "ready" | "denied" | "error" */

const HAND_LINKS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];

function drawHand(canvas, landmarks, pose) {
  const ctx = canvas.getContext("2d");
  const { width: w, height: h } = canvas;
  ctx.clearRect(0, 0, w, h);
  if (!landmarks) return;
  ctx.lineWidth = 2;
  ctx.strokeStyle = pose === "fist" ? "#ff3b1f" : "#ffffff";
  ctx.fillStyle = ctx.strokeStyle;
  ctx.beginPath();
  for (const [a, b] of HAND_LINKS) {
    ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h);
    ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h);
  }
  ctx.stroke();
  for (const p of landmarks) {
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function useHandControl({ enabled, axis = "y", onScroll, onRelease, onEnter }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const hudRef = useRef(null);
  const [status, setStatus] = useState("off");

  const tracker = useRef(null);
  if (!tracker.current) tracker.current = createHandTracker({ axis });

  // Callbacks en refs: el bucle de video no se reinicia si cambian
  const handlers = useRef({ onScroll, onRelease, onEnter });
  handlers.current = { onScroll, onRelease, onEnter };

  useEffect(() => {
    tracker.current.setAxis(axis);
  }, [axis]);

  /* Un frame del tracker → acciones + HUD. Lo usa el bucle de cámara y, en
     desarrollo, el simulador (window.__handControl.feed). */
  const process = useCallback((frame, t) => {
    const r = tracker.current.update(frame, t);
    const h = handlers.current;
    if (r.delta) h.onScroll?.(r.delta);
    if (r.release) h.onRelease?.();
    if (r.enter) h.onEnter?.();

    const hud = hudRef.current;
    if (hud) {
      if (hud.dataset.pose !== r.pose) hud.dataset.pose = r.pose;
      hud.style.setProperty("--fist", r.progress.toFixed(3));
    }
    const canvas = canvasRef.current;
    if (canvas) drawHand(canvas, frame?.landmarks ?? null, r.pose);
    return r;
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStatus("off");
      return undefined;
    }

    let cancelled = false;
    let stream = null;
    let raf = null;
    let lastVideoTime = -1;
    let recognizer = null;
    let toFrame = null;

    const stopStream = () => {
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const video = videoRef.current;
      if (!video || video.readyState < 2 || document.hidden) return;
      // Sólo frames nuevos: el rAF corre más rápido que la cámara
      if (video.currentTime === lastVideoTime) return;
      lastVideoTime = video.currentTime;
      const now = performance.now();
      let result;
      try {
        result = recognizer.recognizeForVideo(video, now);
      } catch (err) {
        console.error("[hands] recognize failed", err);
        return;
      }
      process(toFrame(result), now);
    };

    (async () => {
      setStatus("loading");
      try {
        const [mod, media] = await Promise.all([
          import("../gestures/recognizer.js"),
          navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
            audio: false,
          }),
        ]);
        stream = media;
        /* Si se apagó mientras cargaba, el cleanup ya corrió y no vio este
           stream: hay que soltarlo acá o la cámara queda prendida. */
        if (cancelled) return stopStream();
        toFrame = mod.toFrame;
        recognizer = await mod.loadRecognizer();
        if (cancelled) return stopStream();

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }
        tracker.current.reset();
        setStatus("ready");
        loop();
      } catch (err) {
        stopStream();
        if (cancelled) return;
        const denied = err?.name === "NotAllowedError" || err?.name === "SecurityError";
        console.error("[hands] could not start", err);
        setStatus(denied ? "denied" : "error");
      }
    })();

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      // Soltar la cámara: si no, la luz queda prendida al salir de la home
      stopStream();
      const video = videoRef.current;
      if (video) video.srcObject = null;
      // Si la mano estaba scrolleando, que el carrusel haga snap
      const r = tracker.current.update(null, performance.now());
      if (r.release) handlers.current.onRelease?.();
    };
  }, [enabled, process]);

  // Simulador para desarrollo y verificación: inyecta frames sin cámara.
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    window.__handControl = { feed: (frame, t = performance.now()) => process(frame, t) };
    return () => {
      delete window.__handControl;
    };
  }, [process]);

  return { status, videoRef, canvasRef, hudRef };
}
