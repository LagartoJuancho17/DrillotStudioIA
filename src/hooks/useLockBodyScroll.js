import { useEffect } from "react";

/* Bloquea el scroll del documento mientras `locked` sea true.

   Lleva la cuenta de cuántos consumidores lo pidieron en vez de poner y quitar
   la clase directamente: si el modal de contacto y la home lo piden a la vez,
   que uno se desmonte no debe desbloquear el scroll que el otro sigue
   necesitando. */

let locks = 0;

export function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return undefined;

    locks += 1;
    document.documentElement.classList.add("is-locked");

    return () => {
      locks = Math.max(0, locks - 1);
      if (locks === 0) {
        document.documentElement.classList.remove("is-locked");
      }
    };
  }, [locked]);
}
