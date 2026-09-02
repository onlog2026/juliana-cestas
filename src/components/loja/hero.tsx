import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="border-b border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 md:gap-12 md:py-16 lg:px-8">
        <div className="relative aspect-[4/5] overflow-hidden rounded-card md:order-1">
          <Image
            src="/images/produtos/cesta-cafe-completo.png"
            alt="Cesta de café da manhã Juliana Cestas, com pães, frutas e mel, amarrada com fita verde"
            fill
            priority
            sizes="(min-width: 768px) 45vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="md:order-2">
          <h1 className="font-display text-4xl leading-[1.1] text-foreground md:text-5xl">
            Um café da manhã que chega como um abraço.
          </h1>
          <p className="mt-4 max-w-md text-base text-muted-foreground">
            Cestas montadas à mão em Brasília, com cartão de mensagem
            personalizado em cada pedido. Entrega no mesmo dia em regiões
            selecionadas.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/categoria/cafe-da-manha"
              className="inline-flex h-12 items-center rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-[0.98]"
            >
              Ver cestas
            </Link>
            <Link
              href="#mais-pedidas"
              className="inline-flex h-12 items-center rounded-full border border-[color-mix(in_oklch,var(--primary),transparent_70%)] px-7 text-base font-semibold text-primary transition-colors hover:bg-accent"
            >
              Mais pedidas
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
