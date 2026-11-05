import type { Categoria, Kit, Peca, Vitrine } from './tipos';

export function tamanhosDisponiveis(peca: Peca, categoria: Categoria): string[] {
  return categoria.grade.filter((t) => peca.tamanhos[t] === true);
}

export function estaEsgotada(peca: Peca, categoria: Categoria): boolean {
  return tamanhosDisponiveis(peca, categoria).length === 0;
}

export function categoriaDaPeca(v: Vitrine, peca: Peca): Categoria | null {
  return v.categorias.find((c) => c.id === peca.categoriaId) ?? null;
}

/** Esgotada também quando a categoria não está na vitrine. */
export function esgotadaNaVitrine(v: Vitrine, peca: Peca): boolean {
  const cat = categoriaDaPeca(v, peca);
  return !cat || estaEsgotada(peca, cat);
}

const maisNovaPrimeiro = (a: Peca, b: Peca) => b.criadoEm.localeCompare(a.criadoEm);

export function pecasDaCategoria(v: Vitrine, slug: string): Peca[] | null {
  const cat = v.categorias.find((c) => c.slug === slug);
  if (!cat) return null;
  const doCat = v.pecas.filter((p) => p.categoriaId === cat.id).sort(maisNovaPrimeiro);
  return [...doCat.filter((p) => !estaEsgotada(p, cat)), ...doCat.filter((p) => estaEsgotada(p, cat))];
}

export function chegouAgora(v: Vitrine, n = 12): Peca[] {
  return v.pecas.filter((p) => !esgotadaNaVitrine(v, p)).sort(maisNovaPrimeiro).slice(0, n);
}

export function pecasDoKit(v: Vitrine, kit: Kit): Peca[] {
  return kit.pecaIds.flatMap((id) => v.pecas.find((p) => p.id === id) ?? []);
}

export function totalDoKit(v: Vitrine, kit: Kit): number {
  return pecasDoKit(v, kit)
    .filter((p) => !esgotadaNaVitrine(v, p))
    .reduce((soma, p) => soma + p.precoCentavos, 0);
}

const porOrdem = (a: Kit, b: Kit) => a.ordem - b.ordem;

export function kitsDoInicio(v: Vitrine): Kit[] {
  return [...v.kits].sort(porOrdem).filter((k) => pecasDoKit(v, k).some((p) => !esgotadaNaVitrine(v, p)));
}

export function kitsComPeca(v: Vitrine, pecaId: string): Kit[] {
  return [...v.kits].sort(porOrdem).filter((k) => k.pecaIds.includes(pecaId));
}

export function buscarPeca(v: Vitrine, slug: string): Peca | null {
  return v.pecas.find((p) => p.slug === slug) ?? null;
}

export function buscarKit(v: Vitrine, slug: string): Kit | null {
  return v.kits.find((k) => k.slug === slug) ?? null;
}
