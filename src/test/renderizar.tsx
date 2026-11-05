import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Rotas } from '../App';
import { SacolaProvider } from '../sacola/SacolaContext';
import type { FonteVitrine, Vitrine } from '../vitrine/tipos';
import { VitrineProvider } from '../vitrine/VitrineContext';
import { vitrineDeTeste } from '../vitrine/vitrineDeTeste';

/** Fonte que entrega a vitrine dada (ou a de teste), sempre como cópia nova. */
export function fonteDe(v: Vitrine = vitrineDeTeste()): FonteVitrine & { carregar: ReturnType<typeof vi.fn> } {
  return { carregar: vi.fn(async () => structuredClone(v)) };
}

/** Monta o app inteiro (rotas + provedores). Com uma lista, as anteriores viram o histórico e abre na última. */
export function renderizarApp(caminho: string | string[], fonte: FonteVitrine = fonteDe()) {
  const entradas = Array.isArray(caminho) ? caminho : [caminho];
  return render(
    <MemoryRouter initialEntries={entradas} initialIndex={entradas.length - 1}>
      <VitrineProvider fonte={fonte}>
        <SacolaProvider>
          <Rotas />
        </SacolaProvider>
      </VitrineProvider>
    </MemoryRouter>,
  );
}
