import { Truck, ShieldCheck, PenLine, Headset, type LucideIcon } from "lucide-react";
import { benefits } from "@/lib/mock-content";
import { Reveal } from "./reveal";

const icons: Record<string, LucideIcon> = {
  Truck,
  ShieldCheck,
  PenLine,
  Headset,
};

export function Benefits() {
  return (
    <Reveal className="border-y border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
        {benefits.map((benefit) => {
          const Icon = icons[benefit.icon];
          return (
            <div key={benefit.title} className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {benefit.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Reveal>
  );
}
