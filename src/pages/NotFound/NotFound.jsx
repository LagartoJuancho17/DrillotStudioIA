import { useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./NotFound.module.css";

export default function NotFound() {
  useEffect(() => {
    document.title = "404 — Obys";
  }, []);

  return (
    <main className={styles.root}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>Esta página no existe.</h1>
      <Link to="/" className={styles.back}>
        ← Volver al inicio
      </Link>
    </main>
  );
}
