import { ChevronDown } from "lucide-react";
import { getTenantId } from "@/lib/tenant/context";
import { getContent } from "@/modules/content/service";
import { Reveal } from "./reveal";

export async function Faq() {
  const content = await getContent(await getTenantId(), "faq");

  return (
    <Reveal className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {content.title ? (
        <h2 className="font-display text-2xl text-foreground">
          {content.title}
        </h2>
      ) : null}
      <div className="mt-5 divide-y divide-border rounded-card border border-border bg-card">
        {content.items.map((item) => (
          <details key={item.question} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-foreground">
              {item.question}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2.5 text-sm text-muted-foreground">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </Reveal>
  );
}
