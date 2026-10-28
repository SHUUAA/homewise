"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SERVICE_SEQUENCE, TECHNOLOGY_STEP_START, type SectionId } from "@/lib/data";
import { HomeWiseContext, type HomeWiseCtx } from "./context";
import { Cursor } from "./Cursor";
import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { Services, stepToSection } from "./Services";
import { Clients } from "./Clients";
import { Contacts } from "./Contacts";

gsap.registerPlugin(ScrollTrigger);

const SECTION_ORDER: Exclude<SectionId, "technologies">[] = ["home", "services", "clients", "contacts"];

/** Root client component — smooth scrolling, shared state and verifier hooks. */
export function HomeWise() {
  const lenis = useRef<Lenis | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<SectionId>("home");
  const [serviceStep, setServiceStep] = useState(0);
  const [introDone, setIntroDone] = useState(false);
  const [verifyMode] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("verify")
  );
  const stepRef = useRef(0);
  useEffect(() => {
    stepRef.current = serviceStep;
  }, [serviceStep]);

  /* ---------------------------------------------------- smooth scrolling */
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const l = new Lenis({ duration: 1.25, easing: (t) => 1 - Math.pow(1 - t, 4), autoRaf: false });
    lenis.current = l;
    l.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => l.raf(time * 1000);
    gsap.ticker.add(tick);
    // a frame that takes > 100ms (e.g. a GC or decode stall) advances
    // animations by one frame instead of jumping ahead by the whole stall
    gsap.ticker.lagSmoothing(100, 33);
    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      gsap.ticker.remove(tick);
      l.destroy();
      lenis.current = null;
    };
  }, []);

  /* ------------------------------------------- active section detection */
  const introDoneRef = useRef(false);
  useEffect(() => {
    introDoneRef.current = introDone;
  }, [introDone]);
  useEffect(() => {
    const update = () => {
      // nothing can scroll during the intro; skip the layout reads so they
      // don't force a synchronous layout on every animation frame
      if (!introDoneRef.current) return;
      const mid = window.innerHeight / 2;
      let current: SectionId = "home";
      for (const id of SECTION_ORDER) {
        const el = document.getElementById(id);
        if (!el) continue;
        const box = (el.parentElement?.classList.contains("pin-spacer") ? el.parentElement : el).getBoundingClientRect();
        if (box.top <= mid && box.bottom > mid) current = id;
      }
      if (current === "services") current = stepToSection(stepRef.current);
      setActive((prev) => (prev === current ? prev : current));
    };
    update();
    gsap.ticker.add(update);
    return () => gsap.ticker.remove(update);
  }, []);

  /* ------------------------------------------------------ navigation */
  const scrollToSection = useCallback<HomeWiseCtx["scrollToSection"]>((id, step, immediate) => {
    const l = lenis.current;
    let y = 0;
    if (id === "services" || id === "technologies") {
      const st = ScrollTrigger.getById("services");
      const target = step ?? (id === "technologies" ? TECHNOLOGY_STEP_START : 0);
      if (st) {
        const steps = SERVICE_SEQUENCE.length;
        y = st.start + ((st.end - st.start) * (target + 0.5)) / steps;
        if (target === 0) y = st.start + 2;
      }
    } else if (id === "clients") {
      const st = ScrollTrigger.getById("clients");
      y = st ? st.start + 2 : document.getElementById(id)!.offsetTop;
    } else if (id === "contacts") {
      y = document.documentElement.scrollHeight - window.innerHeight;
    }
    if (l) l.scrollTo(y, { duration: immediate ? 0 : 1.6, immediate: !!immediate, force: true });
    else window.scrollTo(0, y);
  }, []);

  /* ------------------------------------------------ verifier hooks */
  useEffect(() => {
    const w = window as unknown as { __hw?: Record<string, unknown> };
    w.__hw = {
      ...(w.__hw || {}),
      ready: true,
      verifyMode,
      goto: (id: SectionId, step?: number) => {
        lenis.current?.start();
        scrollToSection(id, step, true);
        ScrollTrigger.update();
      },
      scrollY: (y: number) => {
        lenis.current?.start();
        lenis.current?.scrollTo(y, { immediate: true, force: true });
        ScrollTrigger.update();
      },
      triggers: () =>
        ScrollTrigger.getAll().map((t) => ({ id: t.vars.id, start: t.start, end: t.end })),
    };
  }, [scrollToSection, verifyMode]);

  const ctx = useMemo<HomeWiseCtx>(
    () => ({
      lenis,
      active,
      setActive,
      serviceStep,
      setServiceStep,
      introDone,
      setIntroDone,
      verifyMode,
      scrollToSection,
    }),
    [active, serviceStep, introDone, verifyMode, scrollToSection]
  );

  return (
    <HomeWiseContext.Provider value={ctx}>
      <Cursor />
      <Nav ref={navRef} />
      <main>
        <Hero navRef={navRef} />
        <Services />
        <Clients />
        <Contacts />
      </main>
    </HomeWiseContext.Provider>
  );
}
