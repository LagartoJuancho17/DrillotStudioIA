import styles from "./SplitWords.module.css";

/* Texto partido en palabras, cada una dentro de una máscara, para que entre
   subiendo desde abajo de su propia línea (ver useProjectEntrance).

   Los espacios quedan como texto real entre máscaras: el título se sigue
   leyendo, copiando y cortando en líneas igual que antes. */

export function SplitWords({ text }) {
  const words = String(text).split(/\s+/).filter(Boolean);
  return words.map((word, i) => (
    <span key={`${word}-${i}`}>
      <span className={styles.mask}>
        <span className={styles.word} data-split-word="">
          {word}
        </span>
      </span>
      {i < words.length - 1 ? " " : null}
    </span>
  ));
}
