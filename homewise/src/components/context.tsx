"use client";

import { createContext, useContext } from "react";
import type Lenis from "lenis";
import type { SectionId } from "@/lib/data";

export type HomeWiseCtx = {
  lenis: React.RefObject<Lenis | null>;
  active: SectionId;
  setActive: (id: SectionId) => void;
  serviceStep: number;
  setServiceStep: (step: number) => void;
  introDone: boolean;
  setIntroDone: (done: boolean) => void;
  verifyMode: boolean;
  scrollToSection: (id: SectionId, step?: number, immediate?: boolean) => void;
};

export const HomeWiseContext = createContext<HomeWiseCtx | null>(null);

export function useHomeWise() {
  const ctx = useContext(HomeWiseContext);
  if (!ctx) throw new Error("useHomeWise must be used inside <HomeWise />");
  return ctx;
}

/** Read the live reference unit (1u = 1px of the 660×412 reference frame). */
export function getUnit() {
  if (typeof window === "undefined") return 1;
  const v = getComputedStyle(document.documentElement).getPropertyValue("--u");
  // --u is an expression; resolve it by measuring a probe element.
  const probe = document.createElement("div");
  probe.style.cssText = `position:absolute;visibility:hidden;width:calc(${v || "1px"} * 100)`;
  document.body.appendChild(probe);
  const u = probe.getBoundingClientRect().width / 100;
  probe.remove();
  return u || 1;
}
