-- Esquema da vitrine (spec: "Banco de dados"). Regras de acesso ficam na migração seguinte.

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(trim(nome)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  grade text[] not null check (cardinality(grade) > 0),
  ordem int not null default 0,
  visivel boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.pecas (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.categorias (id),
  nome text not null check (length(trim(nome)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  descricao text,
  preco numeric(10, 2) not null check (preco >= 0),
  arquivada boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index pecas_categoria_id_idx on public.pecas (categoria_id);

-- path: caminho dentro do bucket `vitrine`, ou caminho começando com "/" (fotos de exemplo do site).
create table public.peca_fotos (
  id uuid primary key default gen_random_uuid(),
  peca_id uuid not null references public.pecas (id) on delete cascade,
  path text not null check (length(trim(path)) > 0),
  ordem int not null default 0
);

create index peca_fotos_peca_id_ordem_idx on public.peca_fotos (peca_id, ordem);

create table public.peca_tamanhos (
  peca_id uuid not null references public.pecas (id) on delete cascade,
  tamanho text not null check (length(trim(tamanho)) > 0),
  disponivel boolean not null default false,
  primary key (peca_id, tamanho)
);

create table public.kits (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (length(trim(titulo)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  descricao text,
  foto_path text,
  publicado boolean not null default false,
  ordem int not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Peça excluída sai do kit sozinha; a vitrine já trata kit com peça faltando.
create table public.kit_pecas (
  kit_id uuid not null references public.kits (id) on delete cascade,
  peca_id uuid not null references public.pecas (id) on delete cascade,
  ordem int not null default 0,
  primary key (kit_id, peca_id)
);

create index kit_pecas_peca_id_idx on public.kit_pecas (peca_id);

-- Uma linha só: a chave é sempre `true`.
create table public.configuracoes (
  id boolean primary key default true check (id),
  loja_aberta boolean not null default true,
  whatsapp_numero text not null check (whatsapp_numero ~ '^[0-9]{12,13}$'),
  instagram_url text not null default '',
  grupo_whatsapp_url text not null default '',
  texto_entrega text not null default ''
);

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- atualizado_em segue a última alteração.
create function public.tocar_atualizado_em()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger categorias_atualizado_em before update on public.categorias
  for each row execute function public.tocar_atualizado_em();
create trigger pecas_atualizado_em before update on public.pecas
  for each row execute function public.tocar_atualizado_em();
create trigger kits_atualizado_em before update on public.kits
  for each row execute function public.tocar_atualizado_em();
