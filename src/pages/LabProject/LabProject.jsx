import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  labProjects,
  findLabProjectIndex,
  normalizeImage,
} from "../../data/labProjects.js";
import { useReveal } from "../../hooks/useReveal.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { HoverMedia } from "../../components/HoverMedia/HoverMedia.jsx";
import { SplitWords } from "../../components/SplitWords/SplitWords.jsx";
import { useProjectEntrance } from "../../hooks/useProjectEntrance.js";
import { isLanding } from "../../transitions/projectTransition.js";
import styles from "./LabProject.module.css";

/* La primera pieza es la portada: si se llega desde el carrusel, ahí aterriza
   la imagen que viene viajando (`coverRef`) y entra ya visible (`instant`),
   sin su fundido de aparición, que la haría saltar al recibir la imagen. */
const Shot = forwardRef(function Shot({ image, index, total, instant }, coverRef) {
  const [revealRef, revealed] = useReveal({ threshold: 0.05 });
  const img = normalizeImage(image);

  const setRef = (el) => {
    revealRef.current = el;
    if (coverRef) coverRef.current = el;
  };

  return (
    <figure
      ref={setRef}
      className={`${styles.figure} ${revealed || instant ? styles.figureIn : ""} ${
        instant ? styles.figureInstant : ""
      }`}
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
});

export default function LabProject() {
  const { slug } = useParams();
  const index = findLabProjectIndex(slug);
  const project = index >= 0 ? labProjects[index] : null;

  usePageTitle(project ? `${project.name} — Lab` : undefined);

  const rootRef = useRef(null);
  const coverRef = useRef(null);
  // Se lee al montar: ¿viene una imagen del carrusel a posarse en la portada?
  const [arriving] = useState(isLanding);
  useProjectEntrance(rootRef, coverRef, slug);

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

  /* Si todas las piezas son portrait (alto > ancho), se activa la clase que
     muestra 3 columnas. Si alguna no tiene dimensiones, se asume landscape. */
  const allPortrait = shots.every((img) => {
    const { w, h } = normalizeImage(img);
    return w && h && h > w;
  });

  return (
    <main className={styles.root} ref={rootRef}>
      <section className={styles.hero}>
        <div className={styles.meta} data-reveal="">
          <span>{project.category || "Lab"}</span>
          <span className={styles.metaNumber}>
            {project.year || `${shots.length} images`}
          </span>
        </div>
        <h1 className={styles.title}>
          <SplitWords text={project.name} />
        </h1>
      </section>

      <section className={`${styles.images} ${allPortrait ? styles.imagesPortrait : ""}`}>
        {shots.map((image, i) => (
          <Shot
            key={normalizeImage(image).src}
            image={image}
            index={i}
            total={shots.length}
            ref={i === 0 ? coverRef : undefined}
            instant={i === 0 && arriving}
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
