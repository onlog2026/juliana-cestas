/**
 * Versão curta do endereço do favicon, usada como `?v=` nas URLs dos ícones
 * (trocou o favicon -> URL nova). Arquivo separado de `icon.ts` para o layout
 * da loja não carregar o `sharp` só para calcular isto.
 */
export function shortHash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(16);
}
