import { NextResponse } from "next/server";
import { getDeliverySettings, getSlotOccupancy } from "@/modules/delivery/settings";
import { generateSlots } from "@/modules/delivery/slots";
import { addDaysToDateStr, saoPauloDateStr } from "@/lib/time/sao-paulo";
import { checkRateLimit, clientIp } from "@/lib/security/rate-limit";

export async function GET(req: Request) {
  const withinLimit = await checkRateLimit(`slots:${clientIp(req)}`, 60, 60);
  if (!withinLimit) {
    return NextResponse.json({ error: "Muitas consultas. Espera um pouco." }, { status: 429 });
  }

  const settings = await getDeliverySettings();
  if (!settings) {
    return NextResponse.json({ error: "Configuração de entrega indisponível." }, { status: 503 });
  }

  const today = saoPauloDateStr();
  const lastDay = addDaysToDateStr(today, settings.horizonDays);
  const occupancy = await getSlotOccupancy(today, lastDay);

  const days = generateSlots(settings, new Date(), occupancy);
  return NextResponse.json({ days, cardMaxWords: settings.cardMaxWords });
}
