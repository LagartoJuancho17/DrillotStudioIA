import { memo, useCallback, useEffect, useState } from "react";
import {
  founders,
  gallery,
  facts,
  lead,
  more,
  typographyCredit,
} from "../../data/about.js";
import styles from "./About.module.css";

const GalleryItem = memo(function GalleryItem({ item, eager, open, onTouchOpen }) {
  const line = [item.category, item.subtitle].filter(Boolean).join(" · ");
  const hasCaption = item.brand || line || item.year;

  return (
    <figure
      className={`${styles.item} ${open ? styles.itemOpen : ""}`}
      onClick={onTouchOpen}
    >
      <img
        src={item.src}
        alt={item.alt}
        width={item.w || undefined}
        height={item.h || undefined}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
      {hasCaption && (
        <figcaption className={styles.caption}>
          {item.brand && <span className={styles.captionBrand}>{item.brand}</span>}
          {line && <span className={styles.captionLine}>{line}</span>}
          {item.year && <span className={styles.captionLine}>{item.year}</span>}
        </figcaption>
      )}
    </figure>
  );
});

export default function About() {
  const [openIndex, setOpenIndex] = useState(null);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    document.title = "About — Obys";
    setIsTouch(!window.matchMedia("(hover: hover)").matches);
  }, []);

  // En touch no hay :hover, así que el toque hace de revelador de la ficha.
  const handleTouchOpen = useCallback(
    (index) => () => {
      if (!isTouch) return;
      setOpenIndex((current) => (current === index ? null : index));
    },
    [isTouch]
  );

  return (
    <main className={styles.root}>
      <h1 className="visually-hidden">About</h1>

      <section className={styles.intro}>
        <div className={styles.founders}>
          {founders.map((f) => (
            <p key={f.name}>
              <span className={styles.founderName}>{f.name}</span>
              <span className={styles.founderRole}>{f.role}</span>
            </p>
          ))}
        </div>

        <div className={styles.lead}>
          {lead.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>
      </section>

      <section className={styles.portraits}>
        {founders.map((f) => (
          <figure key={f.name} className={styles.portrait}>
            <div className={styles.portraitMedia}>
              <img src={f.img} alt={f.alt} loading="lazy" decoding="async" />
            </div>
            <figcaption className={styles.portraitCaption}>
              <span>{f.name}</span>
              <span>{f.role}</span>
            </figcaption>
          </figure>
        ))}
      </section>

      <section className={styles.gallery} aria-label="Studio gallery">
        {gallery.map((item, i) => (
          <GalleryItem
            key={item.src}
            item={item}
            eager={i < 4}
            open={openIndex === i}
            onTouchOpen={handleTouchOpen(i)}
          />
        ))}
      </section>

      <section className={styles.more}>
        {more.map((p) => (
          <p key={p.slice(0, 40)}>{p}</p>
        ))}
      </section>

      <section className={styles.facts}>
        {facts.map((col) => (
          <div key={col.label}>
            <p className={styles.factsLabel}>{col.label}</p>
            <ul className={styles.factsList}>
              {col.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <p className={styles.credit}>{typographyCredit}</p>
    </main>
  );
}
