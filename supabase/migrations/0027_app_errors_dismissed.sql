-- 0027_app_errors_dismissed.sql — "dispensar" um alerta sem APAGAR o histórico.
--
-- Armadilha documentada do Agentop (docs/SUPER-ADMIN-SPEC.md): lá, dispensar um
-- alerta apagava a linha. Consequências reais: o dono perdia o histórico do
-- problema, o mesmo erro reaparecia "do zero" e ninguém conseguia dizer se
-- aquilo já tinha acontecido antes nem com que frequência.
--
-- Aqui dispensar é só uma MARCA: a linha continua em `app_errors` para sempre,
-- some da lista do dia a dia e volta com o filtro "mostrar dispensados" na tela
-- /super/erros.
--
-- Idempotente: pode rodar quantas vezes quiser.

-- Quando foi dispensado (null = ainda não foi).
alter table app_errors add column if not exists dismissed_at timestamptz;

-- Quem dispensou (e-mail do administrador da plataforma).
alter table app_errors add column if not exists dismissed_by text;

-- A tela abre sempre na lista de "ainda não vistos". Índice parcial, porque é
-- exatamente essa a consulta que roda toda vez que o painel é aberto.
create index if not exists app_errors_pendentes
  on app_errors (created_at desc)
  where dismissed_at is null;

-- Críticos pendentes das últimas 24h: é o que alimenta o painel vermelho do topo.
create index if not exists app_errors_criticos_pendentes
  on app_errors (level, created_at desc)
  where dismissed_at is null;

comment on column app_errors.dismissed_at is
  'Marca de "já vi este alerta". NUNCA apagar a linha para dispensar: o histórico do erro é o que permite saber se ele é reincidente.';
comment on column app_errors.dismissed_by is
  'E-mail de quem dispensou o alerta (administrador da plataforma).';

-- RLS: `app_errors` já nasceu fechada na migração 0026
-- (`app_errors_service_only ... using (false)`). Só o service role lê e escreve,
-- e é assim que continua — nenhuma policy nova aqui de propósito.
