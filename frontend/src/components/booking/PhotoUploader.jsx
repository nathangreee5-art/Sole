import React, { useRef, useState } from "react";
import { Camera, X, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { uploadImages, mediaUrl } from "@/lib/api";

const SLOTS = [
  { key: "front", label: "Front", required: true },
  { key: "left", label: "Left side", required: true },
  { key: "right", label: "Right side", required: true },
  { key: "back", label: "Back", required: true },
  { key: "soles", label: "Soles", required: true },
  { key: "problem", label: "Problem areas", required: false },
];

export const PhotoUploader = ({ photos, setPhotos }) => {
  const [uploading, setUploading] = useState(null);
  const refs = useRef({});

  const onSelect = async (slot, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(slot);
    try {
      const res = await uploadImages(files);
      const added = res.files.map((f) => ({ ...f, slot }));
      setPhotos([...(photos || []), ...added]);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed. Try a JPG or PNG under 12MB.");
    } finally {
      setUploading(null);
      if (refs.current[slot]) refs.current[slot].value = "";
    }
  };

  const remove = (fileId) => setPhotos(photos.filter((p) => p.file_id !== fileId));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {SLOTS.map((slot) => {
        const slotPhotos = (photos || []).filter((p) => p.slot === slot.key);
        return (
          <div key={slot.key} className="ss-card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--ss-fg)]">{slot.label}</span>
              {slot.required ? <span className="text-[10px] uppercase tracking-wide text-[var(--ss-mint)]">Required</span> : <span className="text-[10px] uppercase tracking-wide text-[var(--ss-muted)]">Optional</span>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {slotPhotos.map((p) => (
                <div key={p.file_id} className="relative aspect-square rounded-lg overflow-hidden border border-[var(--ss-border)]">
                  <img src={mediaUrl(p.url || `/api/images/${p.file_id}`)} alt={slot.label} className="h-full w-full object-cover" />
                  <button type="button" onClick={() => remove(p.file_id)} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-[rgba(0,0,0,0.6)] text-white flex items-center justify-center">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                data-testid={`booking-photo-${slot.key}-input`}
                onClick={() => refs.current[slot.key]?.click()}
                className="aspect-square rounded-lg border border-dashed border-[var(--ss-border)] flex items-center justify-center text-[var(--ss-muted)] hover:border-[var(--ss-mint)] hover:text-[var(--ss-mint)] transition-colors"
              >
                {uploading === slot.key ? <Loader2 className="h-5 w-5 animate-spin" /> : (slotPhotos.length ? <Plus className="h-5 w-5" /> : <Camera className="h-5 w-5" />)}
              </button>
            </div>
            <input
              ref={(el) => (refs.current[slot.key] = el)}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              className="hidden"
              onChange={(e) => onSelect(slot.key, e.target.files)}
            />
          </div>
        );
      })}
    </div>
  );
};

export const requiredSlotsCovered = (photos) => {
  const covered = new Set((photos || []).map((p) => p.slot));
  return ["front", "left", "right", "back", "soles"].every((s) => covered.has(s));
};
