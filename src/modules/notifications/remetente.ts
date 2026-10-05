// ═══ ARQUIVO PURO, SEM NENHUM IMPORT ═══ (o webhook do Asaas importa este arquivo; ver shell.ts)

/**
 * Remetente do e-mail de uma loja. A loja ORIGINAL mantém o `EMAIL_FROM` exatamente como está.
 * Toda outra loja usa o MESMO endereço de envio da plataforma, mas com o NOME da própria loja
 * ("Doce Manhã" <pedidos@plataforma>) — assim o cliente vê de quem veio, e a resposta vai para o
 * e-mail da loja (`replyTo`). Quando a loja tiver domínio de e-mail próprio verificado, basta
 * trocar o endereço aqui.
 */
export function remetenteDaLoja(emailFrom: string, storeName: string, lojaOriginal: boolean): string {
  const bruto = emailFrom.trim();
  if (lojaOriginal || !bruto) return bruto;
  const nome = storeName.replace(/[<>"\\\r\n]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  if (!nome) return bruto;
  const dentro = bruto.match(/<([^<>\s]+@[^<>\s]+)>/);
  const endereco = dentro ? dentro[1] : bruto;
  if (!/^[^<>\s]+@[^<>\s]+$/.test(endereco)) return bruto;
  return `"${nome}" <${endereco}>`;
}
