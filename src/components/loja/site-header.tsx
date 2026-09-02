import Link from "next/link";
import { Search, User, ShoppingBag } from "lucide-react";
import { featuredProducts } from "@/lib/mock-content";

const categoryLinks = featuredProducts.map((product) => ({
  href: `/produto/${product.slug}`,
  label: product.name,
}));

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-saturate-150">
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 font-display text-2xl text-primary"
        >
          <img
            src="/logo/juliana-present-icon.svg"
            alt=""
            aria-hidden="true"
            width={38}
            height={34}
            className="h-[34px] w-[38px] shrink-0"
          />
          Juliana Present
        </Link>

        <label className="relative hidden flex-1 max-w-md md:block">
          <span className="sr-only">Buscar cestas</span>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Buscar cestas, ocasiões..."
            className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <nav className="ml-auto hidden items-center gap-2 md:flex">
          <Link
            href="/minha-conta"
            className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent"
            aria-label="Minha conta"
          >
            <User className="size-5" />
          </Link>
          <Link
            href="/carrinho"
            className="relative flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent"
            aria-label="Carrinho"
          >
            <ShoppingBag className="size-5" />
          </Link>
        </nav>
      </div>

      <div className="hidden border-t border-border md:block">
        <nav className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-2.5 text-sm font-medium text-foreground sm:px-6 lg:px-8">
          {categoryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-border px-4 py-2.5 md:hidden">
        <label className="relative block">
          <span className="sr-only">Buscar cestas</span>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Buscar cestas, ocasiões..."
            className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>
    </header>
  );
}
