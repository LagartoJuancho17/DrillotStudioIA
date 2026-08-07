import { Link } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import styles from "./NotFound.module.css";

export default function NotFound() {
  usePageTitle("404");

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
