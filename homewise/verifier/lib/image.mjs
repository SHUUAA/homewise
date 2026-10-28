// Image utilities for the visual verifier (pure JS — pngjs only).
import fs from "node:fs";
import { PNG } from "pngjs";

export const readPng = (file) => PNG.sync.read(fs.readFileSync(file));
export const writePng = (file, png) => fs.writeFileSync(file, PNG.sync.write(png));

/** Box-filter downscale to an exact size. */
export function resize(png, w, h) {
  const out = new PNG({ width: w, height: h });
  const sx = png.width / w;
  const sy = png.height / h;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
      const y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
      let r = 0, g = 0, b = 0, n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * png.width + xx) << 2;
          r += png.data[i]; g += png.data[i + 1]; b += png.data[i + 2]; n++;
        }
      }
      const o = (y * w + x) << 2;
      out.data[o] = r / n; out.data[o + 1] = g / n; out.data[o + 2] = b / n; out.data[o + 3] = 255;
    }
  }
  return out;
}

export function gray(png) {
  const g = new Float32Array(png.width * png.height);
  for (let i = 0; i < g.length; i++) {
    const o = i << 2;
    g[i] = 0.299 * png.data[o] + 0.587 * png.data[o + 1] + 0.114 * png.data[o + 2];
  }
  return g;
}

/**
 * Tonal layout score: compares a coarse colour grid (where light, dark and
 * accent masses sit). 1 = identical distribution.
 * `include(xu, yu)` (optional) restricts the comparison to grid cells whose
 * centre — in 660×412 reference units — passes the predicate.
 */
export function tonalScore(a, b, cols = 44, rows = 28, tolerance = 110, include = null) {
  const A = resize(a, cols, rows);
  const B = resize(b, cols, rows);
  let s = 0, n = 0;
  for (let i = 0; i < cols * rows; i++) {
    if (include) {
      const cx = ((i % cols) + 0.5) * (660 / cols);
      const cy = (Math.floor(i / cols) + 0.5) * (412 / rows);
      if (!include(cx, cy)) continue;
    }
    const o = i << 2;
    const d = Math.hypot(A.data[o] - B.data[o], A.data[o + 1] - B.data[o + 1], A.data[o + 2] - B.data[o + 2]);
    s += Math.max(0, 1 - d / tolerance);
    n++;
  }
  return n ? s / n : 1;
}

/** Global SSIM over 8×8 windows on a 330×206 grayscale version. */
export function ssim(a, b, w = 330, h = 206) {
  const A = gray(resize(a, w, h));
  const B = gray(resize(b, w, h));
  const C1 = (0.01 * 255) ** 2, C2 = (0.03 * 255) ** 2;
  let total = 0, n = 0;
  for (let y = 0; y + 8 <= h; y += 4) {
    for (let x = 0; x + 8 <= w; x += 4) {
      let ma = 0, mb = 0;
      for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { const k = (y + j) * w + x + i; ma += A[k]; mb += B[k]; }
      ma /= 64; mb /= 64;
      let va = 0, vb = 0, cov = 0;
      for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
        const k = (y + j) * w + x + i; const da = A[k] - ma, db = B[k] - mb;
        va += da * da; vb += db * db; cov += da * db;
      }
      va /= 63; vb /= 63; cov /= 63;
      total += ((2 * ma * mb + C1) * (2 * cov + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2));
      n++;
    }
  }
  return total / n;
}

function edges(png, w, h, threshold) {
  const g = gray(resize(png, w, h));
  const e = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const k = y * w + x;
      const gx = -g[k - w - 1] - 2 * g[k - 1] - g[k + w - 1] + g[k - w + 1] + 2 * g[k + 1] + g[k + w + 1];
      const gy = -g[k - w - 1] - 2 * g[k - w] - g[k - w + 1] + g[k + w - 1] + 2 * g[k + w] + g[k + w + 1];
      e[k] = Math.hypot(gx, gy) > threshold ? 1 : 0;
    }
  }
  return e;
}

function dilate(e, w, h, r) {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!e[y * w + x]) continue;
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      const xx = x + i, yy = y + j;
      if (xx >= 0 && yy >= 0 && xx < w && yy < h) out[yy * w + xx] = 1;
    }
  }
  return out;
}

/**
 * Edge layout F1: how well hard edges (text, brackets, card borders, nav
 * pills) line up, with a 2px tolerance at 660×412.
 * `include(xu, yu)` (optional) limits scoring to pixels (= reference units at
 * the default 660×412 size) that pass the predicate.
 */
export function edgeF1(a, b, w = 660, h = 412, threshold = 90, include = null) {
  const ea = edges(a, w, h, threshold), eb = edges(b, w, h, threshold);
  const da = dilate(ea, w, h, 2), db = dilate(eb, w, h, 2);
  let na = 0, nb = 0, hitA = 0, hitB = 0;
  for (let i = 0; i < w * h; i++) {
    if (include && !include(((i % w) + 0.5) * (660 / w), (Math.floor(i / w) + 0.5) * (412 / h))) continue;
    if (ea[i]) { na++; if (db[i]) hitA++; }
    if (eb[i]) { nb++; if (da[i]) hitB++; }
  }
  const recall = na ? hitA / na : 1; // reference edges reproduced
  const precision = nb ? hitB / nb : 1; // site edges that exist in reference
  return { f1: recall + precision ? (2 * recall * precision) / (recall + precision) : 0, recall, precision };
}

/** Side-by-side composite: reference | site | diff (each scaled to w×h). */
export function composite(images, w = 660, h = 412, gap = 8) {
  const out = new PNG({ width: images.length * w + (images.length - 1) * gap, height: h });
  out.data.fill(255);
  images.forEach((img, idx) => {
    const r = img.width === w && img.height === h ? img : resize(img, w, h);
    for (let y = 0; y < h; y++) {
      r.data.copy(out.data, ((y * out.width) + idx * (w + gap)) << 2, (y * w) << 2, ((y + 1) * w) << 2);
    }
  });
  return out;
}
