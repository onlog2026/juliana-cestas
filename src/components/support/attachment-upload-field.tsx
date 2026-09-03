"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Loader2, Paperclip, X } from "lucide-react";
import { uploadSupportAttachment } from "@/modules/media/actions";

export function AttachmentUploadField({
  value,
  onChange,
}: {
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
    startTransition(async () => {
      const result = await uploadSupportAttachment(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onChange(result.url);
    });
  }

  if (value) {
    return (
      <div className="flex items-center gap-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-[10px] border border-border bg-secondary">
          <Image src={value} alt="" fill sizes="64px" className="object-cover" />
        </div>
        <button
          type="button"
          onClick={() => onChange("")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive"
        >
          <X className="size-4" /> Remover anexo
        </button>
      </div>
    );
  }

  return (
    <div>
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
        className="flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
        {pending ? "Enviando…" : "Anexar foto"}
      </button>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
