import { ChevronDown } from "lucide-react";
import { faqItems } from "@/lib/mock-content";
import { Reveal } from "./reveal";

export function Faq() {
  return (
    <Reveal className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="font-display text-2xl text-foreground">
        Perguntas frequentes
      </h2>
      <div className="mt-5 divide-y divide-border rounded-card border border-border bg-card">
        {faqItems.map((item) => (
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
