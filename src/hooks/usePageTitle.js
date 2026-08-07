import { useEffect } from "react";
import config from "../data/config.json";

/* Título de la pestaña por página.

   En una SPA el título no se reinicia al navegar: si una ruta no lo declara,
   queda el de la anterior. Centralizarlo acá evita que agregar una página
   nueva y olvidarse del efecto deje un título ajeno colgado.

   El sufijo vive en config.json → site.name. */

const BRAND = config.site.name;

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — ${BRAND}` : BRAND;
  }, [title]);
}
