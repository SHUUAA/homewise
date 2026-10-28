"use client";

import { forwardRef } from "react";
import { Home, Orbit, Cpu, UsersRound, MessageCircle } from "lucide-react";
import { NAV_ITEMS, type SectionId } from "@/lib/data";
import { useHomeWise } from "./context";

const ICONS: Record<SectionId, typeof Home> = {
  home: Home,
  services: Orbit,
  technologies: Cpu,
  clients: UsersRound,
  contacts: MessageCircle,
};

/**
 * Fixed top navigation. The pill splits around the active item exactly like
 * the reference: [items before] [ACTIVE · orange] [items after].
 */
export const Nav = forwardRef<HTMLElement>(function Nav(_, ref) {
  const { active, scrollToSection } = useHomeWise();
  const activeIndex = NAV_ITEMS.findIndex((i) => i.id === active);

  return (
    <header
      ref={ref}
      data-verify="nav"
      className="pointer-events-none fixed inset-x-0 top-0 z-50"
    >
      <div className="stage !h-auto">
        <a
          href="#home"
          aria-label="HomeWise Network — home"
          data-verify="logo"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection("home");
          }}
          className="pointer-events-auto absolute left-22.5 top-13.5 grid size-18 place-items-center rounded-full bg-[rgba(40,37,42,0.62)] text-u5h tracking-[-0.04em] text-hw-ink backdrop-blur-md transition-colors hover:bg-hw-accent"
        >
          HN
        </a>

        <nav
          aria-label="Primary"
          data-verify="nav-pill"
          className="pointer-events-auto absolute left-1/2 top-13.5 flex h-17.5 -translate-x-1/2 items-stretch max-md:hidden"
        >
          {NAV_ITEMS.map((item, i) => {
            const isActive = i === activeIndex;
            const groupStart = i === 0 || i === activeIndex + 1;
            const groupEnd = i === NAV_ITEMS.length - 1 || i === activeIndex - 1;
            const Icon = ICONS[item.id];
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                data-verify={`nav-${item.id}`}
                data-active={isActive}
                aria-current={isActive ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(item.id);
                }}
                className={[
                  "relative flex items-center whitespace-nowrap text-u6 tracking-[-0.01em] backdrop-blur-md",
                  "transition-[background-color,border-radius,margin,padding,color] duration-500 ease-(--ease-hw-out)",
                  isActive
                    ? "mx-1 gap-2 rounded-full bg-hw-accent px-6.5 text-white"
                    : "bg-[rgba(40,37,42,0.62)] px-8.5 text-hw-ink/90 hover:text-hw-accent-soft",
                  !isActive && groupStart ? "rounded-l-full pl-13.5" : "",
                  !isActive && groupEnd ? "rounded-r-full pr-13.5" : "",
                  !isActive && !groupStart && !groupEnd ? "rounded-none" : "",
                  !isActive && groupStart && !groupEnd ? "rounded-r-none" : "",
                  !isActive && groupEnd && !groupStart ? "rounded-l-none" : "",
                ].join(" ")}
              >
                <span
                  className={`grid overflow-hidden transition-[width,opacity] duration-500 ease-(--ease-hw-out) ${
                    isActive ? "w-6 opacity-100" : "w-0 opacity-0"
                  }`}
                >
                  <Icon className="size-6" strokeWidth={1.6} />
                </span>
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="pointer-events-auto absolute right-23 top-13.5 flex h-17.5 gap-1.5">
          <a
            href="#contacts"
            data-verify="login"
            className="grid place-items-center rounded-full bg-[rgba(40,37,42,0.62)] px-6 text-u5h text-hw-ink backdrop-blur-md transition-colors hover:bg-[rgba(70,66,72,0.8)]"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("contacts");
            }}
          >
            Log In
          </a>
          <a
            href="#contacts"
            data-verify="signup"
            className="grid place-items-center rounded-full bg-hw-accent px-6 text-u5h text-white transition-[background-color,box-shadow] hover:bg-hw-accent-soft hover:shadow-[0_0_24px_rgba(246,95,55,0.45)]"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("contacts");
            }}
          >
            Sign Up
          </a>
        </div>
      </div>
    </header>
  );
});
