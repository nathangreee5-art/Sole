import React from "react";

export const SectionHeading = ({ eyebrow, title, subtitle, center, className = "" }) => (
  <div className={`${center ? "text-center mx-auto max-w-2xl" : "max-w-2xl"} ${className}`}>
    {eyebrow ? <div className="ss-eyebrow mb-3">{eyebrow}</div> : null}
    <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.05] text-[var(--ss-fg)]">{title}</h2>
    {subtitle ? <p className="mt-4 text-[var(--ss-muted)] text-base leading-relaxed">{subtitle}</p> : null}
  </div>
);
