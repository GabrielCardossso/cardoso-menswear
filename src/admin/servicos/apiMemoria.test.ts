import { ErroSessao } from '../tipos';
import { criarApiMemoria } from './apiMemoria';

async function logada() {
  const api = criarApiMemoria();
  await api.entrar('gabriel@exemplo.test', 'qualquer');
  return api;
}

describe('apiMemoria', () => {
  it('parte da vitrine de exemplo', async () => {
    const d = await (await logada()).carregar();
    expect(d.categorias.map((c) => c.slug)).toEqual(['camisetas', 'polos', 'bermudas', 'calcas', 'tenis']);
    expect(d.pecas).toHaveLength(12);
    expect(d.kits).toHaveLength(4);
    expect(d.pecas.every((p) => !p.arquivada)).toBe(true);
  });

  it('entrar: sem sessão, credenciais e sem acesso', async () => {
    const api = criarApiMemoria();
    expect(await api.sessao()).toBeNull();
    await expect(api.carregar()).rejects.toBeInstanceOf(ErroSessao);
    expect(await api.entrar('sem-arroba', 'x')).toBe('credenciais');
    expect(await api.entrar('a@b.com', '')).toBe('credenciais');
    expect(await api.entrar('sem-acesso@x.com', 'x')).toBe('sem-acesso');
    expect(await api.sessao()).toBeNull();
    expect(await api.entrar('gabriel@exemplo.test', 'x')).toBe('ok');
    expect(await api.sessao()).toEqual({ email: 'gabriel@exemplo.test' });
    await api.sair();
    expect(await api.sessao()).toBeNull();
  });

  it('slug livre que não muda ao renomear', async () => {
    const api = await logada();
    const polos = (await api.carregar()).categorias.find((c) => c.slug === 'polos')!;
    const base = { nome: 'Polo preta', descricao: '', categoriaId: polos.id, precoCentavos: 100, tamanhos: { M: true } };
    const a = await api.criarPeca(base);
    const b = await api.criarPeca(base);
    expect([a.slug, b.slug]).toEqual(['polo-preta', 'polo-preta-2']);
    await api.salvarPeca(a.id, { ...base, nome: 'Polo azul' });
    const depois = (await api.carregar()).pecas.find((p) => p.id === a.id)!;
    expect(depois.nome).toBe('Polo azul');
    expect(depois.slug).toBe('polo-preta');
  });

  it('peça nova tem a grade toda, com só os tamanhos dados ligados', async () => {
    const api = await logada();
    const polos = (await api.carregar()).categorias.find((c) => c.slug === 'polos')!;
    const p = await api.criarPeca({ nome: 'Nova', descricao: '', categoriaId: polos.id, precoCentavos: 100, tamanhos: { M: true, ZZ: true } });
    expect(p.tamanhos).toEqual({ P: false, M: true, G: false, GG: false, XG: false });
  });

  it('grade alterada sincroniza as peças', async () => {
    const api = await logada();
    const cat = await api.criarCategoria({ nome: 'Teste', grade: ['P', 'M'], visivel: true });
    const p = await api.criarPeca({ nome: 'X', descricao: '', categoriaId: cat.id, precoCentavos: 100, tamanhos: { M: true } });
    await api.salvarCategoria(cat.id, { nome: 'Teste', grade: ['M', 'G'], visivel: true });
    const depois = (await api.carregar()).pecas.find((x) => x.id === p.id)!;
    expect(depois.tamanhos).toEqual({ M: true, G: false });
  });

  it('excluir categoria só sem peças', async () => {
    const api = await logada();
    const d = await api.carregar();
    expect(await api.excluirCategoria(d.categorias[0].id)).toBe('tem-pecas');
    const nova = await api.criarCategoria({ nome: 'Bonés', grade: ['U'], visivel: true });
    expect(nova.slug).toBe('bones');
    expect(nova.ordem).toBe(6);
    expect(await api.excluirCategoria(nova.id)).toBe('ok');
  });

  it('kit novo nasce oculto e no fim; excluir peça tira do kit', async () => {
    const api = await logada();
    const d = await api.carregar();
    const k = await api.criarKit({ titulo: 'Kit teste', descricao: '', pecaIds: [d.pecas[0].id, d.pecas[1].id] });
    expect(k.publicado).toBe(false);
    expect(k.ordem).toBe(5);
    await api.excluirPeca(d.pecas[0].id);
    const kit = (await api.carregar()).kits.find((x) => x.id === k.id)!;
    expect(kit.pecaIds).toEqual([d.pecas[1].id]);
  });

  it('fotos: enviar vai para o fim, ordenar e excluir', async () => {
    const api = await logada();
    const p = (await api.carregar()).pecas[0];
    const f = await api.enviarFotoPeca(p.id, new Blob(['x'], { type: 'image/webp' }));
    let fotos = (await api.carregar()).pecas[0].fotos;
    expect(fotos.map((x) => x.id)).toEqual([p.fotos[0].id, f.id]);
    await api.ordenarFotosPeca(p.id, [f.id, p.fotos[0].id]);
    fotos = (await api.carregar()).pecas[0].fotos;
    expect(fotos.map((x) => x.id)).toEqual([f.id, p.fotos[0].id]);
    await api.excluirFotoPeca(f);
    expect((await api.carregar()).pecas[0].fotos).toHaveLength(1);
  });

  it('sessão expirada rejeita com ErroSessao até entrar de novo', async () => {
    const api = await logada();
    const { configuracoes } = await api.carregar();
    api.expirarSessao();
    await expect(api.carregar()).rejects.toBeInstanceOf(ErroSessao);
    await expect(api.salvarConfiguracoes({ ...configuracoes, lojaAberta: false })).rejects.toBeInstanceOf(ErroSessao);
    await api.entrar('gabriel@exemplo.test', 'x');
    await expect(api.carregar()).resolves.toBeDefined();
  });

  it('carregar devolve cópias (mexer no resultado não muda a API)', async () => {
    const api = await logada();
    const d = await api.carregar();
    d.pecas[0].nome = 'Mexido';
    expect((await api.carregar()).pecas[0].nome).not.toBe('Mexido');
  });
});
