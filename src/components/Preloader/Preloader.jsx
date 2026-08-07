import { useEffect, useRef, useState } from "react";
import { BracketMark } from "../Marks.jsx";
import { homeItems } from "../../data/homeItems.js";
import styles from "./Preloader.module.css";

/* Intro de entrada con preloader asíncrono real.
   Carga de 0% a 100% todas las imágenes y videos de la home.
   `?intro=1` la fuerza aunque ya se haya visto. */

const SEEN_KEY = "obys-visited";

function preloadImage(url) {
  return new Promise((resolve) => {
    if (!url) return resolve();
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
    if (img.complete) resolve();
  });
}

function preloadVideo(url) {
  return new Promise((resolve) => {
    if (!url) return resolve();
    fetch(url)
      .then((res) => (res.ok ? res.blob() : null))
      .then(() => resolve())
      .catch(() => resolve());
  });
}

function preloadAsset(url) {
  if (typeof url === "string" && url.toLowerCase().endsWith(".mp4")) {
    return preloadVideo(url);
  }
  return preloadImage(url);
}

export function Preloader({ onDone }) {
  const rootRef = useRef(null);
  const markRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const countRef = useRef(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  const [count, setCount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const force = params.has("intro");
    const seen = !force && sessionStorage.getItem(SEEN_KEY);
    const reduced =
      !force && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const finish = () => {
      sessionStorage.setItem(SEEN_KEY, "1");
      doneRef.current?.();
    };

    if (seen || reduced) {
      setCount(100);
      const fallback = setTimeout(finish, 380);
      return () => clearTimeout(fallback);
    }

    let cancelled = false;
    let safetyTimeout = null;
    let ctx = null;

    import("gsap").then(({ gsap }) => {
      if (cancelled) return;

      // Lista única de assets (imágenes + videos) que usa la home
      const assetUrls = Array.from(
        new Set(
          homeItems
            .flatMap((item) => [item.img, item.video])
            .filter((url) => typeof url === "string" && url.trim().length > 0)
        )
      );

      const total = assetUrls.length || 1;
      let loadedCount = 0;
      const counter = { v: 0 };
      let exitStarted = false;

      ctx = gsap.context(() => {
        const openX = () =>
          (markRef.current?.getBoundingClientRect().width || 200) * 0.28;

        // 1. Animación inicial de entrada del isotipo
        gsap.fromTo(
          markRef.current,
          { scale: 0.3 },
          { scale: 0.42, duration: 1.0, ease: "power2.out" }
        );
        gsap.to(rootRef.current.querySelectorAll("path"), {
          fillOpacity: 1,
          strokeOpacity: 0,
          duration: 0.8,
          ease: "power2.inOut",
          delay: 0.2,
        });

        const startExitAnimation = () => {
          if (exitStarted) return;
          exitStarted = true;

          const tl = gsap.timeline({ onComplete: finish });

          // Fondo negro → blanco, marca a negro, contador desvanece
          tl.to(rootRef.current, { backgroundColor: "#ffffff", duration: 0.7, ease: "power2.inOut" }, 0);
          tl.to(markRef.current, { color: "#000000", duration: 0.7, ease: "power2.inOut" }, 0);
          tl.to(countRef.current, { opacity: 0, duration: 0.4, ease: "power2.out" }, 0);

          // Las mitades se abren en paréntesis "( )"
          tl.to(leftRef.current, { x: -openX(), duration: 1.1, ease: "expo.inOut" }, 0.35);
          tl.to(rightRef.current, { x: openX(), duration: 1.1, ease: "expo.inOut" }, 0.35);
          tl.to(markRef.current, { scale: 1, duration: 1.1, ease: "expo.inOut" }, 0.35);

          // Overlay desvanece
          tl.to(rootRef.current, { opacity: 0, duration: 0.5, ease: "power2.out" }, 1.15);
        };

        const updateProgress = () => {
          const targetPercent = Math.min(100, Math.round((loadedCount / total) * 100));

          gsap.to(counter, {
            v: targetPercent,
            duration: 0.5,
            ease: "power1.out",
            onUpdate: () => {
              const currentVal = Math.round(counter.v);
              setCount(currentVal);
              if (currentVal >= 100) {
                startExitAnimation();
              }
            },
          });
        };

        // Timeout de seguridad (8s) por si la red falla
        safetyTimeout = setTimeout(() => {
          loadedCount = total;
          updateProgress();
        }, 8000);

        // Pre-carga asíncrona real de cada recurso
        assetUrls.forEach((url) => {
          preloadAsset(url).then(() => {
            if (cancelled) return;
            loadedCount++;
            updateProgress();
          });
        });
      }, rootRef);
    });

    return () => {
      cancelled = true;
      if (safetyTimeout) clearTimeout(safetyTimeout);
      ctx?.revert();
    };
  }, []);

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={styles.mark} ref={markRef}>
        <BracketMark leftRef={leftRef} rightRef={rightRef} />
      </div>
      <div className={styles.count} ref={countRef}>
        {count}%
      </div>
    </div>
  );
}
