import fs from "node:fs";
import path from "node:path";

/* Detecta por convención qué proyectos de Lab tienen video de portada.

   Escanea public/img/lab/<slug>/ y, si encuentra el archivo, lo expone en un
   módulo virtual. Así alcanza con soltar `portadaVideo.mp4` en la carpeta del
   proyecto: no hay que declararlo en ningún lado ni tocar código.

   Se hace acá, en tiempo de build, y no probando la URL desde el navegador,
   porque el navegador tendría que pedir cada archivo para saber si existe.
   Además el aviso de "tiene video" quedaría mal hasta que la prueba falle: el
   video recién se descarga al pasar el mouse, así que sin esta lista no habría
   forma de saberlo antes.

   En dev, agregar o borrar un video recarga solo. */

const VIRTUAL_ID = "virtual:lab-media";
const RESOLVED_ID = "\0" + VIRTUAL_ID;

const DEFAULTS = {
  dir: "public/img/lab",
  videoName: "portadaVideo.mp4",
  urlBase: "/img/lab",
};

export function labMedia(options = {}) {
  const { dir, videoName, urlBase } = { ...DEFAULTS, ...options };
  let root = process.cwd();

  function scan() {
    const base = path.resolve(root, dir);
    const found = {};
    if (!fs.existsSync(base)) return found;

    for (const slug of fs.readdirSync(base)) {
      const folder = path.join(base, slug);
      let stat;
      try {
        stat = fs.statSync(folder);
      } catch {
        continue;
      }
      if (!stat.isDirectory()) continue;
      if (fs.existsSync(path.join(folder, videoName))) {
        found[slug] = `${urlBase}/${slug}/${videoName}`;
      }
    }
    return found;
  }

  return {
    name: "lab-media",

    configResolved(config) {
      root = config.root;
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
      return null;
    },

    load(id) {
      if (id !== RESOLVED_ID) return null;
      const found = scan();
      return [
        "// Generado por vite-plugin-lab-media. No editar a mano.",
        `export const coverVideos = ${JSON.stringify(found, null, 2)};`,
        "",
      ].join("\n");
    },

    configureServer(server) {
      const watchDir = path.resolve(root, dir);
      server.watcher.add(watchDir);

      const refresh = (file) => {
        if (!file.endsWith(videoName)) return;
        if (!file.startsWith(watchDir)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: "full-reload" });
      };

      server.watcher.on("add", refresh);
      server.watcher.on("unlink", refresh);
    },
  };
}
