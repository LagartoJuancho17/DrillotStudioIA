import { useLayoutEffect } from "react";
import { EASE_OUT, gsap, prefersReducedMotion } from "../transitions/eases.js";
import { isLanding, landProject } from "../transitions/projectTransition.js";

/* Entrada de la página de un proyecto.

   - Las palabras del título ([data-split-word]) suben desde su máscara, una
     detrás de otra.
   - Lo marcado con [data-reveal] aparece con un fundido corto hacia arriba.
   - Si se llegó desde el carrusel, la imagen que viene viajando aterriza sobre
     `coverRef` y todo lo anterior arranca cuando empieza a bajar, así título
     y portada llegan juntos.

   Corre en useLayoutEffect: el estado inicial (palabras abajo, metadatos
   transparentes) se aplica antes del primer paint, sin parpadeo.

   Con reduced motion no se mueve nada: el contenido está visible desde el
   primer frame y la imagen no viaja (openProject ya navegó directo). */

const WORD_STAGGER = 0.06;
const WORD_DURATION = 1.1;

export function useProjectEntrance(rootRef, coverRef, key) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return undefined;

    const words = root.querySelectorAll("[data-split-word]");
    const fades = Array.from(root.querySelectorAll("[data-reveal]"));
    // Opacidad final de cada uno: la que define su CSS (meta está en 0.45)
    const finals = fades.map((el) => getComputedStyle(el).opacity);

    gsap.set(words, { yPercent: 115 });
    gsap.set(fades, { opacity: 0, y: 14 });

    let tl = null;
    const play = (delay) => {
      tl?.kill();
      tl = gsap.timeline({ delay });
      tl.to(words, {
        yPercent: 0,
        duration: WORD_DURATION,
        ease: EASE_OUT,
        stagger: WORD_STAGGER,
      }, 0);
      fades.forEach((el, i) => {
        tl.to(el, {
          opacity: finals[i],
          y: 0,
          duration: 0.8,
          ease: EASE_OUT,
          clearProps: "opacity,transform",
        }, 0.15 + i * 0.06);
      });
    };

    let stopLanding = null;
    if (isLanding() && coverRef?.current) {
      // La imagen tarda ~1.1s en bajar: el título arranca un poco después de
      // que empieza, cuando la imagen ya dejó libre la parte de arriba.
      stopLanding = landProject(coverRef.current, { onStart: () => play(0.25) });
    } else {
      play(0.05);
    }

    return () => {
      tl?.kill();
      stopLanding?.();
      gsap.set(words, { clearProps: "transform" });
      gsap.set(fades, { clearProps: "opacity,transform" });
    };
  }, [rootRef, coverRef, key]);
}
