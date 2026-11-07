# Vitrine e pedidos da Cardoso Menswear: design da V1

Data: 2026-11-05 · Autor da ideia: Gabriel · Redação: Claude

## Por que existe

A Cardoso Menswear é uma loja de moda masculina de Capivari de Baixo (SC), tocada pelo Gustavo
(@cardoso.gustavo_). Vende pelo Instagram (@cardoso.menswear, ~1.600 seguidores, 394 posts) e por um
grupo de WhatsApp. Quase todo post é uma "SUGESTÃO DE KIT": camisa + bermuda ou calça, fotografadas
de cima sobre um carpete cinza. As legendas não têm preço nem tamanho, então toda venda começa com
"quanto custa?" e "tem G?" no direct. Entrega por motoboy em Capivari e região, e envio para todo o
Brasil. Levantamento completo em `docs/instagram.md`.

A ideia é um site de vitrine onde o cliente vê as peças e os kits com preço e tamanhos disponíveis,
monta a sacola e fecha o pedido mandando uma mensagem pronta para o WhatsApp do Gustavo.

**A regra principal: o site mostra e organiza, a venda continua no WhatsApp.** A V1 não cobra, não
calcula frete e não grava pedido. O Gustavo recebe a mensagem já com peças, tamanhos, total e
entrega, e combina frete e pagamento como faz hoje.

## Objetivos da V1

1. O cliente abre o link (da bio do Instagram, do grupo, de um post) no celular e vê os kits e as
   peças com foto, preço e tamanhos disponíveis, sem login e sem instalar nada.
2. Monta a sacola com peças avulsas ou kits, escolhendo o tamanho de cada peça.
3. Finaliza informando nome e entrega, e o site abre o WhatsApp do Gustavo com a mensagem pronta.
4. O Gustavo mantém tudo em `/admin` sem mexer em código: peças, fotos, preços, tamanhos
   disponíveis, kits e categorias.
5. Um link de peça ou de kit colado no WhatsApp ou no Instagram mostra foto, nome e preço.

**Sucesso:** o Gustavo coloca o link na bio, recebe pedidos pelo site que ele entende de primeira
sem perguntar nada, e atualiza sozinho um preço, uma foto ou um tamanho esgotado.

## Fora da V1 (não fazer)

- Pagamento online, cálculo de frete, cupom de desconto.
- Gravar pedidos no banco, painel de pedidos, histórico de vendas.
- Estoque por quantidade (a V1 só marca cada tamanho como disponível ou não).
- Conta de cliente, favoritos, busca por texto, filtro por marca.
- Desconto de kit (o preço do kit é sempre a soma das peças).

O código deve deixar esses caminhos possíveis sem implementá-los. Em especial, o formato da sacola
deve ser o mesmo que um dia será gravado como pedido (ver "Sacola").

## O que tornaria a V1 um fracasso, mesmo funcionando

- Mensagem confusa para o Gustavo. Ela tem que dizer de cara que é um pedido feito pelo site, com
  peças, tamanhos e total legíveis no WhatsApp.
- Preço ou tamanho errado. Se o site disser que tem G e não tem, o cliente perde a confiança no site
  e o Gustavo passa vergonha. Por isso a conferência ao finalizar.
- Abrir devagar ou quebrar no celular, pelo 4G. É praticamente todo o acesso.
- Qualquer pessoa conseguir alterar a vitrine. Só a conta de admin escreve no banco.
- Parecer loja genérica de modelo pronto. A identidade é a do Instagram: preto, logo branca, fotos
  no carpete.

## Restrições

- Celular primeiro: projetar para 360–430 px. Desktop é secundário (grade mais larga, mesmo fluxo).
  O admin tem que funcionar no celular, porque o Gustavo vai cadastrar peça pelo celular.
- Repositório com duas branches permanentes: `main` (desenvolvimento) e `producao` (o que está no
  ar). Nada vai para `producao` sem estar verificado e sem o aval do Gabriel (ver `.claude/CLAUDE.md`).
- Contas gratuitas no Supabase e na Cloudflare, criadas pelo Gabriel (a Vercel gratuita não permite uso comercial; troca decidida em 2026-11-07).
- LGPD: o site não guarda dado de cliente. Nome, bairro, CEP e cidade só existem no navegador do
  cliente e na mensagem que ele mesmo envia. O único dado pessoal no banco é o e-mail do admin.

## Abordagens consideradas

| | Como | Troca |
|---|---|---|
| **A (escolhida)** | React + Vite + TypeScript + Tailwind, Supabase (Postgres, Auth, Storage, RLS), Cloudflare Pages (antes: Vercel); mais uma função da Cloudflare para a prévia dos links | Mesma stack da Marisa: dá para reaproveitar login, upload de fotos e padrões do admin. A função cobre o ponto fraco do Vite numa vitrine (prévia de link). |
| B | Next.js + Supabase na Vercel, páginas montadas no servidor | Prévia de link e Google de fábrica, mas stack diferente da Marisa e mais complexa para algumas centenas de peças. |
| C | Plataforma pronta (Nuvemshop, Shopify) com botão de WhatsApp | Sem código, mas com mensalidade, visual de modelo e o WhatsApp como adaptação. |

O Gabriel escolheu a **A**.

## Decisões tomadas

### Fluxo do cliente

1. **Início (`/`)**
   - Cabeçalho com o nome da loja à esquerda e a sacola à direita.
   - Logo abaixo, as categorias em pílulas que rolam de lado ("Kits" primeiro).
   - Carrossel grande de **kits** (os publicados, na ordem do admin), cada um com foto, "Sugestão de
     kit", título e "N peças · R$ total".
   - Depois **"Chegou agora"**: as 12 peças mais recentes em grade de 2 colunas, com "Ver tudo".
   - No rodapé: "Entrega por motoboy em Capivari de Baixo e região · Enviamos para todo o Brasil",
     link do Instagram e do grupo de WhatsApp.
2. **Categoria (`/c/:slug`)**: grade de 2 colunas (4 no desktop) com foto, nome, preço e os tamanhos
   disponíveis em texto pequeno ("P · M · G"). Peça sem nenhum tamanho disponível aparece apagada com
   "Esgotado" e vai para o fim da lista. A pílula "Kits" abre `/kits`, a lista de todos os kits.
3. **Peça (`/p/:slug`)**
   - Fotos deslizando de lado (até 6), com os pontinhos de posição.
   - Por cima da foto, um botão de voltar à esquerda e a sacola à direita, em círculos escuros
     semitransparentes.
   - Categoria, nome, preço, descrição.
   - Tamanhos da grade da categoria: disponível = botão; indisponível = riscado e não clicável.
     Tamanho é obrigatório.
   - Quantidade (1 por padrão).
   - "Faz parte do kit …" com link, quando a peça estiver em algum kit publicado.
   - Botão fixo embaixo "Adicionar à sacola".
4. **Kit (`/k/:slug`)**
   - Foto do kit, título, descrição opcional.
   - Lista das peças: foto pequena, nome, preço, seletor de tamanho e uma marcação (todas marcadas
     no início).
   - Peça esgotada aparece desmarcada e travada, com "Esgotado".
   - "Adicionar à sacola" leva só as peças marcadas; só fica ativo quando toda peça marcada tem
     tamanho escolhido. O total no botão muda conforme a marcação.
   - Kit em que todas as peças estão esgotadas sai do carrossel do início, mas o link continua
     abrindo (com tudo travado).
5. **Sacola** (painel que sobe do rodapé, aberto pelo ícone)
   - Cada linha: foto, nome, tamanho, preço unitário, − e +, remover, subtotal.
   - Total das peças e "Finalizar pelo WhatsApp" (só com pelo menos um item). Sacola vazia mostra um
     convite para ver os kits.
6. **Finalizar (`/finalizar`)**
   - Campos: nome (obrigatório); entrega: **Motoboy** (Capivari e região, pede o bairro) ou
     **Envio para o Brasil** (pede CEP com 8 dígitos e cidade); observação opcional (até 300
     caracteres).
   - Ao tocar em "Enviar pelo WhatsApp", o site confere de novo preço, tamanho e se a loja está
     aberta (ver "Preços e conferência"), e então abre o WhatsApp.
   - Depois de abrir, a tela mostra "Pedido enviado para o WhatsApp? Se não abriu, copie a mensagem"
     com a mensagem e um botão de copiar, e um botão "Esvaziar sacola". A sacola não se esvazia
     sozinha, porque o site não tem como saber se a mensagem foi enviada.

Se o admin pausar a loja, a vitrine continua no ar, mas "Finalizar" é trocado pelo aviso "Pedidos
pausados no momento. Fale com a gente no Instagram."

### Mensagem do WhatsApp

Aprovada pelo Gabriel. Abre com quem é e o que é, para o Gustavo entender de primeira:

```
Olá! Fiz este pedido pelo site 🛍️

PEÇAS
• 1x Camisa dry fit NK (preta) — tam. G — R$ 89,90
• 1x Bermuda moletom NK — tam. M — R$ 79,90
Total das peças: R$ 169,80

ENTREGA
Motoboy — bairro Centro

Nome: João
Obs.: posso pagar no Pix?
```

- Envio para o Brasil: `Envio para o Brasil — CEP 88745-000, Tubarão`.
- Sem observação, a linha "Obs." não aparece.
- Itens de kit aparecem como peças normais (o Gustavo só precisa saber o que separar).
- O link é `https://wa.me/<número>?text=<mensagem codificada>`, com o número das configurações
  (só dígitos, com 55 e DDD).

### Peças, tamanhos e cores

- Cada **cor é uma peça própria** ("Camisa dry fit NK preta" e "… branca"), cada uma com suas
  fotos e seus tamanhos (decisão do Claude: mantém a V1 simples e a foto sempre bate com a cor).
- A **grade de tamanhos** é da categoria: uma lista ordenada de rótulos. Grades iniciais: roupa
  `P, M, G, GG, XG`; calças `36, 38, 40, 42, 44, 46`; tênis `37, 38, 39, 40, 41, 42, 43, 44`.
  O Gustavo pode editar.
- Na peça, cada tamanho da grade tem um liga/desliga "disponível". Peça nova nasce com todos
  desligados, e ele liga os que tem (assim nunca aparece tamanho que ele não marcou).
- Sem campo de marca. O nome é livre e o Gustavo escreve como já faz ("Camisa dry fit NK").

### Sacola

- Guardada no navegador do cliente (`localStorage`). Expira depois de 7 dias sem alteração.
  Sem `localStorage` disponível, funciona só em memória, sem erro.
- Mesma peça no mesmo tamanho soma na mesma linha. Quantidade de 1 a 10 por linha.
- Cada linha guarda uma cópia do nome e do preço do momento em que entrou, no formato que um dia
  será gravado como pedido:

```ts
type ItemDaSacola = {
  pecaId: string; nome: string; tamanho: string;
  precoUnitarioCentavos: number; // cópia do momento
  quantidade: number;
  kitId?: string; // de qual kit veio, se veio de um
};
type Sacola = { itens: ItemDaSacola[]; atualizadoEm: string };
```

### Preços e conferência

- Preços no banco em `numeric(10,2)`. No navegador, toda conta em centavos inteiros; só a exibição
  usa `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- Ao enviar o pedido, o site busca de novo preço, tamanhos e arquivamento de todas as peças da
  sacola, e se a loja está aberta. Se algo mudou, mostra o que mudou ("Camisa dry fit NK passou de
  R$ 89,90 para R$ 99,90", "Bermuda NK tam. M esgotou"), atualiza a sacola (remove o que esgotou) e
  pede para confirmar de novo.
- Sem rede nesse momento: abre o WhatsApp com os preços guardados e acrescenta à mensagem a linha
  "(preços conferidos no site em <data e hora>)", para o Gustavo saber que podem estar desatualizados.

### Kits

- Um kit é uma vitrine: título ("Dry fit NK + bermuda"), foto (normalmente a do post), descrição
  opcional, e 2 a 4 peças do catálogo, em ordem.
- Preço do kit = soma das peças disponíveis. Não há preço próprio nem desconto.
- O admin publica ou oculta o kit e define a ordem do carrossel.

### Painel administrativo (`/admin`)

- Login por e-mail e senha (Supabase Auth). Cadastro público desligado: só existem as contas criadas
  pelo dono do projeto.
- **Visão geral**: quantidade de peças, peças esgotadas (com atalho para religar tamanhos), kits com
  peça esgotada, e o interruptor **"Loja aberta / pausada"**.
- **Peças**: criar, editar (nome, preço, descrição, categoria, até 6 fotos com ordem, tamanhos
  disponíveis), arquivar, restaurar e excluir. A lista tem filtro por categoria e por "esgotadas".
  O slug sai do nome e não muda depois de publicado, para não quebrar links já compartilhados.
- **Kits**: criar e editar (título, foto, descrição, peças escolhidas da lista com busca por nome,
  ordem), publicar ou ocultar, excluir.
- **Categorias**: criar, renomear, reordenar, editar a grade de tamanhos, mostrar ou esconder.
  Categoria com peças não pode ser excluída, só escondida.
- **Configurações**: número do WhatsApp dos pedidos, link do Instagram, link do grupo de WhatsApp,
  texto de entrega do rodapé.
- **Fotos**: o navegador reduz antes de enviar (lado maior 1600 px, WebP). O banco guarda só o
  caminho no Storage. Excluir a peça apaga as fotos.
- **Excluir**: o padrão é arquivar (some do site, dá para restaurar). Exclusão definitiva com
  confirmação na própria tela.
- **Sair** encerra a sessão; rotas do admin sem sessão voltam ao login.
- Conta de admin com senha própria e forte, criada pelo Gabriel no painel do Supabase. Nenhuma senha
  no código nem no repositório. Contas de teste, se houver, são apagadas logo depois (um projeto só).

### Banco de dados (Supabase / Postgres)

- `categorias`: `id` uuid, `nome`, `slug` único, `grade` text[] (rótulos dos tamanhos em ordem),
  `ordem` int, `visivel` bool, `criado_em`, `atualizado_em`.
- `pecas`: `id` uuid, `categoria_id` → categorias, `nome`, `slug` único, `descricao`,
  `preco numeric(10,2) check (preco >= 0)`, `arquivada` bool, `criado_em`, `atualizado_em`.
- `peca_fotos`: `id`, `peca_id` → pecas (cascade), `path`, `ordem`.
- `peca_tamanhos`: `peca_id` → pecas (cascade), `tamanho` text, `disponivel` bool; chave primária
  (`peca_id`, `tamanho`). Ao mudar a grade da categoria, tamanhos novos entram desligados e os que
  saíram são apagados.
- `kits`: `id`, `titulo`, `slug` único, `descricao`, `foto_path`, `publicado` bool, `ordem`,
  `criado_em`, `atualizado_em`.
- `kit_pecas`: `kit_id` → kits (cascade), `peca_id` → pecas, `ordem`; chave primária composta.
- `configuracoes`: uma linha só: `loja_aberta` bool, `whatsapp_numero` text (só dígitos),
  `instagram_url`, `grupo_whatsapp_url`, `texto_entrega`.
- `admins`: `user_id` → `auth.users`. Quem está aqui pode escrever.

Segurança (RLS em todas as tabelas):

- Leitura pública (`anon`): categorias visíveis, peças não arquivadas de categorias visíveis, suas
  fotos e tamanhos, kits publicados e suas peças, e `configuracoes`.
- Escrita e leitura completa: só quem está em `admins`, pela função `is_admin()`.
- Storage: bucket `vitrine` com leitura pública; envio e remoção só para admins.
- Esquema, políticas e carga inicial versionados como migrações do Supabase.

### Prévia dos links

- Links `/p/:slug` e `/k/:slug` respondem com o `index.html` já com `og:title` (nome), `og:description`
  (preço e tamanhos disponíveis, ou "N peças · R$ total" no kit) e `og:image` (primeira foto ou foto
  do kit), lidos do Supabase por uma função da Cloudflare Pages (`functions/`). O resto do site é o app normal.
- Início e categorias usam uma prévia fixa com a logo (`cardoso-logo-avatar.png`) e "Moda masculina ·
  Capivari de Baixo, SC".
- Se a função falhar, devolve o `index.html` com a prévia fixa (o site nunca deixa de abrir por causa
  dela).

### Visual

- Direção **A, "Preto total"**, aprovada: https://claude.ai/artifact/2RoN4rJnPgjJswLhsThoP1
  (cópia em `docs/direcoes/direcoes.html`).
  - Cores: preto `#0A0A0A` (fundo), branco `#F2F2F0` (texto e botões), cinza carpete `#8C8A86`
    (textos secundários), linhas `#3A3A38`.
  - Fontes: Anton (títulos e nome da peça, em caixa alta), Oswald (rótulos, preços, botões, tamanhos),
    Barlow (texto corrido).
  - Fotos com cantos quase retos (3–4 px), botões retos, pílulas só nas categorias.
  - Tamanhos em quadrados; o escolhido fica branco; o indisponível fica riscado e apagado.
  - Botão principal branco com texto preto em caixa alta.
- **Sacola**: ícone de sacola em contorno, com alça e corpo levemente afunilado, sem nenhum desenho
  dentro; o número de itens num círculo branco no canto, com borda preta.
- **Tela da peça**: botão de voltar (seta) no canto de cima à esquerda e a sacola à direita, em
  círculos escuros semitransparentes por cima da foto.
- Logo: `brand/logo/` (vetor fiel ao perfil do Instagram). Topo do site usa
  `cardoso-nome-branco.svg`; ícone e prévia usam `cardoso-logo-avatar`. Guia em `brand/README.md`.
- Respeitar "reduzir movimento" do sistema no carrossel e nas transições.

### Estrutura e publicação

- Pastas por responsabilidade: `src/components`, `src/pages` (cliente), `src/admin`, `src/hooks`,
  `src/services` (Supabase), `src/lib` (dinheiro, sacola, mensagem), `src/types`, `public/`,
  `functions/` (função da prévia, Cloudflare Pages). Criar só o que cada etapa precisa.
- **Cloudflare Pages** ligada ao repositório (decisão do Gabriel em 2026-11-07, mesmo caminho da
  Marisa): produção = branch `producao`; a `main` gera o link de teste `main.<projeto>.pages.dev`.
  Endereço gratuito `.pages.dev` por enquanto. Variáveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
  (só a publicável) e `NODE_VERSION`. Painel da Cloudflare pelo Edge do Gabriel, conferindo a conta.
- **Um projeto Supabase só** (decisão do Gabriel em 2026-11-05, para não ocupar as 2 vagas gratuitas):
  `cardoso-menswear`, referência `gbhbzntuuysswbsptqgi`, região São Paulo (`sa-east-1`), na conta
  pessoal "GabrielCardossso's Org" (não na organização da empresa). Criado com tabelas novas não
  expostas automaticamente e RLS automático ligado. Todo dado de teste criado nele é apagado logo em
  seguida.
- Migrações em `supabase/migrations/` no repositório. Elas chegam ao banco pela integração do Supabase
  com o GitHub, com "deploy to production" apontado para a branch **`main`** (decisão do Gabriel em
  2026-11-05): com um banco só, a migração precisa estar no banco para ser testada antes da aprovação
  do código na `producao`. Por isso as migrações só acrescentam (nada de apagar ou renomear). **Revisto
  na publicação (2026-11-07) e mantido pela `main`:** como só acrescentam, o site no ar segue
  funcionando com o banco já migrado, e o link de teste da `main` funciona com o banco novo. Sem
  token da CLI no ambiente do Claude.
- Painel e configurações do Supabase são acessados pelo Edge do Gabriel (extensão Claude in Chrome),
  conferindo a conta antes de agir.

## Etapas

1. **Vitrine com dados de exemplo**: início, categoria, peça e kit no visual A, lendo um JSON local
   com peças e kits tirados dos posts do Instagram (preços de exemplo, marcados como exemplo).
2. **Sacola e WhatsApp**: sacola, persistência, finalizar, montagem da mensagem, abrir o WhatsApp,
   copiar mensagem.
3. **Supabase**: esquema, RLS, Storage, carga inicial a partir do JSON, conferência ao enviar.
4. **Painel administrativo**: login, visão geral, peças, kits, categorias, configurações, fotos.
5. **Prévia dos links e publicação**: função da prévia, Cloudflare Pages, conta de produção.

Cada etapa termina funcionando e verificada na `main`; a ida para `producao` é decisão do Gabriel.

## Verificação esperada

- Testes automatizados para: centavos e total, soma de linhas iguais na sacola, kit adicionando só as
  peças marcadas, expiração da sacola, montagem da mensagem (motoboy, envio, com e sem observação,
  linha de "preços conferidos"), validação de CEP, detecção de mudanças na conferência.
- Políticas de RLS verificadas: visitante lê e não escreve; admin escreve.
- Fluxo completo do cliente testado no navegador em 390 × 844, até a URL do WhatsApp gerada.
- Prévia de um link de peça conferida com uma ferramenta de depuração de Open Graph.

## Deixado para quem construir

Bibliotecas de roteamento, estado e formulários; o desenho exato das telas do admin, da categoria, do
kit e da finalização (seguindo a direção A); o formato dos testes; os detalhes das migrações e da
função da prévia. Tudo dentro das decisões acima.

## Ainda em aberto (não bloqueia o começo)

- Número de WhatsApp do Gustavo para os pedidos (o link da bio é de grupo, não serve para `wa.me`).
- Catálogo real: preços, tamanhos e quais peças entram. A etapa 1 usa exemplos.
- Grades de tamanho de calça e tênis: confirmar com o Gustavo.
- Domínio próprio: por enquanto, endereço gratuito `.pages.dev` da Cloudflare.
