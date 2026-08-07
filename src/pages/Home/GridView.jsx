import { memo } from "react";
import { Link } from "react-router-dom";
import { HoverMedia } from "../../components/HoverMedia/HoverMedia.jsx";
import styles from "./GridView.module.css";

/* Grilla dinámica compartida por la vista Grid de la home y /work.
   Adapta el tamaño, columnas (span) y aspect-ratio de cada tarjeta según el `format` del proyecto.
   Si el proyecto tiene video, reproduce el preview al pasar el mouse. */

const FORMAT_CLASS_MAP = {
  horizontal: styles.formatHorizontal,
  vertical: styles.formatVertical,
  portrait: styles.formatPortrait,
  square: styles.formatSquare,
  minisquare: styles.formatMiniSquare,
};

function GridViewBase({ items }) {
  return (
    <div className={styles.grid}>
      {items.map((item) => {
        const formatKey = String(item.format || "").toLowerCase();
        const formatClass = FORMAT_CLASS_MAP[formatKey] || styles.formatSquare;

        return (
          <Link
            key={item.key}
            to={item.to}
            className={`${styles.card} ${formatClass}`}
          >
            <figure className={styles.media}>
              <HoverMedia
                src={item.img}
                video={item.video}
                alt={item.name}
                badgeLabel="Play"
              />
            </figure>

            <div className={styles.info}>
              <h3 className={styles.title}>
                {item.n && <span className={styles.num}>{item.n}</span>}
                {item.n && <span className={styles.sep}>—</span>}
                <span className={styles.name}>{item.name}</span>
              </h3>
              <p className={styles.category}>{item.category || "Lab"}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export const GridView = memo(GridViewBase);
