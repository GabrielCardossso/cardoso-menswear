import { formatarReais } from '../lib/dinheiro';
import { limparTexto, normalizarCep } from '../lib/texto';
import { totalCentavos } from '../sacola/regras';
import type { Sacola } from '../sacola/tipos';

export type Entrega = { tipo: 'motoboy'; bairro: string } | { tipo: 'envio'; cep: string; cidade: string };
export type DadosDoPedido = { nome: string; entrega: Entrega; observacao: string; conferidoEm?: Date };
export type CamposFinalizacao = {
  nome: string;
  tipo: 'motoboy' | 'envio' | '';
  bairro: string;
  cep: string;
  cidade: string;
  observacao: string;
};
export type ErrosFinalizacao = Partial<Record<keyof CamposFinalizacao, string>>;

const MAX_CURTO = 60;
const MAX_OBS = 300;

export function validarFinalizacao(
  c: CamposFinalizacao,
): { ok: true; dados: DadosDoPedido } | { ok: false; erros: ErrosFinalizacao } {
  const erros: ErrosFinalizacao = {};
  const nome = limparTexto(c.nome, MAX_CURTO);
  if (!nome) erros.nome = 'Informe seu nome';

  let entrega: Entrega | null = null;
  if (c.tipo === 'motoboy') {
    const bairro = limparTexto(c.bairro, MAX_CURTO);
    if (!bairro) erros.bairro = 'Informe o bairro';
    else entrega = { tipo: 'motoboy', bairro };
  } else if (c.tipo === 'envio') {
    const cep = normalizarCep(c.cep);
    const cidade = limparTexto(c.cidade, MAX_CURTO);
    if (!cep) erros.cep = 'CEP com 8 números';
    if (!cidade) erros.cidade = 'Informe a cidade';
    if (cep && cidade) entrega = { tipo: 'envio', cep, cidade };
  } else {
    erros.tipo = 'Escolha como quer receber';
  }

  if (Object.keys(erros).length > 0 || !entrega) return { ok: false, erros };
  return { ok: true, dados: { nome, entrega, observacao: limparTexto(c.observacao, MAX_OBS) } };
}

const dois = (n: number) => String(n).padStart(2, '0');
const dataHora = (d: Date) =>
  `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()} às ${dois(d.getHours())}:${dois(d.getMinutes())}`;

/** Texto aprovado pelo Gabriel (spec, "Mensagem do WhatsApp"). */
export function montarMensagem(sacola: Sacola, dados: DadosDoPedido): string {
  const pecas = sacola.itens.map(
    (i) => `• ${i.quantidade}x ${i.nome} — tam. ${i.tamanho} — ${formatarReais(i.precoUnitarioCentavos * i.quantidade)}`,
  );
  const entrega =
    dados.entrega.tipo === 'motoboy'
      ? `Motoboy — bairro ${dados.entrega.bairro}`
      : `Envio para o Brasil — CEP ${dados.entrega.cep}, ${dados.entrega.cidade}`;

  const linhas = [
    'Olá! Fiz este pedido pelo site 🛍️',
    '',
    'PEÇAS',
    ...pecas,
    `Total das peças: ${formatarReais(totalCentavos(sacola))}`,
    '',
    'ENTREGA',
    entrega,
    '',
    `Nome: ${dados.nome}`,
  ];
  if (dados.observacao) linhas.push(`Obs.: ${dados.observacao}`);
  if (dados.conferidoEm) linhas.push('', `(preços conferidos no site em ${dataHora(dados.conferidoEm)})`);
  return linhas.join('\n');
}

export function linkWhatsApp(numero: string, mensagem: string): string {
  return `https://wa.me/${numero.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
}
