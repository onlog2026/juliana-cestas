"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { savePlatformConfig } from "@/modules/platform/config-actions";

/**
 * Formulário da configuração da plataforma.
 *
 * Os tipos são declarados aqui, com campos simples: os tipos "de verdade"
 * moram em config-service.ts, que importa `server-only` e não pode ser
 * carregado pelo navegador.
 */
type ModuloOpcao = { slug: string; name: string; description: string | null; category: string; isCore: boolean };

type ConfigInicial = {
  platformName: string;
  supportEmail: string | null;
  trialDays: number;
  trialModuleSlugs: string[] | null;
  storefrontGraceDays: number;
};

const inputClass =
  "h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const cardClass = "rounded-card border border-border bg-card p-5";
const primaryButton =
  "flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60";

const CATEGORIA_LABEL: Record<string, string> = {
  nucleo: "Núcleo (toda loja já tem)",
  operacao: "Operação do dia a dia",
  vendas: "Vendas",
  vitrine: "Vitrine e conteúdo",
  crescimento: "Crescimento",
  loja: "Outros",
};

export function ConfigForm({ inicial, modulos }: { inicial: ConfigInicial; modulos: ModuloOpcao[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [nomeDaPlataforma, setNomeDaPlataforma] = useState(inicial.platformName);
  const [emailDeSuporte, setEmailDeSuporte] = useState(inicial.supportEmail ?? "");
  const [diasDeTeste, setDiasDeTeste] = useState(inicial.trialDays);
  // `null` no banco = "vê tudo". Lista = "vê só isto". São coisas diferentes.
  const [testeLiberaTudo, setTesteLiberaTudo] = useState(inicial.trialModuleSlugs === null);
  const [modulosDoTeste, setModulosDoTeste] = useState<string[]>(inicial.trialModuleSlugs ?? []);
  const [diasDeCarencia, setDiasDeCarencia] = useState(inicial.storefrontGraceDays);

  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const extras = modulos.filter((m) => !m.isCore);
  const categorias = [...new Set(extras.map((m) => m.category))];

  function alternarModulo(slug: string) {
    setModulosDoTeste((atual) => (atual.includes(slug) ? atual.filter((s) => s !== slug) : [...atual, slug]));
  }

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setSalvo(false);
    startTransition(async () => {
      try {
        const resultado = await savePlatformConfig({
          nomeDaPlataforma,
          emailDeSuporte,
          diasDeTeste,
          testeLiberaTudo,
          modulosDoTeste,
          diasDeCarenciaDaVitrine: diasDeCarencia,
        });
        if (!resultado.ok) {
          setErro(resultado.error);
          return;
        }
        setSalvo(true);
        router.refresh();
      } catch {
        setErro("Não foi possível salvar agora. Tente de novo em alguns segundos.");
      }
    });
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className={cardClass}>
        <h2 className="font-display text-xl text-foreground">Identificação da plataforma</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Nome da plataforma</span>
            <input
              value={nomeDaPlataforma}
              onChange={(evento) => setNomeDaPlataforma(evento.target.value)}
              className={inputClass}
            />
            <span className="mt-1.5 block text-xs text-muted-foreground">
              É o nome que aparece para os lojistas dentro do sistema e nos e-mails que o sistema envia.
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">E-mail de suporte</span>
            <input
              type="email"
              value={emailDeSuporte}
              onChange={(evento) => setEmailDeSuporte(evento.target.value)}
              placeholder="contato@suaplataforma.com.br"
              className={inputClass}
            />
            <span className="mt-1.5 block text-xs text-muted-foreground">
              É o endereço para onde o lojista escreve quando precisa de ajuda. Pode ficar vazio.
            </span>
          </label>
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="font-display text-xl text-foreground">Teste grátis de loja nova</h2>
        <label className="mt-4 block sm:max-w-xs">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Dias de teste grátis</span>
          <input
            type="number"
            min={0}
            max={90}
            value={diasDeTeste}
            onChange={(evento) => setDiasDeTeste(Number(evento.target.value))}
            className={inputClass}
          />
          <span className="mt-1.5 block text-xs text-muted-foreground">
            Quantos dias uma loja recém-cadastrada tem para usar a plataforma sem pagar. Zero significa que a loja já
            nasce precisando pagar.
          </span>
        </label>

        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-foreground">No teste, a loja vê</legend>
          <p className="mt-1 text-sm text-muted-foreground">
            O padrão é <strong>a loja ver tudo</strong> durante o teste: quem experimenta a plataforma inteira entende o
            que está comprando e assina com menos dúvida. Limitar o teste normalmente só faz o lojista achar que o
            sistema não faz o que ele precisa.
          </p>
          <div className="mt-3 space-y-2">
            <label className="flex cursor-pointer items-start gap-2.5 rounded-[10px] border border-border bg-background p-3">
              <input
                type="radio"
                name="teste-libera"
                checked={testeLiberaTudo}
                onChange={() => setTesteLiberaTudo(true)}
                className="mt-0.5 size-4 shrink-0"
              />
              <span>
                <span className="block text-sm font-medium text-foreground">Tudo (recomendado)</span>
                <span className="block text-xs text-muted-foreground">
                  Durante o teste, a loja usa todos os módulos da plataforma.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-[10px] border border-border bg-background p-3">
              <input
                type="radio"
                name="teste-libera"
                checked={!testeLiberaTudo}
                onChange={() => setTesteLiberaTudo(false)}
                className="mt-0.5 size-4 shrink-0"
              />
              <span>
                <span className="block text-sm font-medium text-foreground">Só estes módulos</span>
                <span className="block text-xs text-muted-foreground">
                  Durante o teste, a loja vê o núcleo (pedidos, produtos, configurações, pagamentos e painel de vendas) e
                  mais só o que estiver marcado abaixo.
                </span>
              </span>
            </label>
          </div>

          {!testeLiberaTudo ? (
            <div className="mt-4 space-y-4">
              {categorias.map((categoria) => (
                <div key={categoria}>
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {CATEGORIA_LABEL[categoria] ?? categoria}
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {extras
                      .filter((modulo) => modulo.category === categoria)
                      .map((modulo) => (
                        <label
                          key={modulo.slug}
                          className="flex cursor-pointer items-start gap-2.5 rounded-[10px] border border-border bg-background p-3"
                        >
                          <input
                            type="checkbox"
                            checked={modulosDoTeste.includes(modulo.slug)}
                            onChange={() => alternarModulo(modulo.slug)}
                            className="mt-0.5 size-4 shrink-0"
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-foreground">{modulo.name}</span>
                            {modulo.description ? (
                              <span className="block text-xs text-muted-foreground">{modulo.description}</span>
                            ) : null}
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </fieldset>
      </div>

      <div className={cardClass}>
        <h2 className="font-display text-xl text-foreground">Atraso no pagamento</h2>
        <label className="mt-4 block sm:max-w-xs">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Dias de carência da vitrine</span>
          <input
            type="number"
            min={0}
            max={90}
            value={diasDeCarencia}
            onChange={(evento) => setDiasDeCarencia(Number(evento.target.value))}
            className={inputClass}
          />
        </label>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Depois de <strong>{Number.isFinite(diasDeCarencia) ? diasDeCarencia : 0}</strong>{" "}
          {diasDeCarencia === 1 ? "dia" : "dias"} de atraso no pagamento, o site da loja sai do ar para os clientes —
          ninguém consegue comprar. <strong>O painel da loja continua aberto</strong> para o lojista regularizar o
          pagamento e voltar ao ar. São coisas separadas de propósito: tirar o painel também deixaria o lojista sem
          como pagar.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Zero significa que a vitrine sai do ar no primeiro dia de atraso.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Salvar configuração
        </button>
        {salvo ? <span className="text-sm text-green-700">Configuração salva.</span> : null}
      </div>
      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
    </form>
  );
}
