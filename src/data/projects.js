/* Proyectos externos (Favorites / Work).

   Los datos viven en src/data/config.json → "projects".
   Para agregar o editar proyectos, editá el JSON directamente. */

import config from "./config.json";

export const projects = config.projects;

export const findProjectIndex = (slug) =>
  projects.findIndex((p) => p.slug === slug);
