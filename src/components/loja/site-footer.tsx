import Link from "next/link";

const columns = [
  {
    title: "Ajuda",
    links: [
      { href: "/atendimento", label: "Atendimento" },
      { href: "/faq", label: "Perguntas frequentes" },
    ],
  },
  {
    title: "Institucional",
    links: [
      { href: "/sobre", label: "Sobre a Juliana Cestas" },
      { href: "/trocas-e-devolucoes", label: "Trocas e entregas" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-display text-2xl text-primary">Juliana Cestas</p>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Cestas de café da manhã e presentes afetivos, feitos e entregues
            em Brasília.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold text-foreground">
              {col.title}
            </p>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="jc-nav-hover -mx-2 -my-1 rounded-full px-2 py-1 text-sm text-muted-foreground hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="text-sm font-semibold text-foreground">
            Endereço e horário
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            QNL 7 Bloco D, Edifício São Raimundo
            <br />
            Brasília, DF
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Retirada das 8h às 18h
            <br />
            Segunda a sábado
            <br />
            Domingo (sob agendamento)
          </p>
        </div>
      </div>
      <div className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Juliana Cestas. Brasília, DF.
      </div>
    </footer>
  );
}
