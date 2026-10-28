"use client";

import { useState } from "react";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { Brackets, FooterRow } from "./primitives";

/**
 * Contacts — not shown in the reference clip, so it extends the same visual
 * language (dark stage, brackets, glass, orange CTA) to complete the nav.
 */
export function Contacts() {
  const [sent, setSent] = useState(false);

  return (
    <section id="contacts" data-section="contacts" aria-labelledby="contacts-title" className="section-screen bg-hw-bg">
      <div className="stage">
        <div className="absolute left-1/2 top-48 -translate-x-1/2 max-md:top-50">
          <Brackets tick={9} className="flex h-55 items-center px-12">
            <h2 id="contacts-title" className="display text-u38 uppercase text-white">
              Contacts
            </h2>
          </Brackets>
        </div>

        <div className="absolute left-66 top-130 w-200 max-md:inset-x-22 max-md:top-125 max-md:w-auto">
          <p className="text-u7 leading-[1.35] text-white/85">
            Book a free walkthrough of your home. A HomeWise engineer will map every room and propose a system tailored to
            the way you live.
          </p>
          <ul className="mt-16 space-y-7 text-u5h text-white/80">
            <li className="flex items-center gap-5">
              <Phone className="size-7 text-hw-accent" strokeWidth={1.4} /> +1 (415) 555 0116
            </li>
            <li className="flex items-center gap-5">
              <Mail className="size-7 text-hw-accent" strokeWidth={1.4} /> hello@homewise.network
            </li>
            <li className="flex items-center gap-5">
              <MapPin className="size-7 text-hw-accent" strokeWidth={1.4} /> 210 Alpine Way, Boulder, CO
            </li>
          </ul>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="glass absolute left-330 top-120 w-264 rounded-u11 p-12 max-md:inset-x-22 max-md:top-235 max-md:w-auto max-md:p-10"
        >
          {sent ? (
            <div className="grid h-150 place-items-center text-center">
              <div>
                <p className="display text-u20 text-white">Thank you, we&apos;ll be in touch.</p>
                <p className="mt-5 text-u5h text-white/70">Expect a call from our team within one business day.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { id: "name", label: "Full name", type: "text" },
                  { id: "email", label: "Email", type: "email" },
                ].map((f) => (
                  <label key={f.id} className="block">
                    <span className="text-u4h uppercase tracking-[0.02em] text-white/60">{f.label}</span>
                    <input
                      id={`contact-${f.id}`}
                      required
                      type={f.type}
                      className="mt-2 h-18 w-full rounded-full border border-white/20 bg-white/5 px-7 text-u5h text-white outline-none transition-colors placeholder:text-white/35 focus:border-hw-accent"
                    />
                  </label>
                ))}
              </div>
              <label className="mt-7 block">
                <span className="text-u4h uppercase tracking-[0.02em] text-white/60">Tell us about your home</span>
                <textarea
                  id="contact-message"
                  rows={3}
                  className="mt-2 w-full resize-none rounded-u10 border border-white/20 bg-white/5 px-7 py-5 text-u5h text-white outline-none transition-colors focus:border-hw-accent"
                />
              </label>
              <button
                id="contact-submit"
                type="submit"
                className="mt-8 flex h-21 items-center gap-3 rounded-full bg-hw-accent px-10 text-u6 text-white transition-[background-color,box-shadow] hover:bg-hw-accent-soft hover:shadow-[0_0_30px_rgba(246,95,55,0.5)]"
              >
                Get Free Trial <ArrowUpRight className="size-6" strokeWidth={1.6} />
              </button>
            </>
          )}
        </form>

        <FooterRow />
      </div>
    </section>
  );
}
