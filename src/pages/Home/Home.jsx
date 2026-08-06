import { memo, useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BracketMark } from "../../components/Marks.jsx";
import { useCarousel } from "../../hooks/useCarousel.js";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll.js";
import { projects } from "../../data/projects.js";
import { GridView } from "./GridView.jsx";
import styles from "./Home.module.css";

/* Los cinco formatos que el sitio original alterna en ciclo, medidos del DOM
   real: no es una grilla uniforme. */
const FORMATS = [
  { ar: 1.0, w: 13.2 },
  { ar: 0.8, w: 17.5 },
  { ar: 1.0, w: 18.4 },
  { ar: 0.67, w: 13.2 },
  { ar: 1.5, w: 19.6 },
];

const SETS = 3;
const VIEWS = ["vertical", "horizontal", "grid"];

/* Una diapositiva. memo con comparador propio: al cambiar el activo React
   volvería a renderizar las 57 (19 × 3 copias) aunque sólo dos cambian de
   estado. Así se re-renderiza únicamente la que entra y la que sale. */
const Slide = memo(function Slide({ project, format, active, ariaHidden }) {
  return (
    <Link
      to={`/work/${project.slug}`}
      className={`${styles.slide} ${active ? styles.slideActive : ""}`}
      style={{ width: `${format.w}rem`, aspectRatio: String(format.ar) }}
      aria-label={project.name}
      aria-hidden={ariaHidden || undefined}
      tabIndex={ariaHidden ? -1 : undefined}
    >
      <img src={project.img} alt={ariaHidden ? "" : project.name} loading="lazy" draggable={false} />
    </Link>
  );
});

const NameItem = memo(function NameItem({ project, active, onSelect, ariaHidden }) {
  return (
    <button
      type="button"
      className={`${styles.listItem} ${active ? styles.listItemActive : ""}`}
      onClick={onSelect}
      aria-hidden={ariaHidden || undefined}
      tabIndex={ariaHidden ? -1 : undefined}
    >
      {project.name}
    </button>
  );
});

export default function Home() {
  const [view, setView] = useState("vertical");
  const horizontal = view === "horizontal";
  const carouselOn = view !== "grid";

  const { stripRef, listRef, activeIndex, goTo } = useCarousel({
    count: projects.length,
    horizontal,
    enabled: carouselOn,
  });

  // Mientras el carrusel intercepta la rueda, el documento no debe scrollear.
  // En vista grid se libera para volver al scroll nativo.
  useLockBodyScroll(carouselOn);

  /* Tres copias de la lista: se navega la del medio, así siempre hay contenido
     real arriba y abajo del centro y el envolvimiento es invisible. */
  const loop = useMemo(
    () =>
      Array.from({ length: SETS }, (_, set) =>
        projects.map((project, i) => ({
          key: `${set}-${project.slug}`,
          project,
          index: i,
          format: FORMATS[i % FORMATS.length],
          ghost: set !== 1, // las copias laterales son decorativas
        }))
      ).flat(),
    []
  );

  const active = projects[activeIndex] ?? projects[0];

  const handleSelect = useCallback((index) => goTo(index), [goTo]);

  return (
    <main className={`${styles.root} ${horizontal ? styles.horizontal : ""}`}>
      {carouselOn && (
        <div className={styles.viewport}>
          <aside className={styles.list} aria-label="Selected work">
            <div className={styles.listTrack} ref={listRef}>
              {loop.map((item) => (
                <NameItem
                  key={item.key}
                  project={item.project}
                  active={item.index === activeIndex}
                  ariaHidden={item.ghost}
                  onSelect={() => handleSelect(item.index)}
                />
              ))}
            </div>
          </aside>

          <div className={styles.stage}>
            <div className={styles.strip} ref={stripRef}>
              {loop.map((item) => (
                <Slide
                  key={item.key}
                  project={item.project}
                  format={item.format}
                  active={item.index === activeIndex}
                  ariaHidden={item.ghost}
                />
              ))}
            </div>
            <div className={styles.mark} aria-hidden="true">
              <BracketMark />
            </div>
          </div>

          <aside className={styles.about}>
            <p className={styles.aboutCopy}>
              The studio is shaped by people who care deeply about design and the
              process behind. Each project becomes a case study and a meaningful
              part of our portfolio, developed with care and attention.
            </p>
            <p className={styles.contactLabel}>Contact:</p>
            <a href="mailto:info@obys.agency" className={styles.contactEmail}>
              info@obys.agency
            </a>
          </aside>

          <div className={styles.meta} aria-live="polite">
            <span className={styles.metaCategory}>{active.category}</span>
            <span className={styles.metaServices}>{active.services}</span>
            <span className={styles.metaNumber}>{active.n}</span>
          </div>
        </div>
      )}

      {view === "grid" && <GridView projects={projects} />}

      <div className={styles.bottom}>
        <div className={styles.toggle} role="tablist" aria-label="Work view">
          {VIEWS.map((name, i) => (
            <span key={name}>
              <button
                type="button"
                role="tab"
                aria-selected={view === name}
                className={view === name ? styles.toggleOn : undefined}
                onClick={() => setView(name)}
              >
                {name[0].toUpperCase() + name.slice(1)}
              </button>
              {i < VIEWS.length - 1 && <span>,</span>}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
