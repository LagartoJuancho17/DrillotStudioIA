import { useEffect, useRef, useState } from "react";

/* Marca un elemento como visible la primera vez que entra en viewport, para
   animaciones de aparición.

   Devuelve `revealed` en true de entrada si no hay IntersectionObserver, así
   el contenido nunca queda atrapado en opacity 0 cuando el observer no existe. */

const SUPPORTED =
  typeof window !== "undefined" && "IntersectionObserver" in window;

export function useReveal({ threshold = 0.08, rootMargin = "0px 0px -8% 0px" } = {}) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(!SUPPORTED);

  useEffect(() => {
    if (!SUPPORTED || revealed) return undefined;
    const el = ref.current;
    if (!el) return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setRevealed(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [revealed, threshold, rootMargin]);

  return [ref, revealed];
}
