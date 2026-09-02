import { NextResponse } from "next/server";
import { getDeliverySettings, getSlotOccupancy } from "@/modules/delivery/settings";
import { generateSlots } from "@/modules/delivery/slots";
import { addDaysToDateStr, saoPauloDateStr } from "@/lib/time/sao-paulo";

export async function GET() {
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
