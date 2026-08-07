/* Marcas vectoriales de Obys: los paths salen del SVG del sitio real, que es
   geometría pura, no tipografía embebida.

   La `bracket` cumple doble función: cerrada es la marca del preloader y,
   abriendo sus dos mitades hacia los costados, se convierte en el "( )" que
   enmarca la imagen activa de la home. Es el mismo objeto en dos estados, por
   eso las mitades están separadas en dos <g> identificables. */

export const Wordmark = (props) => (
  <span style={{ fontWeight: 600, letterSpacing: "-0.03em", textTransform: "uppercase" }} {...props}>
    Drillot Studio
  </span>
);

export const BracketMark = ({ leftRef, rightRef, ...props }) => (
  <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
    <g ref={rightRef} data-half="r"><path d="M355.556 0.00292969L379.111 24.0029L400 44.4473V355.57L376.016 379.111L355.571 400H222.223V392.508C318.774 381.481 393.771 299.495 393.771 199.992C393.771 100.489 318.774 18.5016 222.223 7.47461V0L355.556 0.00292969Z" fill="currentColor" /></g>
    <g ref={leftRef} data-half="l"><path d="M177.777 7.47266C81.2195 18.4935 6.21582 100.484 6.21582 199.992C6.21604 299.5 81.2197 381.489 177.777 392.51V400L44.4443 399.997L20.8887 375.997L0 355.553V44.4287L23.9844 20.8887L44.4287 0H177.777V7.47266Z" fill="currentColor" /></g>
  </svg>
);
