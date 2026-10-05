/**
 * Lista única de modelo → variações para os scripts (verificar, capturar).
 * Mantida à mão de propósito (scripts rodam em Node puro); o teste
 * tests/unit/temas-catalogo.test.ts confere que bate com src/storefront/temas/catalogo.ts.
 */
export const TEMAS = {
  classica: ["cafe", "romantica", "corporativa"],
  boutique: ["flores", "premium", "noivas"],
  mercado: ["empresas", "datas", "atacado"],
  festa: ["aniversario", "infantil", "cha-de-bebe"],
  noir: ["vinhos", "corporativo", "natal"],
  rustico: ["cafe-colonial", "fazenda", "pascoa"],
  galeria: ["champagne", "verde-garrafa", "rose-antigo"],
  promo: ["liquida", "black", "dia-das-maes"],
  mono: ["branco", "preto", "concreto"],
  stories: ["claro", "neon", "pastel"],
  panorama: ["terra", "oceano", "floresta"],
  simetria: ["salvia", "marinho", "blush"],
  bairro: ["verde-whatsapp", "azul-bairro", "laranja-padaria"],
  revista: ["papel-jornal", "revista-de-moda", "gastronomia"],
  vibrante: ["tutti", "eletrico", "sol"],
  aconchego: ["pessego", "menta", "lavanda"],
  empresas: ["corporativo", "escritorio", "eventos"],
};
