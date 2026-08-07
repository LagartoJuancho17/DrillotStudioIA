/* Mini proyectos de Lab.

   Los datos viven en src/data/config.json → "labProjects".
   Para agregar un proyecto: editá el JSON, creá la carpeta en
   /public/img/lab/<slug>/ y soltá las imágenes. La grilla, la ficha
   y la navegación anterior/siguiente se arman solas.

   Para agregar portadaVideo: simplemente soltá portadaVideo.mp4 en la
   carpeta del proyecto. El plugin Vite lo detecta automáticamente.

   El video de cover puede declararse en el JSON o dejarse que el plugin
   lo auto-detecte: si aparece en el JSON tiene prioridad. */

import config from "./config.json";

export const labProjects = config.labProjects;

/* Las imágenes pueden venir como string o como objeto: se normalizan una sola
   vez acá para que ningún componente tenga que preguntarse de qué forma llegan. */
export const normalizeImage = (image) =>
  typeof image === "string" ? { src: image } : image || {};

export const findLabProjectIndex = (slug) =>
  labProjects.findIndex((p) => p.slug === slug);
