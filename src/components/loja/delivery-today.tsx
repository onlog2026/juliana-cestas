"use client";

import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import { deliveryHint, type PublicDeliverySettings } from "@/modules/delivery/today";

/**
 * "Peça até 14:30 e receba hoje". Depende da hora de quem está olhando, então
 * é calculado NO NAVEGADOR (a home continua estática). Antes de hidratar mostra
 * o texto neutro do mesmo tamanho, sem pulo de layout.
 */
export function DeliveryToday({
  settings,
  neutral = "Entrega com data e horário marcados",
  className = "",
}: {
  settings: PublicDeliverySettings;
  neutral?: string;
  className?: string;
}) {
  const [text, setText] = useState(neutral);

  useEffect(() => {
    const update = () => {
      const hint = deliveryHint(settings, new Date());
      setText(hint.state === "none" ? neutral : hint.text);
    };
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, [settings, neutral]);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Truck aria-hidden="true" className="size-4 shrink-0 text-primary" strokeWidth={1.8} />
      <span>{text}</span>
    </span>
  );
}
