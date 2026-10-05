import { S } from "./fotos";
import { NOVOS_TEMAS } from "./novos";
import type { Tema, TemaKey } from "./types";

/**
 * Os 6 modelos de loja × 3 variações. Cada modelo tem ESQUELETO próprio
 * (cabeçalho, abertura, cartão, ritmo, rodapé — ver os componentes em
 * `./<modelo>.tsx`); a variação troca paleta, fontes, textos e fotos.
 *
 * `heroImagem`: caminho de `public/` ou `slug:<cesta>` (usa a foto da cesta).
 * As fotos de exemplo são de cestas reais da plataforma (uso autorizado).
 */

const TEMAS_BASE: Tema[] = [
  {
    key: "classica",
    name: "Clássica",
    resumo: "Carrossel com texto, atalhos redondos das categorias e grade de cestas com moldura.",
    paraQuem: "Quem tem muitas cestas e quer a vitrine que já vende todos os dias.",
    destaques: ["Carrossel de banners com texto", "Categorias em círculos", "Cartão com moldura e preço logo abaixo", "Faixa de aviso no topo"],
    plano: "start",
    variacoes: [
      {
        key: "cafe", name: "Café da manhã",
        paleta: { bg: "#f6f1e8", fg: "#1f2a24", primary: "#556b2f", onPrimary: "#ffffff", accent: "#c9a24a", surface: "#ffffff", muted: "#5d6b61", line: "#e6dccb" },
        fontes: { titulo: "playfair", texto: "figtree" },
        demo: { loja: "Doce Manhã", aviso: "Entrega com data e horário marcados · cartão grátis", titulo: "Café da manhã montado à mão", texto: "Cestas fresquinhas para começar o dia de quem você ama.", heroImagem: "/images/banners/banner-mesa-manha.webp", cestas: [S.afeto, S.essencia, S.aconchego, S.encanto, S.memoravel, S.porDoSol, S.premium, S.lady], categorias: ["Café da manhã", "Aniversário", "Namorados", "Kits", "Opcionais"] },
      },
      {
        key: "romantica", name: "Romântica",
        paleta: { bg: "#fff7f6", fg: "#2b1218", primary: "#8e1b3a", onPrimary: "#ffffff", accent: "#d8a1a8", surface: "#ffffff", muted: "#7c5a60", line: "#efd8da" },
        fontes: { titulo: "playfair", texto: "figtree" },
        demo: { loja: "Amor em Cesta", aviso: "Entrega surpresa no horário que você escolher", titulo: "Para dizer eu te amo do jeito certo", texto: "Cestas, flores e mensagens escritas à mão.", heroImagem: "slug:" + S.amor, cestas: [S.amor, S.lady, S.flores, S.sinha, S.memoravel, S.premium, S.coracao, S.ferrero], categorias: ["Namorados", "Flores", "Chocolates", "Mensagens", "Opcionais"] },
      },
      {
        key: "corporativa", name: "Corporativa",
        paleta: { bg: "#f5f7fa", fg: "#132033", primary: "#1f3a5f", onPrimary: "#ffffff", accent: "#c9a24a", surface: "#ffffff", muted: "#53627a", line: "#d8e0ea" },
        fontes: { titulo: "playfair", texto: "figtree" },
        demo: { loja: "Brinde & Cia", aviso: "Pedidos para empresas com nota fiscal", titulo: "Presentes corporativos com a sua marca", texto: "Kits para clientes e equipes, entregues no dia certo.", heroImagem: "slug:" + S.executivo, cestas: [S.executivo, S.confraria, S.maestro, S.premium, S.frios, S.memoravel, S.essencia, S.aconchego], categorias: ["Clientes", "Equipe", "Fim de ano", "Vinhos", "Kits"] },
      },
    ],
  },
  {
    key: "boutique",
    name: "Boutique",
    resumo: "Branco, muito espaço e fotos grandes. Tipografia fina e preço discreto, como uma loja de grife.",
    paraQuem: "Marcas elegantes com poucas cestas de ticket alto.",
    destaques: ["Logo centralizado e menu fino", "Foto de abertura sem texto por cima", "Cartões altos, sem moldura", "Muito respiro entre as seções"],
    plano: "start",
    variacoes: [
      {
        key: "flores", name: "Flores",
        paleta: { bg: "#ffffff", fg: "#121212", primary: "#121212", onPrimary: "#ffffff", accent: "#b9626e", surface: "#f6f3f1", muted: "#6b6b6b", line: "#e9e5e2" },
        fontes: { titulo: "cormorant", texto: "jost" },
        demo: { loja: "Maison Flor", aviso: "Entrega no mesmo bairro em até 3 horas", titulo: "Flores e cestas para momentos que ficam", texto: "Arranjos e presentes montados um a um.", heroImagem: "slug:" + S.flores, cestas: [S.flores, S.orquidea, S.kolanchoe, S.lady, S.amor, S.sinha], categorias: ["Arranjos", "Orquídeas", "Cestas", "Presentes"] },
      },
      {
        key: "premium", name: "Premium",
        paleta: { bg: "#fbfaf8", fg: "#141414", primary: "#141414", onPrimary: "#ffffff", accent: "#a07d3b", surface: "#f1ede7", muted: "#6a665f", line: "#e6e0d6" },
        fontes: { titulo: "cormorant", texto: "jost" },
        demo: { loja: "Atelier Gourmet", aviso: "Embalagem de presente inclusa", titulo: "Seleção gourmet, embrulhada à mão", texto: "Vinhos, queijos e doces finos em caixas de madeira.", heroImagem: "slug:" + S.premium, cestas: [S.premium, S.memoravel, S.frios, S.confraria, S.sinha, S.essencia], categorias: ["Gourmet", "Vinhos", "Queijos", "Doces"] },
      },
      {
        key: "noivas", name: "Noivas",
        paleta: { bg: "#fbf9f5", fg: "#2a2622", primary: "#2a2622", onPrimary: "#ffffff", accent: "#9a8c7a", surface: "#f2ede5", muted: "#6a635d", line: "#e7e0d4" },
        fontes: { titulo: "cormorant", texto: "jost" },
        demo: { loja: "Sim, Aceito", aviso: "Lembranças para padrinhos e convidados", titulo: "Presentes para o grande dia", texto: "Cestas para padrinhos, noivos e família.", heroImagem: "slug:" + S.sinha, cestas: [S.sinha, S.lady, S.flores, S.amor, S.memoravel, S.essencia], categorias: ["Padrinhos", "Noivos", "Lembranças", "Flores"] },
      },
    ],
  },
  {
    key: "mercado",
    name: "Mercado",
    resumo: "Busca em destaque, ofertas, banners em grade e cartões compactos com botão de adicionar.",
    paraQuem: "Quem tem muitas opções e vende para empresas ou em volume.",
    destaques: ["Barra de busca larga", "Faixa de ofertas com preço riscado", "Banners em grade 2×2", "Cartão com botão Adicionar"],
    plano: "pro",
    variacoes: [
      {
        key: "empresas", name: "Empresas",
        paleta: { bg: "#f2f4f7", fg: "#0f172a", primary: "#0b5cff", onPrimary: "#ffffff", accent: "#ffb800", surface: "#ffffff", muted: "#5b6475", line: "#e2e6ec" },
        fontes: { titulo: "archivo", texto: "inter-tight" },
        demo: { loja: "Cesta Express", aviso: "Pedidos acima de 10 kits com 8% de desconto", titulo: "Kits para empresas em poucos cliques", texto: "Monte o pedido, escolha as datas e pague por PIX ou cartão.", heroImagem: "slug:" + S.executivo, cestas: [S.executivo, S.confraria, S.maestro, S.premium, S.frios, S.essencia, S.aconchego, S.afeto, S.encanto, S.memoravel], categorias: ["Kits", "Vinhos", "Café", "Doces", "Frios", "Opcionais"] },
      },
      {
        key: "datas", name: "Datas especiais",
        paleta: { bg: "#f6f6f6", fg: "#141414", primary: "#e4002b", onPrimary: "#ffffff", accent: "#ffcf00", surface: "#ffffff", muted: "#5e5e5e", line: "#e5e5e5" },
        fontes: { titulo: "archivo", texto: "inter-tight" },
        demo: { loja: "Mega Cestas", aviso: "Dia das Mães: encomendas abertas", titulo: "Ofertas da semana", texto: "As cestas mais pedidas com preço especial.", heroImagem: "slug:" + S.sinha, cestas: [S.sinha, S.lady, S.memoravel, S.afeto, S.essencia, S.amor, S.pink, S.blue, S.flores, S.ferrero], categorias: ["Mães", "Namorados", "Páscoa", "Crianças", "Natal", "Opcionais"] },
      },
      {
        key: "atacado", name: "Atacado",
        paleta: { bg: "#f1f5f2", fg: "#0e1f15", primary: "#0f7a3e", onPrimary: "#ffffff", accent: "#ff8a00", surface: "#ffffff", muted: "#4f6356", line: "#dde7e0" },
        fontes: { titulo: "archivo", texto: "inter-tight" },
        demo: { loja: "Cestão Atacado", aviso: "Preço especial a partir de 20 unidades", titulo: "Cestas em quantidade", texto: "Para eventos, empresas e revendedores.", heroImagem: "/images/banners/banner-vitrine.webp", cestas: [S.essencia, S.afeto, S.aconchego, S.encanto, S.porDoSol, S.executivo, S.confraria, S.frios, S.premium, S.memoravel], categorias: ["Kits", "Café", "Frios", "Doces", "Bebidas", "Embalagens"] },
      },
    ],
  },
  {
    key: "festa",
    name: "Festa",
    resumo: "Cores vivas, formas arredondadas e etiquetas de preço. Alegre do topo ao rodapé.",
    paraQuem: "Cestas de aniversário, infantis e chá de bebê.",
    destaques: ["Menu em pílulas coloridas", "Abertura colorida com formas", "Cartões com fundo pastel", "Preço em etiqueta"],
    plano: "pro",
    variacoes: [
      {
        key: "aniversario", name: "Aniversário",
        paleta: { bg: "#fff8ec", fg: "#2a1640", primary: "#d6165f", onPrimary: "#ffffff", accent: "#ffc400", surface: "#ffffff", muted: "#6b5a7d", line: "#ffe1b8" },
        fontes: { titulo: "baloo", texto: "nunito" },
        demo: { loja: "Festa na Cesta", aviso: "Balões e cartão de parabéns inclusos", titulo: "Parabéns que chega com festa", texto: "Cestas com balões, doces e uma mensagem do seu jeito.", heroImagem: "slug:" + S.pink, cestas: [S.pink, S.blue, S.baloes, S.miniBolo, S.ferrero, S.coracao, S.afeto, S.caneca], categorias: ["Aniversário", "Balões", "Doces", "Bolos", "Mensagens"] },
      },
      {
        key: "infantil", name: "Infantil",
        paleta: { bg: "#f0fbff", fg: "#13304a", primary: "#007aa8", onPrimary: "#ffffff", accent: "#ff7a59", surface: "#ffffff", muted: "#4f6b80", line: "#cfeefb" },
        fontes: { titulo: "baloo", texto: "nunito" },
        demo: { loja: "Pequenos Mimos", aviso: "Dia das Crianças: monte o seu piquenique", titulo: "Piquenique para os pequenos", texto: "Lanches, brinquedos e balões numa cesta só.", heroImagem: "slug:" + S.blue, cestas: [S.blue, S.pink, S.baloes, S.miniBolo, S.caneca, S.ferrero, S.coracao, S.afeto], categorias: ["Meninas", "Meninos", "Balões", "Lanches", "Brinquedos"] },
      },
      {
        key: "cha-de-bebe", name: "Chá de bebê",
        paleta: { bg: "#fbf7ff", fg: "#2c2142", primary: "#7a5cf0", onPrimary: "#ffffff", accent: "#4fc8a3", surface: "#ffffff", muted: "#685d80", line: "#e9e0fb" },
        fontes: { titulo: "baloo", texto: "nunito" },
        demo: { loja: "Doce Espera", aviso: "Presentes para a mamãe e o bebê", titulo: "Bem-vindo, bebê!", texto: "Cestas carinhosas para a chegada mais esperada.", heroImagem: "slug:" + S.lady, cestas: [S.lady, S.sinha, S.flores, S.caneca, S.miniBolo, S.coracao, S.afeto, S.kolanchoe], categorias: ["Mamãe", "Bebê", "Flores", "Lembranças", "Doces"] },
      },
    ],
  },
  {
    key: "noir",
    name: "Noir",
    resumo: "Fundo escuro, dourado e títulos serifados grandes. Sofisticado, para presentes de alto valor.",
    paraQuem: "Vinhos, presentes corporativos e cestas de fim de ano.",
    destaques: ["Barra escura com logo dourado", "Foto em tela cheia com título grande", "Cartões escuros com fio dourado", "Rodapé minimalista"],
    plano: "pro",
    variacoes: [
      {
        key: "vinhos", name: "Vinhos",
        paleta: { bg: "#0f0b0b", fg: "#f4ece4", primary: "#c8a45c", onPrimary: "#140f0f", accent: "#9a2a38", surface: "#1a1414", muted: "#b5a99b", line: "#3a2e28" },
        fontes: { titulo: "bodoni", texto: "manrope" },
        demo: { loja: "Adega & Cia", aviso: "Entrega refrigerada · embalagem de presente", titulo: "Vinho, queijo e um brinde", texto: "Seleções para quem aprecia o que é raro.", heroImagem: "slug:" + S.confraria, cestas: [S.confraria, S.premium, S.maestro, S.frios, S.executivo, S.memoravel], categorias: ["Tintos", "Queijos", "Kits", "Presentes"] },
      },
      {
        key: "corporativo", name: "Corporativo",
        paleta: { bg: "#0b0f14", fg: "#eef2f6", primary: "#d4b26a", onPrimary: "#0b0f14", accent: "#4a86b0", surface: "#121922", muted: "#9fb0c2", line: "#24303d" },
        fontes: { titulo: "bodoni", texto: "manrope" },
        demo: { loja: "Executive Gifts", aviso: "Atendimento dedicado para empresas", titulo: "Presentes que fecham negócios", texto: "Kits executivos com cartão da sua empresa.", heroImagem: "slug:" + S.executivo, cestas: [S.executivo, S.maestro, S.confraria, S.premium, S.frios, S.memoravel], categorias: ["Executivo", "Clientes", "Diretoria", "Fim de ano"] },
      },
      {
        key: "natal", name: "Natal",
        paleta: { bg: "#0c1410", fg: "#f2efe6", primary: "#d4b26a", onPrimary: "#0c1410", accent: "#b3303a", surface: "#13201a", muted: "#a9b5a8", line: "#26372d" },
        fontes: { titulo: "bodoni", texto: "manrope" },
        demo: { loja: "Noite Feliz", aviso: "Encomendas de Natal até 20 de dezembro", titulo: "A cesta da ceia, pronta para presentear", texto: "Panetones, vinhos e frios selecionados.", heroImagem: "slug:" + S.memoravel, cestas: [S.memoravel, S.premium, S.confraria, S.frios, S.maestro, S.executivo], categorias: ["Ceia", "Vinhos", "Doces", "Empresas"] },
      },
    ],
  },
  {
    key: "rustico",
    name: "Rústico",
    resumo: "Papel kraft, fotos em polaroid e bilhetes escritos à mão. Aconchego de fazenda.",
    paraQuem: "Café colonial, produtos artesanais e datas como Páscoa.",
    destaques: ["Fundo de papel kraft", "Fotos em polaroid levemente inclinadas", "Bilhete manuscrito na abertura", "Selo de feito à mão"],
    plano: "pro",
    variacoes: [
      {
        key: "cafe-colonial", name: "Café colonial",
        paleta: { bg: "#efe4cf", fg: "#3b2a1a", primary: "#5b6b2f", onPrimary: "#ffffff", accent: "#b5562b", surface: "#f8f1e3", muted: "#6e5a44", line: "#d6c4a3" },
        fontes: { titulo: "lora", texto: "work-sans", detalhe: "caveat" },
        demo: { loja: "Sítio da Vó", aviso: "Pães e geleias feitos no dia", titulo: "Café colonial na porta de casa", texto: "Receitas de família, montadas com carinho.", heroImagem: "/images/banners/banner-ingredientes.webp", cestas: [S.afeto, S.aconchego, S.porDoSol, S.essencia, S.encanto, S.memoravel], categorias: ["Café colonial", "Pães", "Geleias", "Queijos"] },
      },
      {
        key: "fazenda", name: "Fazenda",
        paleta: { bg: "#ebe0cb", fg: "#3a2618", primary: "#7a4b2a", onPrimary: "#ffffff", accent: "#5b6b2f", surface: "#f6eedf", muted: "#6f5843", line: "#d3bf9c" },
        fontes: { titulo: "lora", texto: "work-sans", detalhe: "caveat" },
        demo: { loja: "Empório da Roça", aviso: "Queijos e embutidos de produtores locais", titulo: "Direto da roça para a sua mesa", texto: "Queijos, frios e doces caseiros.", heroImagem: "slug:" + S.frios, cestas: [S.frios, S.premium, S.confraria, S.aconchego, S.afeto, S.memoravel], categorias: ["Queijos", "Embutidos", "Doces", "Cafés"] },
      },
      {
        key: "pascoa", name: "Páscoa",
        paleta: { bg: "#f3ead8", fg: "#3a2433", primary: "#8a4f9b", onPrimary: "#ffffff", accent: "#d98e2b", surface: "#fbf5e9", muted: "#6c5664", line: "#e1d0b9" },
        fontes: { titulo: "lora", texto: "work-sans", detalhe: "caveat" },
        demo: { loja: "Coelho Artesanal", aviso: "Ovos e cestas de Páscoa por encomenda", titulo: "Uma Páscoa feita à mão", texto: "Chocolates artesanais em cestas para presentear.", heroImagem: "slug:" + S.ferrero, cestas: [S.ferrero, S.pink, S.blue, S.miniBolo, S.afeto, S.lady], categorias: ["Ovos", "Cestas", "Infantil", "Lembranças"] },
      },
    ],
  },
];

/** Ondas A (6 esqueletos) + B e C (11 esqueletos novos): 17 modelos × 3 variações. */
export const TEMAS: Tema[] = [...TEMAS_BASE, ...NOVOS_TEMAS];

export function getTema(key: string): Tema | undefined {
  return TEMAS.find((t) => t.key === key);
}

export function getVariacao(tema: Tema, key?: string | null) {
  return tema.variacoes.find((v) => v.key === key) ?? tema.variacoes[0];
}

export const TEMA_KEYS = TEMAS.map((t) => t.key) as TemaKey[];
