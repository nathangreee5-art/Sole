import React from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { useApp } from "@/context/AppContext";
import { Truck, ShieldCheck, Camera } from "lucide-react";

export const Footer = () => {
  const { settings } = useApp();
  const social = settings?.social || {};
  const biz = settings?.business || {};
  return (
    <footer data-testid="site-footer" className="border-t border-[var(--ss-border)] bg-[var(--ss-bg-2)]">
      <div className="border-b border-[var(--ss-border)]">
        <div className="ss-container py-5 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10 text-xs sm:text-sm text-[var(--ss-muted)]">
          <span className="inline-flex items-center gap-2"><Truck className="h-4 w-4 text-[var(--ss-mint)]" /> UK-WIDE DELIVERY</span>
          <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[var(--ss-mint)]" /> TRACKED SHIPPING</span>
          <span className="inline-flex items-center gap-2"><Camera className="h-4 w-4 text-[var(--ss-mint)]" /> PHOTO ASSESSMENT BEFORE YOU PAY</span>
        </div>
      </div>
      <div className="ss-container py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <Logo className="h-12" />
          <p className="mt-4 text-sm text-[var(--ss-muted)] max-w-xs">{biz.tagline || "Clean • Protect • Restore"}. Professional shoe cleaning, delivered straight to your door across the UK.</p>
          <div className="mt-5 flex gap-3">
            {social.tiktok ? (
              <a data-testid="footer-tiktok-link" href={social.tiktok} target="_blank" rel="noreferrer" className="rounded-lg border border-[var(--ss-border)] px-4 py-2 text-sm hover:border-[var(--ss-mint)] hover:text-[var(--ss-mint)] transition-colors">TikTok</a>
            ) : null}
            {social.instagram ? (
              <a data-testid="footer-instagram-link" href={social.instagram} target="_blank" rel="noreferrer" className="rounded-lg border border-[var(--ss-border)] px-4 py-2 text-sm hover:border-[var(--ss-mint)] hover:text-[var(--ss-mint)] transition-colors">Instagram</a>
            ) : null}
          </div>
        </div>
        <div>
          <h4 className="ss-eyebrow mb-4">Explore</h4>
          <ul className="space-y-2 text-sm text-[var(--ss-muted)]">
            <li><Link className="hover:text-[var(--ss-mint)]" to="/services">Services</Link></li>
            <li><Link className="hover:text-[var(--ss-mint)]" to="/how-it-works">How It Works</Link></li>
            <li><Link className="hover:text-[var(--ss-mint)]" to="/delivery">Delivery</Link></li>
            <li><Link className="hover:text-[var(--ss-mint)]" to="/book">Book a Clean</Link></li>
            <li><Link className="hover:text-[var(--ss-mint)]" to="/about">About</Link></li>
            <li><Link className="hover:text-[var(--ss-mint)]" to="/faq">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="ss-eyebrow mb-4">Get in touch</h4>
          <ul className="space-y-2 text-sm text-[var(--ss-muted)]">
            {biz.email ? <li><a className="hover:text-[var(--ss-mint)]" href={`mailto:${biz.email}`}>{biz.email}</a></li> : null}
            {biz.phone ? <li>{biz.phone}</li> : null}
            <li><Link className="hover:text-[var(--ss-mint)]" to="/contact">Contact us</Link></li>
            <li><Link className="hover:text-[var(--ss-mint)]" to="/track">Track your order</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--ss-border)]">
        <div className="ss-container py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--ss-muted)]">
          <span>&copy; {new Date().getFullYear()} {biz.name || "Sole Serenity"}. All rights reserved.</span>
          <div className="flex gap-5">
            <Link className="hover:text-[var(--ss-mint)]" to="/terms">Terms &amp; Conditions</Link>
            <Link className="hover:text-[var(--ss-mint)]" to="/privacy">Privacy Policy</Link>
            <Link className="hover:text-[var(--ss-mint)]" to="/admin">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
