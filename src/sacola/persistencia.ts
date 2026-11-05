import { QTD_MAX, sacolaVazia } from './regras';
import type { ItemDaSacola, Sacola } from './tipos';

export const CHAVE = 'cardoso:sacola:v1';
export const EXPIRA_MS = 7 * 24 * 60 * 60 * 1000;

function itemValido(i: unknown): i is ItemDaSacola {
  if (!i || typeof i !== 'object') return false;
  const x = i as Record<string, unknown>;
  return (
    typeof x.pecaId === 'string' &&
    typeof x.nome === 'string' &&
    typeof x.tamanho === 'string' &&
    Number.isInteger(x.precoUnitarioCentavos) && (x.precoUnitarioCentavos as number) >= 0 &&
    Number.isInteger(x.quantidade) && (x.quantidade as number) >= 1 && (x.quantidade as number) <= QTD_MAX &&
    (x.kitId === undefined || typeof x.kitId === 'string')
  );
}

/** Nunca lança: sem armazenamento, dado inválido ou expirado → sacola vazia. */
export function lerSacola(agora: Date): Sacola {
  const vazia = sacolaVazia(agora.toISOString());
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return vazia;
    const s = JSON.parse(bruto) as Partial<Sacola>;
    const quando = Date.parse(String(s.atualizadoEm));
    if (!Array.isArray(s.itens) || Number.isNaN(quando)) return vazia;
    if (agora.getTime() - quando > EXPIRA_MS) return vazia;
    if (!s.itens.every(itemValido)) return vazia;
    return { itens: s.itens, atualizadoEm: s.atualizadoEm as string };
  } catch {
    return vazia;
  }
}

export function salvarSacola(s: Sacola): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(s));
  } catch {
    // Sem armazenamento (aba anônima, bloqueio): a sacola segue só em memória.
  }
}
