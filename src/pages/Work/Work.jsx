import { useEffect } from "react";
import { workItems } from "../../data/homeItems.js";
import { GridView } from "../Home/GridView.jsx";
import styles from "./Work.module.css";

/* Índice de trabajos. Reusa GridView, el mismo componente que la vista Grid de
   la home: son la misma pieza de diseño, no dos grillas parecidas que después
   se desincronizan. */

export default function Work() {
  useEffect(() => {
    document.title = "Work — Obys";
  }, []);

  return (
    <main className={styles.root}>
      <section className={styles.intro}>
        <p className={styles.eyebrow}>
          <span>Index</span>
          <span>{workItems.length} projects</span>
        </p>
        <h1 className={styles.title}>Selected Work</h1>
      </section>

      <GridView items={workItems} />
    </main>
  );
}
