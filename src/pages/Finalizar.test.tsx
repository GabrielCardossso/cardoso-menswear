import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { abrirLink } from '../lib/navegador';
import { CHAVE } from '../sacola/persistencia';
import { fonteDe, renderizarApp } from '../test/renderizar';
import { vitrineDeTeste } from '../vitrine/vitrineDeTeste';

vi.mock('../lib/navegador', () => ({ abrirLink: vi.fn() }));
const abrir = vi.mocked(abrirLink);

function comSacola() {
  localStorage.setItem(CHAVE, JSON.stringify({
    itens: [{ pecaId: 'a', nome: 'Camisa dry fit NK', tamanho: 'M', precoUnitarioCentavos: 8990, quantidade: 1 }],
    atualizadoEm: new Date().toISOString(),
  }));
}
const mensagemEnviada = () => new URL(abrir.mock.lastCall![0]).searchParams.get('text')!;

async function preencherMotoboy() {
  await userEvent.type(await screen.findByLabelText('Seu nome'), 'João');
  await userEvent.click(screen.getByRole('radio', { name: 'Motoboy (Capivari de Baixo e região)' }));
  await userEvent.type(screen.getByLabelText('Bairro'), 'Centro');
}
const enviar = () => userEvent.click(screen.getByRole('button', { name: 'Enviar pelo WhatsApp' }));

beforeEach(() => { localStorage.clear(); abrir.mockClear(); });

it('mostra os campos de cada tipo de entrega', async () => {
  comSacola();
  renderizarApp('/finalizar');
  expect(await screen.findByRole('heading', { level: 1, name: 'Finalizar pedido' })).toBeInTheDocument();
  const grupo = screen.getByRole('radiogroup', { name: 'Como você quer receber?' });
  await userEvent.click(within(grupo).getByRole('radio', { name: 'Motoboy (Capivari de Baixo e região)' }));
  expect(screen.getByLabelText('Bairro')).toBeInTheDocument();
  expect(screen.queryByLabelText('CEP')).not.toBeInTheDocument();
  await userEvent.click(within(grupo).getByRole('radio', { name: 'Envio para o Brasil' }));
  expect(screen.getByLabelText('CEP')).toHaveAttribute('inputmode', 'numeric');
  expect(screen.getByLabelText('Cidade')).toBeInTheDocument();
});

it('enviar vazio mostra os erros e não abre o WhatsApp', async () => {
  comSacola();
  renderizarApp('/finalizar');
  await screen.findByLabelText('Seu nome');
  await enviar();
  expect(screen.getByText('Informe seu nome')).toBeInTheDocument();
  expect(screen.getByText('Escolha como quer receber')).toBeInTheDocument();
  expect(abrir).not.toHaveBeenCalled();
});

it('caminho feliz: abre o WhatsApp da loja com a mensagem pronta', async () => {
  comSacola();
  renderizarApp('/finalizar');
  await preencherMotoboy();
  await enviar();
  expect(abrir).toHaveBeenCalledOnce();
  expect(abrir.mock.lastCall![0]).toMatch(/^https:\/\/wa\.me\/5548999999999\?text=/);
  expect(mensagemEnviada().startsWith('Olá! Fiz este pedido pelo site 🛍️')).toBe(true);
  expect(mensagemEnviada()).toContain('Motoboy — bairro Centro');
  expect(screen.getByText('Pedido enviado para o WhatsApp? Se não abriu, copie a mensagem.')).toBeInTheDocument();
});

it('preço mudou: mostra o que mudou e só envia depois de confirmar', async () => {
  comSacola();
  const v = vitrineDeTeste();
  const nova = vitrineDeTeste();
  nova.pecas[0].precoCentavos = 9990;
  const fonte = fonteDe(v);
  fonte.carregar.mockResolvedValueOnce(structuredClone(v)).mockResolvedValueOnce(nova);
  renderizarApp('/finalizar', fonte);
  await preencherMotoboy();
  await enviar();
  expect(await screen.findByRole('heading', { name: 'Alguns itens mudaram' })).toBeInTheDocument();
  expect(screen.getByText('Camisa dry fit NK passou de R$ 89,90 para R$ 99,90')).toBeInTheDocument();
  expect(abrir).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar e enviar' }));
  expect(abrir).toHaveBeenCalledOnce();
  expect(mensagemEnviada()).toContain('— R$\u00a099,90');
});

it('sem rede na conferência: envia avisando quando os preços foram conferidos', async () => {
  comSacola();
  const fonte = fonteDe();
  fonte.carregar.mockResolvedValueOnce(vitrineDeTeste()).mockRejectedValueOnce(new Error('sem rede'));
  renderizarApp('/finalizar', fonte);
  await preencherMotoboy();
  await enviar();
  expect(abrir).toHaveBeenCalledOnce();
  expect(mensagemEnviada()).toMatch(/\(preços conferidos no site em \d\d\/\d\d\/\d{4} às \d\d:\d\d\)$/);
});

it('loja pausada na conferência: avisa e não envia', async () => {
  comSacola();
  const pausada = vitrineDeTeste();
  pausada.configuracoes.lojaAberta = false;
  const fonte = fonteDe();
  fonte.carregar.mockResolvedValueOnce(vitrineDeTeste()).mockResolvedValueOnce(pausada);
  renderizarApp('/finalizar', fonte);
  await preencherMotoboy();
  await enviar();
  expect(await screen.findByText('Pedidos pausados no momento. Fale com a gente no Instagram.')).toBeInTheDocument();
  expect(abrir).not.toHaveBeenCalled();
});

it('depois de enviar: copiar a mensagem e esvaziar a sacola', async () => {
  comSacola();
  const copiar = vi.fn(async () => {});
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: copiar }, configurable: true });
  renderizarApp('/finalizar');
  await preencherMotoboy();
  await enviar();
  await userEvent.click(screen.getByRole('button', { name: 'Copiar mensagem' }));
  expect(copiar).toHaveBeenCalledWith(mensagemEnviada());
  expect(await screen.findByText('Mensagem copiada')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Esvaziar sacola' }));
  expect(JSON.parse(localStorage.getItem(CHAVE)!).itens).toEqual([]);
  expect(await screen.findByRole('region', { name: 'Chegou agora' })).toBeInTheDocument();
});

it('sacola vazia em /finalizar volta para o início', async () => {
  renderizarApp('/finalizar');
  expect(await screen.findByRole('region', { name: 'Chegou agora' })).toBeInTheDocument();
});

it('sem rede: confere contra a vitrine já carregada e informa a hora em que ela foi carregada', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 5, 9, 15));
  localStorage.setItem(CHAVE, JSON.stringify({
    itens: [{ pecaId: 'a', nome: 'Camisa dry fit NK', tamanho: 'M', precoUnitarioCentavos: 7990, quantidade: 1 }],
    atualizadoEm: new Date(2026, 10, 1, 8, 0).toISOString(),
  }));
  const fonte = fonteDe();
  fonte.carregar.mockResolvedValueOnce(vitrineDeTeste()).mockRejectedValueOnce(new Error('sem rede'));
  renderizarApp('/finalizar', fonte);
  await screen.findByLabelText('Seu nome');
  vi.setSystemTime(new Date(2026, 10, 5, 18, 40));
  await preencherMotoboy();
  await enviar();
  // o preço guardado (79,90) é diferente do da vitrine carregada (89,90): mostra a mudança antes
  expect(await screen.findByText('Camisa dry fit NK passou de R$ 79,90 para R$ 89,90')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar e enviar' }));
  expect(mensagemEnviada().endsWith('(preços conferidos no site em 05/11/2026 às 09:15)')).toBe(true);
  vi.useRealTimers();
});

it('sem rede com a loja pausada na vitrine já carregada: avisa e não envia', async () => {
  comSacola();
  const pausada = vitrineDeTeste();
  pausada.configuracoes.lojaAberta = false;
  const fonte = fonteDe();
  fonte.carregar.mockResolvedValueOnce(pausada).mockRejectedValueOnce(new Error('sem rede'));
  renderizarApp('/finalizar', fonte);
  await preencherMotoboy();
  await enviar();
  expect(await screen.findByText('Pedidos pausados no momento. Fale com a gente no Instagram.')).toBeInTheDocument();
  expect(abrir).not.toHaveBeenCalled();
});

it('com erro, o foco vai para o primeiro campo inválido', async () => {
  comSacola();
  renderizarApp('/finalizar');
  await userEvent.type(await screen.findByLabelText('Seu nome'), 'João');
  await enviar();
  expect(screen.getByRole('radio', { name: 'Motoboy (Capivari de Baixo e região)' })).toHaveFocus();
});

it('ao mudar de fase, o foco vai para o título da nova seção', async () => {
  comSacola();
  renderizarApp('/finalizar');
  await preencherMotoboy();
  await enviar();
  expect(screen.getByRole('heading', { name: 'Pedido enviado' })).toHaveFocus();
});
