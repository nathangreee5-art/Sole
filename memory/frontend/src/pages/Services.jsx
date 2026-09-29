import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { getServices } from "@/lib/api";
import { gbp } from "@/lib/format";

export default function Services() {
  const navigate = useNavigate();
  const [data, setData] = useState({ services: [], pricing: {}, shipping_rates: [], disclaimer: "" });

  useEffect(() => { getServices().then(setData).catch(() => {}); }, []);

  const tierRows = (key) => {
    const tiers = (data.pricing && data.pricing[`${key}_tiers`]) || {};
    return [1, 2, 3, 4].map((n) => ({ n, price: tiers[String(n)] }));
  };

  return (
    <div>
      <section className="relative ss-noise">
        <div className="absolute inset-0 ss-hero-glow pointer-events-none" />
        <div className="ss-container relative py-16 sm:py-20">
          <Reveal><SectionHeading eyebrow="Services" title="Choose your clean" subtitle="Two focused services with transparent per-pair pricing. Mix and match across pairs in a single order." /></Reveal>
        </div>
      </section>

      <section className="pb-6">
        <div className="ss-container grid md:grid-cols-2 gap-6">
          {data.services.map((s, i) => (
            <Reveal key={s.key} delay={i * 0.08}>
              <div className="ss-card p-8 h-full flex flex-col" data-testid={`services-${s.key}-clean-card`}>
                <div className="ss-eyebrow">{s.key === "deep" ? "Most intensive" : "Most popular"}</div>
                <div className="mt-2 flex items-baseline justify-between">
                  <h3 className="font-display text-3xl text-[var(--ss-fg)]">{s.name}</h3>
                  <div className="text-[var(--ss-mint)] font-display text-4xl">{gbp(s.price)}<span className="text-base text-[var(--ss-muted)]">/pair</span></div>
                </div>
                <p className="text-sm text-[var(--ss-muted)] mt-2">{s.tagline}</p>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {s.includes.map((inc) => (
                    <li key={inc} className="flex items-start gap-2 text-sm text-[var(--ss-fg)]"><CheckCircle2 className="h-4 w-4 text-[var(--ss-mint)] mt-0.5 shrink-0" /> {inc}</li>
                  ))}
                </ul>
                <div className="mt-6 rounded-xl border border-[var(--ss-border)] overflow-hidden">
                  <div className="bg-[var(--ss-surface-2)] px-4 py-2 text-xs ss-eyebrow">Multi-pair pricing</div>
                  <table className="w-full text-sm">
                    <tbody>
                      {tierRows(s.key).map((row) => (
                        <tr key={row.n} className="border-t border-[var(--ss-border)]">
                          <td className="px-4 py-2 text-[var(--ss-muted)]">{row.n} pair{row.n > 1 ? "s" : ""}</td>
                          <td className="px-4 py-2 text-right ss-mono text-[var(--ss-fg)]">{gbp(row.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button onClick={() => navigate("/book")} className="mt-6 bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold w-full">BOOK YOUR CLEAN <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="ss-section">
        <div className="ss-container">
          <div className="ss-card p-6">
            <h3 className="font-semibold text-[var(--ss-fg)]">Delivery included as a flat rate</h3>
            <div className="mt-3 flex flex-wrap gap-3">
              {(data.shipping_rates || []).map((r, i) => (
                <div key={i} className="rounded-lg border border-[var(--ss-border)] px-4 py-2 text-sm">
                  <span className="text-[var(--ss-muted)]">{r.label || `${r.min_pairs}–${r.max_pairs} pairs`}: </span>
                  <span className="ss-mono text-[var(--ss-fg)]">{gbp(r.price)}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-[var(--ss-muted)]">{data.disclaimer}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
