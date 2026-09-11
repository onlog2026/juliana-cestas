import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ADMIN_MENU_MODULES,
  CORE_MODULE_SLUGS,
  MODULE_REGISTRY,
  MODULE_SLUGS,
  MENU_GROUPS,
  MENU_GROUP_OF,
  buildGroupedAdminMenu,
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

/**
 * O catálogo de módulos vive em MAIS DE UMA migração: a 0026 trouxe os
 * primeiros e a 0031 acrescentou `estoque` e `compras`. Ler só a 0026 faria o
 * teste acusar divergência falsa a cada módulo novo -- e um teste que grita
 * sem motivo é um teste que as pessoas aprendem a ignorar. Migração que
 * insere em `platform_modules` entra nesta lista, na ordem em que roda.
 */
const MIGRACOES_COM_MODULOS = [
  "0026_platform_plans_vouchers.sql",
  "0031_inventory_purchases.sql",
];

function modulosDoSql(): ModuloDoSql[] {
  // `extrairValues` acha o PRIMEIRO "insert into platform_modules (" e para no
  // "on conflict" daquele bloco -- concatenar os arquivos e chamar uma vez só
  // faria ele nunca enxergar o insert da segunda migração. Por isso cada
  // arquivo é lido e extraído SEPARADAMENTE, e as linhas são somadas.
  const linhas = MIGRACOES_COM_MODULOS.flatMap((arquivo) =>
    extrairValues(lerMigracao(arquivo), "platform_modules")
  );
  // Colunas do insert: (slug, name, description, category, is_core, sort_order)
  return linhas.map((campos) => {
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

describe("registro de módulos x migrações do catálogo", () => {
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

  // O menu deixou de ser uma fila de 20 itens e virou departamentos
  // ("guarda-chuvas"), no estilo do Agentop. O teste da ordem plana foi
  // substituído pelos testes de departamento abaixo.
  it("o item que fica solto no topo é só o Início", () => {
    const menu = buildGroupedAdminMenu(ADMIN_MENU_MODULES);
    expect(menu.standalone.map((i) => i.label)).toEqual(["Início"]);
  });

  it("a árvore de departamentos é exatamente esta (mudar isto é mudar o painel dela)", () => {
    const menu = buildGroupedAdminMenu(ADMIN_MENU_MODULES);
    const arvore = menu.groups.map((g) => [g.label, g.items.map((i) => i.label)] as const);
    expect(arvore).toEqual([
      ["Vendas", ["Pedidos", "Entregas", "Atendimento"]],
      ["Catálogo", ["Produtos", "Marcas", "Estoque", "Compras"]],
      ["Marketing", ["Cupons", "Avaliações", "Automações"]],
      ["Loja online", ["CMS", "SEO", "Modelos", "Galeria", "Domínio"]],
      ["Financeiro", ["Pagamentos", "Financeiro"]],
      ["Configurações", ["Configurações", "Equipe"]],
    ]);
  });

  it("todo item do menu ou é solto ou cai num departamento que existe", () => {
    for (const m of ADMIN_MENU_MODULES) {
      const grupo = MENU_GROUP_OF[m.slug];
      if (grupo !== undefined) {
        expect(
          MENU_GROUPS.some((g) => g.id === grupo),
          `departamento "${grupo}" do módulo "${m.slug}" não existe em MENU_GROUPS`
        ).toBe(true);
      }
    }
  });

  it("MENU_GROUP_OF só cita módulos que estão no menu", () => {
    const slugsNoMenu = new Set(ADMIN_MENU_MODULES.map((m) => m.slug));
    for (const slug of Object.keys(MENU_GROUP_OF)) {
      expect(slugsNoMenu.has(slug), `MENU_GROUP_OF cita "${slug}", que não é item de menu`).toBe(true);
    }
  });

  it("nenhum departamento fica vazio e todos são usados (com o menu completo)", () => {
    const menu = buildGroupedAdminMenu(ADMIN_MENU_MODULES);
    const idsComItem = new Set(menu.groups.map((g) => g.id));
    for (const g of MENU_GROUPS) {
      expect(idsComItem.has(g.id), `departamento "${g.id}" ficou sem nenhum item`).toBe(true);
    }
  });

  it("agrupar não perdeu nem inventou item: soma dos departamentos + soltos = total", () => {
    const menu = buildGroupedAdminMenu(ADMIN_MENU_MODULES);
    const total = menu.standalone.length + menu.groups.reduce((n, g) => n + g.items.length, 0);
    expect(total).toBe(ADMIN_MENU_MODULES.length);
  });

  it("departamento sem módulo liberado não aparece (some sozinho)", () => {
    // Só os itens de Vendas liberados -> só o departamento Vendas aparece.
    const soVendas = ADMIN_MENU_MODULES.filter((m) => MENU_GROUP_OF[m.slug] === "vendas");
    const menu = buildGroupedAdminMenu(soVendas);
    expect(menu.groups.map((g) => g.id)).toEqual(["vendas"]);
    expect(menu.standalone).toHaveLength(0);
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
    expect(comMenu).not.toContain("paginas");
    expect(comMenu).not.toContain("ia");
    expect(comMenu).not.toContain("social");
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
