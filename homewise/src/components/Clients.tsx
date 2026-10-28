"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight } from "lucide-react";
import { CLIENTS, type Client } from "@/lib/data";
import { useHomeWise, getUnit } from "./context";
import { Brackets, CornerBox, FooterRow } from "./primitives";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** card geometry measured from the reference (reference units) */
const CARD = { w: 114, h: 248, gap: 21, top: 66, startX: -21 };

function ClientCard({ client, index }: { client: Client; index: number }) {
  return (
    <article
      data-client-card
      data-verify={`client-card-${index}`}
      data-cursor="hover"
      tabIndex={0}
      className="group/card relative h-248 w-114 shrink-0 outline-none max-md:h-260 max-md:w-150"
    >
      {/* photo — collapses to the top on hover / focus */}
      <div className="absolute inset-x-0 top-0 h-full overflow-hidden rounded-u8 transition-[height] duration-700 ease-(--ease-hw-out) group-hover/card:h-95 group-focus-visible/card:h-95">
        <Image
          src={client.image}
          alt={`${client.name.replace("\n", " ")}'s HomeWise home`}
          fill
          sizes="(max-width: 768px) 40vw, 18vw"
          className="object-cover transition-transform duration-[1.2s] ease-(--ease-hw-out) group-hover/card:scale-105"
        />
      </div>

      {/* testimonial panel */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-103 translate-y-8 rounded-u8 bg-hw-card opacity-0 transition-[opacity,transform] duration-700 ease-(--ease-hw-out) group-hover/card:pointer-events-auto group-hover/card:translate-y-0 group-hover/card:opacity-100 group-focus-visible/card:translate-y-0 group-focus-visible/card:opacity-100">
        <div className="flex items-center gap-6 px-4 pt-5">
          <span className="relative size-30 shrink-0 overflow-hidden rounded-full">
            <Image src={client.avatar} alt="" fill sizes="80px" className="object-cover" />
          </span>
          <h3 className="whitespace-pre-line text-u7 uppercase leading-[1.05] tracking-[-0.01em] text-white/90">{client.name}</h3>
        </div>
        <p className="px-4.5 pt-6.5 text-u4h leading-[1.4] text-white/80">{client.quote}</p>
      </div>
      <a
        href="#contacts"
        className="pointer-events-none absolute bottom-5.5 left-4.5 flex items-center gap-1.5 text-u4h text-hw-accent opacity-0 transition-opacity duration-500 group-hover/card:pointer-events-auto group-hover/card:opacity-100 group-focus-visible/card:opacity-100"
      >
        Explore this case <ArrowRight className="size-4" strokeWidth={1.6} />
      </a>
    </article>
  );
}

export function Clients() {
  const { lenis } = useHomeWise();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current!;
      const track = trackRef.current!;
      const cards = gsap.utils.toArray<HTMLElement>("[data-client-card]", section);
      const mobile = window.matchMedia("(max-width: 767px)").matches;

      // cards grow in while the section scrolls into view
      gsap.fromTo(
        cards,
        { scale: 0.86, y: () => getUnit() * 48 },
        {
          scale: 1,
          y: 0,
          ease: "none",
          stagger: 0.02,
          scrollTrigger: { trigger: section, start: "top bottom", end: "top top", scrub: true },
        }
      );
      gsap.fromTo(
        "[data-clients-title]",
        { y: () => getUnit() * 24, autoAlpha: 0.2 },
        { y: 0, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: section, start: "top 80%", end: "top top", scrub: true } }
      );

      // horizontal drift while pinned
      const distance = () => {
        const u = getUnit();
        const viewport = mobile ? window.innerWidth : u * 660;
        return Math.max(0, track.scrollWidth - viewport + CARD.startX * u * -1 + u * 30);
      };
      gsap.fromTo(
        track,
        { x: () => CARD.startX * getUnit() },
        {
          x: () => CARD.startX * getUnit() - distance(),
          ease: "none",
          scrollTrigger: {
            id: "clients",
            trigger: section,
            start: "top top",
            end: () => `+=${window.innerHeight * 1.4}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="clients"
      data-section="clients"
      aria-labelledby="clients-title"
      className="section-screen bg-hw-bg"
    >
      <div className="stage">
        <div ref={trackRef} data-verify="clients-track" className="absolute left-0 top-66 flex gap-21 will-change-transform max-md:top-70 max-md:gap-12">
          {CLIENTS.map((c, i) => (
            <ClientCard key={c.id} client={c} index={i} />
          ))}
        </div>

        <CornerBox size={6} className="absolute left-585 top-304 h-27 w-34 max-md:hidden">
          <button
            type="button"
            data-verify="scroll-button"
            onClick={() => lenis.current?.scrollTo(window.scrollY + window.innerHeight * 0.6, { duration: 1.4 })}
            className="grid size-full place-items-center text-u5h text-white/90 transition-colors hover:text-hw-accent"
          >
            Scroll
          </button>
        </CornerBox>

        <div data-clients-title className="absolute left-1/2 top-336 -translate-x-1/2 max-md:top-auto max-md:bottom-55">
          <Brackets tick={9} className="flex h-55 w-246 items-center justify-center">
            <h2 id="clients-title" data-verify="clients-title" className="display text-u38 uppercase text-white">
              Our Clients
            </h2>
          </Brackets>
        </div>

        <FooterRow />
      </div>
    </section>
  );
}
