"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Loader2, Plus, X } from "lucide-react";
import { uploadMedia } from "@/modules/media/actions";

export function GalleryUploadField({
  label,
  values,
  onChange,
  max,
}: {
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
  max: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("kind", "photo");
    startTransition(async () => {
      const result = await uploadMedia(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onChange([...values, result.url]);
    });
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label} <span className="font-normal text-muted-foreground">({values.length}/{max})</span>
      </span>
      <div className="flex flex-wrap gap-3">
        {values.map((url, i) => (
          <div key={url} className="relative size-20 shrink-0 overflow-hidden rounded-[10px] border border-border bg-secondary">
            <Image src={url} alt="" fill sizes="80px" className="object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label="Remover imagem"
              className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        {values.length < max ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={pending}
              aria-label="Adicionar imagem"
              className="flex size-20 shrink-0 items-center justify-center rounded-[10px] border border-dashed border-border text-muted-foreground hover:bg-accent disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
            </button>
          </>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
