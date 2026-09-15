-- 0042_juliana_delivery_prices.sql
-- Preços reais de frete por região administrativa do DF, confirmados pela dona
-- da Juliana Cestas. Substitui as zonas semeadas em 0006 (todas R$0/placeholder)
-- pela tabela real. Idempotente: pode rodar de novo sem duplicar nem quebrar.
--
-- Regra da casa: frete é dinheiro real recalculado no servidor no checkout.
-- Esta migração deixa os valores VÁLIDOS (já ativos) — autorização explícita
-- do dono em 2026-09-15.

do $$
declare t uuid := 'a0000000-0000-4000-8000-000000000001';
begin
  -- 1) Lista real (ativa). Atualiza pelo nome as que já existem; insere as novas.
  insert into delivery_zones (tenant_id, name, fee_cents, active, sort_order, placeholder) values
    (t, 'Taguatinga Norte/Sul', 1000, true, 1, false),
    (t, 'Vicente Pires', 1500, true, 2, false),
    (t, 'Águas Claras', 1500, true, 3, false),
    (t, 'Ceilândia', 1500, true, 4, false),
    (t, 'Samambaia', 2000, true, 5, false),
    (t, 'Riacho Fundo I/II', 2000, true, 6, false),
    (t, 'Recanto das Emas', 2000, true, 7, false),
    (t, 'Guará', 2000, true, 8, false),
    (t, 'Núcleo Bandeirante', 2500, true, 9, false),
    (t, 'SIA/Estrutural', 2500, true, 10, false),
    (t, 'Plano Piloto', 3000, true, 11, false),
    (t, 'Cruzeiro/Sudoeste', 3000, true, 12, false),
    (t, 'Lago Sul/Lago Norte', 4000, true, 13, false),
    (t, 'Gama', 4000, true, 14, false),
    (t, 'Santa Maria', 3500, true, 15, false),
    (t, 'Sobradinho', 5000, true, 16, false),
    (t, 'São Sebastião', 6000, true, 17, false),
    (t, 'Planaltina', 6000, true, 18, false),
    (t, 'Brazlândia', 4000, true, 19, false)
  on conflict (tenant_id, name) do update
    set fee_cents = excluded.fee_cents,
        active = true,
        sort_order = excluded.sort_order,
        placeholder = false;

  -- 2) Esconde (não apaga) as regiões antigas semeadas que não estão na lista
  --    nova. Não apaga porque pedidos antigos referenciam zone_id por FK.
  update delivery_zones set active = false
   where tenant_id = t
     and name in (
       'Plano Piloto (Asa Sul)', 'Plano Piloto (Asa Norte)', 'Sudoeste/Octogonal',
       'Noroeste', 'Lago Sul', 'Lago Norte', 'Taguatinga'
     );
end $$;
