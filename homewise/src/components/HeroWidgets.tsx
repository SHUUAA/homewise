"use client";

import { useState } from "react";
import { Volume2, Video, Fan, Mic, KeyRound, WashingMachine, House, ChevronDown, Lightbulb, Thermometer, Tv } from "lucide-react";
import { CornerBox } from "./primitives";

/* ------------------------------------------------------------------ */
/* Hotspots: bracketed icon boxes connected to labels with thin lines  */
/* All coordinates are reference units on the 660×412 stage.           */
/* ------------------------------------------------------------------ */

export const HOTSPOTS = [
  {
    id: "security",
    Icon: KeyRound,
    box: { x: 100, y: 149, w: 32, h: 27 },
    path: "M116 176 V201 H23.5",
    dot: { x: 23.5, y: 201 },
    label: ["House security"],
    labelPos: { x: 22, y: 211 },
  },
  {
    id: "household",
    Icon: WashingMachine,
    box: { x: 306, y: 151, w: 32, h: 27 },
    path: "M322 151 V126.5 H414",
    dot: { x: 414, y: 126.5 },
    label: ["Household needs", "management"],
    labelPos: { x: 413, y: 98 },
  },
  {
    id: "control",
    Icon: House,
    box: { x: 330, y: 245, w: 31, h: 27 },
    path: "M346 272 V296 H438",
    dot: { x: 438, y: 296 },
    label: ["Seamlessly", "house control"],
    labelPos: { x: 437, y: 267 },
  },
] as const;

export function HotspotLines() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full overflow-visible max-md:hidden"
      viewBox="0 0 660 412"
      preserveAspectRatio="none"
    >
      {HOTSPOTS.map((h) => (
        <path
          key={h.id}
          data-hero="line"
          d={h.path}
          pathLength={1}
          fill="none"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

export function Hotspots() {
  return (
    <div className="max-md:hidden">
      {HOTSPOTS.map(({ id, Icon, box, dot, label, labelPos }) => (
        <div key={id} data-verify={`hotspot-${id}`}>
          <div data-hero="hotspot-box">
          <CornerBox
            size={6}
            className="group/hs absolute grid place-items-center"
            style={{
              left: `calc(var(--u) * ${box.x})`,
              top: `calc(var(--u) * ${box.y})`,
              width: `calc(var(--u) * ${box.w})`,
              height: `calc(var(--u) * ${box.h})`,
            }}
          >
            <button
              type="button"
              aria-label={label.join(" ")}
              className="grid size-full place-items-center text-white/90 transition-colors duration-300 hover:text-hw-accent"
            >
              <Icon className="size-11 transition-transform duration-500 ease-(--ease-hw-out) group-hover/hs:scale-110" strokeWidth={1.1} />
            </button>
          </CornerBox>
          </div>
          <span
            data-hero="dot"
            className="dot-pulse absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            style={{ left: `calc(var(--u) * ${dot.x})`, top: `calc(var(--u) * ${dot.y})` }}
          />
          <p
            data-hero="label"
            className="absolute text-u5 leading-[1.35] text-white/90"
            style={{ left: `calc(var(--u) * ${labelPos.x})`, top: `calc(var(--u) * ${labelPos.y})` }}
          >
            {label.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Glass widgets (thermostat + quick access, bedroom scene)            */
/* ------------------------------------------------------------------ */

function useClock() {
  // fixed to match the reference frame (24/03/23 · 18:00)
  return { date: "24/03/23", time: "18:00" };
}

export function ClimateWidget() {
  const { date, time } = useClock();
  const [temp, setTemp] = useState(24);
  const [on, setOn] = useState<Record<string, boolean>>({});
  const quick = [
    { id: "sound", Icon: Volume2, label: "Speakers" },
    { id: "camera", Icon: Video, label: "Cameras" },
    { id: "fan", Icon: Fan, label: "Ventilation" },
    { id: "voice", Icon: Mic, label: "Voice assistant" },
  ];
  // ring indicator angle: 18°C → -150°, 30°C → +150° (0° = 3 o'clock)
  const angle = -8 + (temp - 24) * 18;

  return (
    <div
      data-hero="widget"
      data-verify="widget-climate"
      className="glass absolute left-479 top-89 h-87 w-158 rounded-u11 max-md:hidden"
    >
      <div data-hero="widget-content" className="absolute inset-0">
        <button
          type="button"
          aria-label={`Thermostat ${temp} degrees. Click to raise, shift-click to lower.`}
          onClick={(e) => setTemp((t) => Math.max(16, Math.min(30, t + (e.shiftKey ? -1 : 1))))}
          className="absolute left-9 top-8.5 size-70 rounded-full border border-white/80 text-white"
        >
          <span
            className="absolute left-1/2 top-1/2 size-0 transition-transform duration-700 ease-(--ease-hw-out)"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <span className="absolute left-[calc(var(--u)*35)] top-0 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
          </span>
          <span className="absolute inset-x-0 top-17 text-center text-u4h text-white/85">{date}</span>
          <span className="display absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-u20 font-extralight tracking-[-0.02em]">
            {temp}°C
          </span>
          <span className="absolute inset-x-0 bottom-15 text-center text-u4h text-white/85">{time}</span>
        </button>

        <p className="absolute left-91 top-9 text-u5h text-white/95">Good Morning, Alex</p>
        <p className="absolute left-91 top-25 text-u5 text-white/90">Quick Access</p>
        <div className="absolute left-91 top-36.5 grid grid-cols-2 gap-x-3.5 gap-y-2.5">
          {quick.map(({ id, Icon, label }) => (
            <button
              key={id}
              type="button"
              aria-label={label}
              aria-pressed={!!on[id]}
              data-on={!!on[id]}
              onClick={() => setOn((s) => ({ ...s, [id]: !s[id] }))}
              className="orb size-19.5"
            >
              <Icon className="size-8" strokeWidth={1.4} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BedroomWidget() {
  const [scene, setScene] = useState<string | null>("light");
  const items = [
    { id: "light", Icon: Lightbulb },
    { id: "climate", Icon: Thermometer },
    { id: "tv", Icon: Tv },
  ];
  return (
    <div
      data-hero="widget"
      data-verify="widget-bedroom"
      className="glass absolute left-530 top-181 h-54 w-107 overflow-hidden rounded-u11 max-md:hidden"
    >
      <div data-hero="widget-content" className="absolute inset-0">
        <p className="absolute left-9 top-6.5 flex items-center gap-2 text-u5h text-white/95">
          Bedroom <ChevronDown className="size-4 text-white/70" strokeWidth={1.5} />
        </p>
        <p className="absolute left-9 top-17 text-u4 text-white/45">3 devices active</p>
        <div className="absolute bottom-5 left-8 flex gap-2">
          {items.map(({ id, Icon }) => (
            <button
              key={id}
              type="button"
              aria-label={`Bedroom ${id}`}
              aria-pressed={scene === id}
              onClick={() => setScene((s) => (s === id ? null : id))}
              className={`grid size-17 place-items-center rounded-full border transition-colors duration-300 ${
                scene === id ? "border-white bg-white/45 text-white" : "border-white/60 bg-white/15 text-white/80 hover:bg-white/30"
              }`}
            >
              <Icon className="size-6.5" strokeWidth={1.4} />
            </button>
          ))}
        </div>
        <div className="absolute bottom-4 right-3.5 top-4 w-41 overflow-hidden rounded-u8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/service-concierge.png"
            alt="Bedroom live view"
            className="size-full object-cover grayscale-[0.6] brightness-90"
          />
        </div>
      </div>
    </div>
  );
}
