import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { projects, findProjectIndex } from "../../data/projects.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import styles from "./Project.module.css";

/* Ficha de proyecto. Una sola plantilla para los 19, alimentada por el slug.

   No se inventa contenido de caso de estudio: el material real es de Obys, así
   que la página dice qué es y enlaza al caso original en vez de fabricar
   narrativa de cliente. */

export default function Project() {
  const { slug } = useParams();
  const index = findProjectIndex(slug);
  const project = index >= 0 ? projects[index] : null;

  usePageTitle(project?.name);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [project]);

  if (!project) return <Navigate to="/favorites" replace />;

  const total = projects.length;
  const prev = projects[(index - 1 + total) % total];
  const next = projects[(index + 1) % total];

  return (
    <main className={styles.root}>
      <section className={styles.hero}>
        <div className={styles.meta}>
          <span>{project.category}</span>
          <span className={styles.metaServices}>{project.services}</span>
          <span className={styles.metaNumber}>{project.n}</span>
        </div>
        <h1 className={styles.title}>{project.name}</h1>
      </section>

      <figure className={styles.image}>
        <img src={project.img} alt={project.name} loading="eager" />
      </figure>

      <section className={styles.note}>
        <p className={styles.noteLabel}>About this page</p>
        <div className={styles.noteBody}>
          <p className={styles.noteText}>
            This is a personal, educational recreation of the Obys project page
            for <strong>{project.name}</strong>, built by hand to study the
            studio&rsquo;s design language. It is not affiliated with or endorsed
            by Obys, and no original case-study content is reproduced here.
          </p>
          <a
            className={styles.link}
            href={`https://obys.agency/work/${project.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View the full case study on obys.agency
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <nav className={styles.pager} aria-label="Más proyectos">
        <Link to={`/favorites/${prev.slug}`} className={styles.pagerLink}>
          <span className={styles.pagerArrow}>←</span>
          <span className={styles.pagerCopy}>
            <span className={styles.pagerLabel}>Previous</span>
            <span className={styles.pagerName}>
              {prev.n} — {prev.name}
            </span>
          </span>
        </Link>

        <Link
          to={`/favorites/${next.slug}`}
          className={`${styles.pagerLink} ${styles.pagerNext}`}
        >
          <span className={`${styles.pagerCopy} ${styles.pagerCopyRight}`}>
            <span className={styles.pagerLabel}>Next</span>
            <span className={styles.pagerName}>
              {next.n} — {next.name}
            </span>
          </span>
          <span className={styles.pagerArrow}>→</span>
        </Link>
      </nav>
    </main>
  );
}
