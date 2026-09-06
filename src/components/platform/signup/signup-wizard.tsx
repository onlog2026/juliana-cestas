"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Loader2, Store, TriangleAlert } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { BotaoGoogle } from "@/components/platform/signup/google-button";
import { criarMinhaLoja, verificarEnderecoDaLoja } from "@/modules/platform/onboarding-actions";

/**
 * Cadastro de loja em três passos: (1) conta, (2) dados da loja, (3) pronto.
 *
 * Três decisões que valem o comentário:
 *
 * 1. **Senha nunca passa por este componente.** O campo vai direto para o
 *    `supabase.auth.signUp`. Não guardamos, não mandamos para o nosso servidor
 *    e não temos como ler — quem cuida de senha é o Supabase Auth.
 * 2. **O endereço da loja é normalizado NO SERVIDOR.** A pessoa digita à
 *    vontade ("Cestas da Ju!") e a resposta da conferência traz o endereço que
 *    o sistema realmente usaria ("cestas-da-ju"), que é o que a tela mostra.
 *    Se a limpeza fosse feita aqui, existiriam duas regras de endereço no
 *    projeto e um dia elas discordariam — e a pessoa descobriria o endereço
 *    diferente depois de já ter divulgado.
 * 3. **A tela não decide plano nem teste.** O plano escolhido na página de
 *    planos vem só como informação; o que grava é o servidor, com o teste de
 *    `saas_config`. Por isso não existe nenhum campo escondido de plano aqui.
 */

type LojaPronta = {
  nome: string;
  slug: string;
  /** `null` quando a plataforma ainda não tem domínio próprio configurado. */
  painelUrl: string | null;
  /** Já formatado (dd de mês de aaaa) — nunca uma data crua. */
  fimDoTesteTexto: string | null;
  jaExistia: boolean;
};

type Passo = "conta" | "loja" | "pronto";

const NICHOS = [
  "Cestas e presentes",
  "Flores e plantas",
  "Doces e bolos",
  "Comida e bebida",
  "Moda e acessórios",
  "Beleza e cuidados",
  "Casa e decoração",
  "Papelaria e festas",
  "Outro",
] as const;

export function SignupWizard({
  logado,
  emailDaConta,
  nomeSugerido,
  lojaExistente,
  planoEscolhido,
  trialDays,
  dominioDaPlataforma,
}: {
  logado: boolean;
  emailDaConta: string | null;
  nomeSugerido: string | null;
  lojaExistente: LojaPronta | null;
  /** Nome REAL do plano vindo do banco, ou `null`. Nunca texto do endereço. */
  planoEscolhido: string | null;
  trialDays: number | null;
  dominioDaPlataforma: string | null;
}) {
  const [passo, setPasso] = useState<Passo>(lojaExistente ? "pronto" : logado ? "loja" : "conta");
  const [email, setEmail] = useState(emailDaConta ?? "");
  const [pronta, setPronta] = useState<LojaPronta | null>(lojaExistente);

  return (
    <div className="mx-auto w-full max-w-xl">
      <Trilha passo={passo} />

      <div className="mt-6 rounded-card border border-border bg-card p-5 shadow-[var(--jc-shadow)] sm:p-7">
        {passo === "conta" ? (
          <PassoConta
            onEntrou={(emailUsado) => {
              setEmail(emailUsado);
              setPasso("loja");
            }}
          />
        ) : null}

        {passo === "loja" ? (
          <PassoLoja
            email={email}
            nomeSugerido={nomeSugerido}
            planoEscolhido={planoEscolhido}
            trialDays={trialDays}
            dominioDaPlataforma={dominioDaPlataforma}
            onCriou={(loja) => {
              setPronta(loja);
              setPasso("pronto");
            }}
            onVoltarParaConta={logado ? null : () => setPasso("conta")}
          />
        ) : null}

        {passo === "pronto" && pronta ? <PassoPronto loja={pronta} /> : null}
      </div>
    </div>
  );
}

/* ─────────────────────────────── Trilha ─────────────────────────────────── */

function Trilha({ passo }: { passo: Passo }) {
  const indice = passo === "conta" ? 0 : passo === "loja" ? 1 : 2;
  const nomes = ["Sua conta", "Sua loja", "Pronto"];

  return (
    <ol className="flex items-center gap-2">
      {nomes.map((nome, i) => (
        <li key={nome} className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className={
              i <= indice
                ? "flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                : "flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-muted-foreground"
            }
          >
            {i < indice ? <Check className="size-3.5" /> : i + 1}
          </span>
          <span
            className={
              i <= indice
                ? "truncate text-sm font-medium text-foreground"
                : "truncate text-sm text-muted-foreground"
            }
          >
            {nome}
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ───────────────────────────── Passo 1: conta ───────────────────────────── */

function PassoConta({ onEntrou }: { onEntrou: (email: string) => void }) {
  const [modo, setModo] = useState<"criar" | "entrar">("criar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmePorEmail, setConfirmePorEmail] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);
    const supabase = createBrowserSupabaseClient();

    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) {
        setErro("E-mail ou senha incorretos.");
        setCarregando(false);
        return;
      }
      onEntrou(email);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { name: nome } },
    });

    if (error) {
      setErro(
        error.message.includes("already registered")
          ? "Esse e-mail já tem conta. Use a opção “Já tenho conta”."
          : "Não consegui criar a conta agora. Confira o e-mail e tente de novo."
      );
      setCarregando(false);
      return;
    }

    // Quando a confirmação por e-mail está ligada no Supabase, o cadastro NÃO
    // devolve sessão. Seguir para o passo 2 aqui faria a criação da loja falhar
    // com "sessão expirada" e a pessoa não entenderia por quê. Dizemos a
    // verdade e paramos.
    if (!data.session) {
      setConfirmePorEmail(true);
      setCarregando(false);
      return;
    }

    onEntrou(email);
  }

  if (confirmePorEmail) {
    return (
      <div>
        <h2 className="font-display text-xl text-foreground">Confirme seu e-mail</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Enviamos um link de confirmação para <span className="font-medium text-foreground">{email}</span>.
          Abra esse e-mail, clique no link e volte aqui para continuar o cadastro da loja. Nada do que você
          preencheu foi perdido — a loja ainda não foi criada.
        </p>
        <button
          type="button"
          onClick={() => setConfirmePorEmail(false)}
          className="mt-5 inline-flex h-12 items-center gap-2 rounded-full border border-primary/30 px-5 text-sm font-semibold text-primary hover:bg-accent"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-xl text-foreground">
        {modo === "criar" ? "Crie sua conta" : "Entre na sua conta"}
      </h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        É a conta que vai abrir o painel da sua loja.
      </p>

      <div className="mt-5">
        <BotaoGoogle next="/cadastro" rotulo="Continuar com Google" />
      </div>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={enviar} className="space-y-4">
        {modo === "criar" ? (
          <Campo rotulo="Seu nome">
            <input
              required
              value={nome}
              autoComplete="name"
              onChange={(e) => setNome(e.target.value)}
              className={ENTRADA}
            />
          </Campo>
        ) : null}

        <Campo rotulo="E-mail">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={ENTRADA}
          />
        </Campo>

        <Campo rotulo="Senha" ajuda={modo === "criar" ? "Pelo menos 6 caracteres." : undefined}>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={modo === "criar" ? "new-password" : "current-password"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={ENTRADA}
          />
        </Campo>

        {erro ? <Recado>{erro}</Recado> : null}

        <button
          type="submit"
          disabled={carregando}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {carregando ? <Loader2 className="size-4 animate-spin" /> : null}
          {modo === "criar" ? "Criar conta e continuar" : "Entrar e continuar"}
          {!carregando ? <ArrowRight className="size-4" /> : null}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setModo(modo === "criar" ? "entrar" : "criar");
          setErro(null);
        }}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center text-sm text-muted-foreground hover:text-primary"
      >
        {modo === "criar" ? "Já tenho conta" : "Quero criar uma conta"}
      </button>
    </div>
  );
}

/* ───────────────────────────── Passo 2: a loja ──────────────────────────── */

function PassoLoja({
  email,
  nomeSugerido,
  planoEscolhido,
  trialDays,
  dominioDaPlataforma,
  onCriou,
  onVoltarParaConta,
}: {
  email: string;
  nomeSugerido: string | null;
  planoEscolhido: string | null;
  trialDays: number | null;
  dominioDaPlataforma: string | null;
  onCriou: (loja: LojaPronta) => void;
  onVoltarParaConta: (() => void) | null;
}) {
  const [nome, setNome] = useState(nomeSugerido ?? "");
  const [enderecoDigitado, setEnderecoDigitado] = useState("");
  const [enderecoTocado, setEnderecoTocado] = useState(false);
  const [nicho, setNicho] = useState<string>(NICHOS[0]);
  const [nichoLivre, setNichoLivre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cidade, setCidade] = useState("");

  const [conferindo, setConferindo] = useState(false);
  const [enderecoFinal, setEnderecoFinal] = useState("");
  const [enderecoOk, setEnderecoOk] = useState(false);
  const [enderecoRecado, setEnderecoRecado] = useState<string | null>(null);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Enquanto a pessoa não mexeu no campo de endereço, ele acompanha o nome da
  // loja. Assim ninguém precisa inventar um endereço do zero.
  const textoDoEndereco = enderecoTocado ? enderecoDigitado : nome;

  // Guarda contra resposta atrasada: se a pessoa continua digitando, a resposta
  // da conferência antiga não pode sobrescrever a nova.
  const pedidoAtual = useRef(0);

  useEffect(() => {
    const texto = textoDoEndereco.trim();
    if (!texto) {
      setEnderecoFinal("");
      setEnderecoOk(false);
      setEnderecoRecado(null);
      setConferindo(false);
      return;
    }

    setConferindo(true);
    const meuPedido = ++pedidoAtual.current;
    const timer = setTimeout(async () => {
      try {
        const r = await verificarEnderecoDaLoja(texto);
        if (meuPedido !== pedidoAtual.current) return;
        setEnderecoFinal(r.slug);
        setEnderecoOk(r.disponivel);
        setEnderecoRecado(r.mensagem);
      } catch (e) {
        if (meuPedido !== pedidoAtual.current) return;
        console.error("[cadastro] falha ao conferir o endereço:", e);
        setEnderecoOk(false);
        setEnderecoRecado("Não consegui conferir o endereço agora. Tente de novo em instantes.");
      } finally {
        if (meuPedido === pedidoAtual.current) setConferindo(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [textoDoEndereco]);

  const nichoFinal = nicho === "Outro" ? nichoLivre.trim() : nicho;
  const podeEnviar =
    !salvando &&
    !conferindo &&
    enderecoOk &&
    nome.trim().length >= 2 &&
    nichoFinal.length >= 2 &&
    whatsapp.replace(/\D+/g, "").length >= 10 &&
    cidade.trim().length >= 2;

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);

    try {
      const r = await criarMinhaLoja({
        nome: nome.trim(),
        slug: textoDoEndereco.trim(),
        nicho: nichoFinal,
        whatsapp,
        cidade: cidade.trim(),
      });

      if (!r.ok) {
        setErro(r.error);
        if (r.campo === "slug") setEnderecoOk(false);
        setSalvando(false);
        return;
      }

      onCriou({
        nome: r.nome,
        slug: r.slug,
        painelUrl: r.painelUrl,
        fimDoTesteTexto: formatarData(r.trialEndsAt),
        jaExistia: r.jaExistia,
      });
    } catch (e) {
      console.error("[cadastro] falha ao criar a loja:", e);
      setErro("Não consegui criar sua loja agora. Tente de novo em instantes.");
      setSalvando(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-xl text-foreground">Sua loja</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {email ? (
          <>
            Conta: <span className="font-medium text-foreground">{email}</span>.{" "}
          </>
        ) : null}
        Dá para mudar tudo isso depois, no painel.
      </p>

      {planoEscolhido || trialDays !== null ? (
        <div className="mt-4 rounded-[10px] border border-primary/25 bg-secondary/50 p-3.5 text-sm text-foreground">
          {planoEscolhido ? (
            <p>
              Plano escolhido: <span className="font-semibold">{planoEscolhido}</span>.
            </p>
          ) : null}
          {trialDays !== null ? (
            <p className={planoEscolhido ? "mt-1 text-muted-foreground" : "text-muted-foreground"}>
              {trialDays > 0
                ? `Sua loja começa com ${trialDays} ${trialDays === 1 ? "dia" : "dias"} de teste. Nenhuma cobrança agora e nenhum cartão pedido.`
                : "Nenhuma cobrança acontece agora — a escolha do plano vem depois, dentro do painel."}
            </p>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={criar} className="mt-5 space-y-4">
        <Campo rotulo="Nome da loja">
          <input
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Cestas da Ju"
            className={ENTRADA}
          />
        </Campo>

        <Campo
          rotulo="Endereço da loja"
          ajuda="Letras minúsculas, números e hífen. É o endereço que seus clientes vão digitar."
        >
          <input
            required
            value={textoDoEndereco}
            onChange={(e) => {
              setEnderecoTocado(true);
              setEnderecoDigitado(e.target.value);
            }}
            placeholder="cestas-da-ju"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={ENTRADA}
          />
        </Campo>

        <div aria-live="polite" className="-mt-2">
          {conferindo ? (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Conferindo o endereço…
            </p>
          ) : enderecoRecado ? (
            <Recado>{enderecoRecado}</Recado>
          ) : enderecoOk && enderecoFinal ? (
            <p className="flex items-start gap-1.5 text-sm text-primary">
              <Check className="mt-0.5 size-4 shrink-0" />
              <span className="min-w-0 break-words">
                Livre! Sua loja vai ficar em{" "}
                <span className="font-semibold">
                  {dominioDaPlataforma ? `${enderecoFinal}.${dominioDaPlataforma}` : `/${enderecoFinal}`}
                </span>
              </span>
            </p>
          ) : null}
        </div>

        <Campo rotulo="O que você vende">
          <select value={nicho} onChange={(e) => setNicho(e.target.value)} className={ENTRADA}>
            {NICHOS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Campo>

        {nicho === "Outro" ? (
          <Campo rotulo="Conte em poucas palavras">
            <input
              required
              maxLength={40}
              value={nichoLivre}
              onChange={(e) => setNichoLivre(e.target.value)}
              placeholder="Artesanato em madeira"
              className={ENTRADA}
            />
          </Campo>
        ) : null}

        <Campo rotulo="WhatsApp da loja" ajuda="Com DDD. É por onde seus clientes falam com você.">
          <input
            required
            type="tel"
            inputMode="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="(61) 99999-9999"
            className={ENTRADA}
          />
        </Campo>

        <Campo rotulo="Cidade">
          <input
            required
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            placeholder="Brasília"
            className={ENTRADA}
          />
        </Campo>

        {erro ? <Recado>{erro}</Recado> : null}

        <button
          type="submit"
          disabled={!podeEnviar}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {salvando ? <Loader2 className="size-4 animate-spin" /> : <Store className="size-4" />}
          {salvando ? "Criando sua loja…" : "Criar minha loja"}
        </button>
      </form>

      {onVoltarParaConta ? (
        <button
          type="button"
          onClick={onVoltarParaConta}
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </button>
      ) : null}
    </div>
  );
}

/* ──────────────────────────── Passo 3: pronto ───────────────────────────── */

function PassoPronto({ loja }: { loja: LojaPronta }) {
  return (
    <div>
      <span className="flex size-11 items-center justify-center rounded-full bg-primary/12 text-primary">
        <Check className="size-5" />
      </span>

      <h2 className="mt-4 font-display text-xl text-foreground">
        {loja.jaExistia ? `Você já tem a loja ${loja.nome}` : `A loja ${loja.nome} está criada`}
      </h2>

      <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <dt className="text-muted-foreground">Endereço:</dt>
          <dd className="font-medium break-all text-foreground">{loja.slug}</dd>
        </div>
        {loja.fimDoTesteTexto ? (
          <div className="flex flex-wrap items-baseline gap-x-2">
            <dt className="text-muted-foreground">Teste grátis até:</dt>
            <dd className="font-medium text-foreground">{loja.fimDoTesteTexto}</dd>
          </div>
        ) : null}
      </dl>

      {loja.painelUrl ? (
        <a
          href={loja.painelUrl}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Abrir o painel da minha loja
          <ArrowRight className="size-4" />
        </a>
      ) : (
        // Sem `PLATFORM_DOMAIN` configurada, a loja nova ainda não tem endereço
        // próprio: `/admin` neste mesmo domínio abre o painel da loja fundadora
        // e recusa esta conta. Botão que leva a lugar nenhum é pior que a
        // verdade escrita.
        <div className="mt-6 flex items-start gap-3 rounded-[10px] border border-destructive/40 bg-background p-4">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="min-w-0 text-sm">
            <p className="font-medium text-foreground">Sua loja foi criada, mas ainda não tem endereço próprio.</p>
            <p className="mt-1 text-muted-foreground">
              O endereço de cada loja depende de uma configuração da plataforma que ainda não foi ligada. Seus
              dados estão salvos e nada se perde. Fale com o suporte para liberarem o acesso ao seu painel.
            </p>
          </div>
        </div>
      )}

      <Link
        href="/plataforma"
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center text-sm text-muted-foreground hover:text-primary"
      >
        Voltar para a página inicial
      </Link>
    </div>
  );
}

/* ────────────────────────────── Peças comuns ────────────────────────────── */

/**
 * Altura 48px (`h-12`) e texto 16px no celular de propósito: abaixo de 16px o
 * iPhone dá zoom sozinho ao focar o campo e a página "pula".
 */
const ENTRADA =
  "h-12 w-full rounded-[10px] border border-border bg-background px-3.5 text-base text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:text-sm";

function Campo({
  rotulo,
  ajuda,
  children,
}: {
  rotulo: string;
  ajuda?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{rotulo}</span>
      {children}
      {ajuda ? <span className="mt-1.5 block text-xs text-muted-foreground">{ajuda}</span> : null}
    </label>
  );
}

function Recado({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-1.5 text-sm text-destructive">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/**
 * Formata só no navegador, e só depois de a pessoa clicar — nunca durante a
 * renderização do servidor. Data formatada no servidor (UTC) e recalculada no
 * navegador (fuso local) é o caminho conhecido para o erro de hidratação do
 * React.
 */
function formatarData(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}
