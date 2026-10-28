"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SERVICES, SERVICE_SEQUENCE, TECHNOLOGY_STEP_START } from "@/lib/data";
import { useHomeWise } from "./context";
import { FooterRow } from "./primitives";
import { ServiceVisualFace, ServiceWordFace } from "./ServiceFaces";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* ------------------------------------------------------------------ */
/* Cube: both halves rotate around X in opposite directions, exactly   */
/* like the transition captured in the reference (frame @ 6.5s).       */
/* ------------------------------------------------------------------ */

function faceTransform(angle: number, depth: number) {
  return `translateZ(${-depth}px) rotateX(${angle}deg) translateZ(${depth}px)`;
}

function ServiceCube({ index }: { index: number }) {
  const [faces, setFaces] = useState({ from: index, to: index });
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const shown = useRef(index);

  // when the target changes, start (or restart) a flip from what is on screen
  useEffect(() => {
    if (index === shown.current && !tl.current) return;
    tl.current?.progress(1).kill();
    tl.current = null;
    setFaces({ from: shown.current, to: index });
    shown.current = index;
  }, [index]);

  useLayoutEffect(() => {
    if (faces.from === faces.to) {
      // idle: the reused DOM nodes must not keep the last rotation
      root.current?.querySelectorAll<HTMLElement>("[data-face]").forEach((f) => {
        f.style.transform = "";
        f.style.filter = "";
      });
      return;
    }
    const el = root.current!;
    const leftOld = el.querySelector<HTMLElement>("[data-face='left-old']")!;
    const leftNew = el.querySelector<HTMLElement>("[data-face='left-new']")!;
    const rightOld = el.querySelector<HTMLElement>("[data-face='right-old']")!;
    const rightNew = el.querySelector<HTMLElement>("[data-face='right-new']")!;
    const depth = el.offsetHeight / 2;
    const p = { v: 0 };
    const render = () => {
      const a = p.v * 90;
      leftOld.style.transform = faceTransform(a, depth);
      leftNew.style.transform = faceTransform(a - 90, depth);
      rightOld.style.transform = faceTransform(-a, depth);
      rightNew.style.transform = faceTransform(90 - a, depth);
      const shade = Math.sin(p.v * Math.PI) * 0.45;
      leftOld.style.filter = rightOld.style.filter = `brightness(${1 - p.v * 0.5})`;
      leftNew.style.filter = rightNew.style.filter = `brightness(${0.5 + p.v * 0.5})`;
      el.style.setProperty("--cube-shade", String(shade));
    };
    render();
    tl.current = gsap.timeline({
      onComplete: () => {
        tl.current = null;
        setFaces((f) => ({ from: f.to, to: f.to }));
      },
    });
    tl.current.to(p, { v: 1, duration: 1.05, ease: "power3.inOut", onUpdate: render });
    tl.current.fromTo(el, { scale: 1 }, { scale: 0.96, duration: 0.52, ease: "power2.in", yoyo: true, repeat: 1 }, 0);
    return () => {
      // keep running across re-renders; the effect above handles restarts
    };
  }, [faces]);

  const animating = faces.from !== faces.to;
  const faceCls = "absolute inset-0 [backface-visibility:hidden] will-change-transform";

  return (
    <div
      ref={root}
      data-verify="service-card"
      className="absolute left-120 top-110 flex h-195 w-439 [perspective:calc(var(--u)*900)] max-md:inset-x-16 max-md:top-90 max-md:h-300 max-md:w-auto max-md:flex-col"
    >
      {/* left — big word */}
      <div className="relative h-full w-1/2 [transform-style:preserve-3d] max-md:h-1/3 max-md:w-full">
        <div data-face="left-old" className={faceCls}>
          <ServiceWordFace index={faces.from} />
        </div>
        {animating && (
          <div data-face="left-new" className={faceCls}>
            <ServiceWordFace index={faces.to} />
          </div>
        )}
      </div>
      {/* right — interior + widgets */}
      <div className="relative h-full w-1/2 [transform-style:preserve-3d] max-md:h-2/3 max-md:w-full">
        <div data-face="right-old" className={faceCls}>
          <ServiceVisualFace index={faces.from} />
        </div>
        {animating && (
          <div data-face="right-new" className={faceCls}>
            <ServiceVisualFace index={faces.to} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Looping tab rail                                                    */
/* ------------------------------------------------------------------ */

function TabRail({ activeIndex, onSelect }: { activeIndex: number; onSelect: (i: number) => void }) {
  const track = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = track.current!;
    // one set is a third of the track; loop it seamlessly
    const tween = gsap.fromTo(el, { xPercent: -100 / 3 + 3 }, { xPercent: (-100 / 3) * 2 + 3, duration: 60, ease: "none", repeat: -1 });
    return () => tween.kill();
  });

  return (
    <div
      data-verify="service-tabs"
      className="absolute left-1/2 top-336 h-14 w-screen -translate-x-1/2 overflow-hidden max-md:top-auto max-md:bottom-40"
      role="tablist"
      aria-label="Services"
    >
      <div ref={track} className="flex h-full w-max items-center">
        {[0, 1, 2].flatMap((set) =>
          SERVICES.map((s, i) => {
            const active = i === activeIndex;
            return (
              <button
                key={`${set}-${s.key}`}
                type="button"
                role="tab"
                aria-selected={active}
                tabIndex={set === 1 ? 0 : -1}
                onClick={() => onSelect(i)}
                data-verify={set === 1 ? `tab-${s.key}` : undefined}
                data-active={active}
                className={`w-131 shrink-0 text-center text-u10 uppercase tracking-[-0.01em] transition-colors duration-700 ease-(--ease-hw-out) ${
                  active ? "text-hw-accent" : "text-hw-ink/85 hover:text-hw-accent-soft"
                }`}
              >
                {s.label}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Services() {
  const { serviceStep, setServiceStep, scrollToSection } = useHomeWise();
  const sectionRef = useRef<HTMLElement>(null);
  const serviceIndex = SERVICE_SEQUENCE[serviceStep];

  useGSAP(
    () => {
      const steps = SERVICE_SEQUENCE.length;
      const st = ScrollTrigger.create({
        id: "services",
        trigger: sectionRef.current,
        start: "top top",
        end: () => `+=${window.innerHeight * steps * 0.75}`,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          setServiceStep(Math.min(steps - 1, Math.floor(self.progress * steps * 0.9999)));
        },
      });
      return () => st.kill();
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="services"
      data-section="services"
      aria-labelledby="services-title"
      className="section-screen bg-hw-bg"
    >
      <span id="technologies" className="absolute top-0" aria-hidden />
      <div className="stage">
        <h2 id="services-title" className="sr-only">
          Services — {SERVICES[serviceIndex].title}
        </h2>
        {/* big frame brackets */}
        <span aria-hidden data-verify="services-bracket-left" className="absolute left-22 top-101 h-211 w-28 border-y border-l border-white/85 max-md:hidden" />
        <span aria-hidden data-verify="services-bracket-right" className="absolute left-610 top-101 h-211 w-28 border-y border-r border-white/85 max-md:hidden" />

        <ServiceCube index={serviceIndex} />

        <TabRail
          activeIndex={serviceIndex}
          onSelect={(i) => {
            const step = SERVICE_SEQUENCE.indexOf(i);
            scrollToSection("services", step);
          }}
        />
        <FooterRow />
      </div>
    </section>
  );
}

export function stepToSection(step: number) {
  return step >= TECHNOLOGY_STEP_START ? ("technologies" as const) : ("services" as const);
}
