import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fonteDe, renderizarApp } from '../test/renderizar';
import { peca, vitrineDeTeste } from '../vitrine/vitrineDeTeste';

beforeEach(() => localStorage.clear());

it('abre com o primeiro kit do carrossel', async () => {
  renderizarApp('/');
  const carrossel = await screen.findByRole('region', { name: 'Sugestões de kit' });
  const primeiro = within(carrossel).getAllByRole('link')[0];
  expect(primeiro).toHaveAttribute('href', '/k/k1');
  expect(within(primeiro).getByText('Sugestão de kit')).toBeInTheDocument();
  expect(within(primeiro).getByText('Kit k1')).toBeInTheDocument();
  expect(within(primeiro).getByText('1 peça · R$ 89,90')).toBeInTheDocument();
  expect(within(carrossel).queryByText('Kit kit-todo-esgotado')).not.toBeInTheDocument();
});

it('chegou agora: até 12 peças, sem esgotadas, e "Ver tudo"', async () => {
  const v = vitrineDeTeste();
  v.pecas.push(...Array.from({ length: 15 }, (_, i) => peca(`n${i}`)));
  renderizarApp('/', fonteDe(v));
  const secao = await screen.findByRole('region', { name: 'Chegou agora' });
  expect(within(secao).getAllByRole('listitem')).toHaveLength(12);
  expect(within(secao).queryByText('Camisa Mizuno')).not.toBeInTheDocument();
  expect(within(secao).getByRole('link', { name: 'Ver tudo' })).toHaveAttribute('href', '/novidades');
});

it('pílulas: "Kits" primeiro, depois as categorias em ordem', async () => {
  renderizarApp('/');
  const nav = await screen.findByRole('navigation', { name: 'Categorias' });
  const links = within(nav).getAllByRole('link');
  expect(links.map((l) => l.textContent)).toEqual(['Kits', 'Camisetas', 'Bermudas']);
  expect(links[0]).toHaveAttribute('href', '/kits');
  expect(links[1]).toHaveAttribute('href', '/c/camisetas');
});

it('rodapé com a entrega e os links da loja', async () => {
  renderizarApp('/');
  const rodape = await screen.findByRole('contentinfo');
  expect(within(rodape).getByText('Entrega por motoboy em Capivari de Baixo e região · Enviamos para todo o Brasil')).toBeInTheDocument();
  expect(within(rodape).getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', 'https://www.instagram.com/cardoso.menswear/');
  expect(within(rodape).getByRole('link', { name: 'Grupo no WhatsApp' })).toHaveAttribute('href', 'https://chat.whatsapp.com/exemplo');
});

it.each(['/p/nao-existe', '/k/nao-existe', '/c/nao-existe', '/qualquer/coisa'])('%s mostra "não encontrada"', async (caminho) => {
  renderizarApp(caminho);
  expect(await screen.findByRole('heading', { name: 'Não encontramos esta página' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/');
});

it('erro ao carregar: mostra aviso e tenta de novo', async () => {
  const fonte = fonteDe();
  fonte.carregar.mockRejectedValueOnce(new Error('rede'));
  renderizarApp('/', fonte);
  await userEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }));
  expect(await screen.findByRole('region', { name: 'Chegou agora' })).toBeInTheDocument();
});

it('vitrine vazia: aviso "Novidades chegando" com link do Instagram', async () => {
  const v = vitrineDeTeste();
  v.pecas = [];
  v.kits = [];
  renderizarApp('/', fonteDe(v));
  expect(await screen.findByRole('heading', { name: 'Novidades chegando' })).toBeInTheDocument();
  expect(screen.getByText('Estamos preparando a vitrine. Enquanto isso, veja as peças no nosso Instagram.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ver no Instagram' })).toHaveAttribute('href', 'https://www.instagram.com/cardoso.menswear/');
});

it('com peças, o aviso de vitrine vazia não aparece', async () => {
  renderizarApp('/');
  await screen.findByRole('region', { name: 'Chegou agora' });
  expect(screen.queryByRole('heading', { name: 'Novidades chegando' })).not.toBeInTheDocument();
});
