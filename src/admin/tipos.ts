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
