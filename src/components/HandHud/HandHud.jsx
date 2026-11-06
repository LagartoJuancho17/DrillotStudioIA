import styles from "./HandHud.module.css";

/* Vista de la cámara con la mano dibujada encima y el estado del gesto.

   La pose y el progreso del puño no llegan por props: useHandControl los
   escribe directo sobre `hudRef` (data-pose y --fist) en cada frame, para no
   re-renderizar React 30 veces por segundo. Acá sólo hay CSS que reacciona. */

const MESSAGE = {
  loading: "Starting camera…",
  denied: "Camera blocked. Allow it in the browser to use your hands.",
  error: "Could not start hand tracking.",
};

export function HandHud({ status, videoRef, canvasRef, hudRef }) {
  return (
    <div className={styles.root} ref={hudRef} data-status={status} data-pose="none" aria-live="polite">
      <div className={styles.frame}>
        <video ref={videoRef} className={styles.video} muted playsInline aria-hidden="true" />
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
        <div className={styles.ring} aria-hidden="true" />
      </div>
      <p className={styles.caption}>
        {MESSAGE[status] ?? (
          <>
            <span className={styles.hintOpen}>Open hand: scroll</span>
            <span className={styles.hintFist}>Hold fist: open project</span>
            <span className={styles.hintNone}>Show your hand</span>
          </>
        )}
      </p>
    </div>
  );
}
