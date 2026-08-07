import { memo, useCallback, useEffect, useRef, useState } from "react";
import styles from "./HoverMedia.module.css";

/* Imagen que, si tiene video, lo reproduce al pasar el mouse.

   El video no se descarga hasta que hace falta: el `src` se monta recién en la
   primera interacción. `preload="none"` solo no alcanza, varios navegadores
   piden igual los metadatos, y con una grilla de piezas eso serían muchas
   descargas para algo que quizá nunca se mire.

   Aparece cuando de verdad arrancó (evento `playing`) y no cuando se pidió
   reproducir, para que no se vea el salto negro mientras busca el primer
   fotograma.

   En touch no hay hover: ahí se reproduce mientras la pieza esté bien visible
   en pantalla y se pausa al salir. */

function HoverMediaBase({
  src,
  video,
  alt = "",
  width,
  height,
  loading = "lazy",
  className = "",
  badgeLabel = "Hover to play",
}) {
  const videoRef = useRef(null);
  const rootRef = useRef(null);

  const [armed, setArmed] = useState(false); // ya se puede montar el src
  const [playing, setPlaying] = useState(false);

  const play = useCallback(() => {
    if (!video) return;
    setArmed(true);
    const el = videoRef.current;
    // En la primera vez el elemento todavía no tiene src: el efecto de abajo
    // se encarga de arrancarlo cuando aparezca.
    if (el?.src) el.play().catch(() => {});
  }, [video]);

  const stop = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setPlaying(false);
  }, []);

  // Arranca en cuanto el src queda montado tras la primera interacción.
  useEffect(() => {
    if (!armed) return;
    const el = videoRef.current;
    if (el && el.paused) el.play().catch(() => {});
  }, [armed]);

  /* Touch: reproducir mientras esté a la vista. */
  useEffect(() => {
    if (!video) return undefined;
    if (typeof window === "undefined") return undefined;
    if (window.matchMedia("(hover: hover)").matches) return undefined;
    if (!("IntersectionObserver" in window)) return undefined;

    const el = rootRef.current;
    if (!el) return undefined;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) play();
        else stop();
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [video, play, stop]);

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${className}`}
      onMouseEnter={play}
      onMouseLeave={stop}
    >
      <img
        src={src}
        alt={alt}
        width={width || undefined}
        height={height || undefined}
        loading={loading}
        decoding="async"
      />

      {video && (
        <>
          <video
            ref={videoRef}
            className={`${styles.video} ${playing ? styles.videoPlaying : ""}`}
            src={armed ? video : undefined}
            muted
            loop
            playsInline
            preload="none"
            tabIndex={-1}
            aria-hidden="true"
            onPlaying={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />

          <span
            className={`${styles.badge} ${playing ? styles.badgeHidden : ""}`}
          >
            <span className={styles.dot} />
            {badgeLabel}
          </span>
        </>
      )}
    </div>
  );
}

export const HoverMedia = memo(HoverMediaBase);
