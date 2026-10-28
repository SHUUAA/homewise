// Builds the high-resolution hero asset from the original source photo.
//   node scripts/prepare-hero.mjs
//
// 1. Super-resolution: if `assets/hero-residence-x4.png` exists (4× upscale
//    made with Real-ESRGAN, see below) it is used as the master — it has real
//    recovered detail. Otherwise we fall back to a Lanczos3 upscale, which is
//    smooth but cannot add detail.
//      ../_tools/realesrgan/realesrgan-ncnn-vulkan.exe \
//        -i assets/hero-residence-source.jpg -o assets/hero-residence-x4.png \
//        -n realesrgan-x4plus -s 4
// 2. Bakes the colour grade into the pixels (it used to be three live CSS
//    filters, which had to be recomputed every frame of the intro animation).
// 3. Exports a 3840px high-quality JPEG; next/image serves resized WebP from it.
import fs from "node:fs";
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "assets", "hero-residence-source.jpg");
const esrgan = path.join(root, "assets", "hero-residence-x4.png");
// NOTE: next/image caches optimised variants by URL, not by file contents —
// if you regenerate with different pixels, also rename the file (and update
// `Hero.tsx`) or clear `.next/cache/images`, otherwise stale sizes are served.
const out = path.join(root, "public", "images", "hero-residence-4k.jpg");
const SIZE = 3840;

const useEsrgan = fs.existsSync(esrgan);

// Real-ESRGAN deepens shadows / adds global contrast. Match its per-channel
// mean + stdev back to the original photo so only *detail* is added, not a
// different tonality.
let master = source;
if (useEsrgan) {
  const [src, up] = await Promise.all([sharp(source).stats(), sharp(esrgan).stats()]);
  const a = [0, 1, 2].map((i) => src.channels[i].stdev / up.channels[i].stdev);
  const b = [0, 1, 2].map((i) => src.channels[i].mean - a[i] * up.channels[i].mean);
  master = await sharp(esrgan).removeAlpha().linear(a, b).png().toBuffer();
  console.log("tone match  gain", a.map((v) => v.toFixed(3)).join("/"), " offset", b.map((v) => v.toFixed(1)).join("/"));
}
let img = sharp(master).resize(SIZE, SIZE, { kernel: sharp.kernel.lanczos3 });

// same grade as the former `saturate(.7) brightness(.9) contrast(.95)`
const contrast = 0.95;
img = img.modulate({ saturation: 0.7, brightness: 0.9 }).linear(contrast, 128 * (1 - contrast));

// ESRGAN output is already crisp — only a whisper of sharpening; the Lanczos
// fallback needs a stronger unsharp mask to not look soft
img = useEsrgan ? img.sharpen({ sigma: 0.6, m1: 0.3, m2: 0.6 }) : img.sharpen({ sigma: 1.1, m1: 0.6, m2: 1.4 });

await img.jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: "4:4:4" }).toFile(out);

const meta = await sharp(out).metadata();
const kb = Math.round(fs.statSync(out).size / 1024);
console.log(`✓ ${path.relative(root, out)} ${meta.width}×${meta.height} ${kb}KB (${useEsrgan ? "Real-ESRGAN master" : "Lanczos fallback"})`);
