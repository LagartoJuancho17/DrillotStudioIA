import { memo } from "react";
import config from "../../data/config.json";
import styles from "./Footer.module.css";

function FooterBase({ fixed = false }) {
  return (
    <footer className={`${styles.root} ${fixed ? styles.fixed : ""}`}>
      <span>All rights reserved. ©{new Date().getFullYear()} {config.site.name}</span>
    </footer>
  );
}

export const Footer = memo(FooterBase);
