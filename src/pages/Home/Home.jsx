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

const VIEW_ICONS = {
  vertical: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="3" y1="1" x2="3" y2="13" />
      <line x1="7" y1="1" x2="7" y2="13" />
      <line x1="11" y1="1" x2="11" y2="13" />
    </svg>
  ),
  horizontal: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="1" y1="3" x2="13" y2="3" />
      <line x1="1" y1="7" x2="13" y2="7" />
      <line x1="1" y1="11" x2="13" y2="11" />
    </svg>
  ),
  grid: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <rect x="1.5" y="1.5" width="4.5" height="4.5" />
      <rect x="8" y="1.5" width="4.5" height="4.5" />
      <rect x="1.5" y="8" width="4.5" height="4.5" />
      <rect x="8" y="8" width="4.5" height="4.5" />
    </svg>
  ),
};

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

  // Reproducción de sonido al cambiar de elemento en el carrusel
  const tapAudioRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const audio = new Audio("/assets/tap.mp3");
    audio.volume = 0.4;
    tapAudioRef.current = audio;
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!carouselOn || !tapAudioRef.current) return;
    tapAudioRef.current.currentTime = 0;
    tapAudioRef.current.play().catch(() => {});
  }, [activeIndex, carouselOn]);

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
    <main
      className={`${styles.root} ${horizontal ? styles.horizontal : ""} ${
        view === "grid" ? styles.isGrid : ""
      }`}
    >
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
            <span key={name} className={styles.toggleGroup}>
              <button
                type="button"
                role="tab"
                aria-selected={view === name}
                className={`${styles.toggleBtn} ${
                  view === name ? styles.toggleOn : ""
                }`}
                onClick={() => setView(name)}
                title={name[0].toUpperCase() + name.slice(1)}
              >
                <span className={styles.toggleIcon}>{VIEW_ICONS[name]}</span>
                <span className={styles.toggleText}>
                  {name[0].toUpperCase() + name.slice(1)}
                </span>
              </button>
              {i < VIEWS.length - 1 && <span className={styles.toggleSep}>,</span>}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
