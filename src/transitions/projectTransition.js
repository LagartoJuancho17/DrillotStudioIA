import { EASE_IN_OUT, EASE_OUT, gsap, prefersReducedMotion } from "./eases.js";
import { fromDOMRect, lerp, lerpRect, viewportRect, frameStyle } from "./geometry.js";

/* Transición de apertura de proyecto: la imagen del carrusel se convierte en
   la portada del proyecto.

   Dos tiempos, con la navegación en el medio:

   1. openProject (en la home): una copia de la imagen sale de la diapositiva y
      crece hasta llenar la pantalla, con un leve zoom de cámara, mientras el
      resto de la home se va. Cuando tapa todo, se navega.
   2. landProject (en la página del proyecto): la página ya está montada
      debajo; la imagen baja de pantalla completa a la posición exacta de la
      portada, deshace el zoom y se retira. La portada real queda en su lugar
      sin salto porque es la misma imagen en la misma caja.

   La capa vive fuera de React (un nodo en <body>): sobrevive al cambio de
   ruta, que desmonta la home entera, y su animación por frame no dispara
   renders. Ver geometry.js para cómo se calcula cada frame. */

const LEAVE_DURATION = 1.05;
const LAND_DURATION = 1.15;
const PEAK_ZOOM = 1.12; // zoom de la imagen a pantalla completa
const SAFETY_MS = 2500; // si nadie aterriza la imagen, se retira sola

let flight = null;

/* ¿Hay una imagen esperando aterrizar? La página del proyecto lo usa para
   sincronizar su entrada con la llegada de la imagen. */
export const isLanding = () => flight?.status === "waiting";

function buildLayer(src, aspect) {
  const vw = window.innerWidth;
  const baseW = vw; // a pantalla completa la escala queda ~1: imagen nítida

  const overlay = document.createElement("div");
  overlay.setAttribute("aria-hidden", "true");
  overlay.dataset.projectTransition = "";
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "300",
    pointerEvents: "auto",
    cursor: "progress",
  });

  const frame = document.createElement("div");
  Object.assign(frame.style, {
    position: "absolute",
    inset: "0",
    overflow: "hidden",
    willChange: "clip-path",
  });

  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  img.decoding = "sync";
  Object.assign(img.style, {
    position: "absolute",
    left: "0",
    top: "0",
    width: `${baseW}px`,
    height: `${baseW / aspect}px`,
    maxWidth: "none",
    transformOrigin: "0 0",
    willChange: "transform",
  });

  frame.appendChild(img);
  overlay.appendChild(frame);

  /* Mientras viaja la imagen no se scrollea nada: ni el carrusel que queda
     debajo ni la página nueva, cuya portada es el destino. */
  const block = (e) => e.preventDefault();
  overlay.addEventListener("wheel", block, { passive: false });
  overlay.addEventListener("touchmove", block, { passive: false });

  document.body.appendChild(overlay);
  return { overlay, frame, img, baseW };
}

function render(f, rect, zoom) {
  const { clipPath, transform } = frameStyle(rect, {
    vw: window.innerWidth,
    vh: window.innerHeight,
    aspect: f.aspect,
    baseW: f.baseW,
    zoom,
  });
  f.frame.style.clipPath = clipPath;
  f.img.style.transform = transform;
}

function dispose(f) {
  if (!f) return;
  f.tl?.kill();
  clearTimeout(f.safety);
  f.overlay.remove();
  if (f.target) f.target.style.visibility = "";
  if (flight === f) flight = null;
}

/* Retiro de emergencia: la página no tenía portada o tardó demasiado. */
function abort(f) {
  if (flight !== f) return;
  f.tl?.kill();
  f.tl = gsap.to(f.overlay, {
    opacity: 0,
    duration: 0.45,
    ease: EASE_OUT,
    onComplete: () => dispose(f),
  });
}

/* Abre un proyecto desde una diapositiva.

   sourceEl  el elemento de la diapositiva (su caja es el punto de partida)
   imgEl     la imagen dentro de la diapositiva (src y proporción)
   navigate  función que cambia de ruta (react-router)
   leave     opcional: (timeline) => agrega la salida del resto de la página

   Devuelve false si ya hay una transición en vuelo: un segundo click o un
   segundo puño no arrancan otra encima. */
export function openProject({ sourceEl, imgEl, to, navigate, leave }) {
  if (flight) return false;

  const src = imgEl?.currentSrc || imgEl?.src;
  if (prefersReducedMotion() || !sourceEl || !src) {
    navigate(to);
    return true;
  }

  const from = fromDOMRect(sourceEl.getBoundingClientRect());
  const natural = imgEl.naturalWidth && imgEl.naturalHeight ? imgEl.naturalWidth / imgEl.naturalHeight : 0;
  const aspect = natural || from.w / from.h;

  const f = { ...buildLayer(src, aspect), aspect, status: "leaving", tl: null, safety: null, target: null };
  flight = f;

  const vp = viewportRect(window.innerWidth, window.innerHeight);
  const p = { t: 0 };
  render(f, from, 1);

  f.tl = gsap.timeline();
  f.tl.to(p, {
    t: 1,
    duration: LEAVE_DURATION,
    ease: EASE_IN_OUT,
    onUpdate: () => render(f, lerpRect(from, vp, p.t), lerp(1, PEAK_ZOOM, p.t)),
  }, 0);
  leave?.(f.tl);
  f.tl.call(() => {
    f.status = "waiting";
    f.safety = setTimeout(() => abort(f), SAFETY_MS);
    navigate(to);
  });
  return true;
}

/* Aterriza la imagen sobre la portada del proyecto. La llama la página del
   proyecto al montarse, con el elemento de la portada.

   onStart se llama cuando la imagen empieza a bajar: ahí arranca la entrada
   del resto de la página, para que título y portada lleguen juntos.

   Devuelve una función de limpieza (por si se sale de la página a mitad). */
export function landProject(targetEl, { onStart } = {}) {
  const f = flight;
  if (!f || f.status !== "waiting" || !targetEl) return () => {};

  clearTimeout(f.safety);
  f.status = "landing";
  f.target = targetEl;
  targetEl.style.visibility = "hidden";

  let raf = requestAnimationFrame(() => {
    raf = null;
    window.scrollTo(0, 0);
    const to = fromDOMRect(targetEl.getBoundingClientRect());
    if (!to.w || !to.h) {
      abort(f);
      return;
    }
    const vp = viewportRect(window.innerWidth, window.innerHeight);
    const p = { t: 0 };

    f.tl?.kill();
    f.tl = gsap.timeline({ onComplete: () => dispose(f) });
    f.tl.to(p, {
      t: 1,
      duration: LAND_DURATION,
      ease: EASE_IN_OUT,
      onUpdate: () => render(f, lerpRect(vp, to, p.t), lerp(PEAK_ZOOM, 1, p.t)),
    }, 0);
    // La portada real aparece debajo y la copia se funde: cubre el 1% de
    // escala de hover que tiene la portada y cualquier redondeo de subpíxel.
    f.tl.call(() => {
      targetEl.style.visibility = "";
    });
    f.tl.to(f.overlay, { opacity: 0, duration: 0.2, ease: EASE_OUT });
    onStart?.();
  });

  return () => {
    if (flight !== f) return;
    if (raf) {
      /* Todavía no arrancó: es el desmontaje de prueba de StrictMode (o una
         salida instantánea). Se vuelve a "esperando" para que el montaje
         siguiente la pueda aterrizar, con la red de seguridad rearmada. */
      cancelAnimationFrame(raf);
      targetEl.style.visibility = "";
      f.target = null;
      f.status = "waiting";
      f.safety = setTimeout(() => abort(f), SAFETY_MS);
      return;
    }
    dispose(f);
  };
}
