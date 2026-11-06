-- Regras de acesso (spec: "Segurança").
-- O projeto foi criado com "Automatically expose new tables" desligado: sem grant, a API não vê a tabela.
-- O visitante (anon) só lê o que é público; quem está em `admins` lê e grava tudo.
-- As políticas do visitante nunca chamam is_admin(): o schema `private` é fechado para anon.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

-- Função de gatilho: não é para ser chamada pela API.
revoke execute on function public.tocar_atualizado_em() from public, anon, authenticated;

-- RLS em todas as tabelas.
alter table public.categorias enable row level security;
alter table public.pecas enable row level security;
alter table public.peca_fotos enable row level security;
alter table public.peca_tamanhos enable row level security;
alter table public.kits enable row level security;
alter table public.kit_pecas enable row level security;
alter table public.configuracoes enable row level security;
alter table public.admins enable row level security;

-- Grants: a política decide o que cada um vê e grava.
grant select on public.categorias, public.pecas, public.peca_fotos, public.peca_tamanhos,
  public.kits, public.kit_pecas, public.configuracoes to anon, authenticated;
grant insert, update, delete on public.categorias, public.pecas, public.peca_fotos,
  public.peca_tamanhos, public.kits, public.kit_pecas to authenticated;
grant update on public.configuracoes to authenticated;
grant select on public.admins to authenticated;

-- categorias
create policy "visitante lê categorias visíveis" on public.categorias
  for select to anon, authenticated using (visivel);
create policy "admin lê categorias" on public.categorias
  for select to authenticated using ((select private.is_admin()));
create policy "admin cria categorias" on public.categorias
  for insert to authenticated with check ((select private.is_admin()));
create policy "admin altera categorias" on public.categorias
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin apaga categorias" on public.categorias
  for delete to authenticated using ((select private.is_admin()));

-- pecas: não arquivadas, de categoria visível
create policy "visitante lê peças à venda" on public.pecas
  for select to anon, authenticated using (
    not arquivada
    and exists (select 1 from public.categorias c where c.id = categoria_id and c.visivel)
  );
create policy "admin lê peças" on public.pecas
  for select to authenticated using ((select private.is_admin()));
create policy "admin cria peças" on public.pecas
  for insert to authenticated with check ((select private.is_admin()));
create policy "admin altera peças" on public.pecas
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin apaga peças" on public.pecas
  for delete to authenticated using ((select private.is_admin()));

-- peca_fotos e peca_tamanhos: seguem a peça (a RLS de pecas já filtra a subconsulta)
create policy "visitante lê fotos de peças à venda" on public.peca_fotos
  for select to anon, authenticated using (exists (select 1 from public.pecas p where p.id = peca_id));
create policy "admin lê fotos" on public.peca_fotos
  for select to authenticated using ((select private.is_admin()));
create policy "admin cria fotos" on public.peca_fotos
  for insert to authenticated with check ((select private.is_admin()));
create policy "admin altera fotos" on public.peca_fotos
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin apaga fotos" on public.peca_fotos
  for delete to authenticated using ((select private.is_admin()));

create policy "visitante lê tamanhos de peças à venda" on public.peca_tamanhos
  for select to anon, authenticated using (exists (select 1 from public.pecas p where p.id = peca_id));
create policy "admin lê tamanhos" on public.peca_tamanhos
  for select to authenticated using ((select private.is_admin()));
create policy "admin cria tamanhos" on public.peca_tamanhos
  for insert to authenticated with check ((select private.is_admin()));
create policy "admin altera tamanhos" on public.peca_tamanhos
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin apaga tamanhos" on public.peca_tamanhos
  for delete to authenticated using ((select private.is_admin()));

-- kits: só publicados
create policy "visitante lê kits publicados" on public.kits
  for select to anon, authenticated using (publicado);
create policy "admin lê kits" on public.kits
  for select to authenticated using ((select private.is_admin()));
create policy "admin cria kits" on public.kits
  for insert to authenticated with check ((select private.is_admin()));
create policy "admin altera kits" on public.kits
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin apaga kits" on public.kits
  for delete to authenticated using ((select private.is_admin()));

-- kit_pecas: segue o kit (a RLS de kits já filtra a subconsulta)
create policy "visitante lê peças de kits publicados" on public.kit_pecas
  for select to anon, authenticated using (exists (select 1 from public.kits k where k.id = kit_id));
create policy "admin lê peças de kits" on public.kit_pecas
  for select to authenticated using ((select private.is_admin()));
create policy "admin cria peças de kits" on public.kit_pecas
  for insert to authenticated with check ((select private.is_admin()));
create policy "admin altera peças de kits" on public.kit_pecas
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin apaga peças de kits" on public.kit_pecas
  for delete to authenticated using ((select private.is_admin()));

-- configuracoes: todos leem; só o admin altera (a linha é criada pela migração de dados iniciais)
create policy "todos leem as configurações" on public.configuracoes
  for select to anon, authenticated using (true);
create policy "admin altera as configurações" on public.configuracoes
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- admins: cada um vê só a própria linha; ninguém grava pela API (só pelo painel do Supabase)
create policy "admin vê a própria linha" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));
