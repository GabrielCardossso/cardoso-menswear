import type { Configuracoes } from '../vitrine/tipos';

export type FotoPeca = { id: string; path: string; ordem: number };

export type CategoriaAdmin = { id: string; nome: string; slug: string; grade: string[]; ordem: number; visivel: boolean };

export type PecaAdmin = {
  id: string;
  slug: string;
  nome: string;
  descricao: string;
  categoriaId: string;
  precoCentavos: number;
  arquivada: boolean;
  fotos: FotoPeca[];
  tamanhos: Record<string, boolean>;
  criadoEm: string;
};

export type KitAdmin = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string;
  fotoPath: string | null;
  publicado: boolean;
  ordem: number;
  pecaIds: string[];
};

export type DadosAdmin = {
  categorias: CategoriaAdmin[];
  pecas: PecaAdmin[];
  kits: KitAdmin[];
  configuracoes: Configuracoes;
};

export type DadosPeca = {
  nome: string;
  descricao: string;
  categoriaId: string;
  precoCentavos: number;
  tamanhos: Record<string, boolean>;
};

export type DadosKit = { titulo: string; descricao: string; pecaIds: string[] };

export type DadosCategoria = { nome: string; grade: string[]; visivel: boolean };

/** Sessão ausente ou expirada: o painel volta para a entrada. */
export class ErroSessao extends Error {
  constructor(mensagem = 'sessao') {
    super(mensagem);
    this.name = 'ErroSessao';
  }
}

/**
 * O que as telas do painel usam. Duas versões: Supabase (banco real) e memória (testes, e2e e dev sem .env.local).
 * Toda falha de rede ou do banco rejeita com Error; sessão expirada ou ausente rejeita com ErroSessao.
 */
export interface ApiAdmin {
  sessao(): Promise<{ email: string } | null>;
  /** 'credenciais': e-mail ou senha errados; 'sem-acesso': a conta não está em `admins` (e a sessão é encerrada). */
  entrar(email: string, senha: string): Promise<'ok' | 'credenciais' | 'sem-acesso'>;
  sair(): Promise<void>;
  carregar(): Promise<DadosAdmin>;
  /** slug = slugLivre(gerarSlug(nome)); nunca muda depois. Nasce com a grade toda desligada e depois grava os tamanhos dados. */
  criarPeca(d: DadosPeca): Promise<PecaAdmin>;
  salvarPeca(id: string, d: DadosPeca): Promise<void>;
  arquivarPeca(id: string, arquivada: boolean): Promise<void>;
  /** Apaga também as fotos do Storage. */
  excluirPeca(id: string): Promise<void>;
  /** Vai para o fim da ordem. */
  enviarFotoPeca(pecaId: string, foto: Blob): Promise<FotoPeca>;
  ordenarFotosPeca(pecaId: string, fotoIds: string[]): Promise<void>;
  excluirFotoPeca(foto: FotoPeca): Promise<void>;
  /** Nasce oculto, no fim da ordem. */
  criarKit(d: DadosKit): Promise<KitAdmin>;
  salvarKit(id: string, d: DadosKit): Promise<void>;
  publicarKit(id: string, publicado: boolean): Promise<void>;
  /** Apaga a foto do kit, se houver. */
  excluirKit(id: string): Promise<void>;
  /** Devolve o path; substitui a anterior. */
  enviarFotoKit(kitId: string, foto: Blob): Promise<string>;
  removerFotoKit(kitId: string): Promise<void>;
  ordenarKits(kitIds: string[]): Promise<void>;
  criarCategoria(d: DadosCategoria): Promise<CategoriaAdmin>;
  salvarCategoria(id: string, d: DadosCategoria): Promise<void>;
  ordenarCategorias(ids: string[]): Promise<void>;
  excluirCategoria(id: string): Promise<'ok' | 'tem-pecas'>;
  salvarConfiguracoes(c: Configuracoes): Promise<void>;
  urlDaFoto(path: string): string;
}
