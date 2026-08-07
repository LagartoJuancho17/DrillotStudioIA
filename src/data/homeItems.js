import { projects } from "./projects.js";
import { labProjects, normalizeImage } from "./labProjects.js";

/* Los proyectos, ya resueltos para mostrar.

   Cada pieza sabe a dónde lleva: las de Lab a /lab/<slug> y las otras a
   /favorites/<slug>. Así la grilla y el carrusel pueden mezclar ambas fuentes
   sin tener que saber de dónde salió cada una.

   `favorite` no filtra acá: se marca en el item y cada vista decide. La home
   los muestra todos; Favorites, sólo los marcados. */

const pad = (i) => String(i + 1).padStart(2, "0");

const fromLab = (p) => ({
  key: `lab-${p.slug}`,
  to: `/lab/${p.slug}`,
  name: p.name,
  category: p.category || "Lab",
  // Los de Lab no tienen "servicios": lo útil ahí es cuánto hay adentro, que
  // además invita a entrar.
  services: `${(p.images?.length || 0) + 1} images`,
  img: normalizeImage(p.cover).src,
  favorite: Boolean(p.favorite),
});

const fromWork = (p) => ({
  key: `work-${p.slug}`,
  to: `/favorites/${p.slug}`,
  n: p.n,
  name: p.name,
  category: p.category,
  services: p.services,
  img: p.img,
  favorite: Boolean(p.favorite),
});

/* El carrusel de la home: todo, con los de Lab primero por ser obra propia.
   La numeración se recalcula sobre la lista final para que sea correlativa y
   no choquen los números de ambas fuentes. */
export const homeItems = [
  ...labProjects.map(fromLab),
  ...projects.map(fromWork),
].map((item, i) => ({ ...item, n: pad(i) }));

/* La sección Favorites: sólo lo marcado, renumerado sobre esa selección para
   que no queden huecos al desmarcar un proyecto. */
export const favoriteItems = homeItems
  .filter((item) => item.favorite)
  .map((item, i) => ({ ...item, n: pad(i) }));
