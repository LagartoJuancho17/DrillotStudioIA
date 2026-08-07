import { useEffect, useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  labProjects,
  findLabProjectIndex,
  normalizeImage,
} from "../../data/labProjects.js";
import { useReveal } from "../../hooks/useReveal.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { HoverMedia } from "../../components/HoverMedia/HoverMedia.jsx";
import styles from "./LabProject.module.css";

function Shot({ image, index, total }) {
  const [ref, revealed] = useReveal({ threshold: 0.05 });
  const img = normalizeImage(image);

  return (
    <figure
      ref={ref}
      className={`${styles.figure} ${revealed ? styles.figureIn : ""}`}
    >
      <HoverMedia
        src={img.src}
        video={img.video}
        alt=""
        width={img.w}
        height={img.h}
        loading={index === 0 ? "eager" : "lazy"}
      />
      <span className={styles.index}>
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
    </figure>
  );
}

export default function LabProject() {
  const { slug } = useParams();
  const index = findLabProjectIndex(slug);
  const project = index >= 0 ? labProjects[index] : null;

  usePageTitle(project ? `${project.name} — Lab` : undefined);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [project]);

  /* La portada abre la secuencia: es parte de la obra, no sólo una miniatura
     para la grilla. */
  const shots = useMemo(() => {
    if (!project) return [];
    return [project.cover, ...(project.images || [])].filter(Boolean);
  }, [project]);

  // Slug inexistente: al índice, sin dejar una ruta rota en el historial.
  if (!project) return <Navigate to="/lab" replace />;

  const total = labProjects.length;
  const prev = labProjects[(index - 1 + total) % total];
  const next = labProjects[(index + 1) % total];
  const hasSiblings = total > 1;

  return (
    <main className={styles.root}>
      <section className={styles.hero}>
        <div className={styles.meta}>
          <span>{project.category || "Lab"}</span>
          <span className={styles.metaNumber}>
            {project.year || `${shots.length} images`}
          </span>
        </div>
        <h1 className={styles.title}>{project.name}</h1>
      </section>

      <section className={styles.images}>
        {shots.map((image, i) => (
          <Shot
            key={normalizeImage(image).src}
            image={image}
            index={i}
            total={shots.length}
          />
        ))}
      </section>

      <nav className={styles.pager} aria-label="Más proyectos">
        {hasSiblings ? (
          <>
            <Link to={`/lab/${prev.slug}`} className={styles.pagerLink}>
              <span className={styles.pagerArrow}>←</span>
              <span className={styles.pagerCopy}>
                <span className={styles.pagerLabel}>Previous</span>
                <span className={styles.pagerName}>{prev.name}</span>
              </span>
            </Link>
            <Link
              to={`/lab/${next.slug}`}
              className={`${styles.pagerLink} ${styles.pagerNext}`}
            >
              <span className={`${styles.pagerCopy} ${styles.pagerCopyRight}`}>
                <span className={styles.pagerLabel}>Next</span>
                <span className={styles.pagerName}>{next.name}</span>
              </span>
              <span className={styles.pagerArrow}>→</span>
            </Link>
          </>
        ) : (
          /* Con un solo proyecto, un paginador que va a sí mismo no aporta:
             se ofrece la vuelta al índice. */
          <Link to="/lab" className={styles.back}>
            ← Back to Lab
          </Link>
        )}
      </nav>
    </main>
  );
}
