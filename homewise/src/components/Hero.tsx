"use client";

import { useRef, type CSSProperties } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useHomeWise, getUnit } from "./context";
import { Brackets } from "./primitives";
import { HotspotLines, Hotspots, ClimateWidget, BedroomWidget } from "./HeroWidgets";

gsap.registerPlugin(useGSAP);

/**
 * Intro choreography, fitted to the reference video (measured every 0.1s with
 * _reference/measure2.js, reference units).
 *
 * Every channel is one eased tween (instead of a spline through the raw,
 * slightly noisy samples) so the speed never wobbles, and only transforms and
 * clip-path are animated — no layout, no font-size, no live filters — so each
 * frame stays cheap:
 *   - the title is laid out once at its final size; earlier states are drawn
 *     by scaling / sliding the two words and the brackets
 *   - the picture box is a clip-path, the photo inside it is scaled with a
 *     transform so the whole scene stays visible (like object-cover)
 */
const TITLE_FINAL = { ts: 54.3, gap: 14, ty: 354.5 };
const TITLE_START = { ts: 35.1, gap: 215, ty: 210 };
/** picture box at the start (inside the title gap), in stage units */
const PICTURE_START = { x: 253, y: 153, w: 185, h: 105 };
/** vertical focus of the photo — 62% frames the house like the reference
 *  (default `object-[50%_62%]`). On very wide windows the focus moves up just
 *  enough that the summit (≈29% down the square photo) stays in frame: the
 *  part cropped above the photo never exceeds `MAX_TOP_CROP`. */
const FOCUS_Y = 0.62;
const MAX_TOP_CROP = 0.24;
const focusFor = (w: number, h: number) => {
  const overflow = 1 - Math.min(1, h / w); // square photo, object-cover
  return overflow > 0 ? Math.min(FOCUS_Y, MAX_TOP_CROP / overflow) : FOCUS_Y;
};

/** start time / duration / ease for each animated channel (seconds) */
const CH = {
  gap: { at: 0.62, dur: 0.68, ease: "sine.inOut" },
  ts: { at: 0.6, dur: 1.5, ease: "sine.inOut" },
  // the title drops fast, then settles slowly: two segments whose speeds
  // match at the joint (≈280u/s at 1.45s)
  tyDrop: { at: 1.12, dur: 0.33, ease: "sine.in" },
  tySettle: { at: 1.45, dur: 0.61, ease: "power1.out" },
  // quadratic in-out (GSAP "power1") fits the measured box sizes best
  picX: { at: 0.62, dur: 1.13, ease: "power1.inOut" },
  picY: { at: 0.6, dur: 1.25, ease: "power1.inOut" },
};
/** title centre where the fast drop hands over to the slow settle */
const TY_JOINT = 269;

type Props = { navRef: React.RefObject<HTMLElement | null> };

export function Hero({ navRef }: Props) {
  const { setIntroDone, verifyMode, lenis } = useHomeWise();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const moverRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const leftWordRef = useRef<HTMLSpanElement>(null);
  const rightWordRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current!;
      const stage = stageRef.current!;
      const image = imageRef.current!;
      const mover = moverRef.current!;
      const title = titleRef.current!;
      const leftWord = leftWordRef.current!;
      const rightWord = rightWordRef.current!;
      const bracketL = title.querySelector<HTMLElement>("[data-bracket='left']")!;
      const bracketR = title.querySelector<HTMLElement>("[data-bracket='right']")!;
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      const q = gsap.utils.selector(section);

      const ui = q("[data-hero='ui']");
      const lines = q("[data-hero='line']");
      const boxes = q("[data-hero='hotspot-box']");
      const dots = q("[data-hero='dot']");
      const labels = q("[data-hero='label']");
      const widgets = q("[data-hero='widget']");
      const widgetContent = q("[data-hero='widget-content']");
      const nav = navRef.current;

      if (mobile) {
        // simplified intro on small screens
        gsap.from([title, ...ui], { autoAlpha: 0, y: 20, stagger: 0.08, duration: 1, ease: "power3.out" });
        setIntroDone(true);
        return;
      }

      /* ---------------------------------------------------- geometry */
      // stage + section geometry (px), refreshed on resize
      const geo = { u: 1, ox: 0, oy: 0, sw: 0, sh: 0, fy: FOCUS_Y };
      // final (untransformed) title layout (px)
      const tg = { cx: 0, lLeft: 0, lW: 0, rLeft: 0, rW: 0, rRight: 0 };
      const img = mover.querySelector("img");
      const measure = () => {
        const s = section.getBoundingClientRect();
        const st = stage.getBoundingClientRect();
        const fy = focusFor(s.width, s.height);
        Object.assign(geo, { u: getUnit(), ox: st.left - s.left, oy: st.top - s.top, sw: s.width, sh: s.height, fy });
        if (img) img.style.objectPosition = `50% ${(fy * 100).toFixed(2)}%`;
        for (const el of [title, leftWord, rightWord, bracketL, bracketR]) el.style.transform = "";
        const l = leftWord.getBoundingClientRect();
        const r = rightWord.getBoundingClientRect();
        Object.assign(tg, { cx: (l.left + r.right) / 2, lLeft: l.left, lW: l.width, rLeft: r.left, rW: r.width, rRight: r.right });
      };

      /* ------------------------------------------------------- state */
      // pX / pY: 0 = picture in the title gap, 1 = covering the whole section
      const state = { ...TITLE_START, pX: 0, pY: 0 };

      const renderTitle = () => {
        const { u } = geo;
        const k = state.ts / TITLE_FINAL.ts;
        const total = (tg.lW + tg.rW) * k + state.gap * u;
        const left = tg.cx - total / 2;
        const right = tg.cx + total / 2;
        const dxL = left - tg.lLeft;
        const dxR = right - tg.rW * k - tg.rLeft;
        leftWord.style.transform = `translate3d(${dxL.toFixed(2)}px,0,0) scale(${k.toFixed(4)})`;
        rightWord.style.transform = `translate3d(${dxR.toFixed(2)}px,0,0) scale(${k.toFixed(4)})`;
        bracketL.style.transform = `translate3d(${dxL.toFixed(2)}px,0,0)`;
        bracketR.style.transform = `translate3d(${(right - tg.rRight).toFixed(2)}px,0,0)`;
        title.style.transform = `translate3d(0,${((state.ty - TITLE_FINAL.ty) * u).toFixed(2)}px,0)`;
      };

      const renderPicture = () => {
        const { u, ox, oy, sw, sh, fy } = geo;
        if (state.pX >= 1 && state.pY >= 1) {
          image.style.clipPath = "";
          mover.style.transform = "";
          return;
        }
        // interpolate from the gap box to the full section (not just the stage,
        // so wide / tall viewports finish full-bleed without a jump)
        const L = gsap.utils.interpolate(ox + PICTURE_START.x * u, 0, state.pX);
        const W = gsap.utils.interpolate(PICTURE_START.w * u, sw, state.pX);
        const T = gsap.utils.interpolate(oy + PICTURE_START.y * u, 0, state.pY);
        const H = gsap.utils.interpolate(PICTURE_START.h * u, sh, state.pY);
        image.style.clipPath = `inset(${T.toFixed(2)}px ${(sw - L - W).toFixed(2)}px ${(sh - T - H).toFixed(2)}px ${L.toFixed(2)}px)`;
        // scale the full-bleed photo so it "covers" the box around the same focus point
        const s = Math.max(W / sw, H / sh);
        const tx = L - 0.5 * (s * sw - W);
        const ty = T - fy * (s * sh - H);
        mover.style.transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) scale(${s.toFixed(5)})`;
      };

      const render = () => {
        renderTitle();
        renderPicture();
      };

      measure();
      render();

      gsap.set(ui, { autoAlpha: 0 });
      gsap.set(lines, { autoAlpha: 0, attr: { "stroke-dasharray": "1 1", "stroke-dashoffset": 1 } });
      gsap.set([boxes, dots, labels], { autoAlpha: 0 });
      gsap.set(widgets, { autoAlpha: 0, scale: 0.94, transformOrigin: "50% 50%" });
      gsap.set(widgetContent, { autoAlpha: 0 });
      if (nav) gsap.set(nav, { autoAlpha: 0, y: -12 });

      lenis.current?.stop();

      /* ---------------------------------------------------- timeline */
      const tl = gsap.timeline({
        paused: true,
        onUpdate: render,
        onComplete: () => {
          lenis.current?.start();
          setIntroDone(true);
        },
      });
      const ch = (key: keyof typeof CH, vars: gsap.TweenVars) =>
        tl.to(state, { ...vars, duration: CH[key].dur, ease: CH[key].ease }, CH[key].at);

      ch("gap", { gap: TITLE_FINAL.gap });
      ch("ts", { ts: TITLE_FINAL.ts });
      ch("tyDrop", { ty: TY_JOINT });
      ch("tySettle", { ty: TITLE_FINAL.ty });
      ch("picX", { pX: 1 });
      ch("picY", { pY: 1 });
      // the interface draws in once the picture is full-bleed (1.55s → 2.9s)
      if (nav) tl.to(nav, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }, 1.55);
      tl.to(ui, { autoAlpha: 1, duration: 0.6, stagger: 0.06, ease: "power2.out" }, 1.6);
      tl.to(widgets, { autoAlpha: 1, scale: 1, duration: 0.7, stagger: 0.12, ease: "power3.out" }, 1.6);
      tl.to(lines, { autoAlpha: 1, attr: { "stroke-dashoffset": 0 }, duration: 0.8, stagger: 0.1, ease: "power2.inOut" }, 1.8);
      tl.to(boxes, { autoAlpha: 1, duration: 0.5, stagger: 0.1 }, 1.85);
      tl.to(widgetContent, { autoAlpha: 1, duration: 0.6, stagger: 0.12, ease: "power2.out" }, 2.05);
      tl.to(dots, { autoAlpha: 1, duration: 0.4, stagger: 0.1 }, 2.25);
      tl.to(labels, { autoAlpha: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" }, 2.3);

      const onResize = () => {
        measure();
        render();
      };
      window.addEventListener("resize", onResize);

      /* ------------------------------------------------------- start */
      // Start only once the web font (title metrics) and the hero photo are
      // ready and the main thread is idle — starting during hydration / image
      // decode is what made the first frames stutter and jump.
      let cancelled = false;
      const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
      const idle = () =>
        new Promise<void>((r) =>
          "requestIdleCallback" in window ? window.requestIdleCallback(() => r(), { timeout: 600 }) : setTimeout(r, 120)
        );
      const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
      Promise.race([
        Promise.all([document.fonts.ready, img?.decode().catch(() => undefined)]),
        wait(2500), // never hold the intro hostage to a slow network
      ])
        .then(idle)
        .then(nextFrame)
        .then(() => {
          if (cancelled) return;
          measure(); // fonts are in: re-measure the final title layout
          render();
          // expose for the visual verifier (only once geometry is final)
          const w = window as unknown as { __hw?: Record<string, unknown> };
          w.__hw = { ...(w.__hw || {}), intro: tl };
          if (!verifyMode) tl.play(0);
        });

      // subtle parallax as the hero scrolls away
      gsap.to(img, {
        yPercent: 8,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
      });

      return () => {
        cancelled = true;
        window.removeEventListener("resize", onResize);
      };
    },
    { scope: sectionRef, dependencies: [] }
  );

  return (
    <section
      ref={sectionRef}
      id="home"
      data-section="home"
      aria-label="HomeWise Network — smart home services"
      className="section-screen bg-hw-bg"
    >
      {/* full-bleed picture revealed by the intro (clip-path box + scaled photo) */}
      <div ref={imageRef} data-verify="hero-image" className="absolute inset-0 overflow-hidden">
        <div ref={moverRef} className="absolute inset-0 origin-top-left">
          <Image
            src="/images/hero-residence-4k.jpg"
            alt="Minimal concrete house in front of a forested mountain peak"
            fill
            preload
            fetchPriority="high"
            quality={90}
            sizes="100vw"
            className="object-cover object-[50%_62%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/20" />
        </div>
      </div>

      <div ref={stageRef} className="stage">
        {/* intro copy */}
        <p
          data-hero="ui"
          data-verify="hero-intro"
          className="absolute left-22 top-70 w-161 text-u5 leading-[1.45] text-white/80 max-md:top-50 max-md:w-200"
        >
          At HomeWise Network we believe a home should feel like a calm, intelligent sanctuary. Our connected services
          learn your routines, anticipate what you need and keep every room secure, efficient and comfortable — so you
          can simply enjoy living there.
        </p>

        <HotspotLines />
        <Hotspots />
        <ClimateWidget />
        <BedroomWidget />

        <p data-hero="ui" className="absolute left-24 top-300 text-u5h text-white/90 max-md:top-250">
          Since 2016
        </p>
        <a
          href="#contacts"
          data-hero="ui"
          data-verify="cta-trial"
          className="absolute left-530 top-298 grid h-21 w-63 place-items-center rounded-full bg-hw-accent text-u6 text-white transition-[background-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:bg-hw-accent-soft hover:shadow-[0_0_30px_rgba(246,95,55,0.5)] max-md:left-auto max-md:right-22 max-md:top-245"
        >
          Get Free Trial
        </a>

        {/* the bracketed brand title — laid out at its final size, the intro scales it */}
        <div
          ref={titleRef}
          data-verify="hero-title"
          className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 max-md:top-[calc(var(--u)*330)]!"
          style={{ top: `calc(var(--u) * ${TITLE_FINAL.ty})` } as CSSProperties}
        >
          <Brackets tick={23} className="flex h-85 items-center px-18 max-md:h-110 max-md:px-8">
            <h1
              className="display text-white max-md:whitespace-normal max-md:text-center"
              style={{ fontSize: `calc(var(--u) * ${TITLE_FINAL.ts})`, letterSpacing: "-0.006em" }}
            >
              <span ref={leftWordRef} className="inline-block origin-left">
                (HOME)WISE
              </span>
              <span
                aria-hidden
                className="inline-block max-md:block max-md:h-0"
                style={{ width: `calc(var(--u) * ${TITLE_FINAL.gap})` }}
              />
              <span className="sr-only"> </span>
              <span ref={rightWordRef} className="inline-block origin-left">
                NETWORK
              </span>
            </h1>
          </Brackets>
        </div>
      </div>
    </section>
  );
}
