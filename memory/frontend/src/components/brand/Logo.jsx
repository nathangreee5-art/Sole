import React from "react";
import { Link } from "react-router-dom";
import logoWhite from "@/assets/logo-white.png";

export const Logo = ({ className = "h-10", withText = false, to = "/" }) => {
  const content = (
    <span className="inline-flex items-center gap-3">
      <img src={logoWhite} alt="Sole Serenity logo" className={className} />
      {withText && (
        <span className="font-display text-2xl tracking-wide text-[var(--ss-fg)]">SOLE SERENITY</span>
      )}
    </span>
  );
  if (to) {
    return (
      <Link to={to} data-testid="site-logo-link" className="inline-flex items-center">
        {content}
      </Link>
    );
  }
  return content;
};
