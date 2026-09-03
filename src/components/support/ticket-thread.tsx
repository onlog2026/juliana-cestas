"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AttachmentUploadField } from "@/components/support/attachment-upload-field";
import type { TicketMessage } from "@/modules/support/service";

function MessageBubble({ message, viewerRole }: { message: TicketMessage; viewerRole: "customer" | "staff" }) {
  const isMine = message.sender === viewerRole;
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-card px-4 py-3 text-sm ${
          isMine ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.body}</p>
        {message.attachment_url ? (
          <div className="relative mt-2 size-32 overflow-hidden rounded-[10px]">
            <Image src={message.attachment_url} alt="Anexo" fill sizes="128px" className="object-cover" />
          </div>
        ) : null}
        <p className={`mt-1.5 text-xs ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {message.sender_name ?? (message.sender === "staff" ? "Juliana Cestas" : "Você")} ·{" "}
          {new Date(message.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

export function TicketThread({
  messages,
  viewerRole,
  onReply,
}: {
  messages: TicketMessage[];
  viewerRole: "customer" | "staff";
  onReply: (input: { body: string; attachmentUrl: string }) => Promise<{ ok: boolean; error?: string }>;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await onReply({ body: body.trim(), attachmentUrl });
      if (!result.ok) {
        setError(result.error ?? "Não foi possível enviar.");
        return;
      }
      setBody("");
      setAttachmentUrl("");
      router.refresh();
    });
  }

  return (
    <div>
      <div className="space-y-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} viewerRole={viewerRole} />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-card border border-border bg-card p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Escreva sua resposta"
          className="w-full resize-none rounded-[10px] border border-border bg-background px-3.5 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex items-center justify-between gap-3">
          <AttachmentUploadField value={attachmentUrl} onChange={setAttachmentUrl} />
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Responder
          </button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </div>
  );
}
