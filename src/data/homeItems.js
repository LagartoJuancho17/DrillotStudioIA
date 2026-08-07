import { projects } from "./projects.js";
import { labProjects, normalizeImage } from "./labProjects.js";

/* Lo que muestra el carrusel de la home.

   Une los mini proyectos propios de Lab con los de Obys en una sola lista, y
   cada pieza sabe a dónde lleva: las de Lab a /lab/<slug>, las otras a
   /work/<slug>. Los de Lab van primero porque son obra propia; los de Obys
   quedan detrás como material de la recreación.

   La numeración se recalcula sobre la lista final para que el contador de la
   home sea correlativo y no repita números entre ambas fuentes. */

const pad = (i) => String(i + 1).padStart(2, "0");

const toCarouselItem = {
  lab: (p) => ({
    key: `lab-${p.slug}`,
    to: `/lab/${p.slug}`,
    name: p.name,
    category: p.category || "Lab",
    // Los proyectos de Lab no tienen "servicios": lo útil ahí es cuánto hay
    // adentro, que además invita a entrar.
    services: `${(p.images?.length || 0) + 1} images`,
    img: normalizeImage(p.cover).src,
  }),
  work: (p) => ({
    key: `work-${p.slug}`,
    to: `/work/${p.slug}`,
    name: p.name,
    category: p.category,
    services: p.services,
    img: p.img,
  }),
};

export const homeItems = [
  ...labProjects.map(toCarouselItem.lab),
  ...projects.map(toCarouselItem.work),
].map((item, i) => ({ ...item, n: pad(i) }));

/* La grilla de /work muestra sólo los de Obys, con su numeración original. */
export const workItems = projects.map((p) => ({
  key: `work-${p.slug}`,
  to: `/work/${p.slug}`,
  n: p.n,
  name: p.name,
  category: p.category,
  img: p.img,
}));
