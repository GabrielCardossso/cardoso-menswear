export type Categoria = { id: string; nome: string; slug: string; grade: string[]; ordem: number };

export type Peca = {
  id: string;
  slug: string;
  nome: string;
  descricao: string;
  categoriaId: string;
  precoCentavos: number;
  /** URLs; a primeira é a capa. */
  fotos: string[];
  /** Rótulo da grade → disponível. */
  tamanhos: Record<string, boolean>;
  /** ISO 8601. */
  criadoEm: string;
};

export type Kit = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string;
  foto: string;
  pecaIds: string[];
  ordem: number;
};

export type Configuracoes = {
  lojaAberta: boolean;
  whatsappNumero: string;
  instagramUrl: string;
  grupoWhatsappUrl: string;
  textoEntrega: string;
};

/** Só o que é público: categorias visíveis, peças não arquivadas, kits publicados. */
export type Vitrine = { categorias: Categoria[]; pecas: Peca[]; kits: Kit[]; configuracoes: Configuracoes };

export interface FonteVitrine {
  carregar(): Promise<Vitrine>;
}
