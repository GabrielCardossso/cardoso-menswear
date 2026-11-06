import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { lerSacola, salvarSacola } from './persistencia';
import { adicionarItens, alterarQuantidade, removerItem, sacolaVazia } from './regras';
import type { ItemDaSacola, Sacola } from './tipos';

type ValorSacola = {
  sacola: Sacola;
  adicionar(itens: ItemDaSacola[]): void;
  alterar(pecaId: string, tamanho: string, qtd: number): void;
  remover(pecaId: string, tamanho: string): void;
  substituir(s: Sacola): void;
  esvaziar(): void;
  aberta: boolean;
  abrir(): void;
  fechar(): void;
};

const Contexto = createContext<ValorSacola | null>(null);
const agora = () => new Date().toISOString();

export function SacolaProvider({ children }: { children: ReactNode }) {
  const [sacola, setSacola] = useState<Sacola>(() => lerSacola(new Date()));
  const [aberta, setAberta] = useState(false);

  useEffect(() => salvarSacola(sacola), [sacola]);

  const adicionar = useCallback((itens: ItemDaSacola[]) => setSacola((s) => adicionarItens(s, itens, agora())), []);
  const alterar = useCallback(
    (pecaId: string, tamanho: string, qtd: number) => setSacola((s) => alterarQuantidade(s, pecaId, tamanho, qtd, agora())),
    [],
  );
  const remover = useCallback((pecaId: string, tamanho: string) => setSacola((s) => removerItem(s, pecaId, tamanho, agora())), []);
  const substituir = useCallback((s: Sacola) => setSacola(s), []);
  const esvaziar = useCallback(() => setSacola(sacolaVazia(agora())), []);
  const abrir = useCallback(() => setAberta(true), []);
  const fechar = useCallback(() => setAberta(false), []);

  const valor = useMemo(
    () => ({ sacola, adicionar, alterar, remover, substituir, esvaziar, aberta, abrir, fechar }),
    [sacola, adicionar, alterar, remover, substituir, esvaziar, aberta, abrir, fechar],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSacola(): ValorSacola {
  const v = useContext(Contexto);
  if (!v) throw new Error('useSacola fora do SacolaProvider');
  return v;
}
