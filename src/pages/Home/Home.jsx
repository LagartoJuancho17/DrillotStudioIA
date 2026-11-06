import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BracketMark } from "../../components/Marks.jsx";
import { HandHud } from "../../components/HandHud/HandHud.jsx";
import { useCarousel } from "../../hooks/useCarousel.js";
import { useHandControl } from "../../hooks/useHandControl.js";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll.js";
import { openProject } from "../../transitions/projectTransition.js";
import { EASE_OUT } from "../../transitions/eases.js";
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

/* Control con las manos. El tracker devuelve desplazamientos en unidades de
   imagen (0..1); esto los pasa a píxeles del carrusel. Con 2.2, recorrer media
   imagen con la mano mueve ~1 pantalla: varios proyectos por gesto amplio,
   uno con un gesto corto. */
const HAND_GAIN = 2.2;
const HANDS_KEY = "drillot:hands";

/* Se recuerda por sesión: al entrar a un proyecto y volver, la cámara sigue
   activa sin tener que prenderla de nuevo. `?hands` en la URL la prende de
   entrada, útil para presentar. */
function initialHands() {
  try {
    if (new URLSearchParams(window.location.search).has("hands")) return true;
    return sessionStorage.getItem(HANDS_KEY) === "1";
  } catch {
    return false;
  }
}

const HAND_ICON = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7.5V3.2a1 1 0 0 1 2 0V7" />
    <path d="M6 6.5V2.2a1 1 0 0 1 2 0v4.3" />
    <path d="M8 6.5V3a1 1 0 0 1 2 0v4.5" />
    <path d="M10 7V5a1 1 0 0 1 2 0v3.5A4.5 4.5 0 0 1 7.5 13h-.3a4 4 0 0 1-3.3-1.8L2.2 8.6a1 1 0 0 1 1.6-1.2L4 7.6" />
  </svg>
);

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
const Slide = memo(function Slide({ item, format, active, ariaHidden, onOpen }) {
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

  /* Click normal: la transición. Cmd/ctrl/shift/click del medio siguen
     abriendo en otra pestaña o ventana, como cualquier link. */
  const handleClick = (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onOpen?.(item, e.currentTarget);
  };

  return (
    <Link
      to={item.to}
      onClick={handleClick}
      data-slide=""
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

  // En mobile, forzar la vista principal por defecto ("vertical")
  useEffect(() => {
    const lockMobileView = () => {
      if (window.innerWidth <= 900) {
        setView("vertical");
      }
    };
    lockMobileView();
    window.addEventListener("resize", lockMobileView);
    return () => window.removeEventListener("resize", lockMobileView);
  }, []);

  /* Mientras la imagen viaja hacia el proyecto, el carrusel no responde:
     la rueda o la mano moverían la tira debajo de la imagen. */
  const [leaving, setLeaving] = useState(false);

  const { stripRef, listRef, activeIndex, goTo, scrollBy, release } = useCarousel({
    count: homeItems.length,
    horizontal,
    enabled: carouselOn && !leaving,
  });

  /* ---------- apertura de proyecto ---------- */

  const rootRef = useRef(null);
  const navigate = useNavigate();

  /* Salida de la home mientras la imagen crece: lo que rodea a la imagen se
     va primero (los vecinos de la tira, la lista, los textos) y el paréntesis
     se abre hacia afuera, como si dejara salir a la imagen. */
  const leave = useCallback((tl) => {
    const root = rootRef.current;
    if (!root) return;
    const q = (sel) => Array.from(root.querySelectorAll(sel));
    const others = q("[data-slide]").filter((el) => !el.dataset.opening);
    tl.to(others, { opacity: 0, duration: 0.5, ease: EASE_OUT }, 0);
    tl.to(q(`.${styles.listItem}`), { opacity: 0, x: -24, duration: 0.6, ease: EASE_OUT, stagger: 0.012 }, 0);
    tl.to(q(`.${styles.mark}`), { scale: 1.8, opacity: 0, duration: 0.8, ease: EASE_OUT }, 0.05);
    tl.to(q(`.${styles.about}, .${styles.meta}, .${styles.bottom}`), { opacity: 0, y: 12, duration: 0.5, ease: EASE_OUT, stagger: 0.04 }, 0);
  }, []);

  const open = useCallback(
    (item, slideEl) => {
      if (!item?.to) return;
      if (slideEl) slideEl.dataset.opening = "1";
      const started = openProject({
        sourceEl: slideEl,
        imgEl: slideEl?.querySelector("img"),
        to: item.to,
        navigate,
        leave,
      });
      if (started) setLeaving(true);
    },
    [navigate, leave]
  );

  /* ---------- manos ---------- */

  const [handsOn, setHandsOn] = useState(initialHands);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  useEffect(() => {
    try {
      sessionStorage.setItem(HANDS_KEY, handsOn ? "1" : "0");
    } catch {
      /* storage bloqueado: sólo se pierde el recuerdo entre páginas */
    }
  }, [handsOn]);

  const toggleHands = useCallback(() => setHandsOn((on) => !on), []);

  // Atajo "H", salvo que se esté escribiendo en un campo
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "h" && e.key !== "H") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      toggleHands();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleHands]);

  const onHandScroll = useCallback(
    (delta) => {
      const size = horizontal ? window.innerWidth : window.innerHeight;
      scrollBy(delta * size * HAND_GAIN);
    },
    [horizontal, scrollBy]
  );

  // Entra al proyecto que está centrado en el momento del puño
  const onHandEnter = useCallback(() => {
    const i = activeIndexRef.current;
    const item = homeItems[i];
    // La diapositiva activa de la copia del medio (las otras son decorativas)
    const slide = stripRef.current?.querySelector(`.${styles.slideActive}:not([aria-hidden])`);
    open(item, slide);
  }, [open, stripRef]);

  const hands = useHandControl({
    enabled: handsOn && carouselOn && !leaving,
    axis: horizontal ? "x" : "y",
    onScroll: onHandScroll,
    onRelease: release,
    onEnter: onHandEnter,
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
      ref={rootRef}
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
                  onOpen={open}
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
          {carouselOn && (
            <span className={styles.toggleGroup}>
              <span className={styles.toggleSep}>·</span>
              <button
                type="button"
                aria-pressed={handsOn}
                className={`${styles.toggleBtn} ${handsOn ? styles.toggleOn : ""}`}
                onClick={toggleHands}
                title="Control with your hands (H)"
              >
                <span className={styles.toggleIcon}>{HAND_ICON}</span>
                <span className={styles.toggleText}>Hands</span>
              </button>
            </span>
          )}
        </div>
      </div>

      {handsOn && carouselOn && <HandHud {...hands} />}
    </main>
  );
}
