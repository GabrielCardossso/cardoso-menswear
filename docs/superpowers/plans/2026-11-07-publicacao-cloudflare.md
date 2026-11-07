# Prévia dos links e publicação na Cloudflare (etapa 5): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O site sai do `localhost` e vai para a Cloudflare Pages: a `producao` em `cardoso-menswear.pages.dev` e a `main` em `main.cardoso-menswear.pages.dev`. Um link de peça ou de kit colado no WhatsApp mostra foto, nome e preço.

**Architecture:** O build do Vite vai como está para a Pages; a Pages serve o `index.html` para as rotas do app (modo SPA, sem `404.html`). Um middleware da Pages (`functions/_middleware.ts`) intercepta só as respostas HTML. Ele põe as tags Open Graph no `<head>`: as de `/p/:slug` e `/k/:slug` vêm do Supabase, pela API REST com a chave publicável, então valem as mesmas regras de acesso do visitante. As outras páginas recebem uma prévia fixa com a logo. A lógica fica em funções puras em `functions/_lib/`, testadas no Vitest; o middleware só as liga.

**Tech Stack:** o das etapas anteriores, mais Cloudflare Pages Functions (padrão Web: `Request`, `Response`, `fetch`; sem dependência nova nem Wrangler).

**Spec:** `docs/superpowers/specs/2026-11-05-vitrine-pedidos-design.md`: seções "Prévia dos links" e "Estrutura e publicação", e "Verificação esperada" ("Prévia de um link de peça conferida com uma ferramenta de depuração de Open Graph").

## Global Constraints

- Commitar só na `main`, no nome do Gabriel, sem `Co-Authored-By` nem `Claude-Session`. A ida para a `producao` só acontece com o aval do Gabriel, por merge.
- Navegador: painel da Cloudflare, GitHub, Supabase e páginas publicadas pela extensão Claude in Chrome, no navegador `onThisComputer: true`, conferindo a conta antes de agir (Cloudflare: `Gabrielcardossso@gmail.com's Account`; GitHub: `GabrielCardossso`).
- **Chaves:** o Claude não digita chave em formulário. A chave publicável do Supabase entra nas variáveis da Pages **colada pelo Gabriel**. A URL do Supabase e o `NODE_VERSION` o Claude pode preencher. Nenhuma chave secreta em lugar nenhum.
- **Dados de teste:** a peça e o kit criados para testar a prévia levam "Teste" no nome e são apagados pelo painel no mesmo passo, com conferência no banco (peças, kits, fotos e objetos do bucket zerados).
- Migrações continuam pela `main` e só somam (decisão revista em 2026-11-07). Esta etapa não cria migração.
- O middleware nunca pode derrubar o site: qualquer erro ou demora (mais de 2,5 s) no Supabase cai na prévia fixa e devolve a página normal.
- Textos da prévia em português, com dinheiro por `formatarReais` (o mesmo `Intl` com U+00A0 depois de "R$").

## Review Focus

1. **Supabase fora do ar ou lento quando o WhatsApp pede a prévia:** a página abre normalmente, com a prévia fixa, sem esperar mais de 2,5 s (Task 2).
2. **Slug com caracteres estranhos ou tentativa de injeção** (`/p/a%22%3E%3Cscript%3E`, `/p/../admin`): o slug só segue para a consulta se casar com `^[a-z0-9]+(-[a-z0-9]+)*$`; o texto injetado no HTML é escapado (Task 1).
3. **Peça arquivada, de categoria escondida, ou kit oculto:** a prévia não revela o nome nem o preço (a consulta usa a chave publicável e a RLS esconde), e cai na prévia fixa (Task 2).
4. **Peça sem foto, ou foto `/exemplo/...`:** a imagem vira a logo ou a URL absoluta do próprio site, nunca um caminho relativo, que o WhatsApp não abre (Task 1).
5. **Rotas do app abertas direto pelo link** (`/admin/pecas`, `/k/x`, `/finalizar`, recarregar no meio): a Pages devolve o app, não um 404, e o `/admin` sai com `noindex` também no cabeçalho HTTP (Tasks 1 e 4).

---

## Estrutura de arquivos

```
functions/_lib/previa.ts          puro: slug da rota, textos da prévia, HTML com as tags
functions/_lib/previa.test.ts
functions/_lib/supabase.ts        puro: monta a URL REST e lê a resposta (fetch injetado)
functions/_lib/supabase.test.ts
functions/_middleware.ts          liga tudo (Pages Functions)
public/og-cardoso.png             cópia de brand/logo/cardoso-logo-avatar.png (prévia fixa)
public/_headers                   cabeçalhos de segurança e noindex do /admin
public/robots.txt                 Disallow: /admin
```

---

### Task 1: Prévia em funções puras e arquivos públicos

**Files:**
- Create: `functions/_lib/previa.ts`, `functions/_lib/previa.test.ts`, `public/og-cardoso.png`, `public/_headers`, `public/robots.txt`
- Modify: `tsconfig.node.json` (incluir `functions`), `vite.config.ts` (nada: o Vitest já pega `functions/**/*.test.ts`; conferir), `index.html` (descrição padrão)

**Interfaces:**
- Produces:

```ts
export type Previa = { titulo: string; descricao: string; imagem: string; url: string };
export const PREVIA_FIXA_DESCRICAO = 'Moda masculina · Capivari de Baixo, SC';
/** "/p/camisa-preta" → { tipo: 'peca', slug }; "/k/x" → kit; o resto (ou slug inválido) → null. */
export function rotaComPrevia(caminho: string): { tipo: 'peca' | 'kit'; slug: string } | null;
export function previaFixa(origem: string, caminho: string): Previa;   // titulo 'Cardoso Menswear', imagem `${origem}/og-cardoso.png`
/** "/x.jpg" → origem + caminho; "pecas/a.webp" → URL pública do bucket; vazio → logo. */
export function imagemAbsoluta(path: string | null | undefined, origem: string, urlSupabase: string): string;
/** Insere og:title, og:description, og:image, og:url, og:type, og:site_name, twitter:card e troca o <title>. Escapa &, <, >, ". */
export function injetarPrevia(html: string, p: Previa): string;
```

  Textos: peça → título "Camisa dry fit NK preta · Cardoso Menswear", descrição "R$ 89,90 · Tamanhos M, G, GG" (na ordem da grade) ou "R$ 89,90 · Esgotada"; kit → título "<título do kit> · Cardoso Menswear", descrição "2 peças · R$ 169,80" (só peças com tamanho, igual ao `totalDoKit` da vitrine; "1 peça" no singular). A montagem desses textos fica em `textoPeca(...)` e `textoKit(...)` exportados, recebendo os dados já lidos (Task 2 os produz).
- `public/_headers`: em `/*`: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`; em `/admin/*`: `X-Robots-Tag: noindex`.
- `public/robots.txt`: `User-agent: *` / `Disallow: /admin`.

- [ ] **Step 1: Testes (falham)** em `previa.test.ts`: `rotaComPrevia('/p/camisa-preta')` → peça; `('/k/kit-1/')` → kit; `('/p/A%22%3E')`, `('/p/../admin')`, `('/c/camisetas')`, `('/')` → `null`; `imagemAbsoluta('/exemplo/kit-1.jpg', O, S)` → `${O}/exemplo/kit-1.jpg`; `('pecas/a b.webp', O, S)` → `${S}/storage/v1/object/public/vitrine/pecas/a%20b.webp`; `(null, O, S)` → `${O}/og-cardoso.png`; `injetarPrevia` com título `Calça "jogger" <b>` gera `content="Calça &quot;jogger&quot; &lt;b&gt;"` e troca o `<title>`; `textoPeca` com grade P,M,G e só M,G ligados → "R$ 89,90 · Tamanhos M, G"; nenhum ligado → "· Esgotada"; `textoKit` com 2 peças disponíveis de 8990 e 7990 → "2 peças · R$ 169,80".
- [ ] **Step 2:** FAIL → implementar → PASS; copiar a logo para `public/og-cardoso.png`; criar `_headers` e `robots.txt`; `npm run build` e conferir que `dist/` tem os três arquivos.
- [ ] **Step 3: Commit** `"Monta a prévia dos links e os arquivos de publicação"`

---

### Task 2: Middleware da Pages lendo o Supabase

**Files:**
- Create: `functions/_lib/supabase.ts`, `functions/_lib/supabase.test.ts`, `functions/_middleware.ts`, `functions/_lib/middleware.test.ts`

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - `buscarPeca(slug, env, fetchFn, limiteMs = 2500): Promise<{ nome; precoCentavos; grade: string[]; ligados: string[]; foto: string | null } | null>`: `GET ${url}/rest/v1/pecas?slug=eq.<slug>&select=nome,preco,peca_fotos(path,ordem),peca_tamanhos(tamanho,disponivel),categorias(grade)&limit=1` com `apikey` e `Authorization: Bearer <publicável>`.
  - `buscarKit(slug, env, fetchFn, limiteMs = 2500): Promise<{ titulo; foto: string | null; pecas: { precoCentavos; disponivel: boolean; foto: string | null }[] } | null>`: `kits?slug=eq.<slug>&select=titulo,foto_path,kit_pecas(ordem,pecas(preco,peca_fotos(path,ordem),peca_tamanhos(tamanho,disponivel),categorias(grade)))&limit=1`; `pecas` nula (escondida pela RLS) é ignorada; sem `foto_path`, usa a primeira foto da primeira peça disponível.
  - Ambos devolvem `null` em resposta vazia, status não 2xx, JSON inválido ou estouro do limite (`AbortSignal.timeout`). Nunca rejeitam.
  - `env`: `{ VITE_SUPABASE_URL: string; VITE_SUPABASE_PUBLISHABLE_KEY: string }` (as mesmas variáveis do build, também disponíveis para a função). Sem as duas, prévia fixa.
  - `responderComPrevia(request, proxima: () => Promise<Response>, env, fetchFn): Promise<Response>`: só para `GET` com resposta `text/html` e status 200; senão devolve a resposta como veio. Tira `content-length` ao reescrever. Exportado de `functions/_lib/middleware.ts`; `functions/_middleware.ts` só faz `export const onRequest = (ctx) => responderComPrevia(ctx.request, ctx.next, ctx.env, fetch)`.

- [ ] **Step 1: Testes (falham)** com `fetch` falso: peça encontrada → HTML com `og:title` "Camisa … · Cardoso Menswear" e `og:image` do bucket; resposta `[]` (arquivada/escondida) → prévia fixa; `fetch` que nunca responde com `limiteMs = 30` → prévia fixa em menos de 1 s; status 500 → prévia fixa; resposta não HTML (`image/png`) → devolvida igual, sem chamar `fetch`; `POST` → igual; sem `env` → prévia fixa; kit com uma peça escondida (`pecas: null`) conta só as visíveis.
- [ ] **Step 2:** FAIL → implementar → PASS; `npm test` inteiro e `npm run build`.
- [ ] **Step 3: Commit** `"Põe a prévia dos links de peça e kit numa função da Cloudflare"`; `git push origin main`.

---

### Task 3: Projeto na Cloudflare Pages (pelo Edge do Gabriel)

- [ ] **Step 1:** No Edge (extensão, navegador deste computador), abrir `dash.cloudflare.com` → Workers & Pages e conferir a conta `Gabrielcardossso@gmail.com's Account`. Create → Pages → **Connect to Git** → GitHub. Se o app da Cloudflare no GitHub ainda não tiver acesso ao `GabrielCardossso/cardoso-menswear` (hoje ele só vê o `marisa-lanches`), a tela do GitHub pede para incluir o repositório: **parar e pedir ao Gabriel para aprovar ali** (é uma permissão da conta dele) e seguir depois.
- [ ] **Step 2:** Configurar: nome do projeto `cardoso-menswear`; **production branch `producao`**; framework "None"/Vite; build `npm run build`; saída `dist`; variáveis (Production e Preview): `NODE_VERSION = 22`, `VITE_SUPABASE_URL = https://gbhbzntuuysswbsptqgi.supabase.co`, e `VITE_SUPABASE_PUBLISHABLE_KEY`, **que o Gabriel cola** (a chave publicável `default` de Project Settings → API Keys do Supabase). Salvar e implantar. Se o nome `cardoso-menswear` não estiver livre, parar e perguntar.
- [ ] **Step 3:** Em Settings → Builds → **Preview deployments**: só a branch `main` (`Custom branches` = `main`), para não gerar link para qualquer branch.
- [ ] **Step 4:** Conferir o primeiro deploy da `producao` (código da etapa 4, ainda sem a prévia) em `https://cardoso-menswear.pages.dev`: abre a vitrine com as 5 categorias e "Novidades chegando". Disparar o da `main` (fazer um commit de docs na `main`, por exemplo o README da Task 5, ou "Retry deployment") e esperar `https://main.cardoso-menswear.pages.dev`.

---

### Task 4: Conferir o link de teste da `main`

- [ ] **Step 1: Rotas direto pelo link** em `main.cardoso-menswear.pages.dev`, pelo Edge: `/`, `/kits`, `/c/camisetas`, `/p/nao-existe` (mostra "Não encontramos esta página" do app, não um 404 da Cloudflare), `/admin` (entrada do painel). Com `curl -sI`: `/admin/pecas` tem `x-robots-tag: noindex`; `/robots.txt` responde; `/og-cardoso.png` é `image/png`.
- [ ] **Step 2: Prévia fixa:** `curl -s -A "WhatsApp/2.23" https://main.cardoso-menswear.pages.dev/ | grep og:` mostra `og:title` "Cardoso Menswear", `og:image` absoluta da logo e `og:url`.
- [ ] **Step 3: Prévia de peça e kit, com dados de teste** (o Gabriel já está logado no painel do `localhost`, no mesmo banco): pelo painel, criar "Teste prévia" (Camisetas, R$ 89,90, M e G, 1 foto) e "Teste prévia bermuda" (Bermudas, R$ 79,90, G), e o kit "Teste kit prévia" publicado com as duas. Conferir com `curl -A "WhatsApp/2.23"`: `/p/teste-previa` → `og:title` "Teste prévia · Cardoso Menswear", `og:description` "R$ 89,90 · Tamanhos M, G", `og:image` no bucket; `/k/teste-kit-previa` → "2 peças · R$ 169,80". Conferir a prévia de `/p/teste-previa` numa ferramenta de depuração de Open Graph aberta no Edge (ex.: `https://www.opengraph.xyz/url/<url codificada>`). Arquivar a peça e conferir que `/p/teste-previa` volta para a prévia fixa.
- [ ] **Step 4: Apagar os dados de teste** pelo painel (kit, depois as 2 peças: arquivar e excluir) e conferir no SQL Editor: `pecas`, `kits`, `peca_fotos`, `kit_pecas` e `storage.objects` do bucket `vitrine` zerados; categorias = as 5 reais.
- [ ] **Step 5:** Celular: abrir `main.cardoso-menswear.pages.dev` no Edge em 390 × 844 e conferir a vitrine sem rolagem lateral (o e2e já cobre o build; aqui é o deploy).

---

### Task 5: Documentar e levar para a `producao`

**Files:**
- Modify: `README.md` (seção "Publicação": endereços, variáveis, onde fica o painel da Cloudflare, prévia dos links)

- [ ] **Step 1:** README atualizado; commit `"Documenta a publicação na Cloudflare"`; push.
- [ ] **Step 2: Parar e pedir o aval do Gabriel** para levar a etapa 5 à `producao`. Com o aval: merge `--no-ff` da `main` na `producao`, no nome dele, e push.
- [ ] **Step 3:** Conferir o deploy de produção em `https://cardoso-menswear.pages.dev`: vitrine abre, `/admin` abre a entrada, prévia fixa no `curl` da raiz.
- [ ] **Step 4:** Revisão final do branch (fresca, modelo mais capaz), corrigir o que for Crítico/Importante com teste, e relatar decisões e pendências.

---

## Depois desta etapa (fora do plano)

- O Gustavo cadastra o catálogo real e o WhatsApp dos pedidos pelo painel (`/admin` em `cardoso-menswear.pages.dev/admin`), e o Gabriel cria a conta dele no Supabase (Authentication → Users), liberada como admin.
- Domínio próprio, quando houver: Custom domains da Pages.
