import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { formatarReais } from '../lib/dinheiro';
import { abrirLink } from '../lib/navegador';
import { conferirSacola, type ResultadoConferencia } from '../pedido/conferencia';
import {
  linkWhatsApp, montarMensagem, validarFinalizacao, type CamposFinalizacao, type DadosDoPedido, type ErrosFinalizacao,
} from '../pedido/mensagem';
import { totalCentavos } from '../sacola/regras';
import { useSacola } from '../sacola/SacolaContext';
import type { Sacola } from '../sacola/tipos';
import { useVitrinePronta } from '../vitrine/VitrineContext';

type Fase =
  | { tipo: 'formulario' }
  | { tipo: 'mudancas'; mudancas: string[]; dados: DadosDoPedido }
  | { tipo: 'pausada' }
  | { tipo: 'enviado'; mensagem: string };

const vazio: CamposFinalizacao = { nome: '', tipo: '', bairro: '', cep: '', cidade: '', observacao: '' };
const botaoPrincipal = 'w-full bg-branco py-4 font-rotulo text-sm font-semibold tracking-[0.12em] text-preto uppercase disabled:bg-linha disabled:text-carpete';
const botaoSecundario = 'w-full border border-branco py-4 font-rotulo text-sm font-semibold tracking-[0.12em] uppercase';
const AVISO_PAUSADA = 'Pedidos pausados no momento. Fale com a gente no Instagram.';

export default function Finalizar() {
  const { vitrine, carregadaEm, recarregar } = useVitrinePronta();
  const { sacola, substituir, esvaziar } = useSacola();
  const navigate = useNavigate();
  const [campos, setCampos] = useState<CamposFinalizacao>(vazio);
  const [erros, setErros] = useState<ErrosFinalizacao>({});
  const [fase, setFase] = useState<Fase>({ tipo: 'formulario' });
  const [enviando, setEnviando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const blocoMensagem = useRef<HTMLPreElement>(null);
  const tituloFase = useRef<HTMLElement>(null);

  // Acessibilidade: com erro, foco no primeiro campo inválido; ao trocar de fase, foco no título da nova seção.
  useEffect(() => {
    if (tentativa === 0) return;
    const ordem: [keyof ErrosFinalizacao, string][] = [['nome', 'nome'], ['tipo', 'entrega-motoboy'], ['bairro', 'bairro'], ['cep', 'cep'], ['cidade', 'cidade']];
    const primeiro = ordem.find(([campo]) => erros[campo]);
    if (primeiro) document.getElementById(primeiro[1])?.focus();
  }, [tentativa, erros]);
  useEffect(() => {
    if (fase.tipo !== 'formulario') tituloFase.current?.focus();
  }, [fase.tipo]);

  if (sacola.itens.length === 0 && fase.tipo === 'formulario') return <Navigate to="/" replace />;

  const mudar = (c: Partial<CamposFinalizacao>) => setCampos((atual) => ({ ...atual, ...c }));

  function enviarAgora(s: Sacola, dados: DadosDoPedido, numero = vitrine.configuracoes.whatsappNumero) {
    const mensagem = montarMensagem(s, dados);
    abrirLink(linkWhatsApp(numero, mensagem));
    setFase({ tipo: 'enviado', mensagem });
  }

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    const r = validarFinalizacao(campos);
    setTentativa((t) => t + 1);
    if (!r.ok) return setErros(r.erros);
    setErros({});
    setEnviando(true);
    const agora = new Date().toISOString();
    try {
      const atual = await recarregar();
      seguir(conferirSacola(sacola, atual, agora), r.dados, atual.configuracoes.whatsappNumero);
    } catch {
      // Sem rede: confere contra a vitrine já carregada e avisa o Gustavo de quando ela é.
      seguir(conferirSacola(sacola, vitrine, agora), { ...r.dados, conferidoEm: carregadaEm }, vitrine.configuracoes.whatsappNumero);
    } finally {
      setEnviando(false);
    }
  }

  function seguir(c: ResultadoConferencia, dados: DadosDoPedido, numero: string) {
    if (!c.lojaAberta) return setFase({ tipo: 'pausada' });
    if (c.mudancas.length > 0) {
      substituir(c.sacola);
      return setFase({ tipo: 'mudancas', mudancas: c.mudancas, dados });
    }
    enviarAgora(c.sacola, dados, numero);
  }

  function copiar(mensagem: string) {
    const selecionar = () => {
      const el = blocoMensagem.current;
      if (!el) return;
      const faixa = document.createRange();
      faixa.selectNodeContents(el);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(faixa);
    };
    try {
      navigator.clipboard.writeText(mensagem).then(() => setCopiado(true), selecionar);
    } catch {
      selecionar();
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-[560px] gap-5 px-4 pt-2 pb-10 md:px-0">
      <h1 className="font-titulo text-3xl leading-none uppercase md:text-4xl">Finalizar pedido</h1>

      {fase.tipo === 'enviado' && (
        <section className="grid gap-4" aria-labelledby="titulo-enviado">
          <h2 id="titulo-enviado" ref={(el) => { tituloFase.current = el; }} tabIndex={-1} className="font-titulo text-2xl uppercase focus:outline-none">Pedido enviado</h2>
          <p>Pedido enviado para o WhatsApp? Se não abriu, copie a mensagem.</p>
          <pre ref={blocoMensagem} className="overflow-x-auto border border-linha p-3 font-texto text-sm whitespace-pre-wrap select-all">{fase.mensagem}</pre>
          <button type="button" className={botaoPrincipal} onClick={() => copiar(fase.mensagem)}>Copiar mensagem</button>
          {copiado && <p role="status" className="text-center text-sm text-carpete">Mensagem copiada</p>}
          <button type="button" className={botaoSecundario} onClick={() => { esvaziar(); navigate('/'); }}>Esvaziar sacola</button>
        </section>
      )}

      {fase.tipo === 'pausada' && (
        <p role="alert" ref={(el) => { tituloFase.current = el; }} tabIndex={-1} className="border border-linha p-4 focus:outline-none">
          {AVISO_PAUSADA}{' '}
          <a href={vitrine.configuracoes.instagramUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">Instagram</a>
        </p>
      )}

      {fase.tipo === 'mudancas' && (
        <section className="grid gap-4" aria-labelledby="titulo-mudancas">
          <h2 id="titulo-mudancas" ref={(el) => { tituloFase.current = el; }} tabIndex={-1} className="font-titulo text-2xl uppercase focus:outline-none">Alguns itens mudaram</h2>
          <ul className="grid list-disc gap-1 pl-5 text-branco/90">
            {fase.mudancas.map((m) => <li key={m}>{m}</li>)}
          </ul>
          {sacola.itens.length > 0 ? (
            <>
              <p className="flex justify-between font-rotulo font-semibold uppercase">
                <span>Total das peças</span><span className="tabular-nums">{formatarReais(totalCentavos(sacola))}</span>
              </p>
              <button type="button" className={botaoPrincipal} onClick={() => enviarAgora(sacola, fase.dados)}>Confirmar e enviar</button>
            </>
          ) : (
            <button type="button" className={botaoSecundario} onClick={() => navigate('/')}>Voltar ao início</button>
          )}
        </section>
      )}

      {fase.tipo === 'formulario' && (
        <form noValidate onSubmit={aoEnviar} className="grid gap-5">
          <Campo id="nome" rotulo="Seu nome" erro={erros.nome}>
            <input id="nome" autoComplete="name" value={campos.nome} onChange={(e) => mudar({ nome: e.target.value })} {...descricao('nome', erros.nome)} className={entrada} />
          </Campo>

          <div className="grid gap-2">
            <p id="rotulo-entrega" className={rotulo}>Como você quer receber?</p>
            <div role="radiogroup" aria-labelledby="rotulo-entrega" aria-describedby={erros.tipo ? 'erro-tipo' : undefined} className="grid gap-2">
              <Opcao valor="motoboy" atual={campos.tipo} onEscolher={() => mudar({ tipo: 'motoboy' })}>Motoboy (Capivari de Baixo e região)</Opcao>
              <Opcao valor="envio" atual={campos.tipo} onEscolher={() => mudar({ tipo: 'envio' })}>Envio para o Brasil</Opcao>
            </div>
            {erros.tipo && <p id="erro-tipo" className={textoErro}>{erros.tipo}</p>}
          </div>

          {campos.tipo === 'motoboy' && (
            <Campo id="bairro" rotulo="Bairro" erro={erros.bairro}>
              <input id="bairro" value={campos.bairro} onChange={(e) => mudar({ bairro: e.target.value })} {...descricao('bairro', erros.bairro)} className={entrada} />
            </Campo>
          )}
          {campos.tipo === 'envio' && (
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3">
              <Campo id="cep" rotulo="CEP" erro={erros.cep}>
                <input id="cep" inputMode="numeric" autoComplete="postal-code" maxLength={9} value={campos.cep} onChange={(e) => mudar({ cep: e.target.value })} {...descricao('cep', erros.cep)} className={entrada} />
              </Campo>
              <Campo id="cidade" rotulo="Cidade" erro={erros.cidade}>
                <input id="cidade" autoComplete="address-level2" value={campos.cidade} onChange={(e) => mudar({ cidade: e.target.value })} {...descricao('cidade', erros.cidade)} className={entrada} />
              </Campo>
            </div>
          )}

          <Campo id="observacao" rotulo="Observação (opcional)">
            <textarea id="observacao" rows={3} maxLength={300} value={campos.observacao} onChange={(e) => mudar({ observacao: e.target.value })} className={`${entrada} resize-none`} />
          </Campo>

          <p className="flex justify-between font-rotulo font-semibold uppercase">
            <span>Total das peças</span><span className="tabular-nums">{formatarReais(totalCentavos(sacola))}</span>
          </p>
          <button type="submit" disabled={enviando} className={botaoPrincipal}>Enviar pelo WhatsApp</button>
        </form>
      )}
    </main>
  );
}

const rotulo = 'font-rotulo text-xs font-medium tracking-[0.12em] text-carpete uppercase';
const entrada = 'w-full min-h-11 rounded-[3px] border border-linha bg-transparent px-3 py-2.5 text-base text-branco focus:border-branco focus:outline-none aria-[invalid=true]:border-branco';
const textoErro = 'font-rotulo text-xs tracking-[0.06em] text-branco uppercase';

const descricao = (id: string, erro?: string) =>
  erro ? { 'aria-invalid': true, 'aria-describedby': `erro-${id}` } : {};

function Campo({ id, rotulo: texto, erro, children }: { id: string; rotulo: string; erro?: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <label htmlFor={id} className={rotulo}>{texto}</label>
      {children}
      {erro && <p id={`erro-${id}`} className={textoErro}>{erro}</p>}
    </div>
  );
}

function Opcao({ valor, atual, onEscolher, children }: { valor: string; atual: string; onEscolher(): void; children: string }) {
  return (
    <label className={`flex min-h-11 cursor-pointer items-center gap-3 border px-3 ${atual === valor ? 'border-branco' : 'border-linha'}`}>
      <input type="radio" id={`entrega-${valor}`} name="entrega" value={valor} checked={atual === valor} onChange={onEscolher} className="size-4 accent-branco" />
      <span>{children}</span>
    </label>
  );
}
