"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { updateTicketStatusAdmin } from "@/modules/support/actions";

const OPTIONS = [
  { value: "aberto", label: "Aberto" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "resolvido", label: "Resolvido" },
  { value: "reaberto", label: "Reaberto" },
] as const;

export function TicketStatusSelect({ ticketId, status }: { ticketId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleChange(next: string) {
    startTransition(async () => {
      await updateTicketStatusAdmin(ticketId, next as (typeof OPTIONS)[number]["value"]);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value)}
        disabled={pending}
        className="h-10 rounded-[10px] border border-border bg-card px-3.5 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {pending ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
    </div>
  );
}
