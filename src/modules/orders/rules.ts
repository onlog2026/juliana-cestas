/**
 * Regras PURAS sobre o que dá para fazer com um pedido, dependendo do status.
 * Sem banco, sem `server-only` -- por isso dá para testar sem servidor.
 *
 * `PEDIDO_ENCERRADO` é a mesma lista usada em `cancelOrder`/`CancelOrderButton`
 * (`entregue`, `cancelado`, `reembolsado`): pedido que já chegou lá não volta
 * a ser mexido, nem em status, nem em cancelamento, nem em edição de dados.
 */
export const PEDIDO_ENCERRADO = new Set(["entregue", "cancelado", "reembolsado"]);

export function podeAlterarPedido(status: string): boolean {
  return !PEDIDO_ENCERRADO.has(status);
}

/** `"yyyy-mm-dd"`, o formato que o `<input type="date">` do navegador manda. */
export function dataDeEntregaValida(data: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(data);
}
