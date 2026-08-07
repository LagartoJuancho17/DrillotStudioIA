import { useEffect } from "react";

/* Título de la pestaña por página.

   En una SPA el título no se reinicia al navegar: si una ruta no lo declara,
   queda el de la anterior. Centralizarlo acá evita que agregar una página
   nueva y olvidarse del efecto deje un título ajeno colgado, que es lo que
   pasaba en la home.

   El sufijo vive en un solo lugar: `usePageTitle()` sin argumentos deja
   solamente la marca. */

const BRAND = "Obys";

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — ${BRAND}` : BRAND;
  }, [title]);
}
