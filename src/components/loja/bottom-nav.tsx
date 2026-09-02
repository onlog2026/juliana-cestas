import Link from "next/link";
import { Home, ShoppingBasket, User, MessageCircle } from "lucide-react";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? "";

const items = [
  { href: "/", label: "Início", icon: Home },
  { href: "/categoria/cafe-da-manha", label: "Cestas", icon: ShoppingBasket },
  { href: "/conta", label: "Minha conta", icon: User },
];

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border bg-card md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegação principal"
    >
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-muted-foreground transition-colors active:text-primary"
        >
          <Icon className="size-5" />
          <span className="text-[11px] font-medium">{label}</span>
        </Link>
      ))}
      <a
        href={`https://wa.me/${WHATSAPP}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[var(--jc-whatsapp)]"
      >
        <MessageCircle className="size-5" />
        <span className="text-[11px] font-medium">WhatsApp</span>
      </a>
    </nav>
  );
}
