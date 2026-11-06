/* Geometría pura de la transición de apertura de proyecto.

   La imagen viaja entre dos "ventanas" (la diapositiva del carrusel, la
   pantalla completa, la portada del proyecto). En las tres la imagen se ve con
   object-fit: cover, así que en cada frame hay que saber dos cosas:

   1. qué parte de la pantalla se ve: un clip-path inset() con la ventana
   2. dónde está la imagen: una transformación que la deja cubriendo la ventana

   Interpolar la ventana y recalcular el cover en cada frame (en vez de
   interpolar la transformación de la imagen) garantiza que en ningún frame
   aparece un borde vacío ni la imagen deformada: cover se cumple siempre.

   Todo es transform + clip-path, que el navegador compone en GPU sin layout.
   Sin DOM: se testea con node --test (geometry.test.js). */

export const lerp = (a, b, t) => a + (b - a) * t;

export const lerpRect = (a, b, t) => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
});

export const viewportRect = (vw, vh) => ({ x: 0, y: 0, w: vw, h: vh });

/* De DOMRect (left/top/width/height) al formato interno. */
export const fromDOMRect = (r) => ({ x: r.left, y: r.top, w: r.width, h: r.height });

/* Caja de una imagen de proporción `aspect` (ancho / alto) que cubre `rect`
   centrada, como object-fit: cover; object-position: center. */
export function coverBox(rect, aspect) {
  const a = aspect > 0 && Number.isFinite(aspect) ? aspect : rect.w / rect.h || 1;
  let w = rect.w;
  let h = w / a;
  if (h < rect.h) {
    h = rect.h;
    w = h * a;
  }
  return {
    x: rect.x + (rect.w - w) / 2,
    y: rect.y + (rect.h - h) / 2,
    w,
    h,
  };
}

/* Estilos de un frame: la imagen tiene en el DOM un tamaño base (baseW x baseH,
   en 0,0) y se lleva con translate + scale uniforme a su caja de cover. El
   clip deja ver sólo la ventana.

   `zoom` agranda la imagen desde el centro de la ventana sin cambiar la
   ventana: da la sensación de cámara que se acerca mientras la ventana crece. */
export function frameStyle(rect, { vw, vh, aspect, baseW, zoom = 1 }) {
  const box = coverBox(rect, aspect);
  const zw = box.w * zoom;
  const zh = box.h * zoom;
  const x = box.x - (zw - box.w) / 2;
  const y = box.y - (zh - box.h) / 2;
  const scale = zw / baseW;

  const top = Math.max(0, rect.y);
  const left = Math.max(0, rect.x);
  const right = Math.max(0, vw - (rect.x + rect.w));
  const bottom = Math.max(0, vh - (rect.y + rect.h));

  return {
    clipPath: `inset(${round(top)}px ${round(right)}px ${round(bottom)}px ${round(left)}px)`,
    transform: `translate3d(${round(x)}px, ${round(y)}px, 0) scale(${scale.toFixed(5)})`,
    box: { x, y, w: zw, h: zh },
  };
}

const round = (n) => Math.round(n * 100) / 100;
