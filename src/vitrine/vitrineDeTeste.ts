import type { Categoria, Kit, Peca, Vitrine } from './tipos';

/** Vitrine pequena e previsível para os testes (não é o JSON de exemplo). */
export const catRoupa: Categoria = { id: 'c1', nome: 'Camisetas', slug: 'camisetas', grade: ['P', 'M', 'G', 'GG'], ordem: 1 };
export const catBermuda: Categoria = { id: 'c2', nome: 'Bermudas', slug: 'bermudas', grade: ['P', 'M', 'G', 'GG'], ordem: 2 };

export function peca(id: string, extra: Partial<Peca> = {}): Peca {
  return {
    id,
    slug: id,
    nome: `Peça ${id}`,
    descricao: '',
    categoriaId: 'c1',
    precoCentavos: 8990,
    fotos: [`/exemplo/${id}.jpg`],
    tamanhos: { P: false, M: true, G: true, GG: false },
    criadoEm: '2026-11-01T10:00:00Z',
    ...extra,
  };
}

export function kit(id: string, pecaIds: string[], extra: Partial<Kit> = {}): Kit {
  return { id, slug: id, titulo: `Kit ${id}`, descricao: '', foto: `/exemplo/${id}.jpg`, pecaIds, ordem: 1, ...extra };
}

export function vitrineDeTeste(): Vitrine {
  return {
    categorias: [catBermuda, catRoupa],
    pecas: [
      peca('a', { nome: 'Camisa dry fit NK', criadoEm: '2026-11-03T10:00:00Z' }),
      peca('b', { nome: 'Bermuda NK', categoriaId: 'c2', precoCentavos: 7990, criadoEm: '2026-11-04T10:00:00Z' }),
      peca('esgotada', { nome: 'Camisa Mizuno', tamanhos: { P: false, M: false }, criadoEm: '2026-11-05T10:00:00Z' }),
      peca('velha', { nome: 'Camiseta básica', criadoEm: '2026-10-01T10:00:00Z' }),
    ],
    kits: [
      kit('k2', ['a', 'b'], { ordem: 2, titulo: 'Dry fit NK + bermuda' }),
      kit('k1', ['a', 'esgotada'], { ordem: 1 }),
      kit('kit-todo-esgotado', ['esgotada'], { ordem: 3 }),
    ],
    configuracoes: {
      lojaAberta: true,
      whatsappNumero: '5548999999999',
      instagramUrl: 'https://www.instagram.com/cardoso.menswear/',
      grupoWhatsappUrl: 'https://chat.whatsapp.com/exemplo',
      textoEntrega: 'Entrega por motoboy em Capivari de Baixo e região · Enviamos para todo o Brasil',
    },
  };
}
