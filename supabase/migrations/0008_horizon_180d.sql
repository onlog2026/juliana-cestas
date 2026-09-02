-- 0008_horizon_180d.sql — calendario de checkout mostra ate 6 meses a frente
-- (pedido do dono), nao so 30 dias. Idempotente.

update delivery_settings set horizon_days = 180
where tenant_id = 'a0000000-0000-4000-8000-000000000001';
