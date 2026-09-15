import Link from "next/link";

const tabs = [
  { key: "agenda", href: "/admin/entregas", label: "Agenda do dia" },
  { key: "areas", href: "/admin/entregas/areas", label: "Áreas e preços" },
] as const;

/** Sub-navegação entre a agenda de entregas e o cadastro de áreas/preços. */
export function EntregasTabs({ active }: { active: "agenda" | "areas" }) {
  return (
    <nav className="mt-4 flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={active === tab.key ? "page" : undefined}
          className={`-mb-px border-b-2 px-3 pb-2 text-sm font-medium transition-colors ${
            active === tab.key
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
