"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  Lock,
  LockOpen,
  ChevronRight,
  Video,
  KeyRound,
  Mic,
  Plus,
  Sun,
  Zap,
  BatteryCharging,
  Blinds,
  Moon,
  Sunrise,
  DoorOpen,
  TrendingDown,
  Activity,
} from "lucide-react";
import { SERVICES, type ServiceKey } from "@/lib/data";
import { CornerBox } from "./primitives";

/* ---------------------------------------------------------------- left */

/** Left face: the service name drifting as an endless bracketed marquee. */
export function ServiceWordFace({ index }: { index: number }) {
  const track = useRef<HTMLDivElement>(null);
  const label = SERVICES[index].label.toUpperCase();

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const tween = gsap.to(el, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
    return () => {
      tween.kill();
    };
  }, []);

  const item = (k: number) => (
    <div key={k} className="relative mr-35 flex h-55 shrink-0 items-center px-3" style={{ "--tick": "calc(var(--u) * 10)", "--bracket-color": "rgba(246,95,55,0.75)" } as React.CSSProperties}>
      <span className="bracket-l" />
      <span className="display text-u38 text-hw-accent">{label}</span>
      <span className="bracket-r" />
    </div>
  );

  return (
    <div className="absolute inset-0 overflow-hidden bg-hw-panel">
      <div className="absolute left-0 top-1/2 -translate-y-1/2">
        <div ref={track} className="flex w-max">
          {[0, 1, 2, 3, 4, 5].map(item)}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- right */

function GlassTile({
  className = "",
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div className={`glass-dark absolute rounded-u10 ${className}`} style={style}>
      {children}
    </div>
  );
}

function LockTile({ title, x }: { title: [string, string]; x: number }) {
  const [locked, setLocked] = useState(true);
  return (
    <GlassTile className="top-58 h-44.5 w-43" style={{ left: `calc(var(--u) * ${x})` }}>
      <button
        type="button"
        onClick={() => setLocked((l) => !l)}
        aria-pressed={locked}
        aria-label={`${title.join(" ")}: ${locked ? "locked" : "unlocked"}`}
        className="absolute inset-0 text-left"
      >
        <span className="absolute left-5.5 top-5 text-u5 leading-[1.3] text-white/90">
          {title[0]}
          <br />
          {title[1]}
        </span>
        <span className="absolute bottom-6 left-5 flex items-center gap-1">
          <span className={`grid size-12 place-items-center rounded-full transition-colors duration-300 ${locked ? "bg-white text-[#3a363b]" : "bg-white/30 text-white"}`}>
            <Lock className="size-6" strokeWidth={1.6} />
          </span>
          <ChevronRight className="size-4 text-white/60" />
          <span className={`grid size-12 place-items-center rounded-full transition-colors duration-300 ${!locked ? "bg-white text-[#3a363b]" : "bg-white/30 text-white"}`}>
            <LockOpen className="size-6" strokeWidth={1.6} />
          </span>
        </span>
      </button>
    </GlassTile>
  );
}

function SecurityWidgets() {
  return (
    <>
      <LockTile title={["Front Door", "Lock"]} x={10.5} />
      <LockTile title={["Garage", "Lock"]} x={60.5} />
      <CornerBox size={6} className="absolute left-9.5 top-145 grid h-28 w-32 place-items-center text-white/90">
        <KeyRound className="size-12" strokeWidth={1.1} />
      </CornerBox>
      <GlassTile className="left-107.5 top-128 h-53 w-102">
        <p className="absolute left-6 top-5 flex items-center gap-3 text-u5 text-white/90">
          <Video className="size-7" strokeWidth={1.3} /> Camera Views
        </p>
        <div className="absolute inset-x-5 bottom-5 grid grid-cols-3 gap-2.5">
          {["/images/client-5.png", "/images/client-4.png", "/images/client-3.png"].map((src, i) => (
            <button key={src} type="button" className="group/cam text-left" aria-label={`Open camera ${i + 1}`}>
              <span className="block h-20 overflow-hidden rounded-u6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="size-full object-cover transition-transform duration-500 group-hover/cam:scale-110" />
              </span>
              <span className="mt-1 block text-u4 text-white/70">Camera {i + 1}</span>
            </button>
          ))}
        </div>
      </GlassTile>
    </>
  );
}

function ConciergeWidgets() {
  const [tasks, setTasks] = useState([
    { t: "10:00", label: "Kitchen cleaning", done: true },
    { t: "12:00", label: "Grocery delivery", done: true },
    { t: "17:00", label: "Garage", done: false },
  ]);
  return (
    <>
      <div className="glass-dark absolute left-10.5 top-51 flex h-25 w-123 items-center rounded-full">
        <span className="grid size-25 place-items-center rounded-full bg-white/10 text-white/90">
          <Mic className="size-8" strokeWidth={1.3} />
        </span>
        <span className="ml-8 text-u5h text-white/90">Hi, Alex! How can I help you?</span>
      </div>
      <GlassTile className="left-117 top-90 h-76 w-69">
        <p className="mt-6 text-center text-u5h text-white/90">Today</p>
        <ul className="mt-4 space-y-3 px-6">
          {tasks.map((task, i) => (
            <li key={task.t}>
              <button
                type="button"
                onClick={() => setTasks((ts) => ts.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}
                className="flex items-center gap-3 text-left text-u4h text-white/85"
              >
                <span className={`size-7 shrink-0 rounded-full border transition-colors duration-300 ${task.done ? "border-white bg-white" : "border-white/80"}`} />
                {task.t} · {task.label}
              </button>
            </li>
          ))}
        </ul>
        <span className="absolute bottom-4 left-1/2 grid size-11 -translate-x-1/2 place-items-center rounded-full bg-white text-[#3a363b]">
          <Plus className="size-6" strokeWidth={2} />
        </span>
      </GlassTile>
      <GlassTile className="left-10.5 top-125 h-40 w-43">
        <span className="absolute left-4.5 top-4.5 grid size-13 place-items-center rounded-full bg-white/80 text-[#3a363b]">
          <Sun className="size-7" strokeWidth={1.4} />
        </span>
        <span className="absolute right-6 top-8 text-u4h text-white/60">22%</span>
        <p className="absolute bottom-9 left-5 text-u5 text-white/90">Smart Light 2</p>
        <p className="absolute bottom-4.5 left-5 text-u4 text-white/55">Active till 22:00</p>
      </GlassTile>
    </>
  );
}

function EnergyWidgets() {
  const bars = [38, 52, 30, 64, 46, 72, 40];
  return (
    <>
      <GlassTile className="left-10.5 top-51 h-62 w-98">
        <p className="absolute left-6 top-5 flex items-center gap-2.5 text-u5 text-white/90">
          <Zap className="size-6.5" strokeWidth={1.4} /> Consumption today
        </p>
        <p className="display absolute left-6 top-15 text-u16 text-white">12.4<span className="ml-1 text-u6 text-white/70">kWh</span></p>
        <div className="absolute bottom-5 left-6 right-6 flex h-18 items-end gap-2">
          {bars.map((b, i) => (
            <span key={i} className={`flex-1 rounded-full ${i === 5 ? "bg-hw-accent" : "bg-white/55"}`} style={{ height: `${b}%` }} />
          ))}
        </div>
      </GlassTile>
      <GlassTile className="left-115 top-120 h-50 w-90">
        <p className="absolute left-6 top-5 flex items-center gap-2.5 text-u5 text-white/90">
          <BatteryCharging className="size-6.5" strokeWidth={1.4} /> Solar battery
        </p>
        <div className="absolute inset-x-6 top-21 h-5 overflow-hidden rounded-full bg-white/20">
          <span className="block h-full w-[78%] rounded-full bg-white" />
        </div>
        <p className="absolute bottom-5 left-6 text-u4h text-white/70">78% · 6h 20m reserve</p>
      </GlassTile>
      <CornerBox size={6} className="absolute left-9.5 top-145 grid h-28 w-32 place-items-center text-white/90">
        <Sun className="size-12" strokeWidth={1.1} />
      </CornerBox>
    </>
  );
}

function AutomationWidgets() {
  const [scene, setScene] = useState("evening");
  const scenes = [
    { id: "morning", label: "Morning", Icon: Sunrise },
    { id: "away", label: "Away", Icon: DoorOpen },
    { id: "evening", label: "Night", Icon: Moon },
  ];
  return (
    <>
      <GlassTile className="left-10.5 top-51 h-44 w-118">
        <p className="absolute left-6 top-5 text-u5 text-white/90">Scenes</p>
        <div className="absolute bottom-5 left-6 flex gap-3">
          {scenes.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setScene(id)}
              aria-pressed={scene === id}
              className={`flex h-14 items-center gap-2 rounded-full px-5 text-u4h transition-colors duration-300 ${scene === id ? "bg-white text-[#3a363b]" : "bg-white/20 text-white/85 hover:bg-white/30"}`}
            >
              <Icon className="size-5.5" strokeWidth={1.5} /> {label}
            </button>
          ))}
        </div>
      </GlassTile>
      <GlassTile className="left-115 top-118 h-52 w-90">
        <p className="absolute left-6 top-5 flex items-center gap-2.5 text-u5 text-white/90">
          <Blinds className="size-6.5" strokeWidth={1.4} /> Living room blinds
        </p>
        <div className="absolute inset-x-6 top-23 h-1 rounded-full bg-white/25">
          <span className="absolute left-0 top-0 h-full w-[60%] rounded-full bg-white" />
          <span className="absolute left-[60%] top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" />
        </div>
        <p className="absolute bottom-5 left-6 text-u4h text-white/70">60% open · closes at sunset</p>
      </GlassTile>
      <CornerBox size={6} className="absolute left-9.5 top-145 grid h-28 w-32 place-items-center text-white/90">
        <Activity className="size-12" strokeWidth={1.1} />
      </CornerBox>
    </>
  );
}

function AnalyticsWidgets() {
  const pts = [30, 26, 34, 22, 25, 16, 18, 10];
  const d = pts.map((y, i) => `${i === 0 ? "M" : "L"}${(i / (pts.length - 1)) * 100} ${y}`).join(" ");
  return (
    <>
      <GlassTile className="left-10.5 top-51 h-66 w-120">
        <p className="absolute left-6 top-5 text-u5 text-white/90">Weekly usage</p>
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-x-6 bottom-6 h-36 w-[calc(100%-var(--u)*12)] overflow-visible">
          <path d={`${d} L100 40 L0 40 Z`} fill="rgba(246,95,55,0.18)" />
          <path d={d} fill="none" stroke="#f65f37" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
        </svg>
      </GlassTile>
      <GlassTile className="left-138 top-125 h-44 w-68">
        <p className="absolute left-6 top-5 flex items-center gap-2 text-u5 text-white/90">
          <TrendingDown className="size-6" strokeWidth={1.4} /> Savings
        </p>
        <p className="display absolute bottom-5 left-6 text-u16 text-white">−18%</p>
      </GlassTile>
    </>
  );
}

const WIDGETS: Record<ServiceKey, () => React.ReactElement> = {
  security: SecurityWidgets,
  concierge: ConciergeWidgets,
  energy: EnergyWidgets,
  automation: AutomationWidgets,
  analytics: AnalyticsWidgets,
};

/** Right face: interior photograph with the service's glass widgets. */
export function ServiceVisualFace({ index }: { index: number }) {
  const s = SERVICES[index];
  const Widgets = WIDGETS[s.key];
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#3a3439]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={s.image} alt={`${s.title} — interior`} className="absolute inset-0 size-full object-cover saturate-[0.8] brightness-[0.82]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/20" />
      <h3 className="display absolute left-7 top-6 text-u16 uppercase tracking-[-0.02em] text-white">{s.title}</h3>
      <Widgets />
    </div>
  );
}
