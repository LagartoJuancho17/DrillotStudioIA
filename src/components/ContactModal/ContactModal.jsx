import { memo, useEffect } from "react";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll.js";
import styles from "./ContactModal.module.css";

const SOCIALS = [
  { href: "https://www.instagram.com/obys.agency/", label: "Instagram" },
  { href: "https://www.behance.net/obys", label: "Behance" },
  { href: "https://twitter.com/obys_agency", label: "Twitter" },
  { href: "https://www.linkedin.com/company/obysagency/", label: "LinkedIn" },
];

function ContactModalBase({ open, onClose }) {
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={`${styles.root} ${open ? styles.open : ""}`}
      // aria-hidden en vez de desmontar: así la transición de salida se ve.
      aria-hidden={!open}
    >
      <div className={styles.scrim} onClick={onClose} />

      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Contacto">
        <button type="button" className={styles.close} onClick={onClose}>
          <span>Close</span>
          <i />
        </button>

        <p className={styles.eyebrow}>Let&rsquo;s start something great.</p>
        <a href="mailto:info@obys.agency" className={styles.email}>
          info@obys.agency
        </a>

        <div className={styles.grid}>
          <div className={styles.col}>
            <p className={styles.label}>Studio</p>
            <p>Amsterdam · Warsaw · Berlin</p>
          </div>
          <div className={styles.col}>
            <p className={styles.label}>Social</p>
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const ContactModal = memo(ContactModalBase);
