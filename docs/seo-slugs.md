# Slugs — proposta (NÃO aplicada; precisa do OK do dono)

Slugs com sufixo aleatório (`nova-cesta-muipr2pw`) são ruins para busca e para compartilhar. Mudar exige redirect 301 do endereço antigo para o novo, feito em `next.config.ts` como lista estática (nunca em `/api/*`).

| Atual | Proposto |
|---|---|
| nova-cesta-muipr2pw | cesta-premium |
| nova-cesta-criancas-muimg6te | cesta-pink |
| nova-cesta-arranjo-flores-mu3e1iz1 | arranjo-de-flores-mista |
| nova-cesta-muipeoip | cesta-lady |
| nova-cesta-mtwbo29q | mesa-de-frios-majestosa |
| nova-caixa-presente-muhozgsi | caixa-confraria |
| nova-cesta-maes-muhqb46z | cesta-sinha |
| nova-caixa-pai-homem-muhokijx | caixa-maestro |
| nova-cesta-namorados-muhsajcb | cesta-aroma-de-amor |
| nova-cesta-executivo-muiluxwv | cesta-executivo |
| nova-cesta-dia-das-criancas-muimcd7r | cesta-blue |
| nova-cesta-tarde-muimktaf | cesta-por-do-sol |
| nova-cesta-mu3dwun6 | orquidea |
| nova-cesta-mu3e8s1h | arranjo-de-baloes |
| nova-cesta-mu3dyz8m | flor-kolanchoe-decorada |
| nova-cesta-mu3ec8zz | bombom-ferrero-rocher-3-unidades |
| nova-cesta-mu3donik | foto-personalizada |
| nova-cesta-mu3dbd2p | caneca-personalizada |
| nova-cesta-mu3dubq8 | mini-bolo |
| nova-cesta-mu3eapja | mini-pote-de-nutella |
| nova-cesta-mu3e4x6m | balao-de-coracao-eu-te-amo |
| nova-cesta-mu3drmi9 | 4-fotos-personalizadas |

Já bons: cesta-memoravel, cesta-aconchego, cesta-essencia, cesta-encanto, cesta-afeto.

Riscos: links já compartilhados no WhatsApp/Instagram e a foto no Google passam pelo redirect (pode haver queda leve de ranking por alguns dias). Se aprovar, eu faço: atualizar os slugs (com rollback pronto), a lista de redirects e um teste que garante que cada endereço antigo responde 301 e cada novo responde 200.

**Para aprovar:** diga "aprovo os slugs" (ou edite a coluna da direita).
