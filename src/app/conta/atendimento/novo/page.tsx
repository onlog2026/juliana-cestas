import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCustomerOrders } from "@/modules/customers/service";
import { NewTicketForm } from "@/components/support/new-ticket-form";

export const metadata = { title: "Novo chamado" };

export default async function NovoChamadoPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const orders = await getCustomerOrders(user.id, user.email ?? null);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/conta/atendimento" className="hover:text-primary">
          Atendimento
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Novo chamado</span>
      </nav>

      <h1 className="mt-2 font-display text-2xl text-foreground">Novo chamado</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Conta pra gente o que aconteceu — a Juliana responde por aqui.
      </p>

      <NewTicketForm orders={orders.map((o) => ({ id: o.id, number: o.number }))} />
    </div>
  );
}
