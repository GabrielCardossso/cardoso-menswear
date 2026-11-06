import { fonteLocal } from './fonteLocal';

it('carrega o JSON de exemplo com dados consistentes', async () => {
  const v = await fonteLocal.carregar();
  const categorias = new Set(v.categorias.map((c) => c.id));
  const pecas = new Set(v.pecas.map((p) => p.id));
  expect(v.pecas.length).toBeGreaterThanOrEqual(10);
  for (const p of v.pecas) {
    expect(categorias.has(p.categoriaId)).toBe(true);
    expect(Number.isInteger(p.precoCentavos) && p.precoCentavos > 0).toBe(true);
    expect(p.fotos.length).toBeGreaterThan(0);
  }
  for (const k of v.kits) {
    expect(k.pecaIds.length).toBeGreaterThanOrEqual(2);
    expect(k.pecaIds.length).toBeLessThanOrEqual(4);
    expect(k.pecaIds.every((id) => pecas.has(id))).toBe(true);
  }
  expect(v.configuracoes.whatsappNumero).toMatch(/^\d+$/);
});

it('devolve uma cópia nova a cada carga', async () => {
  const a = await fonteLocal.carregar();
  const b = await fonteLocal.carregar();
  expect(a).not.toBe(b);
  expect(a.pecas[0]).not.toBe(b.pecas[0]);
});
