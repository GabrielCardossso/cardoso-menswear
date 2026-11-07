-- Confere as políticas de escrita do painel e os gatilhos de tamanho SEM conta de verdade:
-- tudo roda numa transação que termina em ROLLBACK, então nada fica no banco.
-- Rodar no SQL Editor do Supabase. Resultado esperado: "Success" (um assert que falha mostra o erro).
begin;

do $$
declare
  v_admin uuid := gen_random_uuid();
  v_cat uuid;
  v_peca uuid;
  v_n int;
  v_liga boolean;
  v_bloqueou boolean := false;
begin
  -- Usuário fictício só nesta transação (admins.user_id aponta para auth.users).
  insert into auth.users (id, email) values (v_admin, 'teste-admin@exemplo.invalid');
  insert into public.admins (user_id) values (v_admin);

  -- Daqui em diante, como o admin logado.
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;

  insert into public.categorias (nome, slug, grade, ordem, visivel)
  values ('Teste admin', 'teste-admin-cat', array['P', 'M'], 99, false)
  returning id into v_cat;

  insert into public.pecas (categoria_id, nome, slug, preco)
  values (v_cat, 'Teste admin', 'teste-admin', 10)
  returning id into v_peca;

  select count(*) into v_n from public.peca_tamanhos where peca_id = v_peca and not disponivel;
  assert v_n = 2, 'peça nova devia nascer com P e M desligados';

  update public.peca_tamanhos set disponivel = true where peca_id = v_peca and tamanho = 'M';
  update public.categorias set grade = array['M', 'G'] where id = v_cat;

  select count(*) into v_n from public.peca_tamanhos where peca_id = v_peca;
  assert v_n = 2, 'depois da grade nova devia ter só M e G';
  select disponivel into v_liga from public.peca_tamanhos where peca_id = v_peca and tamanho = 'M';
  assert v_liga, 'M devia continuar ligado';
  select disponivel into v_liga from public.peca_tamanhos where peca_id = v_peca and tamanho = 'G';
  assert not v_liga, 'G devia entrar desligado';

  update public.pecas set arquivada = true where id = v_peca;
  update public.configuracoes set texto_entrega = texto_entrega where id;
  get diagnostics v_n = row_count;
  assert v_n = 1, 'admin devia conseguir alterar configuracoes';

  delete from public.pecas where id = v_peca;
  get diagnostics v_n = row_count;
  assert v_n = 1, 'admin devia conseguir apagar a peça';

  -- Sem a linha em admins, a mesma conta não grava.
  reset role;
  delete from public.admins where user_id = v_admin;
  set local role authenticated;
  begin
    insert into public.pecas (categoria_id, nome, slug, preco) values (v_cat, 'Teste intruso', 'teste-intruso', 10);
  exception when insufficient_privilege then
    v_bloqueou := true;
  end;
  assert v_bloqueou, 'conta que não é admin conseguiu inserir peça';

  update public.configuracoes set loja_aberta = false where id;
  get diagnostics v_n = row_count;
  assert v_n = 0, 'conta que não é admin conseguiu alterar configuracoes';

  reset role;
  raise notice 'Políticas e gatilhos do painel: OK';
end;
$$;

rollback;
