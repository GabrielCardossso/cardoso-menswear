import dados from './vitrine-exemplo.json';
import type { FonteVitrine, Vitrine } from './tipos';

/** Etapas 1 e 2: a vitrine vem do JSON de exemplo. A etapa 3 troca por uma fonte do Supabase. */
export const fonteLocal: FonteVitrine = {
  async carregar(): Promise<Vitrine> {
    const { categorias, pecas, kits, configuracoes } = structuredClone(dados) as unknown as Vitrine;
    return { categorias, pecas, kits, configuracoes };
  },
};
