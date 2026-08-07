import { useCallback, useEffect, useState } from "react";
import { labProjects } from "../../data/labProjects.js";
import { LabCard } from "./LabCard.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import styles from "./Lab.module.css";

/* Índice de los mini proyectos. Contenedor: sólo decide qué datos van y
   maneja el caso touch. El dibujo de cada pieza vive en LabCard. */

export default function Lab() {
  const [openSlug, setOpenSlug] = useState(null);
  const [isTouch, setIsTouch] = useState(false);

  usePageTitle("Lab");

  useEffect(() => {
    setIsTouch(!window.matchMedia("(hover: hover)").matches);
  }, []);

  /* Sin :hover en touch, el primer toque muestra la ficha y el segundo entra
     al proyecto. */
  const handleTouchOpen = useCallback(
    (slug) => (event) => {
      if (!isTouch || openSlug === slug) return;
      event.preventDefault();
      setOpenSlug(slug);
    },
    [isTouch, openSlug]
  );

  return (
    <main className={styles.root}>
      <h1 className="visually-hidden">Lab</h1>

      <section className={styles.intro}>
        <p className={styles.eyebrow}>
          <span>Lab</span>
          <span className={styles.count}>
            {labProjects.length === 1
              ? "1 project"
              : `${labProjects.length} projects`}
          </span>
        </p>
        <p className={styles.lead}>
          The rest of the site is monochrome by design. Here the work is left in
          full colour. Hover to pull a piece out of the grid, click to see the
          rest of it.
        </p>
      </section>

      {labProjects.length ? (
        <section className={styles.gallery} aria-label="Lab projects">
          {labProjects.map((project, i) => (
            <LabCard
              key={project.slug}
              project={project}
              eager={i < 4}
              open={openSlug === project.slug}
              onTouchOpen={handleTouchOpen(project.slug)}
            />
          ))}
        </section>
      ) : (
        <p className={styles.empty}>
          Todavía no hay proyectos. Agregá uno en{" "}
          <code>src/data/labProjects.js</code>.
        </p>
      )}
    </main>
  );
}
