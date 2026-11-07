# Painel do Gustavo (etapa 4): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Em `/admin`, o Gustavo entra com e-mail e senha e mantém pelo celular, sem mexer em código: peças (com fotos e tamanhos), kits, categorias, configurações e o interruptor "Loja aberta / pausada".

**Architecture:** O painel é uma parte separada do app, carregada só em `/admin` (`React.lazy`), com seu próprio cliente do Supabase **com sessão** (a vitrine continua com o cliente sem sessão da etapa 3). As telas falam com uma interface `ApiAdmin`; há duas implementações: `apiSupabase` (banco real) e `apiMemoria` (em memória, usada nos testes, no e2e e no `npm run dev` sem `.env.local`). Regras puras (slug, preço, validações, resumo) ficam num arquivo testado sem tela. A sincronização dos tamanhos com a grade fica no banco, em gatilhos.

**Tech Stack:** o das etapas 1–3 (React 19, react-router 8, Tailwind 4, Vitest, Playwright, `@supabase/supabase-js`). Sem biblioteca de formulário nem de estado.

**Spec:** `docs/superpowers/specs/2026-11-05-vitrine-pedidos-design.md`, seções "Painel administrativo (`/admin`)", "Peças, tamanhos e cores", "Kits", "Banco de dados", "Visual" e "Restrições" (admin tem que funcionar no celular). Plano anterior: `docs/superpowers/plans/2026-11-05-supabase.md`.

## Global Constraints

- Commitar só na `main`, no nome do Gabriel (`GabrielCardossso <gabrielcardossso@gmail.com>`), **sem** `Co-Authored-By` nem `Claude-Session`.
- Navegador: painel do Supabase e telas do `localhost` pela extensão Claude in Chrome, no navegador com `onThisComputer: true`, conferindo a conta ("GabrielCardossso's Org"). Nunca o navegador interno.
- **Senhas:** o Claude não cria, não digita e não lê senha. A conta de admin é criada pelo Gabriel no painel do Supabase e o login no `localhost` é digitado por ele. Nenhuma senha no código, no repositório ou no chat.
- **Um banco só:** todo dado criado para testar (peça, kit, categoria, foto) tem nome começando com `Teste` e slug com `teste-`, e é apagado no mesmo passo. Conta de teste não existe.
- Migrações só somam (o teste de `src/integracao/migracoes.test.ts` já barra `drop`, `rename`, `truncate`).
- Celular primeiro: toda tela do admin funciona em 360–430 px sem rolagem para o lado; alvos de toque com no mínimo 44 px (`min-h-11`).
- Visual da direção A: fundo `preto`, texto `branco`, secundário `carpete`, linhas `linha`; Oswald em rótulos e botões (caixa alta), Barlow no texto, botões retos; botão principal branco com texto preto.
- Textos da interface em português do Brasil, frases curtas. Dinheiro sempre por `formatarReais`; entrada de preço por `lerPreco` (Task 2).
- A vitrine não muda de comportamento: os 132 testes atuais continuam passando.

## Review Focus

1. **Sessão expirada no meio de uma edição** (o Gustavo deixa o celular aberto e salva horas depois): a gravação falha com erro de sessão, o painel volta ao login com "Sua sessão expirou. Entre de novo." e nada fica pela metade (Task 5).
2. **Toque duplo em "Salvar" no 4G lento:** o botão fica desativado e mostra "Salvando…" até a resposta; nunca cria duas peças (Task 7).
3. **Foto que o navegador não lê** (HEIC num Android, arquivo que não é imagem) **ou muito grande:** mensagem "Não foi possível ler esta foto." e nada é enviado; foto grande é reduzida a 1600 px no lado maior antes de enviar (Task 8).
4. **Preço digitado do jeito brasileiro** ("89,90", "R$ 89,90", "1.299,90", "89"): vira centavos certos; "abc", vazio ou negativo é recusado com mensagem no campo (Task 2).
5. **Grade da categoria alterada com peças cadastradas:** tamanhos que saíram somem das peças, os novos entram desligados, e a tela avisa antes de salvar quais tamanhos as peças vão perder (Tasks 1 e 10).

---

## Estrutura de arquivos

```
supabase/migrations/20261106130000_tamanhos_sincronizados.sql   gatilhos da grade
src/admin/tipos.ts                  tipos do painel e a interface ApiAdmin
src/admin/regras.ts                 slug, preço, validações, resumo, medidas da foto (puro)
src/admin/servicos/apiMemoria.ts    ApiAdmin em memória
src/admin/servicos/apiSupabase.ts   ApiAdmin no Supabase
src/admin/servicos/escolherApi.ts   qual ApiAdmin usar pelo ambiente
src/admin/servicos/reduzirFoto.ts   reduz e converte para WebP no navegador
src/admin/AdminContext.tsx          provedor: api, dados carregados, sessão
src/admin/AdminApp.tsx              rotas /admin/*, guarda de sessão, layout
src/admin/componentes/*.tsx         Campo, Botao, Interruptor, Confirmar, BarraAdmin
src/admin/paginas/*.tsx             Entrar, VisaoGeral, Pecas, PecaForm, Kits, KitForm, Categorias, Configuracoes
src/admin/test/renderizarAdmin.tsx  monta o admin com apiMemoria nos testes
e2e/admin.spec.ts                   fluxo do admin no celular (modo e2e, apiMemoria)
```

---

### Task 1: Tamanhos acompanham a grade (banco)

**Files:**
- Create: `supabase/migrations/20261106130000_tamanhos_sincronizados.sql`
- Modify: `src/integracao/migracoes.test.ts`

**Interfaces:**
- Produces (no banco):
  - `public.sincronizar_tamanhos(p_peca_id uuid)`: apaga de `peca_tamanhos` os tamanhos da peça que não estão na grade da categoria dela e insere os que faltam com `disponivel = false`. `language plpgsql security invoker set search_path = ''`.
  - Gatilho `after insert or update of categoria_id on public.pecas` → `sincronizar_tamanhos(new.id)`.
  - Gatilho `after update of grade on public.categorias` → sincroniza todas as peças da categoria.
  - `revoke execute on function public.sincronizar_tamanhos(uuid) from public, anon` e `grant execute … to authenticated` (a função de gatilho a chama com o papel de quem gravou, e chamar uma função de dentro de outra exige EXECUTE); as funções de gatilho com `revoke execute … from public, anon, authenticated` (gatilho não precisa de EXECUTE).
- Consequência para as tasks seguintes: **peça nova já nasce com todos os tamanhos da grade, desligados**; a API só faz `update`/`upsert` do `disponivel`.

- [ ] **Step 1: Teste (falha)** em `migracoes.test.ts`: existe `create function public.sincronizar_tamanhos`, com `security invoker` e `set search_path = ''`; existem os dois `create trigger` (em `pecas` e em `categorias`); há `revoke execute` para cada função nova e `grant execute on function public.sincronizar_tamanhos(uuid) to authenticated`.
- [ ] **Step 2:** `npx vitest run src/integracao/migracoes.test.ts` → FAIL. Escrever a migração → PASS.
- [ ] **Step 3: Commit** `"Faz os tamanhos das peças acompanharem a grade da categoria"`. (Aplicação no banco e verificação real na Task 12.)

---

### Task 2: Regras do painel (puras)

**Files:**
- Create: `src/admin/regras.ts`, `src/admin/regras.test.ts`, `src/admin/tipos.ts`

**Interfaces:**
- Produces em `tipos.ts`:

```ts
export type FotoPeca = { id: string; path: string; ordem: number };
export type CategoriaAdmin = { id: string; nome: string; slug: string; grade: string[]; ordem: number; visivel: boolean };
export type PecaAdmin = {
  id: string; slug: string; nome: string; descricao: string; categoriaId: string;
  precoCentavos: number; arquivada: boolean; fotos: FotoPeca[]; tamanhos: Record<string, boolean>; criadoEm: string;
};
export type KitAdmin = { id: string; slug: string; titulo: string; descricao: string; fotoPath: string | null; publicado: boolean; ordem: number; pecaIds: string[] };
export type DadosAdmin = { categorias: CategoriaAdmin[]; pecas: PecaAdmin[]; kits: KitAdmin[]; configuracoes: Configuracoes };
export type DadosPeca = { nome: string; descricao: string; categoriaId: string; precoCentavos: number; tamanhos: Record<string, boolean> };
export type DadosKit = { titulo: string; descricao: string; pecaIds: string[] };
export type DadosCategoria = { nome: string; grade: string[]; visivel: boolean };
export class ErroSessao extends Error {}
// ApiAdmin: Task 3.
```

- Produces em `regras.ts`:
  - `gerarSlug(texto: string): string`: sem acento, minúsculas, tudo que não é `a-z0-9` vira `-`, sem `-` repetido nem nas pontas; vazio vira `'peca'`.
  - `slugLivre(base: string, usados: ReadonlySet<string>): string`: `base`, ou `base-2`, `base-3`…
  - `lerPreco(texto: string): number | null`: centavos, ou `null` se inválido.
  - `validarPeca(d: DadosPeca): Record<string, string>` (campo → mensagem; vazio = válido). Foto não é exigida para salvar: a lista marca "Sem foto" (Task 7).
  - `validarKit(d: DadosKit): Record<string, string>`.
  - `lerGrade(texto: string): string[]`: separa por vírgula ou espaço, apara, tira repetidos, mantém a ordem.
  - `validarCategoria(d: DadosCategoria): Record<string, string>`.
  - `tamanhosPerdidos(gradeAntiga: string[], gradeNova: string[], pecas: PecaAdmin[]): string[]`: tamanhos que saem da grade e que alguma peça tinha ligado.
  - `medidasReduzidas(largura: number, altura: number, max = 1600): { largura: number; altura: number }`.
  - `resumoGeral(d: DadosAdmin): { pecasAtivas: number; esgotadas: PecaAdmin[]; kitsComEsgotada: KitAdmin[] }`: considera só peças não arquivadas; esgotada = nenhum tamanho da grade ligado; kit com esgotada = kit que tem ao menos uma peça esgotada ou arquivada.
  - `validarWhatsapp(texto: string): string | null`: devolve só os dígitos se tiver 12 ou 13 dígitos começando com `55`; senão `null`.

- [ ] **Step 1: Testes (falham)** com estes valores exatos:

```ts
expect(gerarSlug('Calça Jogger Preta')).toBe('calca-jogger-preta');
expect(gerarSlug('  Polo  LC — preta!! ')).toBe('polo-lc-preta');
expect(gerarSlug('***')).toBe('peca');
expect(slugLivre('polo', new Set(['polo', 'polo-2']))).toBe('polo-3');
expect(lerPreco('89,90')).toBe(8990);
expect(lerPreco('R$ 89,90')).toBe(8990);
expect(lerPreco('1.299,90')).toBe(129990);
expect(lerPreco('89')).toBe(8900);
expect(lerPreco('89.9')).toBe(8990);
for (const x of ['', 'abc', '-5', '0,999', '89,9,0']) expect(lerPreco(x)).toBeNull();
expect(lerGrade('P, M,G  GG, M')).toEqual(['P', 'M', 'G', 'GG']);
expect(medidasReduzidas(4000, 3000)).toEqual({ largura: 1600, altura: 1200 });
expect(medidasReduzidas(800, 600)).toEqual({ largura: 800, altura: 600 });
expect(validarWhatsapp('(48) 99999-9999')).toBeNull();          // sem 55
expect(validarWhatsapp('+55 48 99999-9999')).toBe('5548999999999');
```

  Mais: `validarPeca` exige nome (1–80 caracteres, "Escreva o nome da peça."), categoria ("Escolha a categoria.") e preço > 0 ("Preço inválido."); `validarKit` exige título e de 2 a 4 peças sem repetir ("Escolha de 2 a 4 peças."); `validarCategoria` exige nome e grade com ao menos 1 tamanho; `tamanhosPerdidos(['P','M','G'], ['M','G','GG'], [peça com P ligado])` → `['P']`; `resumoGeral` com uma peça arquivada esgotada não a conta.
- [ ] **Step 2:** `npx vitest run src/admin/regras.test.ts` → FAIL; implementar; → PASS.
- [ ] **Step 3: Commit** `"Adiciona as regras do painel"`

---

### Task 3: ApiAdmin e a versão em memória

**Files:**
- Modify: `src/admin/tipos.ts`
- Create: `src/admin/servicos/apiMemoria.ts`, `src/admin/servicos/apiMemoria.test.ts`

**Interfaces:**
- Produces em `tipos.ts`:

```ts
export interface ApiAdmin {
  sessao(): Promise<{ email: string } | null>;
  /** 'credenciais': e-mail ou senha errados; 'sem-acesso': conta existe mas não está em `admins` (e a sessão é encerrada). */
  entrar(email: string, senha: string): Promise<'ok' | 'credenciais' | 'sem-acesso'>;
  sair(): Promise<void>;
  carregar(): Promise<DadosAdmin>;
  criarPeca(d: DadosPeca): Promise<PecaAdmin>;            // slug = slugLivre(gerarSlug(nome)); nunca muda depois
  salvarPeca(id: string, d: DadosPeca): Promise<void>;
  arquivarPeca(id: string, arquivada: boolean): Promise<void>;
  excluirPeca(id: string): Promise<void>;                  // apaga também as fotos do Storage
  enviarFotoPeca(pecaId: string, foto: Blob): Promise<FotoPeca>;   // vai para o fim da ordem
  ordenarFotosPeca(pecaId: string, fotoIds: string[]): Promise<void>;
  excluirFotoPeca(foto: FotoPeca): Promise<void>;
  criarKit(d: DadosKit): Promise<KitAdmin>;               // nasce oculto, no fim da ordem
  salvarKit(id: string, d: DadosKit): Promise<void>;
  publicarKit(id: string, publicado: boolean): Promise<void>;
  excluirKit(id: string): Promise<void>;                   // apaga a foto do kit, se houver
  enviarFotoKit(kitId: string, foto: Blob): Promise<string>; // devolve o path; substitui a anterior
  removerFotoKit(kitId: string): Promise<void>;
  ordenarKits(kitIds: string[]): Promise<void>;
  criarCategoria(d: DadosCategoria): Promise<CategoriaAdmin>;
  salvarCategoria(id: string, d: DadosCategoria): Promise<void>;
  ordenarCategorias(ids: string[]): Promise<void>;
  excluirCategoria(id: string): Promise<'ok' | 'tem-pecas'>;
  salvarConfiguracoes(c: Configuracoes): Promise<void>;
  urlDaFoto(path: string): string;
}
```

  Toda falha de rede ou do banco rejeita com `Error`; sessão expirada ou ausente rejeita com `ErroSessao`.
- Produces: `criarApiMemoria(inicial?: DadosAdmin): ApiAdmin & { expirarSessao(): void }`. Sem `inicial`, parte da vitrine de exemplo (`vitrine-exemplo.json` convertida: tudo visível, publicado, não arquivado). `entrar` aceita qualquer e-mail com `@` e senha não vazia (não existe senha de verdade nela), exceto e-mail começando com `sem-acesso@` → `'sem-acesso'`. Imita os gatilhos da Task 1 (peça nova com a grade toda desligada; grade alterada sincroniza). Fotos guardadas como `URL.createObjectURL` quando houver, path `memoria/<id>`. `expirarSessao()` faz toda chamada seguinte rejeitar com `ErroSessao` até `entrar` de novo.

- [ ] **Step 1: Testes (falham)** em `apiMemoria.test.ts`: criar duas peças "Polo preta" → slugs `polo-preta` e `polo-preta-2`; peça nova tem `tamanhos` com todas as chaves da grade em `false`; renomear não muda o slug; `excluirCategoria` de categoria com peça → `'tem-pecas'`, sem peça → `'ok'`; mudar a grade de `P,M` para `M,G` deixa a peça com `{ M: <o que era>, G: false }`; `criarKit` nasce `publicado: false`; depois de `expirarSessao()`, `carregar()` rejeita com `ErroSessao`; `entrar('sem-acesso@x.com', 'x')` → `'sem-acesso'`.
- [ ] **Step 2:** FAIL → implementar → PASS.
- [ ] **Step 3: Commit** `"Adiciona a API do painel em memória"`

---

### Task 4: ApiAdmin no Supabase e redução de foto

**Files:**
- Create: `src/admin/servicos/apiSupabase.ts`, `src/admin/servicos/apiSupabase.test.ts`, `src/admin/servicos/reduzirFoto.ts`, `src/admin/servicos/reduzirFoto.test.ts`, `src/admin/servicos/escolherApi.ts`, `src/admin/servicos/escolherApi.test.ts`

**Interfaces:**
- Consumes: `ApiAdmin` (Task 3), regras (Task 2), `lerAmbienteSupabase` (etapa 3), `urlDaFoto` de `src/vitrine/fonteSupabase.ts`.
- Produces:
  - `criarApiSupabase(cliente: SupabaseClient, urlBase: string): ApiAdmin`. Cliente criado em `escolherApi` com `auth: { persistSession: true, storageKey: 'cardoso-admin' }` — **separado** do cliente da vitrine, que continua sem sessão.
  - Mapeamentos puros exportados e testados: `paraPecaAdmin(linha)`, `paraKitAdmin(linha)`, `paraCategoriaAdmin(linha)` (mesmo formato de linhas da etapa 3, mais `arquivada`, `visivel`, `publicado`; `preco` texto ou número → centavos com `paraCentavos`).
  - `ehErroSessao(erro: { code?: string; status?: number; message?: string }): boolean`: `true` para `status` 401, `code` `PGRST301`/`PGRST303`, ou mensagem com `JWT expired`. A API converte esses casos em `ErroSessao`.
  - Paths no Storage (bucket `vitrine`): `pecas/<pecaId>/<uuid>.webp` e `kits/<kitId>/<uuid>.webp`. Excluir peça: remove os objetos das fotos dela, depois a linha. Trocar foto do kit: envia a nova, grava o path, remove a antiga.
  - `entrar`: `signInWithPassword`; erro de credencial → `'credenciais'`; depois lê `admins` (a política só devolve a própria linha) e, se vazio, `signOut()` e `'sem-acesso'`.
  - Slug livre: lê os slugs existentes que começam com a base (`like 'base%'`) antes de inserir; se o `insert` falhar por slug repetido (`23505`), tenta de novo uma vez com o próximo.
  - `reduzirFoto(arquivo: Blob): Promise<Blob>`: `createImageBitmap` → canvas com `medidasReduzidas` → `toBlob('image/webp', 0.85)`. Rejeita com `Error('foto-ilegivel')` se o navegador não ler o arquivo ou não gerar WebP.
  - `escolherApi(env): ApiAdmin`: `MODE === 'e2e'` → memória; com ambiente do Supabase → Supabase; sem ambiente em dev/test → memória; sem ambiente no build de produção → uma API cujo `sessao()` rejeita com `Error('supabase-nao-configurado')`.

- [ ] **Step 1: Testes (falham):** `paraPecaAdmin` com `preco: '129.90'` → `12990`, fotos ordenadas, `descricao: null` → `''`; `ehErroSessao({ status: 401 })`, `({ code: 'PGRST301' })`, `({ message: 'JWT expired' })` → `true`, `({ code: '23505' })` → `false`; `escolherApi` nos quatro casos acima; `reduzirFoto` com `createImageBitmap` simulado que rejeita → rejeita com `foto-ilegivel` (jsdom não tem canvas real: simular `createImageBitmap` e `HTMLCanvasElement.prototype.toBlob`).
- [ ] **Step 2:** FAIL → implementar → PASS. `npm run build` sem erros.
- [ ] **Step 3: Commit** `"Adiciona a API do painel no Supabase"`

---

### Task 5: Entrada, sessão e estrutura do painel

**Files:**
- Create: `src/admin/AdminContext.tsx`, `src/admin/AdminApp.tsx`, `src/admin/componentes/{Campo,Botao,Interruptor,Confirmar,BarraAdmin}.tsx`, `src/admin/paginas/Entrar.tsx`, `src/admin/test/renderizarAdmin.tsx`, `src/admin/AdminApp.test.tsx`
- Modify: `src/App.tsx` (o `<meta name="robots" content="noindex">` do painel é inserido pelo `AdminApp` num `useEffect`)

**Interfaces:**
- Produces:
  - `AdminProvider({ api, children })` e `useAdmin(): { api: ApiAdmin; dados: DadosAdmin | null; recarregar(): Promise<void>; tratarErro(e: unknown): string }`. `tratarErro` com `ErroSessao` leva para `/admin/entrar?expirou=1` e devolve `''`; com outro erro devolve "Não foi possível salvar. Confira a internet e tente de novo."
  - `App.tsx`: `<Route path="/admin/*" element={<Suspense fallback={null}><AdminApp /></Suspense>} />` **fora** do `VitrineProvider` e do `SacolaProvider`; o resto continua igual. `AdminApp` importado com `lazy(() => import('./admin/AdminApp'))`.
  - Rotas do `AdminApp`: `entrar`, `''` (visão geral), `pecas`, `pecas/nova`, `pecas/:id`, `kits`, `kits/novo`, `kits/:id`, `categorias`, `configuracoes`. Sem sessão, qualquer rota vai para `entrar`. Com sessão, `entrar` vai para `''`.
  - `BarraAdmin`: no celular, barra fixa embaixo com 5 itens (Início, Peças, Kits, Categorias, Ajustes); no desktop (`md:`), lateral. "Sair" fica em Ajustes.
  - Componentes: `Campo` (rótulo visível, erro abaixo ligado por `aria-describedby`, `aria-invalid`), `Botao` (`ocupado` → `disabled` e texto "Salvando…"), `Interruptor` (`role="switch"`, `aria-checked`), `Confirmar` (diálogo com título, texto, botão de confirmar com o verbo: "Excluir peça").
  - `renderizarAdmin(caminho, api = criarApiMemoria())` monta `MemoryRouter` + `AdminProvider` + rotas.
- Textos fixos: título "Painel Cardoso"; campos "E-mail" e "Senha"; botão "Entrar"; erros "E-mail ou senha incorretos." e "Esta conta não tem acesso ao painel."; aviso "Sua sessão expirou. Entre de novo."; "Supabase não configurado." quando `sessao()` rejeitar com `supabase-nao-configurado`.

- [ ] **Step 1: Testes (falham)** em `AdminApp.test.tsx`: sem sessão, `/admin/pecas` mostra o formulário de entrada; entrar com credenciais válidas leva à visão geral; `sem-acesso@` mostra "Esta conta não tem acesso ao painel."; com `expirarSessao()` antes de uma gravação, o painel volta para a entrada com "Sua sessão expirou. Entre de novo."; a barra tem os 5 itens; o app da vitrine (`renderizarApp('/')`) continua igual (os testes atuais passam).
- [ ] **Step 2:** FAIL → implementar → PASS; `npm run build` mostra o admin num pedaço separado do JS (`dist/assets/AdminApp-*.js`).
- [ ] **Step 3: Commit** `"Adiciona a entrada e a estrutura do painel"`

---

### Task 6: Visão geral e configurações

**Files:**
- Create: `src/admin/paginas/VisaoGeral.tsx`, `src/admin/paginas/Configuracoes.tsx`, testes ao lado

**Interfaces:**
- Consumes: `resumoGeral`, `validarWhatsapp` (Task 2), `useAdmin` (Task 5).
- Visão geral: interruptor "Loja aberta" (texto ao lado: "Aberta: recebendo pedidos" / "Pausada: o site avisa que a loja não está recebendo pedidos"), grava na hora com `salvarConfiguracoes`; números "Peças à venda", "Esgotadas", "Kits com peça esgotada"; lista das esgotadas com link "Religar tamanhos" para `pecas/:id`; lista dos kits afetados com link para `kits/:id`; atalhos "Nova peça" e "Novo kit".
- Configurações: campos "WhatsApp dos pedidos" (com dica "Com 55 e DDD, ex.: 55 48 99999-9999"), "Link do Instagram", "Link do grupo de WhatsApp", "Texto de entrega"; "Salvar"; mensagem "Salvo." ao terminar; botão "Sair".

- [ ] **Step 1: Testes (falham):** visão geral mostra a contagem certa com a vitrine de exemplo (1 esgotada: "Camisa Mizuno preta") e o link "Religar tamanhos"; desligar a loja chama `salvarConfiguracoes` com `lojaAberta: false`; WhatsApp "48 99999-9999" mostra erro no campo e não salva; "+55 48 99999-9999" salva `5548999999999`; "Sair" volta para a entrada.
- [ ] **Step 2:** FAIL → implementar → PASS.
- [ ] **Step 3: Commit** `"Adiciona a visão geral e as configurações do painel"`

---

### Task 7: Peças (lista e formulário)

**Files:**
- Create: `src/admin/paginas/Pecas.tsx`, `src/admin/paginas/PecaForm.tsx`, testes ao lado

**Interfaces:**
- Consumes: `lerPreco`, `validarPeca`, `gerarSlug` (só para mostrar o endereço), `useAdmin`, componentes da Task 5.
- Lista: filtro por categoria (pílulas, "Todas" primeiro), filtro "Esgotadas" e "Arquivadas" (arquivadas só aparecem nesse filtro); cada linha com capa (ou quadrado "Sem foto"), nome, preço, tamanhos ligados ("M · G · GG" ou "Esgotada"); botão "Nova peça".
- Formulário: "Nome", "Preço" (texto, `inputMode="decimal"`, mostra o valor lido em `formatarReais` abaixo), "Categoria" (select), "Descrição" (opcional), "Tamanhos disponíveis" (um `Interruptor`-quadrado por tamanho da grade da categoria, no estilo da `GradeTamanhos`), "Fotos" (Task 8; na criação aparece depois de salvar a primeira vez: "Salve a peça para adicionar fotos."). Endereço mostrado: `/p/<slug>` (na criação, prévia do `gerarSlug`).
- Botões: "Salvar" (com `ocupado`), "Arquivar"/"Restaurar", "Excluir" (só para peça arquivada; `Confirmar` com "Excluir de vez? As fotos também são apagadas. Ela sai de N kits."). Trocar a categoria de uma peça avisa: "Os tamanhos vão ser os da nova categoria, todos desligados." (o banco sincroniza; a tela recarrega os dados depois de salvar).

- [ ] **Step 1: Testes (falham):** criar peça com nome "Polo teste", preço "119,90", categoria Polos, M e G ligados → aparece na lista com "R$ 119,90" e "M · G"; preço "abc" mostra "Preço inválido." e não chama a API; clicar duas vezes em "Salvar" com a API lenta (promessa pendente) cria uma peça só; arquivar tira da lista padrão e põe em "Arquivadas"; "Excluir" só aparece na arquivada e pede confirmação; filtro "Esgotadas" mostra só a Mizuno.
- [ ] **Step 2:** FAIL → implementar → PASS.
- [ ] **Step 3: Commit** `"Adiciona o cadastro de peças no painel"`

---

### Task 8: Fotos da peça

**Files:**
- Create: `src/admin/componentes/FotosPeca.tsx`, `src/admin/componentes/FotosPeca.test.tsx`
- Modify: `src/admin/paginas/PecaForm.tsx`

**Interfaces:**
- Consumes: `reduzirFoto` (Task 4), `api.enviarFotoPeca`, `ordenarFotosPeca`, `excluirFotoPeca`, `urlDaFoto`.
- Até 6 fotos; a primeira é a capa ("Capa" sobre ela). Botão "Adicionar fotos" (`<input type="file" accept="image/*" multiple>`; no celular abre câmera ou galeria). Cada foto: "Subir" / "Descer" (setas com `aria-label`) e "Remover" (com `Confirmar`). Envio uma por uma, mostrando "Enviando 2 de 3…". Escolher mais fotos do que cabe envia só até completar 6 e avisa "Máximo de 6 fotos.". Foto que falha em `reduzirFoto` → "Não foi possível ler esta foto." e as outras continuam.
- `reduzirFoto` recebe uma função injetável nos testes (`FotosPeca` aceita a prop `reduzir = reduzirFoto`).

- [ ] **Step 1: Testes (falham):** enviar 2 arquivos chama `enviarFotoPeca` 2 vezes com o resultado de `reduzir`; com 5 fotos, enviar 3 envia 1 e avisa o máximo; `reduzir` rejeitando mostra "Não foi possível ler esta foto."; "Descer" na primeira chama `ordenarFotosPeca` com a ordem trocada; "Remover" pede confirmação.
- [ ] **Step 2:** FAIL → implementar → PASS.
- [ ] **Step 3: Commit** `"Adiciona as fotos das peças no painel"`

---

### Task 9: Kits

**Files:**
- Create: `src/admin/paginas/Kits.tsx`, `src/admin/paginas/KitForm.tsx`, testes ao lado

**Interfaces:**
- Consumes: `validarKit`, `reduzirFoto`. Total mostrado no formulário = soma do `precoCentavos` das peças escolhidas que não estão arquivadas e têm ao menos um tamanho da grade ligado (mesma regra do `totalDoKit` da vitrine), com `formatarReais`.
- Lista na ordem do carrossel, com "Subir"/"Descer" (chama `ordenarKits`), selo "Publicado"/"Oculto", aviso "Tem peça esgotada" quando for o caso; "Novo kit".
- Formulário: "Título", "Descrição" (opcional), "Foto" (opcional, com "Trocar foto" e "Remover foto"; sem foto, a vitrine usa a capa da primeira peça — dizer isso abaixo do campo), "Peças" (campo "Buscar peça" que filtra por nome sem acento; lista de resultados com "Adicionar"; escolhidas em ordem com "Subir"/"Descer"/"Tirar"; mínimo 2, máximo 4); "Salvar"; interruptor "Publicado" (só depois de salvo e válido); "Excluir" com `Confirmar`.

- [ ] **Step 1: Testes (falham):** criar kit com 1 peça mostra "Escolha de 2 a 4 peças." e não salva; com 2 peças salva oculto e aparece na lista; buscar "calca" encontra "Calça jogador preta"; a quinta peça não pode ser adicionada; "Subir" no segundo kit chama `ordenarKits` com a ordem trocada; publicar chama `publicarKit(id, true)`.
- [ ] **Step 2:** FAIL → implementar → PASS.
- [ ] **Step 3: Commit** `"Adiciona o cadastro de kits no painel"`

---

### Task 10: Categorias

**Files:**
- Create: `src/admin/paginas/Categorias.tsx`, `src/admin/paginas/Categorias.test.tsx`

**Interfaces:**
- Consumes: `lerGrade`, `validarCategoria`, `tamanhosPerdidos`.
- Lista na ordem das pílulas com "Subir"/"Descer", interruptor "Visível", quantidade de peças. Tocar abre a edição na própria página (sem rota nova): "Nome", "Tamanhos" (texto, ex.: "P, M, G, GG, XG", com a grade lida mostrada em quadrados abaixo), "Salvar", "Excluir".
- Salvar uma grade que tira tamanhos ligados em alguma peça abre `Confirmar`: "As peças desta categoria vão perder os tamanhos P, XG. Continuar?".
- "Excluir" em categoria com peças mostra "Esta categoria tem peças. Esconda em vez de excluir." (e a API devolve `'tem-pecas'` se a tela errar); sem peças, `Confirmar` e exclui.
- "Nova categoria" no fim: nome + tamanhos.

- [ ] **Step 1: Testes (falham):** renomear "Polos" para "Polos e camisas" chama `salvarCategoria`; grade "P M G" → "M G GG" com peça que tem P ligado pede confirmação citando "P"; excluir "Camisetas" (tem peças) mostra o aviso e não chama `excluirCategoria`; criar "Bonés" com "U" aparece no fim da lista; "Descer" chama `ordenarCategorias`.
- [ ] **Step 2:** FAIL → implementar → PASS.
- [ ] **Step 3: Commit** `"Adiciona o cadastro de categorias no painel"`

---

### Task 11: Admin no celular, de ponta a ponta

**Files:**
- Create: `e2e/admin.spec.ts`

**Interfaces:**
- Consumes: o build `--mode e2e` (etapa 3), em que `escolherApi` usa a memória.

- [ ] **Step 1: Teste** em 390 × 844: abrir `/admin`, entrar com `gabriel@exemplo.test` e uma senha qualquer (é a API em memória; não existe conta), ver a visão geral, criar a peça "Polo teste" por R$ 119,90 em Polos com M ligado, voltar à lista e achá-la; em cada página do admin (`/admin`, `/admin/pecas`, `/admin/pecas/nova`, `/admin/kits`, `/admin/kits/novo`, `/admin/categorias`, `/admin/configuracoes`), `document.documentElement.scrollWidth <= innerWidth`.
- [ ] **Step 2:** `npm run test:e2e` → os 2 testes antigos e os novos passam. Commit `"Testa o painel no celular de ponta a ponta"`.

---

### Task 12: Ligar ao Supabase de verdade (pelo Edge do Gabriel)

Sem senha nas mãos do Claude. Cada dado de teste é apagado no mesmo passo.

**Files:**
- Create: `supabase/verificacao/admin.sql` (verificação das políticas de escrita, sempre com `rollback`)

- [ ] **Step 1:** `git push origin main` e conferir em Database → Migrations a `20261106130000_tamanhos_sincronizados`; Advisors → Security sem erro nem aviso.
- [ ] **Step 2: Auth pelo Edge:** em Authentication → Sign In / Providers, **desligar "Allow new users to sign up"** (o `config.toml` não vale para o projeto hospedado). Conferir que o provedor Email está ligado.
- [ ] **Step 3: Políticas de escrita, sem conta de teste:** `admin.sql` roda numa transação que termina em `rollback`: cria um `uuid` qualquer, insere em `admins`, faz `set local role authenticated` e `set local request.jwt.claims` com esse `sub`, e confere com `do $$ … assert … $$` que esse papel **consegue** inserir, alterar e apagar uma peça `teste-admin`, alterar `configuracoes`, e que **sem** a linha em `admins` não consegue. Rodar no SQL Editor; resultado esperado "Success"; depois conferir que `select count(*) from public.pecas where slug like 'teste-%'` e `from public.admins` voltaram ao que eram.
- [ ] **Step 4: Conta do admin (Gabriel):** parar e pedir ao Gabriel para criar no painel (Authentication → Users → Add user → Create new user, com "Auto Confirm User") a conta de quem vai usar o painel, com senha forte que só ele conhece. Ele informa o **e-mail**; o Claude roda no SQL Editor `insert into public.admins (user_id) select id from auth.users where email = '<e-mail>'` e confere 1 linha.
- [ ] **Step 5: Ensaio no `localhost`:** `npm run dev` com o `.env.local`; o Gabriel entra em `http://localhost:5173/admin` no Edge (digita a senha ele mesmo). Depois, pelo Edge: criar a peça "Teste painel" (slug `teste-painel`) com 1 foto pequena e M ligado; ver que ela aparece na vitrine em `http://localhost:5173/`; criar o kit "Teste kit" com ela e outra peça de teste, publicar, ver no carrossel; mudar a grade de uma **categoria de teste** ("Teste categoria", criada e apagada no passo) e ver os tamanhos acompanharem. **Em seguida apagar tudo** pelo próprio painel (kit, peças, categoria de teste) e conferir no SQL Editor que não sobrou linha com `teste-` nem objeto em `vitrine/pecas/` dessas peças (Storage → vitrine).
- [ ] **Step 6:** Commit `"Confere o painel contra o Supabase"` (só o `admin.sql`). Anotar no ledger o resultado de cada passo.

---

## Próximos planos

- **Etapa 5:** prévia dos links e publicação. Decidir a hospedagem (a Vercel gratuita não permite uso comercial; a Marisa usa Cloudflare Pages), configurar o retorno do `index.html` para `/admin/*` e as rotas da vitrine, e **rever a branch das migrações** antes de publicar (pedido do Gabriel).
- **Antes de abrir para clientes:** o Gustavo cadastra o WhatsApp real e o catálogo pelo painel; conferir as grades de calças e tênis com ele.
