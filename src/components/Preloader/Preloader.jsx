import { useEffect, useRef, useState } from "react";
import { BracketMark } from "../Marks.jsx";
import styles from "./Preloader.module.css";

/* Intro de entrada. Una sola vez por sesión, igual que el sitio original.

   `?intro=1` la fuerza aunque ya se haya visto, para poder revisarla sin
   limpiar sessionStorage a mano. */

const SEEN_KEY = "obys-visited";

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

    let ctx;
    let fallback;

    // GSAP sólo se carga si la intro realmente va a correr: en navegación
    // interna o con motion reducido no hace falta bajarlo.
    if (seen || reduced) {
      setCount(100);
      fallback = setTimeout(finish, 380);
      return () => clearTimeout(fallback);
    }

    let cancelled = false;

    import("gsap").then(({ gsap }) => {
      if (cancelled) return;

      ctx = gsap.context(() => {
        const counter = { v: 0 };
        const openX = () =>
          (markRef.current?.getBoundingClientRect().width || 200) * 0.44;

        const tl = gsap.timeline({ onComplete: finish });

        // 1. El contador corre mientras la marca está cerrada.
        tl.to(
          counter,
          {
            v: 100,
            duration: 2.2,
            ease: "power1.inOut",
            onUpdate: () => setCount(Math.round(counter.v)),
          },
          0
        );

        // 2. Entra en escala y pasa de contorno a sólido.
        tl.fromTo(
          markRef.current,
          { scale: 0.3 },
          { scale: 0.42, duration: 1.4, ease: "power2.out" },
          0
        );
        tl.to(
          rootRef.current.querySelectorAll("path"),
          { fillOpacity: 1, strokeOpacity: 0, duration: 0.9, ease: "power2.inOut" },
          0.9
        );

        // 3. Fondo negro→blanco y la marca invierte a negro.
        tl.to(rootRef.current, { backgroundColor: "#ffffff", duration: 0.7, ease: "power2.inOut" }, 2.0);
        tl.to(markRef.current, { color: "#000000", duration: 0.7, ease: "power2.inOut" }, 2.0);
        tl.to(countRef.current, { opacity: 0, duration: 0.4, ease: "power2.out" }, 2.0);

        // 4. Las mitades se abren: la marca se vuelve el "( )" de la home.
        tl.to(leftRef.current, { x: -openX(), duration: 1.1, ease: "expo.inOut" }, 2.35);
        tl.to(rightRef.current, { x: openX(), duration: 1.1, ease: "expo.inOut" }, 2.35);
        tl.to(markRef.current, { scale: 1, duration: 1.1, ease: "expo.inOut" }, 2.35);

        // 5. El overlay se desvanece dejando el "( )" real de la home debajo.
        tl.to(rootRef.current, { opacity: 0, duration: 0.5, ease: "power2.out" }, 3.15);
      }, rootRef);
    });

    return () => {
      cancelled = true;
      clearTimeout(fallback);
      ctx?.revert();
    };
  }, []);

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={styles.mark} ref={markRef}>
        <BracketMark leftRef={leftRef} rightRef={rightRef} />
      </div>
      <div className={styles.count} ref={countRef}>
        {count}
      </div>
    </div>
  );
}
