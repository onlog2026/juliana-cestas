-- 0012_profile_role_jwt_sync.sql
-- Toda acao do admin (cada botao, cada troca de pagina) hoje faz DUAS
-- consultas sequenciais: auth.getUser() e depois um select em `profiles`
-- pra saber se o usuario e staff. Essa segunda consulta e evitavel: copiando
-- role/name pra dentro do JWT (app_metadata), requireStaff() passa a
-- resolver com UMA consulta so na maioria das vezes.
-- Idempotente.

-- Backfill: sincroniza os perfis que ja existem.
update auth.users u
set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', p.role, 'name', p.name)
from profiles p
where u.id = p.id;

-- Mantem sincronizado dai pra frente: toda vez que profiles mudar (novo
-- staff, promocao, nome alterado), o JWT reflete na proxima renovacao.
create or replace function public.sync_profile_role_to_jwt()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', new.role, 'name', new.name)
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists profiles_sync_jwt on profiles;
create trigger profiles_sync_jwt
  after insert or update of role, name on profiles
  for each row execute function public.sync_profile_role_to_jwt();
