import { memo } from "react";
import { Link } from "react-router-dom";
import styles from "./GridView.module.css";

/* Vista Grid de la home. Presentacional puro: recibe los proyectos y no sabe
   nada del carrusel ni del estado de la página. */

function GridViewBase({ projects }) {
  return (
    <div className={styles.grid}>
      {projects.map((p) => (
        <Link key={p.slug} to={`/work/${p.slug}`} className={styles.card}>
          <figure className={styles.media}>
            <img src={p.img} alt={p.name} loading="lazy" />
          </figure>
          <h3 className={styles.title}>
            {p.n} — {p.name}
          </h3>
          <p className={styles.category}>{p.category}</p>
        </Link>
      ))}
    </div>
  );
}

export const GridView = memo(GridViewBase);
