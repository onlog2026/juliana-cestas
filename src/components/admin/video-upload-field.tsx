"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Video, X } from "lucide-react";
import { uploadMedia } from "@/modules/media/actions";

export function VideoUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("kind", "video");
    startTransition(async () => {
      const result = await uploadMedia(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onChange(result.url);
    });
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>

      {value ? (
        <div className="relative w-full max-w-xs overflow-hidden rounded-[10px] border border-border bg-secondary">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video src={value} controls className="aspect-video w-full" />
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remover vídeo"
            className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-[10px] border border-dashed border-border text-muted-foreground">
            <Video className="size-5" />
          </div>
          <div>
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={pending}
              className="flex h-9 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {pending ? "Enviando…" : "Enviar vídeo"}
            </button>
            {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
          </div>
        </div>
      )}
    </div>
  );
}
