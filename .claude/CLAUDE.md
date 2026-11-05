# Cardoso Menswear: instruções para o Claude

Vitrine online com pedidos pelo WhatsApp para a Cardoso Menswear (Capivari de Baixo, SC), loja do
Gustavo. Design da V1: `docs/superpowers/specs/2026-11-05-vitrine-pedidos-design.md`.

## Fluxo de branches

O repositório tem duas branches permanentes:

- **`main`**: desenvolvimento. Todo commit e todo código novo vai aqui.
- **`producao`**: o código que está no ar. O deploy sai dela.

Regras:

1. Sempre trabalhar e commitar na `main`. Nunca commitar direto na `producao`.
2. Só levar alterações da `main` para a `producao` quando estiverem verificadas, testadas e
   funcionando, e somente com o aval do Gabriel.
3. A promoção para `producao` é por merge da `main` (nada de rebase ou force-push nela).

## Autoria dos commits

- Todo commit sai no nome do Gabriel: `git config user.name "GabrielCardossso"` e
  `git config user.email "gabrielcardossso@gmail.com"`.
- Sem linhas `Co-Authored-By: Claude…` nem `Claude-Session:` nas mensagens de commit, inclusive
  nos commits feitos por subagentes. Pedido explícito do Gabriel.

## Decisões do projeto

- **O pedido termina no WhatsApp do Gustavo**, com mensagem pronta que começa com
  "Olá! Fiz este pedido pelo site". O site não cobra, não calcula frete e não grava pedido.
- **Direção visual A, "Preto total"** (`docs/direcoes/direcoes.html`): preto, branco e cinza carpete;
  Anton, Oswald e Barlow; sacola em contorno sem desenho dentro; botão de voltar na tela da peça.
- **Logo** em `brand/logo/`, refeita em vetor a partir da foto de perfil do Instagram
  (`brand/logo/referencia/perfil-150.jpg`). Para mudar, edite `brand/logo/ferramentas/gerar_logo.py`
  e rode `python brand/logo/ferramentas/gerar_logo.py brand/logo` e depois `renderizar.py`; não edite
  os SVG à mão. Confira sempre sobrepondo ao original antes de mostrar.
- **Kit** é uma vitrine que junta peças avulsas; preço = soma das peças.
- **Tamanhos**: grade por categoria, cada tamanho só liga/desliga (sem quantidade). Cada cor é uma peça.
- **Sem campo de marca**: o nome da peça é livre.
- Informações do Instagram da loja em `docs/instagram.md`.
