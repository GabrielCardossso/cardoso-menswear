import type { DadosAdmin, DadosCategoria, DadosKit, DadosPeca, KitAdmin, PecaAdmin } from './tipos';

/** "Calça Jogger Preta" → "calca-jogger-preta". O slug nasce do nome e não muda depois. */
export function gerarSlug(texto: string): string {
  const slug = texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'peca';
}

export function slugLivre(base: string, usados: ReadonlySet<string>): string {
  if (!usados.has(base)) return base;
  for (let n = 2; ; n++) if (!usados.has(`${base}-${n}`)) return `${base}-${n}`;
}

/** "89,90", "R$ 1.299,90", "89" ou "89.9" → centavos. Inválido, zero ou negativo → null. */
export function lerPreco(texto: string): number | null {
  const t = texto.replace(/R\$/gi, '').replace(/\s/g, '');
  let reais: string;
  let centavos = '';
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(t)) {
    [reais, centavos = ''] = t.replace(/\./g, '').split(',');
  } else if (/^\d+(\.\d{1,2})?$/.test(t)) {
    [reais, centavos = ''] = t.split('.');
  } else {
    return null;
  }
  const valor = Number(reais) * 100 + Number(centavos.padEnd(2, '0'));
  return valor > 0 ? valor : null;
}

/** "P, M,G  GG" → ["P","M","G","GG"], sem repetidos, na ordem. */
export function lerGrade(texto: string): string[] {
  return [...new Set(texto.split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean))];
}

/** Tamanhos que saem da grade e que alguma peça tinha ligado (para avisar antes de salvar). */
export function tamanhosPerdidos(gradeAntiga: string[], gradeNova: string[], pecas: PecaAdmin[]): string[] {
  return gradeAntiga.filter((t) => !gradeNova.includes(t) && pecas.some((p) => p.tamanhos[t] === true));
}

export function medidasReduzidas(largura: number, altura: number, max = 1600): { largura: number; altura: number } {
  const maior = Math.max(largura, altura);
  if (maior <= max) return { largura, altura };
  const f = max / maior;
  return { largura: Math.round(largura * f), altura: Math.round(altura * f) };
}

export function validarPeca(d: DadosPeca): Record<string, string> {
  const erros: Record<string, string> = {};
  const nome = d.nome.trim();
  if (!nome) erros.nome = 'Escreva o nome da peça.';
  else if (nome.length > 80) erros.nome = 'Use até 80 caracteres.';
  if (!d.categoriaId) erros.categoriaId = 'Escolha a categoria.';
  if (!(d.precoCentavos > 0)) erros.preco = 'Preço inválido.';
  return erros;
}

export function validarKit(d: DadosKit): Record<string, string> {
  const erros: Record<string, string> = {};
  if (!d.titulo.trim()) erros.titulo = 'Escreva o título do kit.';
  const n = d.pecaIds.length;
  if (n < 2 || n > 4 || new Set(d.pecaIds).size !== n) erros.pecas = 'Escolha de 2 a 4 peças.';
  return erros;
}

export function validarCategoria(d: DadosCategoria): Record<string, string> {
  const erros: Record<string, string> = {};
  if (!d.nome.trim()) erros.nome = 'Escreva o nome da categoria.';
  if (d.grade.length === 0) erros.grade = 'Coloque ao menos um tamanho.';
  return erros;
}

/** Só dígitos, com 55 e DDD (12 ou 13 dígitos). */
export function validarWhatsapp(texto: string): string | null {
  const d = texto.replace(/\D/g, '');
  return /^55\d{10,11}$/.test(d) ? d : null;
}

/** Peça não arquivada sem nenhum tamanho da grade da categoria ligado. */
export function pecaEsgotada(d: DadosAdmin, p: PecaAdmin): boolean {
  const grade = d.categorias.find((c) => c.id === p.categoriaId)?.grade ?? [];
  return !grade.some((t) => p.tamanhos[t] === true);
}

export function resumoGeral(d: DadosAdmin): { pecasAtivas: number; esgotadas: PecaAdmin[]; kitsComEsgotada: KitAdmin[] } {
  const ativas = d.pecas.filter((p) => !p.arquivada);
  const esgotadas = ativas.filter((p) => pecaEsgotada(d, p));
  const indisponivel = (id: string) => {
    const p = d.pecas.find((x) => x.id === id);
    return !p || p.arquivada || pecaEsgotada(d, p);
  };
  const kitsComEsgotada = [...d.kits].sort((a, b) => a.ordem - b.ordem).filter((k) => k.pecaIds.some(indisponivel));
  return { pecasAtivas: ativas.length, esgotadas, kitsComEsgotada };
}
