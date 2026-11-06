/* Baja el modelo de MediaPipe a public/models/ para presentar sin internet.

   Sin este archivo el sitio funciona igual: pide el modelo al bucket oficial
   de Google la primera vez que se activan las manos. Con él, todo (runtime
   WASM + modelo) sale del propio servidor.

   El modelo pesa ~8MB y no va a git (public/models/ está en .gitignore).

     npm run hands:model */

import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const URL_MODEL =
  "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "public/models/gesture_recognizer.task");

const existing = await stat(out).catch(() => null);
if (existing && existing.size > 1_000_000 && !process.argv.includes("--force")) {
  console.log(`Already there: ${out} (${(existing.size / 1e6).toFixed(1)} MB). Use --force to download again.`);
  process.exit(0);
}

console.log(`Downloading ${URL_MODEL}`);
const res = await fetch(URL_MODEL);
if (!res.ok) {
  console.error(`Download failed: HTTP ${res.status}`);
  process.exit(1);
}
const buf = Buffer.from(await res.arrayBuffer());
await mkdir(dirname(out), { recursive: true });
await writeFile(out, buf);
console.log(`Saved ${out} (${(buf.length / 1e6).toFixed(1)} MB)`);
