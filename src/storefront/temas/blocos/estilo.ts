/**
 * CSS de ESCOPO para componentes antigos da loja que têm cor fixa (dourado, verde) e destoariam
 * do modelo. Sem tocar nos arquivos originais: a regra só vale dentro do contêiner marcado.
 */
export const ESTILO_COMPRA = `
[data-recurso="compra"] .jc-btn-outline{border:1.5px solid var(--t-primary);background-image:none;background-color:transparent;box-shadow:none;color:var(--t-primary)}
[data-recurso="compra"] .jc-btn-outline:hover{background-color:color-mix(in srgb,var(--t-primary) 12%,transparent);box-shadow:none}
[data-recurso="compra"] button.jc-btn-outline{min-height:48px}
@media (prefers-reduced-motion:reduce){[data-recurso="compra"] .jc-btn-outline:hover{transform:none}}
`;
