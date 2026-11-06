import type { SupabaseClient } from '@supabase/supabase-js';
import { paraCentavos } from '../lib/dinheiro';
import type { FonteVitrine, Kit, Peca, Vitrine } from './tipos';

/** Linhas como chegam do Supabase. A RLS já filtrou o que não é público. */
export type Linhas = {
  categorias: { id: string; nome: string; slug: string; grade: string[]; ordem: number }[];
  pecas: {
    id: string;
    slug: string;
    nome: string;
    descricao: string | null;
    categoria_id: string;
    /** numeric(10,2): o PostgREST pode mandar como texto. */
    preco: number | string;
    criado_em: string;
    peca_fotos: { path: string; ordem: number }[];
    peca_tamanhos: { tamanho: string; disponivel: boolean }[];
  }[];
  kits: {
    id: string;
    slug: string;
    titulo: string;
    descricao: string | null;
    foto_path: string | null;
    ordem: number;
    kit_pecas: { peca_id: string; ordem: number }[];
  }[];
  configuracoes: {
    loja_aberta: boolean;
    whatsapp_numero: string;
    instagram_url: string;
    grupo_whatsapp_url: string;
    texto_entrega: string;
  };
};

const BUCKET = 'vitrine';

/** "/x.jpg" (foto do próprio site) fica igual; "pecas/a.webp" vira a URL pública do bucket. */
export function urlDaFoto(path: string, urlBase: string): string {
  if (path.startsWith('/')) return path;
  const caminho = path.split('/').map(encodeURIComponent).join('/');
  return `${urlBase}/storage/v1/object/public/${BUCKET}/${caminho}`;
}

const porOrdem = (a: { ordem: number }, b: { ordem: number }) => a.ordem - b.ordem;

export function montarVitrine(l: Linhas, urlBase: string): Vitrine {
  const pecas: Peca[] = l.pecas.map((p) => ({
    id: p.id,
    slug: p.slug,
    nome: p.nome,
    descricao: p.descricao ?? '',
    categoriaId: p.categoria_id,
    precoCentavos: paraCentavos(Number(p.preco)),
    fotos: [...p.peca_fotos].sort(porOrdem).map((f) => urlDaFoto(f.path, urlBase)),
    tamanhos: Object.fromEntries(p.peca_tamanhos.map((t) => [t.tamanho, t.disponivel])),
    criadoEm: p.criado_em,
  }));
  const capa = (id: string | undefined) => pecas.find((p) => p.id === id)?.fotos[0] ?? '';

  const kits: Kit[] = l.kits.map((k) => {
    const pecaIds = [...k.kit_pecas].sort(porOrdem).map((kp) => kp.peca_id);
    return {
      id: k.id,
      slug: k.slug,
      titulo: k.titulo,
      descricao: k.descricao ?? '',
      foto: k.foto_path ? urlDaFoto(k.foto_path, urlBase) : capa(pecaIds[0]),
      pecaIds,
      ordem: k.ordem,
    };
  });

  const c = l.configuracoes;
  return {
    categorias: [...l.categorias].sort(porOrdem),
    pecas,
    kits,
    configuracoes: {
      lojaAberta: c.loja_aberta,
      whatsappNumero: c.whatsapp_numero,
      instagramUrl: c.instagram_url,
      grupoWhatsappUrl: c.grupo_whatsapp_url,
      textoEntrega: c.texto_entrega,
    },
  };
}

function exigir<T>(nome: string, r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(`Supabase (${nome}): ${r.error.message}`);
  if (r.data == null) throw new Error(`Supabase (${nome}): sem dados`);
  return r.data;
}

export function criarFonteSupabase(cliente: SupabaseClient, urlBase: string): FonteVitrine {
  return {
    async carregar() {
      const [categorias, pecas, kits, configuracoes] = await Promise.all([
        cliente.from('categorias').select('id, nome, slug, grade, ordem').order('ordem'),
        cliente
          .from('pecas')
          .select(
            'id, slug, nome, descricao, categoria_id, preco, criado_em, peca_fotos(path, ordem), peca_tamanhos(tamanho, disponivel)',
          ),
        cliente
          .from('kits')
          .select('id, slug, titulo, descricao, foto_path, ordem, kit_pecas(peca_id, ordem)')
          .order('ordem'),
        cliente
          .from('configuracoes')
          .select('loja_aberta, whatsapp_numero, instagram_url, grupo_whatsapp_url, texto_entrega')
          .maybeSingle(),
      ]);
      return montarVitrine(
        {
          categorias: exigir('categorias', categorias) as Linhas['categorias'],
          pecas: exigir('pecas', pecas) as Linhas['pecas'],
          kits: exigir('kits', kits) as Linhas['kits'],
          configuracoes: exigir('configuracoes', configuracoes) as Linhas['configuracoes'],
        },
        urlBase,
      );
    },
  };
}
