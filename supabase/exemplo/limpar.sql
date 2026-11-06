begin;
-- GERADO por scripts/gerar-sql-exemplo.mjs. Apaga exatamente o que carregar.sql criou.
delete from public.kits where slug in ('exemplo-dry-fit-nk-preta-e-bermuda', 'exemplo-dry-fit-nk-branca-e-bermuda', 'exemplo-polo-nk-e-bermuda-moletom', 'exemplo-polo-lc-e-bermuda-tactel', 'exemplo-oculto');
delete from public.pecas where slug in ('exemplo-camisa-dry-fit-nk-preta', 'exemplo-camisa-dry-fit-nk-branca', 'exemplo-bermuda-dry-fit-nk-preta', 'exemplo-bermuda-dry-fit-nk-preta-e-branca', 'exemplo-polo-piquet-nk-preta', 'exemplo-bermuda-moletom-nk-preta', 'exemplo-polo-piquet-lc-preta', 'exemplo-bermuda-tactel-preta', 'exemplo-camiseta-ea7-branca', 'exemplo-calca-jogador-preta', 'exemplo-camiseta-basica-branca', 'exemplo-camisa-mizuno-preta', 'exemplo-arquivada', 'exemplo-peca-escondida');
delete from public.categorias where slug = 'exemplo-escondida';
commit;
