/**
 * PANORAMA — CSS compartilhado: revelação ao rolar (linha do tempo de rolagem do navegador,
 * sem JavaScript; quem não suporta vê tudo parado e visível) e sublinhado que engrossa.
 */
export const ALTURA_TELA = "lg:min-h-[calc(100dvh-4rem)]";

export function EstiloPanorama() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
@keyframes pn-in{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
@keyframes pn-zoom{from{transform:scale(1.08)}to{transform:scale(1)}}
@supports (animation-timeline:view()){
  [data-modelo="panorama"] .pn-rev{animation:pn-in linear both;animation-timeline:view();animation-range:entry 0% entry 60%}
  [data-modelo="panorama"] .pn-foto{animation:pn-zoom linear both;animation-timeline:view();animation-range:entry 0% cover 50%}
}
[data-modelo="panorama"] .pn-link{background:linear-gradient(currentColor,currentColor) 0 100%/100% 1px no-repeat;padding-bottom:3px;transition:background-size .3s ease}
[data-modelo="panorama"] .pn-link:hover{background-size:100% 3px}
@media (prefers-reduced-motion:reduce){[data-modelo="panorama"] .pn-rev,[data-modelo="panorama"] .pn-foto{animation:none!important}}
` }} />
  );
}
