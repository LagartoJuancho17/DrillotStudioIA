import { useCallback, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "../components/Header/Header.jsx";
import { Footer } from "../components/Footer/Footer.jsx";
import { ContactModal } from "../components/ContactModal/ContactModal.jsx";

/* Cascarón compartido por todas las rutas.

   Vive fuera del <Outlet> a propósito: el header y el modal se montan una sola
   vez y sobreviven a los cambios de ruta, así el estado del menú y del modal no
   se pierde al navegar y no hay reflow del header en cada transición. */

export function Layout() {
  const [contactOpen, setContactOpen] = useState(false);
  const { pathname } = useLocation();

  const openContact = useCallback(() => setContactOpen(true), []);
  const closeContact = useCallback(() => setContactOpen(false), []);

  // La home ocupa exactamente una pantalla y no scrollea: ahí el footer va
  // fijo. En el resto, sticky, para que no pise el final del contenido.
  const isHome = pathname === "/";

  return (
    <>
      <Header onOpenContact={openContact} />
      <Outlet />
      <Footer fixed={isHome} />
      <ContactModal open={contactOpen} onClose={closeContact} />
    </>
  );
}
