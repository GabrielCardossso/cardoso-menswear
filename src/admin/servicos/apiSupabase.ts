import type { SupabaseClient } from '@supabase/supabase-js';
import { paraCentavos } from '../../lib/dinheiro';
import { urlDaFoto } from '../../vitrine/fonteSupabase';
import type { Configuracoes } from '../../vitrine/tipos';
import { gerarSlug, slugLivre } from '../regras';
import {
  ErroSessao,
  type ApiAdmin,
  type CategoriaAdmin,
  type DadosCategoria,
  type DadosPeca,
  type FotoPeca,
  type KitAdmin,
  type PecaAdmin,
} from '../tipos';

const BUCKET = 'vitrine';
const COLUNAS_PECA =
  'id, slug, nome, descricao, categoria_id, preco, arquivada, criado_em, peca_fotos(id, path, ordem), peca_tamanhos(tamanho, disponivel)';
const COLUNAS_KIT = 'id, slug, titulo, descricao, foto_path, publicado, ordem, kit_pecas(peca_id, ordem)';
const COLUNAS_CATEGORIA = 'id, nome, slug, grade, ordem, visivel';

type LinhaPeca = {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  categoria_id: string;
  preco: number | string;
  arquivada: boolean;
  criado_em: string;
  peca_fotos: FotoPeca[];
  peca_tamanhos: { tamanho: string; disponivel: boolean }[];
};
type LinhaKit = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  foto_path: string | null;
  publicado: boolean;
  ordem: number;
  kit_pecas: { peca_id: string; ordem: number }[];
};
type LinhaCategoria = CategoriaAdmin;
type ErroSupabase = { code?: string; status?: number; message?: string } | null;

const porOrdem = (a: { ordem: number }, b: { ordem: number }) => a.ordem - b.ordem;

export function paraPecaAdmin(l: LinhaPeca): PecaAdmin {
  return {
    id: l.id,
    slug: l.slug,
    nome: l.nome,
    descricao: l.descricao ?? '',
    categoriaId: l.categoria_id,
    precoCentavos: paraCentavos(Number(l.preco)),
    arquivada: l.arquivada,
    fotos: [...l.peca_fotos].sort(porOrdem).map(({ id, path, ordem }) => ({ id, path, ordem })),
    tamanhos: Object.fromEntries(l.peca_tamanhos.map((t) => [t.tamanho, t.disponivel])),
    criadoEm: l.criado_em,
  };
}

export function paraKitAdmin(l: LinhaKit): KitAdmin {
  return {
    id: l.id,
    slug: l.slug,
    titulo: l.titulo,
    descricao: l.descricao ?? '',
    fotoPath: l.foto_path,
    publicado: l.publicado,
    ordem: l.ordem,
    pecaIds: [...l.kit_pecas].sort(porOrdem).map((kp) => kp.peca_id),
  };
}

export function paraCategoriaAdmin(l: LinhaCategoria): CategoriaAdmin {
  return { id: l.id, nome: l.nome, slug: l.slug, grade: l.grade, ordem: l.ordem, visivel: l.visivel };
}

/**
 * Sessão vencida ou ausente. Sem sessão o supabase-js fala com o banco como visitante, e a gravação
 * cai em "permission denied" (42501), por isso esse código também conta.
 */
export function ehErroSessao(e: { code?: string; status?: number; message?: string }): boolean {
  return (
    e.status === 401 ||
    e.code === 'PGRST301' ||
    e.code === 'PGRST303' ||
    e.code === '42501' ||
    /jwt expired/i.test(e.message ?? '')
  );
}

function falha(e: NonNullable<ErroSupabase>): never {
  if (ehErroSessao(e)) throw new ErroSessao();
  throw new Error(e.message || 'erro do Supabase');
}

function exigir<T>(r: { data: T | null; error: ErroSupabase }): T {
  if (r.error) falha(r.error);
  if (r.data == null) throw new Error('sem dados');
  return r.data;
}

/** Update/delete que a RLS escondeu não dá erro: volta zero linhas. Para o admin, isso é sessão perdida. */
function exigirLinha(r: { data: unknown[] | null; error: ErroSupabase }) {
  const linhas = exigir(r);
  if (linhas.length === 0) throw new ErroSessao();
}

const textoOuNulo = (s: string) => (s.trim() ? s.trim() : null);
const reais = (centavos: number) => centavos / 100;
const doBucket = (path: string | null | undefined): path is string => !!path && !path.startsWith('/');

export function criarApiSupabase(db: SupabaseClient, urlBase: string): ApiAdmin {
  const slugsComBase = async (tabela: 'pecas' | 'kits' | 'categorias', base: string) => {
    const r = exigir(await db.from(tabela).select('slug').like('slug', `${base}%`));
    return new Set((r as { slug: string }[]).map((x) => x.slug));
  };

  /** Insere com slug livre; se outro admin pegou o mesmo slug no meio, tenta de novo uma vez. */
  const inserirComSlug = async <T>(tabela: 'pecas' | 'kits' | 'categorias', texto: string, linha: object, colunas: string) => {
    const base = gerarSlug(texto);
    for (let tentativa = 0; ; tentativa++) {
      const slug = slugLivre(base, await slugsComBase(tabela, base));
      const r = await db.from(tabela).insert({ ...linha, slug }).select(colunas).single();
      if (r.error?.code === '23505' && tentativa === 0) continue;
      return exigir(r) as T;
    }
  };

  const proximaOrdem = async (tabela: 'kits' | 'categorias') => {
    const r = exigir(await db.from(tabela).select('ordem').order('ordem', { ascending: false }).limit(1));
    return ((r as { ordem: number }[])[0]?.ordem ?? 0) + 1;
  };

  /** Os tamanhos já existem (gatilho do banco); aqui só liga e desliga. */
  const gravarTamanhos = async (pecaId: string, tamanhos: Record<string, boolean>) => {
    const ligados = Object.keys(tamanhos).filter((t) => tamanhos[t]);
    if (ligados.length > 0) {
      exigir(await db.from('peca_tamanhos').update({ disponivel: true }).eq('peca_id', pecaId).in('tamanho', ligados).select('tamanho'));
      const lista = `(${ligados.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(',')})`;
      exigir(await db.from('peca_tamanhos').update({ disponivel: false }).eq('peca_id', pecaId).not('tamanho', 'in', lista).select('tamanho'));
    } else {
      exigir(await db.from('peca_tamanhos').update({ disponivel: false }).eq('peca_id', pecaId).select('tamanho'));
    }
  };

  const linhaPeca = (d: DadosPeca) => ({
    nome: d.nome.trim(),
    descricao: textoOuNulo(d.descricao),
    categoria_id: d.categoriaId,
    preco: reais(d.precoCentavos),
  });

  const enviarObjeto = async (pasta: string, foto: Blob) => {
    const path = `${pasta}/${crypto.randomUUID()}.webp`;
    const { error } = await db.storage.from(BUCKET).upload(path, foto, { contentType: 'image/webp', upsert: false });
    if (error) falha(error as ErroSupabase & object);
    return path;
  };
  const removerObjetos = async (paths: (string | null | undefined)[]) => {
    const doBucketSo = paths.filter(doBucket);
    if (doBucketSo.length === 0) return;
    const { error } = await db.storage.from(BUCKET).remove(doBucketSo);
    if (error) falha(error as ErroSupabase & object);
  };

  const reordenar = async (tabela: 'kits' | 'categorias' | 'peca_fotos', ids: string[], base = 1) => {
    for (const [i, id] of ids.entries()) {
      exigirLinha(await db.from(tabela).update({ ordem: i + base }).eq('id', id).select('id'));
    }
  };

  const linhaCategoria = (d: DadosCategoria) => ({ nome: d.nome.trim(), grade: d.grade, visivel: d.visivel });

  return {
    async sessao() {
      const { data, error } = await db.auth.getSession();
      if (error) throw new Error(error.message);
      return data.session ? { email: data.session.user.email ?? '' } : null;
    },

    async entrar(email, senha) {
      const { data, error } = await db.auth.signInWithPassword({ email: email.trim(), password: senha });
      if (error) {
        if (error.status === 400 || error.code === 'invalid_credentials') return 'credenciais';
        throw new Error(error.message);
      }
      const admin = exigir(await db.from('admins').select('user_id').eq('user_id', data.user.id));
      if (admin.length === 0) {
        await db.auth.signOut();
        return 'sem-acesso';
      }
      return 'ok';
    },

    async sair() {
      await db.auth.signOut();
    },

    async carregar() {
      const [categorias, pecas, kits, configuracoes] = await Promise.all([
        db.from('categorias').select(COLUNAS_CATEGORIA).order('ordem'),
        db.from('pecas').select(COLUNAS_PECA).order('criado_em', { ascending: false }),
        db.from('kits').select(COLUNAS_KIT).order('ordem'),
        db
          .from('configuracoes')
          .select('loja_aberta, whatsapp_numero, instagram_url, grupo_whatsapp_url, texto_entrega')
          .maybeSingle(),
      ]);
      const c = exigir(configuracoes) as {
        loja_aberta: boolean;
        whatsapp_numero: string;
        instagram_url: string;
        grupo_whatsapp_url: string;
        texto_entrega: string;
      };
      return {
        categorias: (exigir(categorias) as LinhaCategoria[]).map(paraCategoriaAdmin),
        pecas: (exigir(pecas) as LinhaPeca[]).map(paraPecaAdmin),
        kits: (exigir(kits) as LinhaKit[]).map(paraKitAdmin),
        configuracoes: {
          lojaAberta: c.loja_aberta,
          whatsappNumero: c.whatsapp_numero,
          instagramUrl: c.instagram_url,
          grupoWhatsappUrl: c.grupo_whatsapp_url,
          textoEntrega: c.texto_entrega,
        },
      };
    },

    async criarPeca(d) {
      const nova = await inserirComSlug<LinhaPeca>('pecas', d.nome, linhaPeca(d), 'id');
      await gravarTamanhos(nova.id, d.tamanhos);
      return paraPecaAdmin(exigir(await db.from('pecas').select(COLUNAS_PECA).eq('id', nova.id).single()) as LinhaPeca);
    },

    async salvarPeca(id, d) {
      exigirLinha(await db.from('pecas').update(linhaPeca(d)).eq('id', id).select('id'));
      await gravarTamanhos(id, d.tamanhos);
    },

    async arquivarPeca(id, arquivada) {
      exigirLinha(await db.from('pecas').update({ arquivada }).eq('id', id).select('id'));
    },

    async excluirPeca(id) {
      const fotos = exigir(await db.from('peca_fotos').select('path').eq('peca_id', id)) as { path: string }[];
      exigirLinha(await db.from('pecas').delete().eq('id', id).select('id'));
      await removerObjetos(fotos.map((f) => f.path));
    },

    async enviarFotoPeca(pecaId, foto) {
      const ultimas = exigir(
        await db.from('peca_fotos').select('ordem').eq('peca_id', pecaId).order('ordem', { ascending: false }).limit(1),
      ) as { ordem: number }[];
      const path = await enviarObjeto(`pecas/${pecaId}`, foto);
      const r = await db
        .from('peca_fotos')
        .insert({ peca_id: pecaId, path, ordem: (ultimas[0]?.ordem ?? -1) + 1 })
        .select('id, path, ordem')
        .single();
      if (r.error) {
        await removerObjetos([path]).catch(() => undefined);
        falha(r.error);
      }
      return r.data as FotoPeca;
    },

    async ordenarFotosPeca(_pecaId, fotoIds) {
      await reordenar('peca_fotos', fotoIds, 0);
    },

    async excluirFotoPeca(foto) {
      exigirLinha(await db.from('peca_fotos').delete().eq('id', foto.id).select('id'));
      await removerObjetos([foto.path]);
    },

    async criarKit(d) {
      const ordem = await proximaOrdem('kits');
      const novo = await inserirComSlug<{ id: string }>(
        'kits',
        d.titulo,
        { titulo: d.titulo.trim(), descricao: textoOuNulo(d.descricao), publicado: false, ordem },
        'id',
      );
      exigir(await db.from('kit_pecas').insert(d.pecaIds.map((peca_id, i) => ({ kit_id: novo.id, peca_id, ordem: i }))).select('kit_id'));
      return paraKitAdmin(exigir(await db.from('kits').select(COLUNAS_KIT).eq('id', novo.id).single()) as LinhaKit);
    },

    async salvarKit(id, d) {
      exigirLinha(
        await db.from('kits').update({ titulo: d.titulo.trim(), descricao: textoOuNulo(d.descricao) }).eq('id', id).select('id'),
      );
      exigir(await db.from('kit_pecas').delete().eq('kit_id', id).select('kit_id'));
      exigir(await db.from('kit_pecas').insert(d.pecaIds.map((peca_id, i) => ({ kit_id: id, peca_id, ordem: i }))).select('kit_id'));
    },

    async publicarKit(id, publicado) {
      exigirLinha(await db.from('kits').update({ publicado }).eq('id', id).select('id'));
    },

    async excluirKit(id) {
      const kit = exigir(await db.from('kits').select('foto_path').eq('id', id).single()) as { foto_path: string | null };
      exigirLinha(await db.from('kits').delete().eq('id', id).select('id'));
      await removerObjetos([kit.foto_path]);
    },

    async enviarFotoKit(kitId, foto) {
      const kit = exigir(await db.from('kits').select('foto_path').eq('id', kitId).single()) as { foto_path: string | null };
      const path = await enviarObjeto(`kits/${kitId}`, foto);
      exigirLinha(await db.from('kits').update({ foto_path: path }).eq('id', kitId).select('id'));
      await removerObjetos([kit.foto_path]).catch(() => undefined); // sobra no bucket não quebra o painel
      return path;
    },

    async removerFotoKit(kitId) {
      const kit = exigir(await db.from('kits').select('foto_path').eq('id', kitId).single()) as { foto_path: string | null };
      exigirLinha(await db.from('kits').update({ foto_path: null }).eq('id', kitId).select('id'));
      await removerObjetos([kit.foto_path]);
    },

    async ordenarKits(ids) {
      await reordenar('kits', ids);
    },

    async criarCategoria(d) {
      const ordem = await proximaOrdem('categorias');
      return paraCategoriaAdmin(
        await inserirComSlug<LinhaCategoria>('categorias', d.nome, { ...linhaCategoria(d), ordem }, COLUNAS_CATEGORIA),
      );
    },

    async salvarCategoria(id, d) {
      exigirLinha(await db.from('categorias').update(linhaCategoria(d)).eq('id', id).select('id'));
    },

    async ordenarCategorias(ids) {
      await reordenar('categorias', ids);
    },

    async excluirCategoria(id) {
      const { count, error } = await db.from('pecas').select('id', { count: 'exact', head: true }).eq('categoria_id', id);
      if (error) falha(error);
      if ((count ?? 0) > 0) return 'tem-pecas';
      const r = await db.from('categorias').delete().eq('id', id).select('id');
      if (r.error?.code === '23503') return 'tem-pecas';
      exigirLinha(r);
      return 'ok';
    },

    async salvarConfiguracoes(c: Configuracoes) {
      exigirLinha(
        await db
          .from('configuracoes')
          .update({
            loja_aberta: c.lojaAberta,
            whatsapp_numero: c.whatsappNumero,
            instagram_url: c.instagramUrl.trim(),
            grupo_whatsapp_url: c.grupoWhatsappUrl.trim(),
            texto_entrega: c.textoEntrega.trim(),
          })
          .eq('id', true)
          .select('id'),
      );
    },

    urlDaFoto(path) {
      return urlDaFoto(path, urlBase);
    },
  };
}
