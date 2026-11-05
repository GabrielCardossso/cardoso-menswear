import { linkWhatsApp, montarMensagem, validarFinalizacao, type CamposFinalizacao } from './mensagem';
import type { ItemDaSacola, Sacola } from '../sacola/tipos';

function sacolaCom(itens: ItemDaSacola[]): Sacola {
  return { itens, atualizadoEm: '2026-11-05T10:00:00Z' };
}

const s = sacolaCom([
  { pecaId: 'a', nome: 'Camisa dry fit NK (preta)', tamanho: 'G', precoUnitarioCentavos: 8990, quantidade: 1 },
  { pecaId: 'b', nome: 'Bermuda moletom NK', tamanho: 'M', precoUnitarioCentavos: 7990, quantidade: 1 },
]);

const campos = (c: Partial<CamposFinalizacao>): CamposFinalizacao => ({
  nome: 'João', tipo: 'motoboy', bairro: 'Centro', cep: '', cidade: '', observacao: '', ...c,
});

it('monta a mensagem aprovada (motoboy, com observação)', () => {
  expect(montarMensagem(s, { nome: 'João', entrega: { tipo: 'motoboy', bairro: 'Centro' }, observacao: 'posso pagar no Pix?' })).toBe(
`Olá! Fiz este pedido pelo site 🛍️

PEÇAS
• 1x Camisa dry fit NK (preta) — tam. G — R$ 89,90
• 1x Bermuda moletom NK — tam. M — R$ 79,90
Total das peças: R$ 169,80

ENTREGA
Motoboy — bairro Centro

Nome: João
Obs.: posso pagar no Pix?`);
});

it('o preço da linha é o subtotal da linha', () => {
  const dois = sacolaCom([{ ...s.itens[0], quantidade: 2 }]);
  expect(montarMensagem(dois, { nome: 'João', entrega: { tipo: 'motoboy', bairro: 'Centro' }, observacao: '' }))
    .toContain('• 2x Camisa dry fit NK (preta) — tam. G — R$ 179,80\nTotal das peças: R$ 179,80');
});

it('envio para o Brasil e sem observação', () => {
  const m = montarMensagem(s, { nome: 'João', entrega: { tipo: 'envio', cep: '88745-000', cidade: 'Tubarão' }, observacao: '' });
  expect(m).toContain('ENTREGA\nEnvio para o Brasil — CEP 88745-000, Tubarão\n');
  expect(m.endsWith('Nome: João')).toBe(true);
});

it('acrescenta quando os preços foram conferidos, se pedido', () => {
  const m = montarMensagem(s, {
    nome: 'João', entrega: { tipo: 'motoboy', bairro: 'Centro' }, observacao: '',
    conferidoEm: new Date(2026, 10, 5, 14, 30),
  });
  expect(m.endsWith('Nome: João\n\n(preços conferidos no site em 05/11/2026 às 14:30)')).toBe(true);
});

describe('validarFinalizacao', () => {
  it('pede nome', () => {
    const r = validarFinalizacao(campos({ nome: '  \n ' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.nome).toBe('Informe seu nome');
  });
  it('pede o tipo de entrega', () => {
    const r = validarFinalizacao(campos({ tipo: '' }));
    expect(!r.ok && r.erros.tipo).toBe('Escolha como quer receber');
  });
  it('motoboy pede bairro', () => {
    const r = validarFinalizacao(campos({ bairro: ' ' }));
    expect(!r.ok && r.erros.bairro).toBe('Informe o bairro');
  });
  it('envio pede CEP com 8 números e cidade', () => {
    const r = validarFinalizacao(campos({ tipo: 'envio', cep: '8874500', cidade: '' }));
    expect(!r.ok && r.erros.cep).toBe('CEP com 8 números');
    expect(!r.ok && r.erros.cidade).toBe('Informe a cidade');
  });
  it('limpa os textos e monta a entrega', () => {
    const r = validarFinalizacao(campos({ tipo: 'envio', cep: '88745000', cidade: ' Tubarão ', observacao: 'a\n\nb' }));
    expect(r.ok && r.dados).toEqual({
      nome: 'João', entrega: { tipo: 'envio', cep: '88745-000', cidade: 'Tubarão' }, observacao: 'a b',
    });
  });
  it('corta nome em 60 e observação em 300 caracteres', () => {
    const r = validarFinalizacao(campos({ nome: 'x'.repeat(80), observacao: 'y'.repeat(400) }));
    expect(r.ok && r.dados.nome.length).toBe(60);
    expect(r.ok && r.dados.observacao.length).toBe(300);
  });
});

it('o link do WhatsApp leva o texto exato, com caracteres especiais e emoji', () => {
  const r = validarFinalizacao(campos({ nome: 'Zé & Cia #1 + 50% 👕', observacao: 'tam. G?\nok' }));
  if (!r.ok) throw new Error('deveria validar');
  const msg = montarMensagem(s, r.dados);
  const url = new URL(linkWhatsApp('55 (48) 99999-9999', msg));
  expect(url.origin + url.pathname).toBe('https://wa.me/5548999999999');
  expect(url.searchParams.get('text')).toBe(msg);
  expect(msg).toContain('Nome: Zé & Cia #1 + 50% 👕\nObs.: tam. G? ok');
});
