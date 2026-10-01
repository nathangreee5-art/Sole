import React, { useEffect, useRef, useState } from "react";

export const Reveal = ({ children, delay = 0, y = 14, className = "" }) => {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "-60px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`ss-reveal ${shown ? "ss-reveal-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}s`, "--ss-reveal-y": `${y}px` }}
    >
      {children}
    </div>
  );
};
