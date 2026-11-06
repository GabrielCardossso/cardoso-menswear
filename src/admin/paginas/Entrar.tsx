import { useState, type FormEvent } from 'react';
import logo from '../../assets/cardoso-nome-branco.svg';
import { Navigate, useSearchParams } from 'react-router';
import { useAdmin } from '../AdminContext';
import Botao from '../componentes/Botao';
import Campo from '../componentes/Campo';

export default function Entrar() {
  const { api, sessao, entrou } = useAdmin();
  const [busca] = useSearchParams();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  if (sessao === 'ativa') return <Navigate to="/admin" replace />;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (ocupado) return;
    setErro('');
    setOcupado(true);
    try {
      const r = await api.entrar(email, senha);
      if (r === 'ok') return entrou(email.trim());
      setErro(r === 'credenciais' ? 'E-mail ou senha incorretos.' : 'Esta conta não tem acesso ao painel.');
    } catch {
      setErro('Não foi possível entrar. Confira a internet e tente de novo.');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-sm content-center gap-6 px-4 py-10">
      <img src={logo} alt="" className="h-10 w-auto justify-self-start" />
      <h1 className="font-titulo text-3xl uppercase">Painel Cardoso</h1>
      {busca.get('expirou') && (
        <p role="status" className="rounded-[3px] border border-linha p-3 text-sm">
          Sua sessão expirou. Entre de novo.
        </p>
      )}
      {sessao === 'sem-config' ? (
        <p role="alert">Supabase não configurado.</p>
      ) : (
        <form onSubmit={enviar} noValidate className="grid gap-4">
          <Campo rotulo="E-mail" type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Campo rotulo="Senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
          {erro && (
            <p role="alert" className="text-sm">
              {erro}
            </p>
          )}
          <Botao type="submit" variante="principal" ocupado={ocupado} textoOcupado="Entrando…">
            Entrar
          </Botao>
        </form>
      )}
    </main>
  );
}
