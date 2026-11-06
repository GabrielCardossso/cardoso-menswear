# Vitrine e sacola (etapas 1 e 2): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vitrine da Cardoso Menswear funcionando no celular: início com kits e "Chegou agora", categorias, página da peça e do kit, sacola persistente e finalização que abre o WhatsApp com a mensagem pronta, lendo peças e kits de um JSON local de exemplo.

**Architecture:** App React no navegador (Vite + TypeScript + Tailwind). Regras (dinheiro, sacola, mensagem, conferência) são funções puras em `src/lib`, `src/sacola` e `src/pedido`, testadas com Vitest; as telas só chamam essas funções. Os dados chegam por uma interface `FonteVitrine`; nesta etapa ela lê `src/vitrine/vitrine-exemplo.json`, e a etapa 3 troca por Supabase sem mexer nas telas.

**Tech Stack:** Node 22, Vite, React 19, TypeScript, React Router (modo biblioteca), Tailwind CSS 4 (`@tailwindcss/vite`), Vitest + Testing Library + jsdom, Playwright (`@playwright/test`), fontes `@fontsource/anton`, `@fontsource/oswald`, `@fontsource/barlow`.

**Spec:** `docs/superpowers/specs/2026-11-05-vitrine-pedidos-design.md` (ler inteiro antes de começar). Referência visual: direção A em https://claude.ai/artifact/2RoN4rJnPgjJswLhsThoP1 (cópia em `docs/direcoes/direcoes.html`, abrir no navegador). Configuração de projeto a copiar como modelo: `../marisa/marisa-lanches/` (`vite.config.ts`, `playwright.config.ts`, `tsconfig*.json`).

## Global Constraints

- Trabalhar e commitar só na `main`; nunca tocar a `producao`.
- Commits no nome do Gabriel (`git config user.name "GabrielCardossso"`, `user.email "gabrielcardossso@gmail.com"`), **sem** linhas `Co-Authored-By` nem `Claude-Session` (regra do `.claude/CLAUDE.md`, vale também para subagentes).
- Versões exatas no `package.json` (sem `^` nem `~`), escolhidas no momento da instalação.
- Celular primeiro: 360 a 430 px de largura; nada rola na horizontal; alvos de toque com pelo menos 44 × 44 px. Desktop: grade de 4 colunas a partir de 1024 px, mesmo fluxo.
- Dinheiro: toda conta em centavos inteiros (`number`); exibição só por `formatarReais` (`Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`, com espaço não separável U+00A0 depois de "R$").
- Nenhum dado do cliente sai do navegador a não ser pela mensagem que ele mesmo envia no WhatsApp. Sem chamadas de rede para gravar nada.
- Cores (tokens em `src/index.css`, `@theme`): `preto #0A0A0A` (fundo), `branco #F2F2F0` (texto e botões), `carpete #8C8A86` (texto secundário), `linha #3A3A38` (bordas), `apagado #4A4A48` (tamanho indisponível). Sem outras cores na interface.
- Fontes (auto-hospedadas via `@fontsource`, sem Google Fonts): `font-titulo` Anton (títulos e nome da peça, caixa alta), `font-rotulo` Oswald 500/600 (rótulos, preços, botões, tamanhos, caixa alta com espaçamento), `font-texto` Barlow 400/500/600 (texto corrido).
- Forma: fotos com raio 3–4 px; botões retos; pílulas (raio cheio) só nas categorias; botões redondos só sobre a foto da peça.
- Logo: copiar `brand/logo/cardoso-nome-branco.svg` para `src/assets/` e `brand/logo/cardoso-logo-avatar.svg` para `public/favicon.svg`; não editar os SVG da marca à mão.
- Textos fixos da interface, exatamente assim: "Sugestão de kit", "Chegou agora", "Ver tudo", "Kits", "Esgotado", "Adicionar à sacola", "Escolha o tamanho", "Sacola", "Sua sacola está vazia", "Ver os kits", "Total das peças", "Finalizar pelo WhatsApp", "Finalizar pedido", "Seu nome", "Como você quer receber?", "Motoboy (Capivari de Baixo e região)", "Envio para o Brasil", "Bairro", "CEP", "Cidade", "Observação (opcional)", "Enviar pelo WhatsApp", "Alguns itens mudaram", "Confirmar e enviar", "Pedido enviado para o WhatsApp? Se não abriu, copie a mensagem.", "Copiar mensagem", "Mensagem copiada", "Esvaziar sacola", "Pedidos pausados no momento. Fale com a gente no Instagram.", "Entrega por motoboy em Capivari de Baixo e região · Enviamos para todo o Brasil", "Não encontramos esta página", "Voltar ao início". Rótulos acessíveis: botão de voltar "Voltar"; sacola "Sacola, N itens" ("1 item" no singular). Kit: "N peças · R$ X" ("1 peça"). Peça em kit: `Faz parte do kit “<título>”`.
- Respeitar `prefers-reduced-motion` (carrossel sem rolagem animada, sem transições de folha).

## Review Focus

1. `localStorage` indisponível, lançando erro ou com dado corrompido/de outro formato: a sacola começa vazia e funciona em memória, sem tela de erro (Task 5).
2. Peça da sacola que foi arquivada, sumiu do JSON ou cujo tamanho saiu da grade / foi desligado: a conferência ao enviar tira a linha e lista a mudança (Task 7).
3. Slug inexistente em `/p/…`, `/k/…`, `/c/…`: tela "Não encontramos esta página" com "Voltar ao início", sem quebrar (Task 8).
4. Nome e observação com quebras de linha, só espaços, emoji, `&`, `#`, `+` ou `%`: a mensagem sai com espaços colapsados e o link do WhatsApp decodifica para o texto exato (Task 6).
5. Somar a mesma peça e tamanho além de 10 (adicionar 7 e depois 5): a linha fica em 10 (Task 4).

---

## Estrutura de arquivos

```
index.html, package.json, vite.config.ts, tsconfig*.json, playwright.config.ts
public/favicon.svg, public/exemplo/*.jpg   fotos de exemplo (docs/referencias/kit-*.jpg)
src/main.tsx, src/App.tsx (rotas), src/index.css (Tailwind + tokens), src/test/setup.ts
src/assets/cardoso-nome-branco.svg
src/lib/dinheiro.ts                 paraCentavos, formatarReais
src/lib/texto.ts                    limparTexto, normalizarCep
src/vitrine/tipos.ts                Categoria, Peca, Kit, Configuracoes, Vitrine, FonteVitrine
src/vitrine/vitrine-exemplo.json    dados de exemplo
src/vitrine/fonteLocal.ts           JSON → Vitrine
src/vitrine/consultas.ts            consultas puras sobre a Vitrine
src/vitrine/VitrineContext.tsx      carrega uma vez, expõe useVitrine
src/sacola/tipos.ts                 ItemDaSacola, Sacola
src/sacola/regras.ts                adicionar, alterar, remover, totais
src/sacola/persistencia.ts          localStorage com expiração
src/sacola/SacolaContext.tsx        provider + useSacola
src/pedido/mensagem.ts              Entrega, DadosDoPedido, montarMensagem, linkWhatsApp, validarFinalizacao
src/pedido/conferencia.ts           conferirSacola
src/components/…                    peças visuais (ver tarefas)
src/pages/Inicio.tsx, Categoria.tsx, Kits.tsx, Peca.tsx, Kit.tsx, Finalizar.tsx, NaoEncontrado.tsx
e2e/fluxo.spec.ts
```

Testes unitários ao lado do arquivo (`*.test.ts(x)`).

---

### Task 1: Projeto base com o visual A

**Files:**
- Create: `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/test/setup.ts`, `src/assets/cardoso-nome-branco.svg`, `public/favicon.svg`, `src/components/IconeSacola.tsx`, `src/components/Cabecalho.tsx`, `src/components/Cabecalho.test.tsx`
- Modify: `.gitignore` (acrescentar `test-results/`, `playwright-report/`)

**Interfaces:**
- Produces: scripts `npm run dev`, `npm run build`, `npm test` (Vitest `run`), `npm run test:e2e`; classes `bg-preto`, `text-branco`, `text-carpete`, `border-linha`, `text-apagado`, `font-titulo`, `font-rotulo`, `font-texto`.
- Produces: `IconeSacola({ quantidade }: { quantidade: number })` (SVG em contorno + selo com o número quando > 0); `Cabecalho({ quantidade, onAbrirSacola }: { quantidade: number; onAbrirSacola: () => void })`.

- [ ] **Step 1:** Criar o projeto Vite React + TypeScript na raiz (sem apagar `brand/`, `docs/`, `.claude/`), com as dependências do Tech Stack. Copiar `vite.config.ts`, `tsconfig*.json` e `playwright.config.ts` da Marisa como ponto de partida. `index.html` com `lang="pt-BR"`, título "Cardoso Menswear", `theme-color` `#0A0A0A`, viewport com `viewport-fit=cover`.
- [ ] **Step 2:** `src/index.css`: `@import "tailwindcss";`, `@theme` com as cores e fontes da seção Global Constraints (`--font-titulo: "Anton", Impact, sans-serif;` `--font-rotulo: "Oswald", "Arial Narrow", sans-serif;` `--font-texto: "Barlow", system-ui, sans-serif;`), `body` em `bg-preto text-branco font-texto`. Importar os pesos das fontes em `main.tsx`. Copiar os SVG da marca.
- [ ] **Step 3:** `IconeSacola`: o desenho aprovado (viewBox 24, traço 1.7, sem nada dentro):

```tsx
<path d="M4.6 8.2h14.8l-1.3 12a1.6 1.6 0 0 1-1.6 1.4H7.5a1.6 1.6 0 0 1-1.6-1.4Z"/>
<path d="M8.8 10.6V6.8a3.2 3.2 0 0 1 6.4 0v3.8"/>
```

  Selo: círculo `branco` com número `preto` em Oswald 700, borda de 2 px `preto`, no canto superior direito.
- [ ] **Step 4: Teste (falha)** em `Cabecalho.test.tsx`:

```tsx
it('mostra a logo e a sacola com a quantidade', async () => {
  const abrir = vi.fn();
  render(<Cabecalho quantidade={2} onAbrirSacola={abrir} />);
  expect(screen.getByRole('img', { name: 'Cardoso Menswear' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Sacola, 2 itens' }));
  expect(abrir).toHaveBeenCalledOnce();
});
it('usa o singular com 1 item', () => {
  render(<Cabecalho quantidade={1} onAbrirSacola={() => {}} />);
  expect(screen.getByRole('button', { name: 'Sacola, 1 item' })).toBeInTheDocument();
});
```

- [ ] **Step 5:** Rodar `npm test` → FAIL; implementar `Cabecalho` (logo à esquerda, altura ~30 px; sacola à direita, botão 44 × 44); `npm test` → PASS; `npm run build` sem erros.
- [ ] **Step 6: Commit** `git add -A && git commit -m "Cria o projeto base com o visual da direção A"`

---

### Task 2: Dinheiro e textos

**Files:**
- Create: `src/lib/dinheiro.ts`, `src/lib/dinheiro.test.ts`, `src/lib/texto.ts`, `src/lib/texto.test.ts`

**Interfaces:**
- Produces: `paraCentavos(valor: number): number` (reais → centavos, arredondado), `formatarReais(centavos: number): string`.
- Produces: `limparTexto(texto: string, max: number): string` (troca qualquer sequência de espaços/quebras por um espaço, apara, corta em `max` caracteres sem partir emoji); `normalizarCep(texto: string): string | null` (8 dígitos → `"88745-000"`, senão `null`).

- [ ] **Step 1: Testes (falham)**

```ts
expect(paraCentavos(89.9)).toBe(8990);
expect(paraCentavos(0.1 + 0.2)).toBe(30);
expect(formatarReais(16980)).toBe('R$ 169,80');
expect(formatarReais(0)).toBe('R$ 0,00');
expect(limparTexto('  posso\n\n pagar   no Pix? ', 300)).toBe('posso pagar no Pix?');
expect(limparTexto('   \n ', 300)).toBe('');
expect(limparTexto('👕'.repeat(5), 3)).toBe('👕👕👕');
expect(normalizarCep('88745000')).toBe('88745-000');
expect(normalizarCep(' 88745-000 ')).toBe('88745-000');
expect(normalizarCep('8874500')).toBeNull();
expect(normalizarCep('abcdefgh')).toBeNull();
```

- [ ] **Step 2:** `npm test` → FAIL. Implementar (`limparTexto` corta por `Array.from(texto)` para respeitar emoji). `npm test` → PASS.
- [ ] **Step 3: Commit** `"Adiciona utilitários de dinheiro e texto"`

---

### Task 3: Vitrine de exemplo e consultas

**Files:**
- Create: `src/vitrine/tipos.ts`, `src/vitrine/vitrine-exemplo.json`, `src/vitrine/fonteLocal.ts`, `src/vitrine/fonteLocal.test.ts`, `src/vitrine/consultas.ts`, `src/vitrine/consultas.test.ts`, `src/vitrine/VitrineContext.tsx`, `public/exemplo/kit-1.jpg` … `kit-6.jpg` (copiados de `docs/referencias/`)

**Interfaces:**
- Produces (tipos):

```ts
type Categoria = { id: string; nome: string; slug: string; grade: string[]; ordem: number };
type Peca = {
  id: string; slug: string; nome: string; descricao: string; categoriaId: string;
  precoCentavos: number; fotos: string[]; // URLs, a primeira é a capa
  tamanhos: Record<string, boolean>;      // rótulo da grade → disponível
  criadoEm: string;                        // ISO
};
type Kit = { id: string; slug: string; titulo: string; descricao: string; foto: string; pecaIds: string[]; ordem: number };
type Configuracoes = { lojaAberta: boolean; whatsappNumero: string; instagramUrl: string; grupoWhatsappUrl: string; textoEntrega: string };
type Vitrine = { categorias: Categoria[]; pecas: Peca[]; kits: Kit[]; configuracoes: Configuracoes };
interface FonteVitrine { carregar(): Promise<Vitrine> }
```

  Só entram na `Vitrine` o que é público (categorias visíveis, peças não arquivadas, kits publicados); filtrar é trabalho da fonte.
- Produces (consultas, em `consultas.ts`): `tamanhosDisponiveis(peca: Peca, categoria: Categoria): string[]` (na ordem da grade, só os ligados e presentes na grade); `estaEsgotada(peca, categoria): boolean`; `pecasDaCategoria(v: Vitrine, slug: string): Peca[] | null` (null = categoria não existe; esgotadas no fim, demais por `criadoEm` decrescente); `chegouAgora(v: Vitrine, n = 12): Peca[]` (não esgotadas, por `criadoEm` decrescente); `pecasDoKit(v, kit): Peca[]` (na ordem do kit, ignorando ids que não existem); `totalDoKit(v, kit): number` (soma das peças não esgotadas, em centavos); `kitsDoInicio(v): Kit[]` (por `ordem`, sem os kits com todas as peças esgotadas); `kitsComPeca(v, pecaId): Kit[]`; `buscarPeca(v, slug)`, `buscarKit(v, slug)`, `categoriaDaPeca(v, peca)`.
- Produces: `fonteLocal: FonteVitrine`; `VitrineProvider` + `useVitrine(): { estado: 'carregando' } | { estado: 'erro' } | { estado: 'pronto'; vitrine: Vitrine; recarregar(): Promise<Vitrine> }`.

- [ ] **Step 1:** Escrever `vitrine-exemplo.json` a partir de `docs/instagram.md` e das fotos: as 5 categorias com as grades da spec (roupa `P, M, G, GG, XG` para Camisetas, Polos, Bermudas; Calças `36…46`; Tênis `37…44`), ~12 peças (camisa dry fit NK preta/branca, camisa fio 30.1 NK, bermuda moletom NK, polo piquet NK, polo piquet LC, camiseta EA7, camisa Mizuno, camisa Quiksilver, calça jogador, bermuda NK), 4 kits (os posts kit-1 a kit-4). Preços de exemplo entre R$ 79,90 e R$ 149,90, alguns tamanhos desligados e **uma peça toda esgotada**. `configuracoes`: `lojaAberta: true`, `whatsappNumero: "5548999999999"`, links do Instagram e do grupo de `docs/instagram.md`. Um campo `"_aviso": "Dados de exemplo: preços e tamanhos não são da loja."` no topo.
- [ ] **Step 2: Testes (falham)** em `consultas.test.ts`, com uma vitrine montada no próprio teste (não o JSON):

```ts
// grade P,M,G,GG; peça com {P:false, M:true, G:true, GG:false, XG:true}
expect(tamanhosDisponiveis(peca, cat)).toEqual(['M', 'G']); // XG não está na grade
expect(estaEsgotada({ ...peca, tamanhos: { P: false } }, cat)).toBe(true);
expect(pecasDaCategoria(v, 'nao-existe')).toBeNull();
expect(pecasDaCategoria(v, 'camisetas')!.at(-1)!.id).toBe('esgotada');
expect(chegouAgora(v).map(p => p.id)).not.toContain('esgotada');
expect(totalDoKit(v, kitComUmaEsgotada)).toBe(8990);
expect(kitsDoInicio(v).map(k => k.id)).not.toContain('kit-todo-esgotado');
expect(pecasDoKit(v, { ...kit, pecaIds: ['a', 'sumiu', 'b'] }).map(p => p.id)).toEqual(['a', 'b']);
```

  E em `fonteLocal.test.ts`: o JSON carrega, toda peça tem `categoriaId` existente, preço inteiro > 0 e pelo menos uma foto; todo kit tem de 2 a 4 peças existentes.
- [ ] **Step 3:** `npm test` → FAIL; implementar tipos, fonte, consultas e o contexto; `npm test` → PASS.
- [ ] **Step 4: Commit** `"Adiciona a vitrine de exemplo e as consultas"`

---

### Task 4: Regras da sacola

**Files:**
- Create: `src/sacola/tipos.ts`, `src/sacola/regras.ts`, `src/sacola/regras.test.ts`

**Interfaces:**
- Produces: tipos `ItemDaSacola` e `Sacola` exatamente como na spec (seção "Sacola"); `QTD_MAX = 10`.
- Produces: `adicionarItens(s: Sacola, novos: ItemDaSacola[], agora: string): Sacola` (mesma `pecaId` + `tamanho` soma na linha existente, limitada a `QTD_MAX`; o `kitId` da linha existente não muda); `alterarQuantidade(s, pecaId, tamanho, quantidade, agora): Sacola` (fica entre 1 e `QTD_MAX`); `removerItem(s, pecaId, tamanho, agora): Sacola`; `totalCentavos(s): number`; `quantidadeDeItens(s): number` (soma das quantidades); `sacolaVazia(agora): Sacola`. Toda alteração atualiza `atualizadoEm`.

- [ ] **Step 1: Testes (falham)**

```ts
let s = adicionarItens(sacolaVazia(T0), [item('a', 'M', 8990, 7)], T1);
s = adicionarItens(s, [item('a', 'M', 8990, 5)], T2);
expect(s.itens).toHaveLength(1);
expect(s.itens[0].quantidade).toBe(10);
expect(s.atualizadoEm).toBe(T2);
s = adicionarItens(s, [item('a', 'G', 8990, 1)], T3);
expect(s.itens).toHaveLength(2);
expect(totalCentavos(s)).toBe(8990 * 11);
expect(quantidadeDeItens(s)).toBe(11);
expect(alterarQuantidade(s, 'a', 'G', 0, T4).itens.find(i => i.tamanho === 'G')!.quantidade).toBe(1);
expect(removerItem(s, 'a', 'M', T4).itens.map(i => i.tamanho)).toEqual(['G']);
```

- [ ] **Step 2:** `npm test` → FAIL; implementar; `npm test` → PASS.
- [ ] **Step 3: Commit** `"Adiciona as regras da sacola"`

---

### Task 5: Sacola persistente

**Files:**
- Create: `src/sacola/persistencia.ts`, `src/sacola/persistencia.test.ts`, `src/sacola/SacolaContext.tsx`, `src/sacola/SacolaContext.test.tsx`

**Interfaces:**
- Consumes: Task 4.
- Produces: `CHAVE = 'cardoso:sacola:v1'`, `EXPIRA_MS = 7 * 24 * 60 * 60 * 1000`; `lerSacola(agora: Date): Sacola`; `salvarSacola(s: Sacola): void`.
- Produces: `SacolaProvider`, `useSacola(): { sacola: Sacola; adicionar(itens: ItemDaSacola[]): void; alterar(pecaId: string, tamanho: string, qtd: number): void; remover(pecaId: string, tamanho: string): void; substituir(s: Sacola): void; esvaziar(): void; aberta: boolean; abrir(): void; fechar(): void }`. Salva a cada mudança.

- [ ] **Step 1: Testes (falham)** em `persistencia.test.ts`:

```ts
it('devolve a sacola salva há menos de 7 dias', ...);       // salvar e ler com agora = +6 dias
it('descarta a sacola parada há mais de 7 dias', ...);       // agora = +7 dias e 1 min → itens []
it('começa vazia com JSON corrompido', ...);                 // localStorage.setItem(CHAVE, '{x')
it('começa vazia com formato diferente', ...);               // {"itens":[{"foo":1}]} → itens []
it('funciona sem localStorage', ...);                        // vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error() }) e o mesmo em setItem: lerSacola não lança e devolve vazia; salvarSacola não lança
```

  Validar cada item lido (tipos dos campos, `quantidade` inteira entre 1 e 10, preço inteiro ≥ 0); um item inválido descarta a sacola inteira.
- [ ] **Step 2:** Teste do contexto: adicionar um item → `localStorage` tem a sacola; remontar o provider → o item continua lá.
- [ ] **Step 3:** `npm test` → FAIL; implementar; `npm test` → PASS.
- [ ] **Step 4: Commit** `"Guarda a sacola no navegador com expiração de 7 dias"`

---

### Task 6: Mensagem do WhatsApp e validação da finalização

**Files:**
- Create: `src/pedido/mensagem.ts`, `src/pedido/mensagem.test.ts`

**Interfaces:**
- Consumes: `formatarReais`, `limparTexto`, `normalizarCep` (Task 2); `Sacola` (Task 4).
- Produces:

```ts
type Entrega = { tipo: 'motoboy'; bairro: string } | { tipo: 'envio'; cep: string; cidade: string };
type DadosDoPedido = { nome: string; entrega: Entrega; observacao: string; conferidoEm?: Date };
type CamposFinalizacao = { nome: string; tipo: 'motoboy' | 'envio' | ''; bairro: string; cep: string; cidade: string; observacao: string };
function validarFinalizacao(c: CamposFinalizacao): { ok: true; dados: DadosDoPedido } | { ok: false; erros: Partial<Record<keyof CamposFinalizacao, string>> };
function montarMensagem(sacola: Sacola, dados: DadosDoPedido): string;
function linkWhatsApp(numero: string, mensagem: string): string; // https://wa.me/<só dígitos>?text=<encodeURIComponent>
```

  Limites (via `limparTexto`): nome, bairro e cidade 60 caracteres; observação 300. Erros: `nome` "Informe seu nome", `tipo` "Escolha como quer receber", `bairro` "Informe o bairro", `cep` "CEP com 8 números", `cidade` "Informe a cidade".

- [ ] **Step 1: Teste (falha) com o texto exato da spec:**

```ts
const s = sacolaCom([
  { pecaId: 'a', nome: 'Camisa dry fit NK (preta)', tamanho: 'G', precoUnitarioCentavos: 8990, quantidade: 1 },
  { pecaId: 'b', nome: 'Bermuda moletom NK', tamanho: 'M', precoUnitarioCentavos: 7990, quantidade: 1 },
]);
expect(montarMensagem(s, { nome: 'João', entrega: { tipo: 'motoboy', bairro: 'Centro' }, observacao: 'posso pagar no Pix?' })).toBe(
`Olá! Fiz este pedido pelo site 🛍️

PEÇAS
• 1x Camisa dry fit NK (preta) — tam. G — R$ 89,90
• 1x Bermuda moletom NK — tam. M — R$ 79,90
Total das peças: R$ 169,80

ENTREGA
Motoboy — bairro Centro

Nome: João
Obs.: posso pagar no Pix?`);
```

  O preço da linha é o subtotal da linha (quantidade × unitário).
- [ ] **Step 2: Mais testes (falham):**
  - envio: linha `Envio para o Brasil — CEP 88745-000, Tubarão`;
  - observação vazia: a mensagem termina em `Nome: João` (sem linha `Obs.:`);
  - `conferidoEm = new Date(2026, 10, 5, 14, 30)`: última linha `(preços conferidos no site em 05/11/2026 às 14:30)`, depois de uma linha em branco;
  - `validarFinalizacao` com nome `'  \n '` → erro em `nome`; tipo `envio` com CEP `'8874500'` → erro em `cep`; observação `'a\n\nb'` → `dados.observacao === 'a b'`;
  - **Review Focus 4:** nome `'Zé & Cia #1 + 50% 👕'` → `decodeURIComponent(new URL(linkWhatsApp('55 (48) 99999-9999', msg)).searchParams.get('text')!) === msg` e o caminho é `/5548999999999`.
- [ ] **Step 3:** `npm test` → FAIL; implementar; `npm test` → PASS.
- [ ] **Step 4: Commit** `"Monta a mensagem do pedido para o WhatsApp"`

---

### Task 7: Conferência ao enviar

**Files:**
- Create: `src/pedido/conferencia.ts`, `src/pedido/conferencia.test.ts`

**Interfaces:**
- Consumes: `Vitrine`, consultas (Task 3); `Sacola` (Task 4); `formatarReais`.
- Produces: `conferirSacola(sacola: Sacola, vitrine: Vitrine, agora: string): { sacola: Sacola; mudancas: string[]; lojaAberta: boolean }`.

  Regras, na ordem dos itens: peça que não está mais na vitrine → sai, mudança `"<nome> saiu da loja"`; tamanho fora da grade ou desligado → sai, `"<nome> tam. <t> esgotou"`; preço diferente → linha fica com o preço novo, `"<nome> passou de <antigo> para <novo>"` (nome atualizado se mudou, mensagem com o nome guardado). Sem mudanças, a sacola volta igual (mesma referência).

- [ ] **Step 1: Testes (falham)** cobrindo cada regra, a combinação delas, e:

```ts
expect(conferirSacola(s, vitrineComPrecoNovo, T).mudancas).toEqual(['Camisa dry fit NK passou de R$ 89,90 para R$ 99,90']);
expect(conferirSacola(s, vitrineSemMudanca, T).sacola).toBe(s);
expect(conferirSacola(s, { ...v, configuracoes: { ...v.configuracoes, lojaAberta: false } }, T).lojaAberta).toBe(false);
```

- [ ] **Step 2:** `npm test` → FAIL; implementar; `npm test` → PASS.
- [ ] **Step 3: Commit** `"Confere preços e tamanhos antes de enviar o pedido"`

---

### Task 8: Rotas e início

**Files:**
- Create: `src/pages/Inicio.tsx`, `src/pages/Inicio.test.tsx`, `src/pages/NaoEncontrado.tsx`, `src/components/PilulasCategorias.tsx`, `src/components/CarrosselKits.tsx`, `src/components/CartaoPeca.tsx`, `src/components/Rodape.tsx`, `src/components/Layout.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`

**Interfaces:**
- Consumes: `useVitrine`, consultas (Task 3); `useSacola` (Task 5); `Cabecalho` (Task 1).
- Produces: rotas `/`, `/kits`, `/c/:slug`, `/p/:slug`, `/k/:slug`, `/finalizar`, `*`; `Layout` (cabeçalho + conteúdo + rodapé + folha da sacola montada na Task 12); `CartaoPeca({ peca, categoria })` (foto 3:4, nome, preço, tamanhos `"P · M · G"`, apagado com "Esgotado" quando esgotada; link para `/p/:slug`); `PilulasCategorias({ ativa?: string })` ("Kits" primeiro, depois categorias por `ordem`; rolagem lateral).
- Carregando: esqueleto em `preto` com blocos `linha`; erro: "Não foi possível carregar a vitrine." com botão "Tentar de novo".

- [ ] **Step 1: Testes (falham)** em `Inicio.test.tsx` com uma vitrine de teste injetada pelo provider:
  - mostra "Sugestão de kit" e o título do primeiro kit de `kitsDoInicio`, com `"2 peças · R$ 169,80"`;
  - "Chegou agora" lista até 12 peças e não mostra a esgotada;
  - pílula "Kits" leva a `/kits`; pílula de categoria leva a `/c/<slug>`;
  - rodapé com "Entrega por motoboy em Capivari de Baixo e região · Enviamos para todo o Brasil" e links para `instagramUrl` e `grupoWhatsappUrl` das configurações;
  - **Review Focus 3:** renderizar o app em `/p/nao-existe`, `/k/nao-existe` e `/c/nao-existe` → "Não encontramos esta página" e link "Voltar ao início" para `/`.
- [ ] **Step 2:** `npm test` → FAIL; implementar (carrossel com `scroll-snap`, cartões 4:4.4 como na direção A, pontinhos de posição); `npm test` → PASS.
- [ ] **Step 3:** Conferir no navegador (`npm run dev`, 390 × 844) contra a primeira tela da direção A.
- [ ] **Step 4: Commit** `"Adiciona as rotas e a tela de início"`

---

### Task 9: Categoria e lista de kits

**Files:**
- Create: `src/pages/Categoria.tsx`, `src/pages/Categoria.test.tsx`, `src/pages/Kits.tsx`, `src/components/CartaoKit.tsx`

**Interfaces:**
- Consumes: `pecasDaCategoria`, `CartaoPeca`, `PilulasCategorias` (Tasks 3 e 8).
- Produces: `CartaoKit({ kit })` (foto, "Sugestão de kit", título, `"N peças · R$ X"`), usado em `/kits` e reaproveitável no carrossel.

- [ ] **Step 1: Testes (falham):** `/c/camisetas` mostra o nome da categoria como título, a peça esgotada por último com "Esgotado", e a pílula da categoria marcada (`aria-current="page"`); `/kits` lista os kits de `kitsDoInicio` em grade.
- [ ] **Step 2:** `npm test` → FAIL; implementar (2 colunas, 4 a partir de 1024 px); `npm test` → PASS.
- [ ] **Step 3: Commit** `"Adiciona a página de categoria e a lista de kits"`

---

### Task 10: Página da peça

**Files:**
- Create: `src/pages/Peca.tsx`, `src/pages/Peca.test.tsx`, `src/components/GaleriaFotos.tsx`, `src/components/GradeTamanhos.tsx`, `src/components/BotaoRedondo.tsx`

**Interfaces:**
- Consumes: `buscarPeca`, `categoriaDaPeca`, `tamanhosDisponiveis`, `kitsComPeca`; `useSacola().adicionar`.
- Produces: `GradeTamanhos({ grade, disponiveis, escolhido, onEscolher })` (quadrados 44 × 44; escolhido `bg-branco text-preto`; indisponível `text-apagado line-through`, `disabled`); `BotaoRedondo` (círculo 36 px visível, área de toque 44, fundo `rgba(10,10,10,.62)`).

- [ ] **Step 1: Testes (falham):**
  - mostra categoria, nome, preço e descrição;
  - botão "Voltar" (canto superior esquerdo, sobre a foto) volta para a página anterior, ou para `/` se a peça foi aberta direto pelo link;
  - botão da sacola sobre a foto abre a sacola;
  - tamanho indisponível está desabilitado;
  - "Adicionar à sacola" sem tamanho mostra "Escolha o tamanho" e não adiciona; com `M` escolhido e quantidade 2 adiciona `{ tamanho: 'M', quantidade: 2, precoUnitarioCentavos: preço atual }`;
  - peça em kit mostra `Faz parte do kit “<título>”` com link para `/k/<slug>`;
  - peça esgotada: botão desabilitado com "Esgotado".
- [ ] **Step 2:** `npm test` → FAIL; implementar (galeria com `scroll-snap` e pontinhos; botão principal fixo embaixo com `env(safe-area-inset-bottom)`); `npm test` → PASS.
- [ ] **Step 3:** Conferir no navegador contra a segunda tela da direção A.
- [ ] **Step 4: Commit** `"Adiciona a página da peça"`

---

### Task 11: Página do kit

**Files:**
- Create: `src/pages/Kit.tsx`, `src/pages/Kit.test.tsx`

**Interfaces:**
- Consumes: `buscarKit`, `pecasDoKit`, `estaEsgotada`, `GradeTamanhos`, `useSacola().adicionar`.

- [ ] **Step 1: Testes (falham):**
  - todas as peças começam marcadas, menos a esgotada (desmarcada, travada, com "Esgotado");
  - "Adicionar à sacola" fica desabilitado enquanto alguma peça marcada não tem tamanho;
  - o total no botão muda ao desmarcar uma peça;
  - com tudo desmarcado, o botão fica desabilitado;
  - ao adicionar, só as peças marcadas entram, cada uma com seu tamanho, quantidade 1 e `kitId` do kit;
  - kit com todas as peças esgotadas abre com tudo travado e botão desabilitado.
- [ ] **Step 2:** `npm test` → FAIL; implementar; `npm test` → PASS.
- [ ] **Step 3: Commit** `"Adiciona a página do kit"`

---

### Task 12: Folha da sacola

**Files:**
- Create: `src/components/FolhaSacola.tsx`, `src/components/FolhaSacola.test.tsx`
- Modify: `src/components/Layout.tsx`

**Interfaces:**
- Consumes: `useSacola`, `totalCentavos`, `QTD_MAX`; `useVitrine` (para a foto da peça; sem foto, quadrado `linha`).

- [ ] **Step 1: Testes (falham):**
  - sacola vazia: "Sua sacola está vazia" e "Ver os kits" (vai para `/kits` e fecha a folha);
  - cada linha mostra nome, `tam. M`, preço unitário, − e +, remover e subtotal; − desabilitado em 1; + desabilitado em 10;
  - "Total das peças" com a soma; "Finalizar pelo WhatsApp" vai para `/finalizar` e fecha a folha;
  - com `lojaAberta: false`, no lugar do botão aparece "Pedidos pausados no momento. Fale com a gente no Instagram." com link para o Instagram;
  - Esc e o botão de fechar fecham a folha; o foco volta para o botão da sacola.
- [ ] **Step 2:** `npm test` → FAIL; implementar (painel que sobe do rodapé, `role="dialog"` com `aria-modal`, título "Sacola"); `npm test` → PASS.
- [ ] **Step 3: Commit** `"Adiciona a folha da sacola"`

---

### Task 13: Finalizar e abrir o WhatsApp

**Files:**
- Create: `src/pages/Finalizar.tsx`, `src/pages/Finalizar.test.tsx`

**Interfaces:**
- Consumes: `validarFinalizacao`, `montarMensagem`, `linkWhatsApp` (Task 6); `conferirSacola` (Task 7); `useVitrine().recarregar` (Task 3); `useSacola` (Task 5).

  Ao tocar em "Enviar pelo WhatsApp": validar; chamar `recarregar()`; se der certo, `conferirSacola`; se `lojaAberta` for falso, mostrar o aviso de loja pausada e não enviar; se houver mudanças, `substituir` a sacola e mostrar "Alguns itens mudaram" com a lista e "Confirmar e enviar"; sem mudanças (ou depois de confirmar), montar a mensagem e abrir o link com `window.location.assign(link)`. Se `recarregar()` falhar, montar a mensagem com `conferidoEm` = hora em que a sacola foi carregada da vitrine pela última vez (guardar no estado da página ao abrir) e enviar. Depois de abrir: mostrar "Pedido enviado para o WhatsApp? Se não abriu, copie a mensagem.", a mensagem num bloco selecionável, "Copiar mensagem" (`navigator.clipboard.writeText`; sucesso mostra "Mensagem copiada"; falha seleciona o texto) e "Esvaziar sacola" (esvazia e vai para `/`). Sacola vazia em `/finalizar` redireciona para `/`.

- [ ] **Step 1: Testes (falham)** com `window.location.assign` substituído por `vi.fn()`:
  - campos "Seu nome", "Como você quer receber?" com as duas opções; Motoboy mostra "Bairro"; Envio mostra "CEP" e "Cidade";
  - enviar vazio mostra os erros da Task 6 ao lado dos campos e não chama `assign`;
  - caminho feliz: `assign` recebe `https://wa.me/5548999999999?text=…` cuja mensagem decodificada começa com `Olá! Fiz este pedido pelo site 🛍️` e contém `Motoboy — bairro Centro`;
  - preço mudou entre abrir e enviar: aparece "Alguns itens mudaram" com a frase da Task 7; `assign` só é chamado depois de "Confirmar e enviar", com o preço novo;
  - `recarregar` rejeita: `assign` é chamado e a mensagem termina com a linha `(preços conferidos no site em …)`;
  - loja pausada na conferência: aviso aparece e `assign` não é chamado;
  - depois de enviar, "Esvaziar sacola" esvazia e navega para `/`.
- [ ] **Step 2:** `npm test` → FAIL; implementar (formulário com `id` estável em cada campo, teclado numérico no CEP com `inputMode="numeric"`, botão principal fixo embaixo); `npm test` → PASS.
- [ ] **Step 3: Commit** `"Finaliza o pedido abrindo o WhatsApp com a mensagem pronta"`

---

### Task 14: Fluxo completo no navegador

**Files:**
- Create: `e2e/fluxo.spec.ts`
- Modify: `README.md` (como rodar, endereços, aviso de dados de exemplo)

- [ ] **Step 1:** Teste Playwright em 390 × 844 (config da Marisa): abrir `/`; tocar no primeiro kit; escolher tamanhos; "Adicionar à sacola"; abrir uma peça por "Chegou agora", escolher tamanho, adicionar; abrir a sacola e conferir o total; "Finalizar pelo WhatsApp"; preencher nome, Motoboy, bairro; interceptar a navegação para `wa.me` com `page.route('https://wa.me/**', r => r.abort())` e capturar a URL; conferir que a mensagem decodificada tem as peças, os tamanhos e o total; recarregar a página e conferir que a sacola continua. Conferir também que `document.documentElement.scrollWidth <= 390` em `/`, `/c/camisetas`, uma peça e um kit.
- [ ] **Step 2:** `npm run test:e2e` → PASS; `npm test` → PASS; `npm run build` → sem erros.
- [ ] **Step 3:** Atualizar o `README.md` (comandos como na Marisa: `npm install`, `npm run dev` em http://localhost:5173, `npm test`, `npm run test:e2e`; endereços `/`, `/kits`, `/c/:slug`, `/p/:slug`, `/k/:slug`, `/finalizar`; aviso de que os produtos e o número do WhatsApp são de exemplo até a etapa 3).
- [ ] **Step 4: Commit** `"Adiciona teste do fluxo completo e instruções de uso"`

---

## Próximos planos

- **Etapa 3 (Supabase):** esquema, RLS, Storage e carga inicial a partir de `vitrine-exemplo.json`; `FonteVitrine` do Supabase no lugar da local. Começa com o Gabriel criando os projetos e o token da CLI.
- **Etapa 4 (painel admin)** e **etapa 5 (prévia dos links e publicação na Vercel)**, cada uma com plano próprio.
