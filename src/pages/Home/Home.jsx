import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BracketMark } from "../../components/Marks.jsx";
import { useCarousel } from "../../hooks/useCarousel.js";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll.js";
import { homeItems } from "../../data/homeItems.js";
import { GridView } from "./GridView.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import config from "../../data/config.json";
import styles from "./Home.module.css";

/* Formatos del carrusel: vienen de config.json → carousel.
   `scale` multiplica todos los anchos: 1.0 = sin cambio, 0.8 = más chico, 1.3 = más grande.
   Si un proyecto define `"format": "Vertical"`, toma ese formato directamente.
   Si no lo define, cicla entre los 5 formatos en orden. */
const { scale, formats } = config.carousel;
const FORMATS = formats.map((f) => ({ name: f.name, ar: f.ar, w: f.w * scale }));
const FORMATS_BY_NAME = FORMATS.reduce((acc, f) => {
  if (f.name) acc[f.name.toLowerCase()] = f;
  return acc;
}, {});

const resolveFormat = (item, index) => {
  if (item.format) {
    const custom = FORMATS_BY_NAME[String(item.format).toLowerCase()];
    if (custom) return custom;
  }
  return FORMATS[index % FORMATS.length];
};

const SETS = 3;
const VIEWS = ["vertical", "horizontal", "grid"];

/* Una diapositiva. Memoizada: al cambiar el activo React volvería a renderizar
   las tres copias enteras aunque sólo dos piezas cambian de estado. Así se
   re-renderiza únicamente la que entra y la que sale.

   El destino llega en `item.to`: las piezas de Lab van a /lab/<slug> y las de
   Obys a /work/<slug>, sin que la diapositiva tenga que saber de dónde salió.

   Si el item tiene `video`, se reproduce cuando la diapositiva se activa (active).
   La imagen siempre está visible (es el fondo / poster). */
const Slide = memo(function Slide({ item, format, active, ariaHidden }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!item.video || !videoRef.current) return;
    if (active) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [active, item.video]);

  return (
    <Link
      to={item.to}
      className={`${styles.slide} ${active ? styles.slideActive : ""}`}
      style={{ width: `${format.w}rem`, aspectRatio: String(format.ar) }}
      aria-label={item.name}
      aria-hidden={ariaHidden || undefined}
      tabIndex={ariaHidden ? -1 : undefined}
    >
      <img src={item.img} alt={ariaHidden ? "" : item.name} loading="lazy" draggable={false} />
      {item.video && (
        <video
          ref={videoRef}
          src={item.video}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          draggable={false}
        />
      )}
    </Link>
  );
});

const NameItem = memo(function NameItem({ item, active, onSelect, ariaHidden }) {
  return (
    <button
      type="button"
      className={`${styles.listItem} ${active ? styles.listItemActive : ""}`}
      onClick={onSelect}
      aria-hidden={ariaHidden || undefined}
      tabIndex={ariaHidden ? -1 : undefined}
    >
      {item.name}
    </button>
  );
});

export default function Home() {
  // Sin título propio, volver al inicio dejaba colgado el de la página
  // anterior: en una SPA nadie lo reinicia solo.
  usePageTitle();

  const [view, setView] = useState("vertical");
  const horizontal = view === "horizontal";
  const carouselOn = view !== "grid";

  const { stripRef, listRef, activeIndex, goTo } = useCarousel({
    count: homeItems.length,
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
        homeItems.map((item, i) => ({
          key: `${set}-${item.key}`,
          item,
          index: i,
          format: resolveFormat(item, i),
          ghost: set !== 1, // las copias laterales son decorativas
        }))
      ).flat(),
    []
  );

  const active = homeItems[activeIndex] ?? homeItems[0];

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
                  item={item.item}
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
                  item={item.item}
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
              {config.site.homeAboutText}
            </p>
            <p className={styles.contactLabel}>Contact:</p>
            <a href={`mailto:${config.site.email}`} className={styles.contactEmail}>
              {config.site.email}
            </a>
          </aside>

          <div className={styles.meta} aria-live="polite">
            <span className={styles.metaCategory}>{active.category}</span>
            <span className={styles.metaServices}>{active.services}</span>
            <span className={styles.metaNumber}>{active.n}</span>
          </div>
        </div>
      )}

      {view === "grid" && <GridView items={homeItems} />}

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
