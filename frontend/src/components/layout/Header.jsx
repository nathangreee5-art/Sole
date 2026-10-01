import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useApp } from "@/context/AppContext";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/delivery", label: "Delivery" },
  { to: "/book", label: "Book a Clean" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const announcement = settings?.announcement;

  return (
    <>
      {announcement ? (
        <div className="bg-[var(--ss-mint)] text-[#ffffff] text-center text-xs sm:text-sm font-semibold py-2 px-4" data-testid="site-announcement">
          {announcement}
        </div>
      ) : null}
      <header
        data-testid="site-header"
        className={`sticky top-0 z-50 border-b transition-colors duration-200 ${
          scrolled
            ? "bg-[rgba(11,13,14,0.85)] backdrop-blur-md border-[var(--ss-border)]"
            : "bg-[rgba(11,13,14,0.6)] backdrop-blur-sm border-transparent"
        }`}
      >
        <div className="ss-container flex h-16 items-center justify-between">
          <Logo className="h-9 sm:h-10" />
          <nav className="hidden lg:flex items-center gap-7">
            {NAV.filter((n) => n.to !== "/book").map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={`nav-${n.label.toLowerCase().replace(/ /g, "-")}`}
                className={({ isActive }) =>
                  `text-sm font-medium tracking-wide transition-colors hover:text-[var(--ss-mint)] ${
                    isActive ? "text-[var(--ss-mint)]" : "text-[var(--ss-muted)]"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-3">
            <Button
              data-testid="header-book-a-clean-button"
              onClick={() => navigate("/book")}
              className="bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold rounded-lg"
            >
              BOOK A CLEAN
            </Button>
          </div>

          {/* Mobile */}
          <div className="lg:hidden flex items-center gap-2">
            <Button
              size="sm"
              data-testid="header-book-a-clean-button-mobile"
              onClick={() => navigate("/book")}
              className="bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold rounded-lg h-9"
            >
              BOOK
            </Button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button data-testid="mobile-nav-open-button" className="p-2 text-[var(--ss-fg)]" aria-label="Open menu">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[var(--ss-bg-2)] border-[var(--ss-border)] w-[86%] max-w-sm p-0 flex flex-col">
                <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                <SheetDescription className="sr-only">Browse Sole Serenity pages and book a clean.</SheetDescription>
                <div className="flex items-center justify-between p-5 border-b border-[var(--ss-border)]">
                  <Logo className="h-9" />
                  <SheetClose asChild>
                    <button className="p-2 text-[var(--ss-muted)]" aria-label="Close menu"><X className="h-5 w-5" /></button>
                  </SheetClose>
                </div>
                <nav className="flex flex-col p-4 gap-1 flex-1">
                  {NAV.map((n) => (
                    <NavLink
                      key={n.to}
                      to={n.to}
                      onClick={() => setOpen(false)}
                      data-testid={`mobile-nav-${n.label.toLowerCase().replace(/ /g, "-")}`}
                      className={({ isActive }) =>
                        `rounded-lg px-4 py-3 text-base font-medium ${
                          isActive ? "bg-[rgba(59,130,246,0.12)] text-[var(--ss-mint)]" : "text-[var(--ss-fg)]"
                        }`
                      }
                    >
                      {n.label}
                    </NavLink>
                  ))}
                </nav>
                <div className="p-4 border-t border-[var(--ss-border)]">
                  <Button
                    data-testid="mobile-book-a-clean-button"
                    onClick={() => { setOpen(false); navigate("/book"); }}
                    className="w-full h-12 bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold text-base"
                  >
                    BOOK A CLEAN
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
};
