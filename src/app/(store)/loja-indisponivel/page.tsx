import Link from "next/link";
import type { Metadata } from "next";

/**
 * A loja está com a vitrine fora do ar (`tenants.status = 'suspended'`).
 *
 * Quem chega aqui pode ser duas pessoas muito diferentes, e o texto precisa
 * servir às duas sem constranger nenhuma:
 *
 *  - o CLIENTE que ia comprar: precisa entender que a loja volta e que ele não
 *    fez nada de errado;
 *  - a LOJISTA, que talvez tenha descoberto o problema exatamente assim:
 *    precisa do caminho para resolver, em uma frase, sem jargão.
 *
 * Por isso o texto não fala em "inadimplência", "bloqueio" nem "pendência
 * financeira" na parte de cima. Uma loja fora do ar já é uma notícia ruim; não
 * precisa vir com acusação junto. O motivo real aparece só no aviso discreto
 * do rodapé, escrito para a dona da loja.
 */
export const metadata: Metadata = {
  title: "Loja temporariamente indisponível",
  description: "Esta loja está temporariamente fora do ar e volta em breve.",
  // Uma loja fora do ar por alguns dias não pode virar o resultado do Google
  // para o nome dela. `noindex` evita que essa página substitua a loja na busca.
  robots: { index: false, follow: false },
};

export default function LojaIndisponivelPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <h1 className="font-display text-3xl text-foreground sm:text-4xl">
        Esta loja está temporariamente fora do ar
      </h1>

      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        Não é nada com o seu computador nem com a sua internet. A loja foi pausada por enquanto e
        deve voltar em breve. Se você já fez um pedido, ele continua registrado e não foi perdido.
      </p>

      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        Se você precisa falar sobre um pedido que já fez, procure a loja pelo mesmo contato de
        sempre — WhatsApp, telefone ou redes sociais. O atendimento não depende desta página.
      </p>

      <div className="mt-10 w-full rounded-card border border-border bg-card p-5 text-left">
        <h2 className="font-display text-lg text-foreground">É você que administra esta loja?</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Seu painel continua funcionando normalmente: você entra, vê os pedidos e resolve o que
          precisa. A vitrine volta ao ar sozinha assim que a assinatura estiver em dia — não é
          preciso pedir para ninguém religar.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">
          <li>
            Clique no botão <strong>Ver minha assinatura</strong>, aqui embaixo. Se você ainda não
            estiver conectada, a tela de entrar aparece antes — é só usar seu e-mail e senha de
            sempre.
          </li>
          <li>
            Na página que abrir, você vê a situação do pagamento e, se houver um valor em aberto,
            o botão para pagar.
          </li>
          <li>
            Assim que o pagamento for confirmado, a loja volta a aparecer para os clientes em
            poucos minutos. Você não precisa avisar ninguém.
          </li>
        </ol>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/assinatura"
            className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ver minha assinatura
          </Link>
          <Link
            href="/admin"
            className="inline-flex h-11 items-center rounded-full border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Ir para o painel
          </Link>
        </div>
      </div>
    </div>
  );
}
