import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 4123,
    strictPort: true,
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        /* GSAP sólo lo usa el preloader y pesa bastante: separarlo del resto
           de vendor evita que una página que no anima tenga que bajarlo junto
           con React. */
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("gsap")) return "gsap";
          if (id.includes("react-router")) return "router";
          if (id.includes("react")) return "react";
        },
      },
    },
  },
});
