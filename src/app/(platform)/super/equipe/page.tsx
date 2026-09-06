import { AlertTriangle, CheckCircle2, FileCode2, Info } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import {
  listPlatformAdmins,
  compararListas,
  listarPlanoB,
  resumirEquipe,
} from "@/modules/platform/team-service";
import { AddPlatformAdminForm, ToggleAdminAccessButton } from "@/components/platform/team-form";

export const dynamic = "force-dynamic";

/** "05/09/2026" no relógio de Brasília. Data quebrada não vira texto quebrado. */
function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;
  return data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

const BADGE = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium";
const cardClass = "rounded-card border border-border bg-card p-5";

const PAPEL_LABEL: Record<string, string> = {
  owner: "Dono da plataforma",
  staff: "Equipe da plataforma",
};

export default async function SuperEquipePage() {
  const eu = await requireSuperAdmin();

  const admins = await listPlatformAdmins();
  const divergencias = compararListas(admins);
  const planoB = listarPlanoB();
  const resumo = resumirEquipe(admins);

  const meuEmail = eu.email.trim().toLowerCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-foreground">Equipe e acesso</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quem pode entrar no painel da plataforma e administrar todas as lojas. Não confunda com a equipe de uma loja:
          aqui é o time de quem administra o sistema inteiro.
        </p>
      </div>

      {/* O aviso mais importante da tela: o que esta tela FAZ e o que ela NÃO faz. */}
      <div className="rounded-card border border-border bg-secondary/40 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Info className="size-4" /> Como funciona o acesso aqui
        </h2>
        <p className="mt-2 text-sm text-foreground">
          <strong>Esta tela dá permissão. A pessoa ainda precisa ter uma conta com este mesmo e-mail; se ela não
          tiver, precisa criar pelo login.</strong>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Cadastrar um e-mail aqui não cria conta, não define senha e não envia senha temporária — nem existe botão
          para isso, de propósito. O que acontece é só isto: quando a pessoa entrar com a conta dela usando esse mesmo
          e-mail, o sistema reconhece que ela pode administrar a plataforma. Se o e-mail estiver escrito diferente do
          e-mail da conta dela (um ponto a mais, outro domínio), ela não entra — e o sistema não tem como avisar.
        </p>
      </div>

      {/* Painel de divergência: a parte mais valiosa desta tela. */}
      {divergencias.length > 0 ? (
        <div className="rounded-card border border-amber-300 bg-amber-50 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <AlertTriangle className="size-4" />
            {divergencias.length === 1
              ? "1 diferença entre as duas listas de acesso"
              : `${divergencias.length} diferenças entre as duas listas de acesso`}
          </h2>
          <p className="mt-2 text-sm text-amber-900">
            O sistema guarda a lista de administradores em dois lugares: a <strong>lista principal</strong> (a tabela
            do banco de dados, que é a que vale no dia a dia) e uma <strong>lista de emergência escrita dentro do
            código</strong>, usada só quando o banco de dados não responde. Quando as duas discordam, alguém pode
            ganhar ou perder acesso na hora errada. Foi exatamente isso que aconteceu no Agentop: um e-mail ficou
            administrador para a API e cego na tela.
          </p>
          <ul className="mt-4 space-y-3">
            {divergencias.map((d) => (
              <li key={`${d.tipo}-${d.email}`} className="rounded-[10px] border border-amber-300 bg-card p-3.5">
                <p className="font-medium break-all text-foreground">{d.email}</p>
                <p className="mt-1 text-xs font-medium text-amber-900">
                  {d.tipo === "so_na_tabela"
                    ? "Está só na lista principal (não está na lista de emergência do código)"
                    : "Está só na lista de emergência do código (não está ativo na lista principal)"}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{d.consequencia}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-amber-900">
            <strong>Como resolver:</strong> mexer na lista principal você consegue aqui mesmo, nesta tela. Mexer na
            lista de emergência exige alterar o arquivo <code>src/lib/platform/super-admins.ts</code> e publicar o site
            de novo — isso é trabalho de programador. Me chame quando quiser acertar as duas.
          </p>
        </div>
      ) : (
        <div className="rounded-card border border-green-300 bg-green-50 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-green-900">
            <CheckCircle2 className="size-4" /> As duas listas de acesso estão iguais
          </h2>
          <p className="mt-2 text-sm text-green-900">
            A lista principal (banco de dados) e a lista de emergência (dentro do código) apontam exatamente para as
            mesmas pessoas. É assim que tem que ficar: ninguém ganha nem perde acesso se o banco de dados falhar.
          </p>
        </div>
      )}

      {/* Lista de administradores */}
      <div>
        <h2 className="font-display text-xl text-foreground">Administradores da plataforma</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {resumo.total === 1 ? "1 pessoa cadastrada" : `${resumo.total} pessoas cadastradas`} ·{" "}
          {resumo.ativos === 1 ? "1 com acesso" : `${resumo.ativos} com acesso`}
          {resumo.inativos > 0 ? ` · ${resumo.inativos} sem acesso` : ""}
        </p>

        {admins.length === 0 ? (
          <div className={`${cardClass} mt-4`}>
            <p className="text-sm text-muted-foreground">
              Nenhum administrador cadastrado na lista principal. Isso é grave: hoje só entra no painel quem estiver na
              lista de emergência do código. Cadastre pelo menos uma pessoa no formulário abaixo.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {admins.map((admin) => {
              const ehVoce = admin.email.trim().toLowerCase() === meuEmail;
              const desde = formatDate(admin.createdAt);
              return (
                <div key={admin.email} className={cardClass}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-all font-medium text-foreground">
                        {admin.name ? `${admin.name} — ` : ""}
                        {admin.email}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {admin.isActive ? (
                          <span className={`${BADGE} bg-green-100 text-green-800`}>Com acesso</span>
                        ) : (
                          <span className={`${BADGE} bg-secondary text-muted-foreground`}>Sem acesso</span>
                        )}
                        <span className={`${BADGE} bg-secondary text-muted-foreground`}>
                          {PAPEL_LABEL[admin.role] ?? admin.role}
                        </span>
                        {ehVoce ? <span className={`${BADGE} bg-blue-100 text-blue-800`}>Você</span> : null}
                        {admin.naListaDoCodigo ? (
                          <span className={`${BADGE} bg-secondary text-muted-foreground`}>
                            Também na lista de emergência
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {desde ? `Administrador desde ${desde}` : "Data de cadastro indisponível"}
                      </p>
                    </div>

                    <ToggleAdminAccessButton email={admin.email} ativo={admin.isActive} ehVoce={ehVoce} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          A plataforma nunca pode ficar sem nenhum administrador com acesso. Se você tentar tirar o acesso do último
          que sobrou, o sistema recusa e explica o motivo — essa conferência é feita no servidor, então ela vale mesmo
          para quem tentar por fora desta tela.
        </p>
      </div>

      {/* Adicionar */}
      <div className={cardClass}>
        <h2 className="font-display text-xl text-foreground">Dar acesso a mais alguém</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Escreva o e-mail exatamente como está na conta da pessoa. Você está concedendo permissão, não criando conta.
        </p>
        <AddPlatformAdminForm />
      </div>

      {/* Plano B: a lista dentro do código */}
      <div className={cardClass}>
        <h2 className="flex items-center gap-2 font-display text-xl text-foreground">
          <FileCode2 className="size-4" /> Lista de emergência (dentro do código)
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Estes e-mails estão escritos dentro do próprio programa, no arquivo{" "}
          <code>src/lib/platform/super-admins.ts</code>. Eles servem de <strong>plano B</strong>: se o banco de dados
          não responder na hora do login, o sistema usa esta lista para não trancar o dono fora do próprio painel.
        </p>
        <ul className="mt-3 space-y-1.5">
          {planoB.map((email) => (
            <li key={email} className="break-all text-sm font-medium text-foreground">
              {email}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          <strong>Esta lista não pode ser mudada por aqui.</strong> Mudar exige alterar o arquivo e publicar o site de
          novo — é serviço de programador, não tem botão. Por isso ela deve ficar curta e conter só quem você quer que
          entre mesmo com o banco de dados fora do ar.
        </p>
      </div>
    </div>
  );
}
