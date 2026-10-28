"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Reticle cursor from the reference: an orange dot inside four thin corner
 * brackets that trails the pointer and opens up over interactive elements.
 */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    document.documentElement.classList.add("has-custom-cursor");

    const xTo = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" });
    let shown = false;

    const move = (e: PointerEvent) => {
      if (!shown) {
        gsap.set(el, { x: e.clientX, y: e.clientY });
        gsap.to(el, { opacity: 1, duration: 0.3 });
        shown = true;
      }
      xTo(e.clientX);
      yTo(e.clientY);
      const target = e.target as HTMLElement | null;
      const interactive = !!target?.closest("a, button, [data-cursor='hover']");
      el.dataset.hover = interactive ? "true" : "false";
    };
    const leave = () => {
      gsap.to(el, { opacity: 0, duration: 0.3 });
      shown = false;
    };
    const down = () => (el.dataset.down = "true");
    const up = () => (el.dataset.down = "false");

    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      data-verify="cursor"
      data-hover="false"
      className="group/cursor pointer-events-none fixed left-0 top-0 z-[100] opacity-0 max-md:hidden"
    >
      <div className="relative -translate-x-1/2 -translate-y-1/2 size-14 transition-[width,height] duration-300 ease-(--ease-hw-out) group-data-[hover=true]/cursor:size-20 group-data-[down=true]/cursor:size-11">
        <span
          className="corners transition-[--corner-color] duration-300"
          style={{ "--corner-size": "calc(var(--u) * 4.5)", "--corner-color": "rgba(255,255,255,0.8)" } as React.CSSProperties}
        />
        <span className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-hw-accent shadow-[0_0_10px_rgba(246,95,55,0.6)] transition-transform duration-300 group-data-[hover=true]/cursor:scale-125" />
      </div>
    </div>
  );
}
