import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { WhatsappCta } from "@/components/loja/whatsapp-cta";

export const metadata: Metadata = {
  title: "Trocas e entregas | Juliana Cestas",
  description:
    "Como funciona a substituição de itens e a entrega das cestas Juliana Cestas.",
};

const regras = [
  {
    title: "Item indisponível",
    text: "Todas as cestas são produzidas artesanalmente por encomenda. Se algum item estiver indisponível no dia, ele é substituído por outro de valor equivalente, mantendo o padrão da cesta.",
  },
  {
    title: "Entrega agendada",
    text: "As entregas são feitas por motoristas terceirizados ou Uber, de forma agendada. Pode haver variação de até 20 minutos por fatores fora do nosso controle (trânsito, clima).",
  },
  {
    title: "Reentrega",
    text: "Se não houver quem receba a cesta no horário combinado, uma nova tentativa de entrega tem taxa de reentrega.",
  },
  {
    title: "Pagamento",
    text: "Pix ou cartão de crédito, via link de pagamento. O pedido é confirmado após o pagamento integral.",
  },
];

export default function TrocasEDevolucoesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-primary">
          Início
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Trocas e entregas</span>
      </nav>

      <h1 className="mt-4 font-display text-3xl text-foreground md:text-4xl">
        Trocas e entregas
      </h1>
      <p className="mt-4 text-muted-foreground">
        Como cada cesta é feita à mão, por encomenda, nossas regras de troca
        e entrega são estas:
      </p>

      <div className="mt-6 space-y-6">
        {regras.map((regra) => (
          <div key={regra.title}>
            <p className="text-sm font-semibold text-foreground">
              {regra.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{regra.text}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Situação diferente das acima? Fala com a gente pelo WhatsApp que a
        gente resolve.
      </p>

      <div className="mt-6">
        <WhatsappCta />
      </div>
    </div>
  );
}
