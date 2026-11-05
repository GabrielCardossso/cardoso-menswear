import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderizarApp } from '../test/renderizar';

beforeEach(() => localStorage.clear());

it('tem setas para quem usa mouse, que rolam o carrossel', async () => {
  const rolar = vi.fn();
  Element.prototype.scrollBy = rolar as unknown as Element['scrollBy'];
  renderizarApp('/');
  await userEvent.click(await screen.findByRole('button', { name: 'Próximos kits' }));
  expect(rolar).toHaveBeenLastCalledWith(expect.objectContaining({ left: expect.any(Number) }));
  expect(rolar.mock.lastCall![0].left).toBeGreaterThanOrEqual(0);
  await userEvent.click(screen.getByRole('button', { name: 'Kits anteriores' }));
  expect(rolar.mock.lastCall![0].left).toBeLessThanOrEqual(0);
});
