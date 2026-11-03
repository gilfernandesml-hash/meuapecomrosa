import { createRequire } from "node:module";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const nextRequire = createRequire(require.resolve("next/package.json"));
const sharp = nextRequire("sharp");

// Keep the original brand assets; generated WebP files do not use Vercel transformations.
for (const [name, width] of [["hero-rosa-imovel-v2", 1254], ["hero-condominio-mcmv-v2", 2048], ["rosa-oliveira-oficial", 960], ["og", 1200]]) {
  const source = new URL(`../public/${name}.png`, import.meta.url);
  const output = new URL(`../public/${name}.webp`, import.meta.url);
  await sharp(fileURLToPath(source)).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(fileURLToPath(output));
  const before = (await stat(source)).size;
  const after = (await stat(output)).size;
  console.log(`${name}: ${before} -> ${after} bytes (${Math.round(100 * (1 - after / before))}% menor)`);
}
