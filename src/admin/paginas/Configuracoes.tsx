import { useState, type FormEvent } from 'react';
import { useDadosAdmin } from '../AdminContext';
import Botao from '../componentes/Botao';
import Campo, { CampoTexto } from '../componentes/Campo';
import Titulo from '../componentes/Titulo';
import { validarWhatsapp } from '../regras';

export default function Configuracoes() {
  const { api, dados, email, recarregar, tratarErro, sair } = useDadosAdmin();
  const c = dados.configuracoes;
  const [whatsapp, setWhatsapp] = useState(c.whatsappNumero);
  const [instagram, setInstagram] = useState(c.instagramUrl);
  const [grupo, setGrupo] = useState(c.grupoWhatsappUrl);
  const [entrega, setEntrega] = useState(c.textoEntrega);
  const [erroWhats, setErroWhats] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (ocupado) return;
    setAviso('');
    const numero = validarWhatsapp(whatsapp);
    if (!numero) {
      setErroWhats('Use só números, com 55 e DDD.');
      return;
    }
    setErroWhats('');
    setOcupado(true);
    try {
      await api.salvarConfiguracoes({
        lojaAberta: c.lojaAberta,
        whatsappNumero: numero,
        instagramUrl: instagram.trim(),
        grupoWhatsappUrl: grupo.trim(),
        textoEntrega: entrega.trim(),
      });
      setWhatsapp(numero);
      await recarregar();
      setAviso('Salvo.');
    } catch (err) {
      setAviso(tratarErro(err));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <main className="grid max-w-xl gap-6">
      <Titulo>Ajustes</Titulo>
      <form onSubmit={salvar} noValidate className="grid gap-4">
        <Campo
          rotulo="WhatsApp dos pedidos"
          inputMode="tel"
          autoComplete="off"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          erro={erroWhats}
          dica="Com 55 e DDD, ex.: 55 48 99999-9999. Os pedidos do site chegam neste número."
        />
        <Campo rotulo="Link do Instagram" type="url" inputMode="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
        <Campo rotulo="Link do grupo de WhatsApp" type="url" inputMode="url" value={grupo} onChange={(e) => setGrupo(e.target.value)} />
        <CampoTexto rotulo="Texto de entrega" value={entrega} onChange={(e) => setEntrega(e.target.value)} dica="Aparece no rodapé do site." />
        <div className="flex flex-wrap items-center gap-3">
          <Botao type="submit" variante="principal" ocupado={ocupado}>
            Salvar
          </Botao>
          {aviso && <p role="status">{aviso}</p>}
        </div>
      </form>

      <section className="grid justify-items-start gap-2 border-t border-linha pt-5">
        {email && <p className="text-sm text-carpete">Conectado como {email}</p>}
        <Botao onClick={() => void sair()}>Sair</Botao>
      </section>
    </main>
  );
}
