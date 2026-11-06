// @vitest-environment node
import exemplo from '../src/vitrine/vitrine-exemplo.json';
import { gerarSqlExemplo } from './gerar-sql-exemplo.mjs';

const { carregar, limpar } = gerarSqlExemplo(exemplo);
const contar = (sql: string, re: RegExp) => sql.match(re)?.length ?? 0;

describe('gerarSqlExemplo', () => {
  it('carregar: uma transação com as 12 peças, os 4 kits e os 3 casos de visibilidade', () => {
    expect(carregar.trim().startsWith('begin;')).toBe(true);
    expect(carregar.trim().endsWith('commit;')).toBe(true);
    // 12 do JSON + exemplo-arquivada + a peça da categoria escondida
    expect(contar(carregar, /insert into public\.pecas\b/gi)).toBe(14);
    // 4 do JSON + exemplo-oculto
    expect(contar(carregar, /insert into public\.kits\b/gi)).toBe(5);
    expect(carregar).toMatch(/insert into public\.categorias[\s\S]*'exemplo-escondida'[\s\S]*false/i);
    expect(carregar).toMatch(/'exemplo-arquivada'[\s\S]*?true/);
    expect(carregar).toMatch(/'exemplo-oculto'[\s\S]*?false/);
  });

  it('preço em reais com duas casas e categoria pelo slug', () => {
    expect(carregar).toContain("'camisa-dry-fit-nk-preta'");
    expect(carregar).toContain('89.90');
    expect(carregar).toContain("(select id from public.categorias where slug = 'camisetas')");
  });

  it('escapa aspas simples', () => {
    const v = structuredClone(exemplo);
    v.pecas[0].nome = "Camisa d'água";
    expect(gerarSqlExemplo(v).carregar).toContain("'Camisa d''água'");
  });

  it('limpar: apaga por slug exato tudo o que o carregar criou, nunca por padrão', () => {
    expect(limpar.trim().startsWith('begin;')).toBe(true);
    expect(limpar.trim().endsWith('commit;')).toBe(true);
    const criados = [...carregar.matchAll(/insert into public\.(?:pecas|kits|categorias)\s*\([^)]*\)\s*values\s*\(\s*'([^']+)'/gi)].map(
      (m) => m[1],
    );
    expect(criados.length).toBe(20);
    for (const slug of criados) expect(limpar).toContain(`'${slug}'`);
    expect(limpar).not.toMatch(/\blike\b/i);
    expect(limpar).not.toMatch(/\btruncate\b/i);
    // As 5 categorias reais nunca são apagadas.
    for (const c of exemplo.categorias) expect(limpar).not.toContain(`'${c.slug}'`);
  });
});
