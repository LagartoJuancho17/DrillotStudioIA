import { memo, useEffect, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Wordmark } from "../Marks.jsx";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll.js";
import styles from "./Header.module.css";

const LINKS = [
  { to: "/favorites", label: "Favorites" },
  { to: "/about", label: "About" },
  { to: "/lab", label: "Lab" },
];

function HeaderBase({ onOpenContact }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useLockBodyScroll(menuOpen);

  // Cambiar de ruta cierra el menú: si no, queda abierto sobre la página nueva.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className={`${styles.root} ${menuOpen ? styles.rootOpen : ""}`}>
      <Link to="/" className={styles.logo} aria-label="Obys — Inicio">
        <Wordmark />
      </Link>

      <button
        type="button"
        className={styles.burger}
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
      </button>

      <nav
        className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`}
        aria-label="Principal"
      >
        <div className={styles.links}>
          {LINKS.map((link, i) => (
            <span key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) => (isActive ? styles.active : undefined)}
              >
                {link.label}
              </NavLink>
              {i < LINKS.length - 1 && <span className={styles.comma}>,</span>}
            </span>
          ))}
        </div>

        <button type="button" className={styles.contact} onClick={onOpenContact}>
          Contact
        </button>
      </nav>
    </header>
  );
}

/* El header se monta una sola vez por sesión y no depende del contenido de la
   página: memo evita que se vuelva a renderizar cada vez que una ruta cambia
   su propio estado interno. */
export const Header = memo(HeaderBase);
