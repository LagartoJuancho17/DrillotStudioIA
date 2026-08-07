import { useCallback, useEffect, useRef, useState } from "react";

/* Carrusel infinito con scroll interceptado.

   Replica la mecánica del sitio original: la página no scrollea, la rueda
   alimenta una posición virtual y la tira se desplaza con el proyecto activo
   siempre centrado.

   El bucle se arma con TRES copias de la lista navegando la del medio, así
   siempre hay contenido real arriba y abajo del centro y al envolver la
   posición el salto es invisible porque la copia vecina ya está dibujada en
   el mismo lugar.

   Rendimiento: la posición vive en refs y se escribe directamente sobre el
   nodo con `style.transform` dentro del rAF. Nada de esto pasa por React, que
   sólo se entera cuando cambia el proyecto activo. Un `useState` por frame
   dispararía ~60 renders por segundo de toda la página.

   El rAF además se detiene solo cuando la posición se asienta y vuelve a
   arrancar con el próximo input, para no quemar batería en reposo. */

const SETS = 3;
const MID = 1;
const LERP = 0.12;
const WHEEL_SPEED = 0.85;
const TOUCH_SPEED = 1.2;
const SNAP_DELAY = 200;

const mod = (n, m) => ((n % m) + m) % m;

export function useCarousel({ count, horizontal = false, enabled = true }) {
  const stripRef = useRef(null);
  const listRef = useRef(null);

  const target = useRef(0);
  const current = useRef(0);
  const centers = useRef([]);
  const setSize = useRef(0);
  const nameSize = useRef(0);
  const rafId = useRef(null);
  const settleTimer = useRef(null);
  const touchLast = useRef(null);
  const touchLastTime = useRef(null);
  const touchVelocity = useRef(0);
  const activeRef = useRef(0);

  const [activeIndex, setActiveIndex] = useState(0);

  /* ---------- medición ---------- */

  const measure = useCallback(() => {
    const strip = stripRef.current;
    if (!strip || !count) return;

    const kids = Array.from(strip.children).slice(0, count);
    if (!kids.length) return;

    const styles = getComputedStyle(strip);
    const gap = parseFloat(horizontal ? styles.columnGap : styles.rowGap) || 0;

    const next = [];
    let acc = 0;
    kids.forEach((el) => {
      const size = horizontal ? el.offsetWidth : el.offsetHeight;
      next.push(acc + size / 2);
      acc += size + gap;
    });

    centers.current = next;
    setSize.current = acc; // incluye el gap final, el que separa copia N de N+1

    const list = listRef.current;
    if (list && list.children.length) {
      nameSize.current = list.children[0].offsetHeight;
    }
  }, [count, horizontal]);

  /* ---------- posición → índice ---------- */

  /* Índice fraccionario continuo: permite que la lista de nombres, de altura
     uniforme, siga el movimiento de la tira, que tiene alturas variables. */
  const fractionalIndex = useCallback(
    (pos) => {
      const list = centers.current;
      const n = list.length;
      const total = setSize.current;
      if (!n || !total) return 0;

      const q = mod(pos, total);
      for (let i = 0; i < n; i++) {
        const a = list[i];
        const b = i + 1 < n ? list[i + 1] : list[0] + total;
        if (q >= a && q < b) return i + (q - a) / (b - a);
      }
      // q cae antes del primer centro: el tramo viene del último de la copia previa
      const last = list[n - 1] - total;
      return mod(n - 1 + (q - last) / (list[0] - last), n);
    },
    []
  );

  const render = useCallback(() => {
    const strip = stripRef.current;
    const total = setSize.current;
    if (!strip || !total) return;

    const p = mod(current.current, total);
    const offset = p + MID * total;

    strip.style.transform = horizontal
      ? `translateY(-50%) translateX(${-offset}px)`
      : `translateX(-50%) translateY(${-offset}px)`;

    const frac = fractionalIndex(current.current);

    const list = listRef.current;
    if (list && nameSize.current) {
      const nh = nameSize.current;
      const nameOffset = frac * nh + nh / 2 + MID * count * nh;
      list.style.transform = `translateY(${-nameOffset}px)`;
    }

    const idx = Math.round(frac) % count;
    if (idx !== activeRef.current) {
      activeRef.current = idx;
      setActiveIndex(idx); // único punto donde React se entera
    }
  }, [count, horizontal, fractionalIndex]);

  /* ---------- bucle ---------- */

  const stop = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const diff = target.current - current.current;
    if (Math.abs(diff) < 0.05) {
      current.current = target.current;
      render();
      rafId.current = null; // asentado: el bucle se apaga hasta el próximo input
      return;
    }
    current.current += diff * LERP;
    render();
    rafId.current = requestAnimationFrame(tick);
  }, [render]);

  const start = useCallback(() => {
    if (rafId.current == null) rafId.current = requestAnimationFrame(tick);
  }, [tick]);

  /* ---------- snap ---------- */

  /* Distancia con signo al centro más cercano. Cada centro se evalúa también
     desplazado ±una vuelta porque el carrusel es circular: cerca del final, el
     más cercano puede ser el primero de la copia siguiente. */
  const nearestDelta = useCallback((pos) => {
    const list = centers.current;
    const total = setSize.current;
    if (!list.length || !total) return 0;

    const q = mod(pos, total);
    let best = 0;
    let bestAbs = Infinity;
    for (let i = 0; i < list.length; i++) {
      for (let k = -1; k <= 1; k++) {
        const d = list[i] + k * total - q;
        const abs = Math.abs(d);
        if (abs < bestAbs) {
          bestAbs = abs;
          best = d;
        }
      }
    }
    return best;
  }, []);

  const cancelSnap = useCallback(() => {
    if (settleTimer.current) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
  }, []);

  /* Se mide sobre `target` y no sobre `current`: current viene interpolando
     hacia target, así que medir ahí elegiría un proyecto ya superado y el
     ajuste se sentiría como un tirón hacia atrás. */
  const scheduleSnap = useCallback(() => {
    cancelSnap();
    settleTimer.current = setTimeout(() => {
      target.current += nearestDelta(target.current);
      start();
    }, SNAP_DELAY);
  }, [cancelSnap, nearestDelta, start]);

  /* ---------- navegación directa ---------- */

  const goTo = useCallback(
    (i) => {
      cancelSnap();
      const list = centers.current;
      const total = setSize.current;
      if (!list.length || !total) return;

      const from = fractionalIndex(current.current);
      // camino más corto en un anillo de `count` posiciones
      const ring = mod(i - from + count / 2, count) - count / 2;

      let d = list[i] - mod(current.current, total);
      if (ring > 0 && d < 0) d += total;
      if (ring < 0 && d > 0) d -= total;

      target.current = current.current + d;
      start();
    },
    [cancelSnap, count, fractionalIndex, start]
  );

  /* ---------- entrada del usuario ---------- */

  useEffect(() => {
    if (!enabled) return undefined;

    const onWheel = (e) => {
      e.preventDefault();
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 32;
      else if (e.deltaMode === 2) delta *= 800;

      target.current += delta * WHEEL_SPEED;
      scheduleSnap();
      start();
    };

    const axis = (touch) => (horizontal ? touch.clientX : touch.clientY);

    const onTouchStart = (e) => {
      cancelSnap();
      touchLast.current = axis(e.touches[0]);
      touchLastTime.current = performance.now();
      touchVelocity.current = 0;
    };

    const onTouchMove = (e) => {
      if (touchLast.current == null) return;
      const now = axis(e.touches[0]);
      const nowTime = performance.now();
      const dt = Math.max(16, nowTime - (touchLastTime.current || nowTime));
      const dist = touchLast.current - now;

      target.current += dist * TOUCH_SPEED;
      touchVelocity.current = dist / dt;
      touchLast.current = now;
      touchLastTime.current = nowTime;
      start();
    };

    const onTouchEnd = () => {
      if (touchLast.current == null) return;
      touchLast.current = null;
      if (Math.abs(touchVelocity.current) > 0.08) {
        target.current += touchVelocity.current * 180;
      }
      scheduleSnap();
      start();
    };

    const onKey = (e) => {
      const forward = ["ArrowDown", "ArrowRight", "PageDown"];
      const back = ["ArrowUp", "ArrowLeft", "PageUp"];
      if (forward.includes(e.key)) {
        e.preventDefault();
        goTo(mod(activeRef.current + 1, count));
      } else if (back.includes(e.key)) {
        e.preventDefault();
        goTo(mod(activeRef.current - 1, count));
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [enabled, horizontal, count, scheduleSnap, cancelSnap, start, goTo]);

  /* ---------- medición inicial y recálculos ---------- */

  useEffect(() => {
    if (!count) return undefined;

    const settleTo = (index) => {
      measure();
      const c = centers.current;
      if (!c.length || setSize.current <= 0) return;
      current.current = c[index] ?? c[0];
      target.current = current.current;
      render();
    };

    // Medición tras el pase de reflow del navegador al cambiar de orientación
    const rafInit = requestAnimationFrame(() => {
      settleTo(activeRef.current);
    });

    /* La webfont cambia las métricas de la lista y el resize cambia todo:
       en ambos casos hay que volver a medir conservando el activo. */
    let cancelled = false;
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) settleTo(activeRef.current);
      });
    }

    let resizeRaf = null;
    const onResize = () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => settleTo(activeRef.current));
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafInit);
      window.removeEventListener("resize", onResize);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
    };
  }, [count, horizontal, measure, render]);

  useEffect(() => () => {
    stop();
    cancelSnap();
  }, [stop, cancelSnap]);

  return { stripRef, listRef, activeIndex, goTo };
}
