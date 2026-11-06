import { act, render, screen } from '@testing-library/react';
import { CHAVE } from './persistencia';
import { SacolaProvider, useSacola } from './SacolaContext';

function Sonda() {
  const { sacola, adicionar, aberta, abrir } = useSacola();
  return (
    <div>
      <span data-testid="itens">{sacola.itens.length}</span>
      <span data-testid="aberta">{String(aberta)}</span>
      <button onClick={() => adicionar([{ pecaId: 'a', nome: 'Camisa', tamanho: 'M', precoUnitarioCentavos: 8990, quantidade: 1 }])}>add</button>
      <button onClick={abrir}>abrir</button>
    </div>
  );
}

beforeEach(() => localStorage.clear());

it('salva ao mudar e recupera ao remontar', () => {
  const { unmount } = render(<SacolaProvider><Sonda /></SacolaProvider>);
  act(() => screen.getByText('add').click());
  expect(JSON.parse(localStorage.getItem(CHAVE)!).itens).toHaveLength(1);
  unmount();
  render(<SacolaProvider><Sonda /></SacolaProvider>);
  expect(screen.getByTestId('itens')).toHaveTextContent('1');
});

it('abre e fecha a folha', () => {
  render(<SacolaProvider><Sonda /></SacolaProvider>);
  expect(screen.getByTestId('aberta')).toHaveTextContent('false');
  act(() => screen.getByText('abrir').click());
  expect(screen.getByTestId('aberta')).toHaveTextContent('true');
});
