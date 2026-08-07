import { useEffect } from "react";
import { Link } from "react-router-dom";
import { favoriteItems } from "../../data/homeItems.js";
import { GridView } from "../Home/GridView.jsx";
import styles from "./Favorites.module.css";

/* Selección destacada. Muestra sólo lo marcado con `favorite: true`, venga de
   Lab o de los proyectos de Obys. Reusa GridView, la misma pieza que la vista
   Grid de la home: son la misma grilla, no dos parecidas que se desincronizan. */

export default function Favorites() {
  useEffect(() => {
    document.title = "Favorites — Obys";
  }, []);

  return (
    <main className={styles.root}>
      <section className={styles.intro}>
        <p className={styles.eyebrow}>
          <span>Selection</span>
          <span>
            {favoriteItems.length === 1
              ? "1 project"
              : `${favoriteItems.length} projects`}
          </span>
        </p>
        <h1 className={styles.title}>Favorites</h1>
      </section>

      {favoriteItems.length ? (
        <GridView items={favoriteItems} />
      ) : (
        <p className={styles.empty}>
          Ningún proyecto está marcado como favorito. Poné{" "}
          <code>favorite: true</code> en <code>src/data/projects.js</code> o en{" "}
          <code>src/data/labProjects.js</code>, o mirá todo en{" "}
          <Link to="/lab">Lab</Link>.
        </p>
      )}
    </main>
  );
}
