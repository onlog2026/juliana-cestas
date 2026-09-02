import Link from "next/link";

const columns = [
  {
    title: "Ajuda",
    links: [
      { href: "/minha-conta/pedidos", label: "Meus pedidos" },
      { href: "/atendimento", label: "Atendimento" },
      { href: "/faq", label: "Perguntas frequentes" },
    ],
  },
  {
    title: "Institucional",
    links: [
      { href: "/sobre", label: "Sobre a Juliana Present" },
      { href: "/politica-de-privacidade", label: "Política de privacidade" },
      { href: "/trocas-e-devolucoes", label: "Trocas e devoluções" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-display text-2xl text-primary">Juliana Present</p>
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
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Juliana Present. Brasília, DF.
      </div>
    </footer>
  );
}
