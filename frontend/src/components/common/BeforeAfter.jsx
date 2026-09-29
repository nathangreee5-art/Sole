import React, { useState } from "react";
import { mediaUrl } from "@/lib/api";

export const BeforeAfter = ({ item }) => {
  const [showAfter, setShowAfter] = useState(true);
  const before = mediaUrl(item.before_url);
  const after = mediaUrl(item.after_url);
  const active = showAfter ? after || before : before || after;
  return (
    <div className="ss-card overflow-hidden group" data-testid="gallery-item">
      <div className="relative aspect-square bg-[var(--ss-surface-2)]">
        {active ? (
          <img src={active} alt={`${item.shoe_type || "Shoe"} ${showAfter ? "after" : "before"} cleaning`} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[var(--ss-muted)] text-sm">No image</div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <button
            onClick={() => setShowAfter(false)}
            className={`rounded-full px-3 py-1 text-xs font-semibold border ${!showAfter ? "bg-[var(--ss-mint)] text-[#ffffff] border-[var(--ss-mint)]" : "bg-[rgba(0,0,0,0.5)] text-white border-[var(--ss-border)]"}`}
          >BEFORE</button>
          <button
            onClick={() => setShowAfter(true)}
            className={`rounded-full px-3 py-1 text-xs font-semibold border ${showAfter ? "bg-[var(--ss-mint)] text-[#ffffff] border-[var(--ss-mint)]" : "bg-[rgba(0,0,0,0.5)] text-white border-[var(--ss-border)]"}`}
          >AFTER</button>
        </div>
      </div>
      {(item.shoe_type || item.description) && (
        <div className="p-4">
          {item.shoe_type ? <div className="font-semibold text-[var(--ss-fg)]">{item.shoe_type}</div> : null}
          {item.description ? <div className="text-sm text-[var(--ss-muted)] mt-1">{item.description}</div> : null}
        </div>
      )}
    </div>
  );
};
