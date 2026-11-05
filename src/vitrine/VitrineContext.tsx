import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { FonteVitrine, Vitrine } from './tipos';

export type EstadoVitrine =
  | { estado: 'carregando' }
  | { estado: 'erro'; tentarDeNovo(): void }
  | { estado: 'pronto'; vitrine: Vitrine; recarregar(): Promise<Vitrine> };

const Contexto = createContext<EstadoVitrine | null>(null);

export function VitrineProvider({ fonte, children }: { fonte: FonteVitrine; children: ReactNode }) {
  const [vitrine, setVitrine] = useState<Vitrine | null>(null);
  const [erro, setErro] = useState(false);

  const carregar = useCallback(() => {
    setErro(false);
    fonte.carregar().then(setVitrine, () => setErro(true));
  }, [fonte]);

  useEffect(carregar, [carregar]);

  /** Busca de novo (usado na conferência); rejeita se falhar, sem derrubar a vitrine já carregada. */
  const recarregar = useCallback(async () => {
    const nova = await fonte.carregar();
    setVitrine(nova);
    return nova;
  }, [fonte]);

  const valor: EstadoVitrine = vitrine
    ? { estado: 'pronto', vitrine, recarregar }
    : erro
      ? { estado: 'erro', tentarDeNovo: carregar }
      : { estado: 'carregando' };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useVitrine(): EstadoVitrine {
  const v = useContext(Contexto);
  if (!v) throw new Error('useVitrine fora do VitrineProvider');
  return v;
}

/** Para as páginas, que só aparecem depois que o Layout viu a vitrine pronta. */
export function useVitrinePronta() {
  const v = useVitrine();
  if (v.estado !== 'pronto') throw new Error('vitrine ainda não carregou');
  return v;
}
