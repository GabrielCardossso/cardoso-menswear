-- Carga inicial (mesma lógica da Marisa: sai do JSON e fica versionada como migração).
-- Só categorias e configurações. Peças e kits de exemplo nunca entram por migração (projeto único).
-- O número do WhatsApp é de EXEMPLO até o Gustavo passar o dele; trocar pelo painel (etapa 4).

insert into public.categorias (nome, slug, grade, ordem, visivel) values
  ('Camisetas', 'camisetas', array['P', 'M', 'G', 'GG', 'XG'], 1, true),
  ('Polos', 'polos', array['P', 'M', 'G', 'GG', 'XG'], 2, true),
  ('Bermudas', 'bermudas', array['P', 'M', 'G', 'GG', 'XG'], 3, true),
  ('Calças', 'calcas', array['36', '38', '40', '42', '44', '46'], 4, true),
  ('Tênis', 'tenis', array['37', '38', '39', '40', '41', '42', '43', '44'], 5, true)
on conflict (slug) do nothing;

insert into public.configuracoes (id, loja_aberta, whatsapp_numero, instagram_url, grupo_whatsapp_url, texto_entrega)
values (
  true,
  true,
  '5548999999999',
  'https://www.instagram.com/cardoso.menswear/',
  'https://chat.whatsapp.com/Lb292xqGI3SEaiDwO9GjaJ',
  'Entrega por motoboy em Capivari de Baixo e região · Enviamos para todo o Brasil'
)
on conflict (id) do nothing;
