-- Tamanhos das peças acompanham a grade da categoria (spec: "Banco de dados", peca_tamanhos).
-- Peça nova nasce com todos os tamanhos da grade, desligados. Grade alterada: tamanhos que saíram
-- são apagados das peças e os novos entram desligados. Trocar a categoria da peça faz o mesmo.

create function public.sincronizar_tamanhos(p_peca_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_grade text[];
begin
  select c.grade into v_grade
  from public.pecas p
  join public.categorias c on c.id = p.categoria_id
  where p.id = p_peca_id;

  if v_grade is null then
    return;
  end if;

  delete from public.peca_tamanhos
  where peca_id = p_peca_id and not (tamanho = any (v_grade));

  insert into public.peca_tamanhos (peca_id, tamanho, disponivel)
  select p_peca_id, t, false
  from unnest(v_grade) as t
  on conflict (peca_id, tamanho) do nothing;
end;
$$;

-- O gatilho chama a função com o papel de quem gravou: o admin (authenticated) precisa de EXECUTE.
revoke execute on function public.sincronizar_tamanhos(uuid) from public, anon;
grant execute on function public.sincronizar_tamanhos(uuid) to authenticated;

create function public.tamanhos_da_peca()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform public.sincronizar_tamanhos(new.id);
  return null;
end;
$$;

create function public.tamanhos_da_categoria()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_peca uuid;
begin
  for v_peca in select id from public.pecas where categoria_id = new.id loop
    perform public.sincronizar_tamanhos(v_peca);
  end loop;
  return null;
end;
$$;

-- Funções de gatilho: o gatilho não precisa de EXECUTE, então ficam fechadas para a API.
revoke execute on function public.tamanhos_da_peca() from public, anon, authenticated;
revoke execute on function public.tamanhos_da_categoria() from public, anon, authenticated;

create trigger pecas_tamanhos_sincronizados
  after insert or update of categoria_id on public.pecas
  for each row execute function public.tamanhos_da_peca();

create trigger categorias_grade_sincronizada
  after update of grade on public.categorias
  for each row when (old.grade is distinct from new.grade)
  execute function public.tamanhos_da_categoria();
