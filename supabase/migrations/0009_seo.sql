-- 0009_seo.sql — configuracoes de SEO editaveis pelo admin, ja semeadas com
-- palavras-chave pesquisadas pro nicho (cesta de cafe da manha / presentes
-- em Brasilia). Idempotente.

create table if not exists seo_settings (
  tenant_id uuid primary key references tenants(id),
  site_title text not null,
  site_description text not null,
  keywords text[] not null default '{}',
  og_image_url text,
  updated_at timestamptz not null default now()
);

alter table seo_settings enable row level security;
-- Sem policy anon/authenticated: lido e gravado só via service role
-- (generateMetadata no servidor, Server Actions do admin).

insert into seo_settings (tenant_id, site_title, site_description, keywords, og_image_url)
values (
  'a0000000-0000-4000-8000-000000000001',
  'Juliana Cestas | Cestas de Café da Manhã em Brasília',
  'Cestas de café da manhã artesanais em Brasília, com entrega no mesmo dia e cartão de mensagem personalizado. Presentes para namorados, aniversário, casamento e ocasiões especiais.',
  ARRAY[
    'cesta de café da manhã Brasília',
    'cesta café da manhã entrega Brasília',
    'presente café da manhã Brasília',
    'cesta surpresa Brasília',
    'cesta de café da manhã personalizada',
    'presente para namorados Brasília',
    'cesta de aniversário Brasília',
    'presente de casamento Brasília',
    'cesta romântica entrega Brasília',
    'café da manhã surpresa',
    'entrega de cesta em Brasília DF',
    'cesta café da manhã Asa Sul',
    'cesta café da manhã Asa Norte',
    'presente entregue no mesmo dia Brasília',
    'cesta com bolo e frutas',
    'cesta café da manhã com flores',
    'kit café da manhã gourmet',
    'cesta de presente Brasília',
    'Juliana Cestas'
  ],
  '/images/produtos/cesta-romance-ao-amanhecer.webp'
)
on conflict (tenant_id) do nothing;
