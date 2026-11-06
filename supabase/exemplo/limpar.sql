begin;
-- GERADO por scripts/gerar-sql-exemplo.mjs. Apaga exatamente o que carregar.sql criou.
delete from public.kits where slug in ('dry-fit-nk-preta-e-bermuda', 'dry-fit-nk-branca-e-bermuda', 'polo-nk-e-bermuda-moletom', 'polo-lc-e-bermuda-tactel', 'exemplo-oculto');
delete from public.pecas where slug in ('camisa-dry-fit-nk-preta', 'camisa-dry-fit-nk-branca', 'bermuda-dry-fit-nk-preta', 'bermuda-dry-fit-nk-preta-e-branca', 'polo-piquet-nk-preta', 'bermuda-moletom-nk-preta', 'polo-piquet-lc-preta', 'bermuda-tactel-preta', 'camiseta-ea7-branca', 'calca-jogador-preta', 'camiseta-basica-branca', 'camisa-mizuno-preta', 'exemplo-arquivada', 'exemplo-peca-escondida');
delete from public.categorias where slug = 'exemplo-escondida';
commit;
