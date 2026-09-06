import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ADMIN_MENU_MODULES,
  CORE_MODULE_SLUGS,
  MODULE_REGISTRY,
  MODULE_SLUGS,
} from "@/lib/modules/registry";
import { SUPER_ADMIN_EMAILS } from "@/lib/platform/super-admins";

/**
 * O TESTE MAIS IMPORTANTE DESTE MÓDULO.
 *
 * Ele abre a migração de verdade (`0026_platform_plans_vouchers.sql`), extrai o
 * INSERT de `platform_modules` e compara, linha por linha, com o registro
 * TypeScript. Se alguém acrescentar um módulo no banco e esquecer do código (ou
 * o contrário), o teste quebra na hora.
 *
 * Motivo: no Agentop havia QUATRO listas de módulos espelhadas. Elas divergiram
 * três vezes -- numa delas a cortesia de um módulo virou botão morto por dois
 * dias. Lista espelhada sem teste diverge; é só questão de quando.
 */

const RAIZ = path.resolve(__dirname, "..", "..");

function lerMigracao(arquivo: string): string {
  return readFileSync(path.join(RAIZ, "supabase", "migrations", arquivo), "utf8");
}

/**
 * Extrai as linhas de VALUES de um `insert into <tabela> ... values (...), (...)`.
 *
 * Escrito à mão de propósito: um regex simples quebraria na primeira descrição
 * que tivesse vírgula ou parêntese dentro das aspas -- e várias têm
 * ("Usar o próprio endereço (www.sualoja.com.br).").
 */
function extrairValues(sql: string, tabela: string): string[][] {
  const marcador = new RegExp(`insert\\s+into\\s+${tabela}\\s*\\(`, "i");
  const inicioMatch = marcador.exec(sql);
  if (!inicioMatch) throw new Error(`não encontrei o insert de ${tabela} no .sql`);

  const depoisDoInsert = sql.slice(inicioMatch.index);
  const posValues = depoisDoInsert.toLowerCase().indexOf(" values");
  if (posValues < 0) throw new Error(`insert de ${tabela} sem VALUES`);

  const corpo = depoisDoInsert.slice(posValues + " values".length);

  const linhas: string[][] = [];
  let campos: string[] = [];
  let atual = "";
  let profundidade = 0;
  let dentroDeAspas = false;

  for (let i = 0; i < corpo.length; i += 1) {
    const c = corpo[i];

    if (dentroDeAspas) {
      if (c === "'") {
        // '' é uma aspa escapada dentro do texto, não o fim dele.
        if (corpo[i + 1] === "'") {
          atual += "'";
          i += 1;
          continue;
        }
        dentroDeAspas = false;
        continue;
      }
      atual += c;
      continue;
    }

    if (c === "'") {
      dentroDeAspas = true;
      continue;
    }

    if (c === "(") {
      profundidade += 1;
      if (profundidade === 1) {
        campos = [];
        atual = "";
        continue;
      }
    }

    if (c === ")") {
      profundidade -= 1;
      if (profundidade === 0) {
        campos.push(atual.trim());
        linhas.push(campos);
        campos = [];
        atual = "";
        continue;
      }
    }

    if (c === "," && profundidade === 1) {
      campos.push(atual.trim());
      atual = "";
      continue;
    }

    // Fim da lista de VALUES: `on conflict`, `select`, `;`…
    if (profundidade === 0) {
      const resto = corpo.slice(i).trimStart().toLowerCase();
      if (resto.startsWith("on conflict") || resto.startsWith(";") || resto.startsWith("select")) break;
      continue;
    }

    atual += c;
  }

  if (linhas.length === 0) throw new Error(`nenhuma linha encontrada no insert de ${tabela}`);
  return linhas;
}

type ModuloDoSql = {
  slug: string;
  name: string;
  description: string;
  category: string;
  isCore: boolean;
  sortOrder: number;
};

function modulosDoSql(): ModuloDoSql[] {
  const sql = lerMigracao("0026_platform_plans_vouchers.sql");
  // Colunas do insert: (slug, name, description, category, is_core, sort_order)
  return extrairValues(sql, "platform_modules").map((campos) => {
    expect(campos).toHaveLength(6);
    return {
      slug: campos[0],
      name: campos[1],
      description: campos[2],
      category: campos[3],
      isCore: campos[4].toLowerCase() === "true",
      sortOrder: Number(campos[5]),
    };
  });
}

describe("registro de módulos x migração 0026", () => {
  const doSql = modulosDoSql();

  it("a migração ainda tem os módulos onde o teste espera (o parser está lendo certo)", () => {
    expect(doSql.length).toBeGreaterThanOrEqual(20);
    expect(doSql[0].slug).toBe("dashboard");
    expect(doSql[0].isCore).toBe(true);
    // Prova que o parser aguenta texto com parêntese e ponto dentro das aspas.
    const dominio = doSql.find((m) => m.slug === "dominio");
    expect(dominio?.description).toBe("Usar o próprio endereço (www.sualoja.com.br).");
  });

  it("os slugs do TypeScript e os do banco são exatamente os mesmos, na mesma ordem", () => {
    expect(MODULE_SLUGS).toEqual(doSql.map((m) => m.slug));
  });

  it("nenhum slug aparece duas vezes no registro", () => {
    expect(new Set(MODULE_SLUGS).size).toBe(MODULE_SLUGS.length);
  });

  it("nome, categoria, is_core e ordem batem módulo a módulo", () => {
    for (const esperado of doSql) {
      const noCodigo = MODULE_REGISTRY.find((m) => m.slug === esperado.slug);
      expect(noCodigo, `módulo "${esperado.slug}" existe no banco e não existe no TypeScript`).toBeTruthy();
      expect({
        slug: noCodigo!.slug,
        name: noCodigo!.name,
        category: noCodigo!.category,
        isCore: noCodigo!.isCore,
        sortOrder: noCodigo!.sortOrder,
      }).toEqual({
        slug: esperado.slug,
        name: esperado.name,
        category: esperado.category,
        isCore: esperado.isCore,
        sortOrder: esperado.sortOrder,
      });
    }
  });

  it("todo módulo do código tem descrição escrita (é o texto da página de oferta)", () => {
    for (const m of MODULE_REGISTRY) {
      expect(m.description.trim().length, `módulo "${m.slug}" sem descrição`).toBeGreaterThan(5);
    }
  });

  it("o núcleo é exatamente estes cinco -- e é o mesmo conjunto marcado no banco", () => {
    expect([...CORE_MODULE_SLUGS].sort()).toEqual(
      ["configuracoes", "dashboard", "pagamentos", "pedidos", "produtos"].sort()
    );
    expect([...CORE_MODULE_SLUGS].sort()).toEqual(
      doSql
        .filter((m) => m.isCore)
        .map((m) => m.slug)
        .sort()
    );
  });
});

describe("menu do painel da loja", () => {
  it("todo item de menu aponta para um módulo do registro e tem ícone e rota", () => {
    for (const m of ADMIN_MENU_MODULES) {
      expect(MODULE_SLUGS).toContain(m.slug);
      expect(m.menu.href.startsWith("/admin")).toBe(true);
      expect(m.menu.iconName.length).toBeGreaterThan(0);
      expect(m.menu.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("não existe rota nem ordem repetida no menu", () => {
    const hrefs = ADMIN_MENU_MODULES.map((m) => m.menu.href);
    const ordens = ADMIN_MENU_MODULES.map((m) => m.menu.menuOrder);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(new Set(ordens).size).toBe(ordens.length);
  });

  it("a ordem do menu é a MESMA que a lojista já usa hoje (mudar isso é mudar o painel dela)", () => {
    expect(ADMIN_MENU_MODULES.map((m) => m.menu.label)).toEqual([
      "Início",
      "Pedidos",
      "Entregas",
      "Atendimento",
      "Produtos",
      "Cupons",
      "CMS",
      "SEO",
      "Configurações",
      "Pagamentos",
    ]);
  });

  /**
   * Antes este teste listava à mão os módulos que ainda não tinham tela --
   * e envelheceu no dia em que `/admin/pagamentos` nasceu. A invariante que
   * realmente importa não é "estes três estão de fora": é **todo item do menu
   * leva a uma tela que existe de verdade**. Agora quem responde isso é o
   * disco, não uma lista escrita à mão que alguém precisa lembrar de atualizar.
   */
  it("todo item do menu aponta para uma tela que existe no disco", () => {
    const raiz = path.resolve(__dirname, "../..");
    const faltando = ADMIN_MENU_MODULES.filter((m) => {
      const rota = m.menu.href.replace(/^\/admin\/?/, "");
      const pasta = rota
        ? path.join(raiz, "src/app/admin/(protected)", rota)
        : path.join(raiz, "src/app/admin/(protected)");
      return !existsSync(path.join(pasta, "page.tsx"));
    }).map((m) => `${m.menu.label} -> ${m.menu.href}`);

    expect(faltando).toEqual([]);
  });

  it("módulo sem rota no registro continua fora do menu (escondido por padrão)", () => {
    const comMenu = ADMIN_MENU_MODULES.map((m) => m.slug);
    // Nada de "aparece cinza e não funciona": sem tela, sem item.
    expect(comMenu).not.toContain("financeiro");
    expect(comMenu).not.toContain("equipe");
    expect(comMenu).not.toContain("galeria");
  });
});

describe("super admin do código x migração 0025", () => {
  it("os e-mails de super admin do TypeScript são os mesmos cadastrados em platform_admins", () => {
    const sql = lerMigracao("0025_platform_foundation.sql");
    // Colunas do insert: (email, name, role)
    const doBanco = extrairValues(sql, "platform_admins").map((campos) => campos[0].toLowerCase());
    expect([...SUPER_ADMIN_EMAILS].map((e) => e.toLowerCase()).sort()).toEqual(doBanco.sort());
  });
});
