import { memo } from "react";
import { Link } from "react-router-dom";
import styles from "./GridView.module.css";

/* Grilla compartida por la vista Grid de la home y por /work.

   Presentacional puro: recibe items ya resueltos ({ key, to, n, name,
   category, img }) y no sabe de dónde salieron. Así la home puede mezclar
   proyectos de Lab con los de Obys y /work mostrar sólo estos últimos, sin
   que la grilla tenga que decidir a qué ruta enlaza cada uno. */

function GridViewBase({ items }) {
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <Link key={item.key} to={item.to} className={styles.card}>
          <figure className={styles.media}>
            <img src={item.img} alt={item.name} loading="lazy" />
          </figure>
          <h3 className={styles.title}>
            {item.n} — {item.name}
          </h3>
          <p className={styles.category}>{item.category}</p>
        </Link>
      ))}
    </div>
  );
}

export const GridView = memo(GridViewBase);
