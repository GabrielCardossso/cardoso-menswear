import exemplo from '../../vitrine/vitrine-exemplo.json';
import type { Vitrine } from '../../vitrine/tipos';
import { gerarSlug, slugLivre } from '../regras';
import {
  ErroSessao,
  type ApiAdmin,
  type CategoriaAdmin,
  type DadosAdmin,
  type FotoPeca,
  type KitAdmin,
  type PecaAdmin,
} from '../tipos';

/** Converte a vitrine de exemplo para o formato do painel: tudo visível, publicado e não arquivado. */
export function dadosDeExemplo(): DadosAdmin {
  const v = structuredClone(exemplo) as unknown as Vitrine;
  let n = 0;
  return {
    categorias: v.categorias.map((c) => ({ ...c, visivel: true })),
    pecas: v.pecas.map((p) => ({
      id: p.id,
      slug: p.slug,
      nome: p.nome,
      descricao: p.descricao,
      categoriaId: p.categoriaId,
      precoCentavos: p.precoCentavos,
      arquivada: false,
      fotos: p.fotos.map((path, ordem) => ({ id: `f${++n}`, path, ordem })),
      tamanhos: p.tamanhos,
      criadoEm: p.criadoEm,
    })),
    kits: v.kits.map((k) => ({
      id: k.id,
      slug: k.slug,
      titulo: k.titulo,
      descricao: k.descricao,
      fotoPath: k.foto || null,
      publicado: true,
      ordem: k.ordem,
      pecaIds: k.pecaIds,
    })),
    configuracoes: v.configuracoes,
  };
}

/**
 * ApiAdmin em memória: testes, e2e e `npm run dev` sem .env.local. Não existe senha de verdade:
 * entra qualquer e-mail com "@" e senha não vazia; "sem-acesso@…" simula conta que não é admin.
 * Imita os gatilhos do banco (peça nova com a grade toda; grade alterada sincroniza as peças).
 */
export function criarApiMemoria(inicial: DadosAdmin = dadosDeExemplo()): ApiAdmin & { expirarSessao(): void } {
  const d = structuredClone(inicial);
  const objetos = new Map<string, string>(); // path → URL do Blob
  let email: string | null = null;
  let seq = 0;
  const novoId = (prefixo: string) => `${prefixo}-${Date.now().toString(36)}-${++seq}`;

  const exigirSessao = async () => {
    if (!email) throw new ErroSessao();
  };
  const peca = (id: string) => {
    const p = d.pecas.find((x) => x.id === id);
    if (!p) throw new Error('peça não encontrada');
    return p;
  };
  const kit = (id: string) => {
    const k = d.kits.find((x) => x.id === id);
    if (!k) throw new Error('kit não encontrado');
    return k;
  };
  const categoria = (id: string) => {
    const c = d.categorias.find((x) => x.id === id);
    if (!c) throw new Error('categoria não encontrada');
    return c;
  };
  /** Mesmo efeito de public.sincronizar_tamanhos. */
  const sincronizar = (p: PecaAdmin) => {
    const grade = categoria(p.categoriaId).grade;
    p.tamanhos = Object.fromEntries(grade.map((t) => [t, p.tamanhos[t] === true]));
  };
  const guardarObjeto = (prefixo: string, foto: Blob) => {
    const path = `memoria/${prefixo}/${novoId('obj')}.webp`;
    objetos.set(path, typeof URL.createObjectURL === 'function' ? URL.createObjectURL(foto) : path);
    return path;
  };
  const apagarObjeto = (path: string | null) => {
    if (!path) return;
    const url = objetos.get(path);
    if (url && url !== path && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url);
    objetos.delete(path);
  };
  const reordenar = <T extends { id: string; ordem: number }>(lista: T[], ids: string[]) => {
    ids.forEach((id, i) => {
      const item = lista.find((x) => x.id === id);
      if (item) item.ordem = i + 1;
    });
  };

  return {
    expirarSessao() {
      email = null;
    },
    async sessao() {
      return email ? { email } : null;
    },
    async entrar(e, senha) {
      if (!e.includes('@') || !senha) return 'credenciais';
      if (e.startsWith('sem-acesso@')) return 'sem-acesso';
      email = e;
      return 'ok';
    },
    async sair() {
      email = null;
    },
    async carregar() {
      await exigirSessao();
      return structuredClone(d);
    },

    async criarPeca(dados) {
      await exigirSessao();
      const p: PecaAdmin = {
        id: novoId('p'),
        slug: slugLivre(gerarSlug(dados.nome), new Set(d.pecas.map((x) => x.slug))),
        nome: dados.nome.trim(),
        descricao: dados.descricao.trim(),
        categoriaId: dados.categoriaId,
        precoCentavos: dados.precoCentavos,
        arquivada: false,
        fotos: [],
        tamanhos: { ...dados.tamanhos },
        criadoEm: new Date().toISOString(),
      };
      sincronizar(p);
      d.pecas.push(p);
      return structuredClone(p);
    },
    async salvarPeca(id, dados) {
      await exigirSessao();
      const p = peca(id);
      Object.assign(p, {
        nome: dados.nome.trim(),
        descricao: dados.descricao.trim(),
        categoriaId: dados.categoriaId,
        precoCentavos: dados.precoCentavos,
        tamanhos: { ...dados.tamanhos },
      });
      sincronizar(p);
    },
    async arquivarPeca(id, arquivada) {
      await exigirSessao();
      peca(id).arquivada = arquivada;
    },
    async excluirPeca(id) {
      await exigirSessao();
      peca(id).fotos.forEach((f) => apagarObjeto(f.path));
      d.pecas = d.pecas.filter((p) => p.id !== id);
      d.kits.forEach((k) => (k.pecaIds = k.pecaIds.filter((x) => x !== id)));
    },
    async enviarFotoPeca(pecaId, foto) {
      await exigirSessao();
      const p = peca(pecaId);
      const f: FotoPeca = { id: novoId('f'), path: guardarObjeto(`pecas/${pecaId}`, foto), ordem: p.fotos.length };
      p.fotos.push(f);
      return { ...f };
    },
    async ordenarFotosPeca(pecaId, fotoIds) {
      await exigirSessao();
      const p = peca(pecaId);
      p.fotos = fotoIds.flatMap((id, ordem) => {
        const f = p.fotos.find((x) => x.id === id);
        return f ? [{ ...f, ordem }] : [];
      });
    },
    async excluirFotoPeca(foto) {
      await exigirSessao();
      for (const p of d.pecas) {
        if (!p.fotos.some((f) => f.id === foto.id)) continue;
        apagarObjeto(foto.path);
        p.fotos = p.fotos.filter((f) => f.id !== foto.id).map((f, ordem) => ({ ...f, ordem }));
      }
    },

    async criarKit(dados) {
      await exigirSessao();
      const k: KitAdmin = {
        id: novoId('k'),
        slug: slugLivre(gerarSlug(dados.titulo), new Set(d.kits.map((x) => x.slug))),
        titulo: dados.titulo.trim(),
        descricao: dados.descricao.trim(),
        fotoPath: null,
        publicado: false,
        ordem: Math.max(0, ...d.kits.map((x) => x.ordem)) + 1,
        pecaIds: [...dados.pecaIds],
      };
      d.kits.push(k);
      return structuredClone(k);
    },
    async salvarKit(id, dados) {
      await exigirSessao();
      Object.assign(kit(id), { titulo: dados.titulo.trim(), descricao: dados.descricao.trim(), pecaIds: [...dados.pecaIds] });
    },
    async publicarKit(id, publicado) {
      await exigirSessao();
      kit(id).publicado = publicado;
    },
    async excluirKit(id) {
      await exigirSessao();
      apagarObjeto(kit(id).fotoPath);
      d.kits = d.kits.filter((k) => k.id !== id);
    },
    async enviarFotoKit(kitId, foto) {
      await exigirSessao();
      const k = kit(kitId);
      const anterior = k.fotoPath;
      k.fotoPath = guardarObjeto(`kits/${kitId}`, foto);
      if (anterior?.startsWith('memoria/')) apagarObjeto(anterior);
      return k.fotoPath;
    },
    async removerFotoKit(kitId) {
      await exigirSessao();
      const k = kit(kitId);
      if (k.fotoPath?.startsWith('memoria/')) apagarObjeto(k.fotoPath);
      k.fotoPath = null;
    },
    async ordenarKits(ids) {
      await exigirSessao();
      reordenar(d.kits, ids);
    },

    async criarCategoria(dados) {
      await exigirSessao();
      const c: CategoriaAdmin = {
        id: novoId('c'),
        nome: dados.nome.trim(),
        slug: slugLivre(gerarSlug(dados.nome), new Set(d.categorias.map((x) => x.slug))),
        grade: [...dados.grade],
        ordem: Math.max(0, ...d.categorias.map((x) => x.ordem)) + 1,
        visivel: dados.visivel,
      };
      d.categorias.push(c);
      return structuredClone(c);
    },
    async salvarCategoria(id, dados) {
      await exigirSessao();
      const c = categoria(id);
      const mudouGrade = c.grade.join('\u0000') !== dados.grade.join('\u0000');
      Object.assign(c, { nome: dados.nome.trim(), grade: [...dados.grade], visivel: dados.visivel });
      if (mudouGrade) d.pecas.filter((p) => p.categoriaId === id).forEach(sincronizar);
    },
    async ordenarCategorias(ids) {
      await exigirSessao();
      reordenar(d.categorias, ids);
    },
    async excluirCategoria(id) {
      await exigirSessao();
      if (d.pecas.some((p) => p.categoriaId === id)) return 'tem-pecas';
      d.categorias = d.categorias.filter((c) => c.id !== id);
      return 'ok';
    },

    async salvarConfiguracoes(c) {
      await exigirSessao();
      d.configuracoes = { ...c };
    },
    urlDaFoto(path) {
      return objetos.get(path) ?? path;
    },
  };
}
