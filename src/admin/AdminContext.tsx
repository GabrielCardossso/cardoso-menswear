import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ErroSessao, type ApiAdmin, type DadosAdmin } from './tipos';

export type EstadoSessao = 'verificando' | 'sem-config' | 'sem-sessao' | 'ativa';

type Admin = {
  api: ApiAdmin;
  sessao: EstadoSessao;
  email: string;
  /** null enquanto carrega (ou sem sessão). */
  dados: DadosAdmin | null;
  erroCarga: boolean;
  recarregar(): Promise<void>;
  /** Depois de entrar com sucesso. */
  entrou(email: string): void;
  sair(): Promise<void>;
  /** Sessão vencida: volta para a entrada e devolve ''. Outro erro: devolve a mensagem para mostrar. */
  tratarErro(e: unknown): string;
};

const Contexto = createContext<Admin | null>(null);

export const ERRO_GRAVAR = 'Não foi possível salvar. Confira a internet e tente de novo.';

export function AdminProvider({ api, children }: { api: ApiAdmin; children: ReactNode }) {
  const navigate = useNavigate();
  const [sessao, setSessao] = useState<EstadoSessao>('verificando');
  const [email, setEmail] = useState('');
  const [dados, setDados] = useState<DadosAdmin | null>(null);
  const [erroCarga, setErroCarga] = useState(false);

  useEffect(() => {
    let vivo = true;
    api.sessao().then(
      (s) => {
        if (!vivo) return;
        setEmail(s?.email ?? '');
        setSessao(s ? 'ativa' : 'sem-sessao');
      },
      (e: unknown) => {
        if (!vivo) return;
        setSessao(e instanceof Error && e.message === 'supabase-nao-configurado' ? 'sem-config' : 'sem-sessao');
      },
    );
    return () => {
      vivo = false;
    };
  }, [api]);

  const expirou = useCallback(() => {
    setSessao('sem-sessao');
    setDados(null);
    navigate('/admin/entrar?expirou=1', { replace: true });
  }, [navigate]);

  const recarregar = useCallback(async () => {
    setErroCarga(false);
    try {
      setDados(await api.carregar());
    } catch (e) {
      if (e instanceof ErroSessao) expirou();
      else setErroCarga(true);
    }
  }, [api, expirou]);

  useEffect(() => {
    if (sessao === 'ativa') void recarregar();
  }, [sessao, recarregar]);

  const valor = useMemo<Admin>(
    () => ({
      api,
      sessao,
      email,
      dados,
      erroCarga,
      recarregar,
      entrou(e) {
        setEmail(e);
        setSessao('ativa');
      },
      async sair() {
        await api.sair().catch(() => undefined);
        setDados(null);
        setSessao('sem-sessao');
        navigate('/admin/entrar', { replace: true });
      },
      tratarErro(e) {
        if (e instanceof ErroSessao) {
          expirou();
          return '';
        }
        return ERRO_GRAVAR;
      },
    }),
    [api, sessao, email, dados, erroCarga, recarregar, expirou, navigate],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAdmin(): Admin {
  const v = useContext(Contexto);
  if (!v) throw new Error('useAdmin fora do AdminProvider');
  return v;
}

/** Para as páginas protegidas, que só aparecem com os dados carregados. */
export function useDadosAdmin(): Admin & { dados: DadosAdmin } {
  const a = useAdmin();
  if (!a.dados) throw new Error('dados do painel ainda não carregaram');
  return a as Admin & { dados: DadosAdmin };
}
