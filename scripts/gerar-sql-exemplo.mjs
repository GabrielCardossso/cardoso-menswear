// Gera supabase/exemplo/carregar.sql e limpar.sql a partir de src/vitrine/vitrine-exemplo.json.
// Os dois rodam no SQL Editor do painel. Projeto único: carrega, testa e apaga no mesmo passo.
// Nunca vira migração. Uso: node scripts/gerar-sql-exemplo.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Slug de exemplo nunca colide com peça real: sempre começa com 'exemplo-'. */
const ex = (slug) => (slug.startsWith('exemplo-') ? slug : `exemplo-${slug}`);
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
const reais = (centavos) => (centavos / 100).toFixed(2);
const idPeca = (slug) => `(select id from public.pecas where slug = ${lit(slug)})`;
const idKit = (slug) => `(select id from public.kits where slug = ${lit(slug)})`;
const idCategoria = (slug) => `(select id from public.categorias where slug = ${lit(slug)})`;

// Casos que o visitante NÃO pode ver.
const ESCONDIDA = { slug: 'exemplo-escondida', nome: 'Exemplo escondida', grade: ['U'] };
const ARQUIVADA = 'exemplo-arquivada';
const DA_ESCONDIDA = 'exemplo-peca-escondida';
const OCULTO = 'exemplo-oculto';

function sqlPeca({ slug, nome, categoriaSlug, descricao, precoCentavos, arquivada, criadoEm, fotos, grade, tamanhos }) {
  const linhas = [
    `insert into public.pecas (slug, nome, categoria_id, descricao, preco, arquivada, criado_em) values (${lit(slug)}, ${lit(nome)}, ${idCategoria(categoriaSlug)}, ${lit(descricao)}, ${reais(precoCentavos)}, ${arquivada}, ${lit(criadoEm)});`,
  ];
  fotos.forEach((path, i) =>
    linhas.push(`insert into public.peca_fotos (peca_id, path, ordem) values (${idPeca(slug)}, ${lit(path)}, ${i});`),
  );
  for (const t of grade) {
    linhas.push(
      `insert into public.peca_tamanhos (peca_id, tamanho, disponivel) values (${idPeca(slug)}, ${lit(t)}, ${tamanhos[t] === true});`,
    );
  }
  return linhas;
}

function sqlKit({ slug, titulo, descricao, foto, publicado, ordem, pecaSlugs }) {
  return [
    `insert into public.kits (slug, titulo, descricao, foto_path, publicado, ordem) values (${lit(slug)}, ${lit(titulo)}, ${lit(descricao)}, ${lit(foto)}, ${publicado}, ${ordem});`,
    ...pecaSlugs.map(
      (p, i) => `insert into public.kit_pecas (kit_id, peca_id, ordem) values (${idKit(slug)}, ${idPeca(p)}, ${i});`,
    ),
  ];
}

/** @returns {{ carregar: string, limpar: string }} */
export function gerarSqlExemplo(v) {
  const catSlug = Object.fromEntries(v.categorias.map((c) => [c.id, c.slug]));
  const grade = Object.fromEntries(v.categorias.map((c) => [c.id, c.grade]));
  const slugPeca = Object.fromEntries(v.pecas.map((p) => [p.id, ex(p.slug)]));
  const camisetas = v.categorias.find((c) => c.slug === 'camisetas');

  const pecas = v.pecas.map((p) => ({
    slug: ex(p.slug),
    nome: p.nome,
    categoriaSlug: catSlug[p.categoriaId],
    descricao: p.descricao,
    precoCentavos: p.precoCentavos,
    arquivada: false,
    criadoEm: p.criadoEm,
    fotos: p.fotos,
    grade: grade[p.categoriaId],
    tamanhos: p.tamanhos,
  }));
  const base = pecas[0];
  pecas.push(
    { ...base, slug: ARQUIVADA, nome: 'Exemplo arquivada', categoriaSlug: camisetas.slug, grade: camisetas.grade, arquivada: true },
    { ...base, slug: DA_ESCONDIDA, nome: 'Exemplo da categoria escondida', categoriaSlug: ESCONDIDA.slug, grade: ESCONDIDA.grade, tamanhos: { U: true } },
  );

  const kits = v.kits.map((k) => ({
    slug: ex(k.slug),
    titulo: k.titulo,
    descricao: k.descricao,
    foto: k.foto,
    publicado: true,
    ordem: k.ordem,
    pecaSlugs: k.pecaIds.map((id) => slugPeca[id]),
  }));
  kits.push({ ...kits[0], slug: OCULTO, titulo: 'Exemplo oculto', publicado: false, ordem: 99 });

  const carregar = [
    'begin;',
    '-- GERADO por scripts/gerar-sql-exemplo.mjs. Dados de EXEMPLO: rodar limpar.sql logo depois dos testes.',
    `insert into public.categorias (slug, nome, grade, ordem, visivel) values (${lit(ESCONDIDA.slug)}, ${lit(ESCONDIDA.nome)}, array[${ESCONDIDA.grade.map(lit).join(', ')}], 99, false);`,
    ...pecas.flatMap(sqlPeca),
    ...kits.flatMap(sqlKit),
    'commit;',
    '',
  ].join('\n');

  const lista = (xs) => xs.map(lit).join(', ');
  const limpar = [
    'begin;',
    '-- GERADO por scripts/gerar-sql-exemplo.mjs. Apaga exatamente o que carregar.sql criou.',
    `delete from public.kits where slug in (${lista(kits.map((k) => k.slug))});`,
    `delete from public.pecas where slug in (${lista(pecas.map((p) => p.slug))});`,
    `delete from public.categorias where slug = ${lit(ESCONDIDA.slug)};`,
    'commit;',
    '',
  ].join('\n');

  return { carregar, limpar };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
  const v = JSON.parse(readFileSync(join(raiz, 'src/vitrine/vitrine-exemplo.json'), 'utf8'));
  const { carregar, limpar } = gerarSqlExemplo(v);
  const pasta = join(raiz, 'supabase/exemplo');
  mkdirSync(pasta, { recursive: true });
  writeFileSync(join(pasta, 'carregar.sql'), carregar);
  writeFileSync(join(pasta, 'limpar.sql'), limpar);
  console.log('Gerados supabase/exemplo/carregar.sql e limpar.sql');
}
