import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";

/* Curvas de las transiciones, registradas una vez.

   - pt-out: la misma que --ease-obys del sitio (tokens.css), para entradas.
     Arranca rápido y se asienta largo: lo que aparece llega enseguida.
   - pt-in-out: ease-in-out fuerte para lo que se mueve en pantalla de un
     lugar a otro (la imagen que viaja). Acelera y frena con decisión, sin el
     arranque blando de las curvas built-in. */

gsap.registerPlugin(CustomEase);

export const EASE_OUT = CustomEase.create("pt-out", "0.16,1,0.3,1");
export const EASE_IN_OUT = CustomEase.create("pt-in-out", "0.77,0,0.175,1");

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap };
