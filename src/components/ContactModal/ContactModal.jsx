import { memo, useEffect } from "react";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll.js";
import config from "../../data/config.json";
import styles from "./ContactModal.module.css";

const { email, instagram, whatsapp, founder, name } = config.site;

const SOCIALS = [
  { href: instagram, label: `Instagram (@${instagram.split("/").filter(Boolean).pop()})` },
  { href: whatsapp,  label: `WhatsApp (+54 11 3803252)` },
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
      aria-hidden={!open}
    >
      <div className={styles.scrim} onClick={onClose} />

      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Contacto">
        <button type="button" className={styles.close} onClick={onClose}>
          <span>Close</span>
          <i />
        </button>

        <p className={styles.eyebrow}>Let&rsquo;s start something great.</p>
        <a href={`mailto:${email}`} className={styles.email}>
          {email}
        </a>

        <div className={styles.grid}>
          <div className={styles.col}>
            <p className={styles.label}>Studio &amp; Founder</p>
            <p>{founder}</p>
            <p>{name}</p>
          </div>
          <div className={styles.col}>
            <p className={styles.label}>Contacto &amp; Redes</p>
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
