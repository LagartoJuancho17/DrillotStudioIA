import { memo } from "react";
import { Link } from "react-router-dom";
import { normalizeImage } from "../../data/labProjects.js";
import { useReveal } from "../../hooks/useReveal.js";
import { HoverMedia } from "../../components/HoverMedia/HoverMedia.jsx";
import styles from "./Lab.module.css";

/* Portada de un mini proyecto. Se revela sola al entrar en viewport, así la
   página no depende de ningún orquestador central para animarse. */

function LabCardBase({ project, eager, open, onTouchOpen }) {
  const [ref, revealed] = useReveal();
  const cover = normalizeImage(project.cover);
  const shots = (project.images?.length || 0) + 1;

  const meta = [project.category, `${shots} images`].filter(Boolean).join(" · ");

  return (
    <Link
      ref={ref}
      to={`/lab/${project.slug}`}
      className={[
        styles.item,
        revealed ? styles.itemIn : "",
        open ? styles.itemOpen : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onTouchOpen}
    >
      <HoverMedia
        className={styles.media}
        src={cover.src}
        video={cover.video}
        alt={project.name}
        width={cover.w}
        height={cover.h}
        loading={eager ? "eager" : "lazy"}
      />

      <figcaption className={styles.caption}>
        <span className={styles.captionTitle}>{project.name}</span>
        <span className={styles.captionMeta}>{meta}</span>
      </figcaption>

      {project.year ? <span className={styles.year}>{project.year}</span> : null}
    </Link>
  );
}

export const LabCard = memo(LabCardBase);
