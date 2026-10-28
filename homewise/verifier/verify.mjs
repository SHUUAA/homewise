#!/usr/bin/env node
/**
 * HomeWise visual verifier agent
 * --------------------------------
 * Drives the site into the same states captured in the reference video,
 * screenshots them, and compares them with frames extracted from the video:
 *   • pixel/tonal/structural similarity (tonal grid, SSIM, edge F1, pixelmatch)
 *   • geometry of key elements vs. boxes measured from the video
 *   • required copy, nav / tab active states, palette and typography
 * Produces verifier/output/report.{md,html,json} plus side-by-side images.
 *
 * Usage: node verifier/verify.mjs [--url http://localhost:3000] [--only hero,clients] [--refresh-refs]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import ffmpegPath from "ffmpeg-static";
import { readPng, writePng, tonalScore, ssim, edgeF1, composite } from "./lib/image.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith("--")) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : true]);
    return acc;
  }, [])
);
const URL_BASE = args.url || "http://localhost:3000";
const spec = JSON.parse(fs.readFileSync(path.join(here, "reference-spec.json"), "utf8"));
const only = typeof args.only === "string" ? args.only.split(",") : null;
const states = spec.states.filter((s) => !only || only.includes(s.id));

const refDir = path.join(here, "reference");
const outDir = path.join(here, "output");
fs.mkdirSync(refDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

/* ------------------------------------------------ 1. reference frames */
const video = path.resolve(here, spec.video);
const { x, y, w, h } = spec.siteCrop;
for (const s of states) {
  const file = path.join(refDir, `${s.id}.png`);
  if (fs.existsSync(file) && !args["refresh-refs"]) continue;
  execFileSync(ffmpegPath, [
    "-v", "error", "-y", "-ss", String(s.videoTime), "-i", video, "-frames:v", "1",
    "-vf", `crop=${w}:${h}:${x}:${y},scale=${spec.viewport.width}:${spec.viewport.height}:flags=lanczos`,
    file,
  ]);
}
console.log(`✓ reference frames ready (${states.length})`);

/* --------------------------------------------------------- 2. browser */
async function launch() {
  for (const channel of ["chrome", "msedge", undefined]) {
    try {
      return await chromium.launch({ channel, args: ["--hide-scrollbars", "--force-color-profile=srgb"] });
    } catch {
      /* try next */
    }
  }
  throw new Error("No Chromium available — run `npx playwright install chromium`.");
}

const browser = await launch();
const context = await browser.newContext({ viewport: spec.viewport, deviceScaleFactor: 1 });
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(String(e)));

async function freshLoad() {
  await page.goto(`${URL_BASE}/?verify`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => !!(window.__hw && window.__hw.ready && window.__hw.intro), null, {
    timeout: 90000,
    polling: 250,
  });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "[data-verify='cursor']{display:none!important}" });
}

async function finishIntro() {
  await page.evaluate(() => window.__hw.intro.progress(1));
  await page.waitForTimeout(150);
}

/** returns key boxes in reference units relative to the 660×412 stage
 *  (the union of all matches, so e.g. both title brackets form one box) */
async function measure(selectors) {
  return page.evaluate((sels) => {
    const vw = innerWidth, vh = innerHeight;
    const u = Math.min(vw / 660, vh / 412);
    const sx = (vw - 660 * u) / 2, sy = (vh - 412 * u) / 2;
    const out = {};
    for (const sel of sels) {
      const els = [...document.querySelectorAll(sel)];
      if (!els.length) { out[sel] = null; continue; }
      const rs = els.map((el) => el.getBoundingClientRect());
      const l = Math.min(...rs.map((r) => r.left)), t = Math.min(...rs.map((r) => r.top));
      const r = Math.max(...rs.map((x) => x.right)), b = Math.max(...rs.map((x) => x.bottom));
      out[sel] = [(l - sx) / u, (t - sy) / u, (r - l) / u, (b - t) / u].map((v) => Math.round(v * 10) / 10);
    }
    return out;
  }, selectors);
}

/* ----------------------------------------------------------- 3. run */
const results = [];
await freshLoad();

for (const s of states) {
  const a = s.action;
  if (a.type === "intro") {
    if (results.length && results.at(-1).action?.type !== "intro") await freshLoad();
    await page.evaluate((t) => {
      const tl = window.__hw.intro;
      tl.pause();
      if (t >= tl.duration()) tl.progress(1);
      else tl.seek(t, false);
    }, a.t);
    await page.waitForTimeout(250);
  } else if (a.type === "goto") {
    await finishIntro();
    await page.mouse.move(2, 2);
    await page.evaluate(({ section, step }) => window.__hw.goto(section, step), a);
    await page.waitForTimeout(a.settle ?? 1200);
    if (a.hover) {
      const box = await page.locator(a.hover).boundingBox();
      if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
      await page.waitForTimeout(1100);
    }
  }

  const shot = path.join(outDir, `${s.id}.site.png`);
  await page.screenshot({ path: shot });

  // ---- image metrics
  const ref = readPng(path.join(refDir, `${s.id}.png`));
  const site = readPng(shot);
  const diff = new PNG({ width: ref.width, height: ref.height });
  const diffPixels = pixelmatch(ref.data, site.data, diff.data, ref.width, ref.height, { threshold: 0.2, alpha: 0.35, diffColor: [246, 95, 55] });
  writePng(path.join(outDir, `${s.id}.compare.png`), composite([ref, site, diff]));
  const tonalFull = tonalScore(ref, site);
  // photo-dominated states: our photography is intentionally original, so the
  // pass/fail tonal score only looks at the UI layer (spec boxes) inside the
  // photo region; the full-frame score stays in the report as information
  const inBox = (bx, px, py) => px >= bx[0] && py >= bx[1] && px <= bx[0] + bx[2] && py <= bx[1] + bx[3];
  const uiBoxes = [...(s.boxes || []).map((b) => b.box).filter((b) => b.every((v) => v !== null)), ...(s.uiRegions || [])];
  const include = s.photoRegion
    ? (px, py) => !inBox(s.photoRegion, px, py) || uiBoxes.some((bx) => inBox(bx, px, py))
    : null;
  const tonal = include ? tonalScore(ref, site, 44, 28, 110, include) : tonalFull;
  const structural = ssim(ref, site);
  const edgeFull = edgeF1(ref, site);
  const edge = include ? edgeF1(ref, site, 660, 412, 90, include) : edgeFull;

  // ---- DOM checks
  const checks = [];
  const boxes = (s.boxes || []).filter((b) => b.box.some((v) => v !== null));
  const measured = await measure(boxes.map((b) => b.selector));
  for (const b of boxes) {
    const m = measured[b.selector];
    if (!m) { checks.push({ kind: "box", name: b.selector, pass: false, detail: "element not found" }); continue; }
    const deltas = b.box.map((v, i) => (v === null ? 0 : Math.abs(m[i] - v)));
    const worst = Math.max(...deltas);
    checks.push({
      kind: "box", name: b.selector, pass: worst <= b.tol,
      detail: `expected [${b.box.map((v) => v ?? "·").join(", ")}] got [${m.join(", ")}] Δmax ${worst.toFixed(1)}u (tol ${b.tol})`,
    });
  }
  if (s.texts) {
    const text = await page.evaluate(() => document.body.innerText);
    for (const t of s.texts) checks.push({ kind: "text", name: t, pass: text.includes(t), detail: text.includes(t) ? "present" : "missing" });
  }
  if (s.navActive) {
    const ok = await page.evaluate((id) => document.querySelector(`[data-verify='nav-${id}']`)?.dataset.active === "true", s.navActive);
    checks.push({ kind: "state", name: `nav active = ${s.navActive}`, pass: ok, detail: ok ? "ok" : "wrong nav item highlighted" });
  }
  if (s.tabActive) {
    const ok = await page.evaluate((id) => document.querySelector(`[data-verify='tab-${id}']`)?.dataset.active === "true", s.tabActive);
    checks.push({ kind: "state", name: `tab active = ${s.tabActive}`, pass: ok, detail: ok ? "ok" : "wrong tab highlighted" });
  }
  const minTonal = s.minTonalScore ?? 0.6;
  checks.push({
    kind: "visual", name: include ? "tonal layout score (UI layer)" : "tonal layout score", pass: tonal >= minTonal,
    detail: `${tonal.toFixed(3)} (min ${minTonal})${include ? ` · full frame incl. original photo ${tonalFull.toFixed(3)}` : ""}`,
  });
  if (s.minEdgeF1) {
    checks.push({
      kind: "visual", name: include ? "edge alignment F1 (UI layer)" : "edge alignment F1", pass: edge.f1 >= s.minEdgeF1,
      detail: `${edge.f1.toFixed(3)} (min ${s.minEdgeF1}) · recall ${edge.recall.toFixed(3)} · precision ${edge.precision.toFixed(3)}${include ? ` · full frame incl. original photo ${edgeFull.f1.toFixed(3)}` : ""}`,
    });
  }

  const r = {
    id: s.id, description: s.description, videoTime: s.videoTime, action: a,
    metrics: { tonal, tonalFull, ssim: structural, edgeF1: edge.f1, edgeF1Full: edgeFull.f1, edgeRecall: edge.recall, edgePrecision: edge.precision, pixelDiff: diffPixels / (ref.width * ref.height) },
    checks,
  };
  results.push(r);
  const failed = checks.filter((c) => !c.pass).length;
  console.log(`${failed ? "✗" : "✓"} ${s.id.padEnd(20)} tonal ${tonal.toFixed(3)}  ssim ${structural.toFixed(3)}  edgeF1 ${edge.f1.toFixed(3)}  checks ${checks.length - failed}/${checks.length}`);
}

/* --------------------------------------------------- global checks */
await finishIntro();
const globals = await page.evaluate(() => {
  const toHex = (c) => {
    const m = c.match(/\d+(\.\d+)?/g)?.map(Number) ?? [0, 0, 0];
    return "#" + m.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  };
  return {
    background: toHex(getComputedStyle(document.body).backgroundColor),
    accent: toHex(getComputedStyle(document.querySelector("[data-verify='signup']")).backgroundColor),
    font: getComputedStyle(document.querySelector("h1")).fontFamily,
    h1Count: document.querySelectorAll("h1").length,
    title: document.title,
    description: document.querySelector("meta[name='description']")?.content ?? "",
    cursor: !!document.querySelector("[data-verify='cursor']"),
  };
});
const globalChecks = [
  { name: "page background", pass: globals.background === spec.palette.background, detail: globals.background },
  { name: "accent colour", pass: globals.accent === spec.palette.accent, detail: globals.accent },
  { name: "display font", pass: /inter.?tight/i.test(globals.font), detail: globals.font },
  { name: "single <h1>", pass: globals.h1Count === 1, detail: String(globals.h1Count) },
  { name: "title + meta description", pass: !!globals.title && globals.description.length > 50, detail: globals.title },
  { name: "custom reticle cursor", pass: globals.cursor, detail: globals.cursor ? "present" : "missing" },
  { name: "no console errors", pass: consoleErrors.length === 0, detail: consoleErrors.slice(0, 3).join(" | ") || "none" },
];
await browser.close();

/* ---------------------------------------------------------- 4. report */
const allChecks = [...results.flatMap((r) => r.checks), ...globalChecks];
const failedChecks = allChecks.filter((c) => !c.pass);
const avg = (k) => results.reduce((s, r) => s + r.metrics[k], 0) / Math.max(1, results.length);
const summary = {
  generatedAt: new Date().toISOString(),
  url: URL_BASE,
  passed: allChecks.length - failedChecks.length,
  total: allChecks.length,
  averages: { tonal: avg("tonal"), ssim: avg("ssim"), edgeF1: avg("edgeF1") },
};
fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify({ summary, globals: globalChecks, results }, null, 2));

const md = [
  `# HomeWise ↔ reference video — verification report`,
  ``,
  `Generated ${summary.generatedAt} against ${URL_BASE}`,
  ``,
  `**${summary.passed}/${summary.total} checks passed** · avg tonal ${summary.averages.tonal.toFixed(3)} · avg SSIM ${summary.averages.ssim.toFixed(3)} · avg edge-F1 ${summary.averages.edgeF1.toFixed(3)}`,
  ``,
  `| State | Video t | Tonal | SSIM | Edge F1 | Pixel diff | Checks |`,
  `|---|---|---|---|---|---|---|`,
  ...results.map((r) => `| ${r.id} | ${r.videoTime}s | ${r.metrics.tonal.toFixed(3)} | ${r.metrics.ssim.toFixed(3)} | ${r.metrics.edgeF1.toFixed(3)} | ${(r.metrics.pixelDiff * 100).toFixed(1)}% | ${r.checks.filter((c) => c.pass).length}/${r.checks.length} |`),
  ``,
  `## Global`,
  ...globalChecks.map((c) => `- ${c.pass ? "✅" : "❌"} ${c.name} — ${c.detail}`),
  ``,
  ...results.flatMap((r) => [
    `## ${r.id} — ${r.description}`,
    ``,
    `![${r.id}](./${r.id}.compare.png)`,
    `*reference | site | diff*`,
    ``,
    ...r.checks.map((c) => `- ${c.pass ? "✅" : "❌"} **${c.kind}** ${c.name} — ${c.detail}`),
    ``,
  ]),
].join("\n");
fs.writeFileSync(path.join(outDir, "report.md"), md);

const html = `<!doctype html><meta charset="utf-8"><title>HomeWise verification</title>
<style>body{font:14px/1.5 system-ui;background:#120f13;color:#eee;padding:32px;max-width:2100px;margin:auto}img{width:100%;border-radius:8px}
.ok{color:#7ddc9a}.bad{color:#f65f37}table{border-collapse:collapse}td,th{padding:4px 12px;border-bottom:1px solid #333;text-align:left}h2{margin-top:48px}</style>
<h1>HomeWise ↔ reference — ${summary.passed}/${summary.total} checks passed</h1>
<p>avg tonal ${summary.averages.tonal.toFixed(3)} · SSIM ${summary.averages.ssim.toFixed(3)} · edge-F1 ${summary.averages.edgeF1.toFixed(3)}</p>
<ul>${globalChecks.map((c) => `<li class="${c.pass ? "ok" : "bad"}">${c.name} — ${c.detail}</li>`).join("")}</ul>
${results.map((r) => `<h2>${r.id} <small>(${r.videoTime}s)</small></h2><p>${r.description}</p><img src="${r.id}.compare.png"><p><em>reference | site | diff</em></p>
<table>${r.checks.map((c) => `<tr class="${c.pass ? "ok" : "bad"}"><td>${c.pass ? "✓" : "✗"}</td><td>${c.kind}</td><td>${c.name}</td><td>${c.detail}</td></tr>`).join("")}</table>`).join("")}`;
fs.writeFileSync(path.join(outDir, "report.html"), html);

console.log(`\n${failedChecks.length ? "✗" : "✓"} ${summary.passed}/${summary.total} checks passed — report: ${path.join(outDir, "report.md")}`);
if (failedChecks.length) {
  console.log("\nFailures:");
  for (const c of failedChecks) console.log(`  - ${c.name}: ${c.detail}`);
}
process.exitCode = failedChecks.length ? 1 : 0;
