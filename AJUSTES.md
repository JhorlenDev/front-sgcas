# Ajustes da branch `ajustes-marreira` — front-sgcas

Este arquivo existe para quem chega depois: **o que foi mexido, por quê, e como
conferir**. Serve tanto para pessoa quanto para agente de IA que abrir o
repositório sem ter acompanhado a conversa.

Base da branch: `main` (`d695031`).

> **Depende da branch irmã.** A API mudou o formato das listagens. Este front só
> funciona contra `api-sgcas` na branch `ajustes-marreira` — contra a `main` da
> API, as telas de lista ficam vazias.

---

## Resumo

| # | O que | Tipo | Issue |
| --- | --- | --- | --- |
| 1 | Tela de Usuários deixou de apagar a lotação | correção (perda de dado) | [#1](https://github.com/JhorlenDev/front-sgcas/issues/1) |
| 2 | Painel e Acompanhamentos param de exibir o teto como total | correção | [#2](https://github.com/JhorlenDev/front-sgcas/issues/2) |
| 3 | Paginação e filtros nas listagens | melhoria | [#2](https://github.com/JhorlenDev/front-sgcas/issues/2) |
| 4 | Acentuação dos textos de interface | correção | [#3](https://github.com/JhorlenDev/front-sgcas/issues/3) |
| 5 | Expor por túnel deixou de dar 403 | correção de dev | — |
| 6 | `Dropdown` e `CampoData` próprios no lugar dos nativos | melhoria | — |
| 7 | Diálogo: animação corrigida e gaveta no celular | correção | — |
| 8 | Acertos nos componentes: clique no modal, rolagem, fundo, data antiga | correção | — |
| 9 | `Checkbox`, `GrupoDeEscolha` e `AreaDeTexto` | melhoria | — |
| 10 | Cantos arredondados seguindo a escala do design system | melhoria | — |
| 11 | Nomes e protocolos viraram links, respeitando permissão | melhoria | — |
| 12 | Prontuário do cidadão virou ficha completa | melhoria | — |
| 13 | Cabeçalho da barra lateral parou de estourar | correção | — |
| 14 | Esqueletos de carregamento no lugar de "Carregando…" | melhoria | — |
| 15 | Celular com cara de app: barra inferior, botão flutuante, cartões, gavetas | melhoria | — |
| 16 | Grid sem colunas declaradas estourava a largura no celular | correção | — |
| 17 | Exclusão de ação itinerante pelo `ConfirmDialog`, não `confirm()` | correção | — |
| 18 | Funcionalidades da `atualização-jhorlen` portadas para esta interface | integração | — |
| 19 | Situação do caso e prioridade com rótulo e cor únicos | correção | — |
| 20 | Cartões da fila encostados e folga no rodapé da gaveta | correção | — |
| 21 | Formulário de novo cidadão escrito duas vezes, com divergências | correção (duplicação) | — |
| 22 | Consulta ao cadastro central da Prefeitura ao informar o CPF | integração | — |

---

## 1. Tela de Usuários deixou de apagar a lotação

**Era:** o select "Unidade" mostrava **"Sem unidade"** para todo operador,
inclusive os lotados. Salvar o formulário — mesmo só para corrigir um nome —
**apagava a lotação de verdade**.

**Causa:** `src/app/admin/page.tsx:233` fazia `operador.unidade?.id`, mas
`GET /api/users/` devolvia `unidade` como string com o id, não como objeto. Em
uma string, `?.id` é `undefined`; o `defaultValue` caía para `""`; o submit
mandava `unidade_id: ""`; e a API gravava `None`.

O contador "Sem unidade" no topo lia `!operador.unidade` — numa string sempre
falso. Por isso o cartão dizia "0" enquanto o select dizia "Sem unidade" para
todo mundo: **duas leituras do mesmo campo se contradiziam na mesma tela**.

**Ficou:** a correção é na API — `unidade` passou a ser objeto nos dois
endpoints ([api#6](https://github.com/JhorlenDev/api-sgcas/issues/6)). Com o
contrato unificado, o `?.id` volta a funcionar. O tipo `Operador` em
`src/types/sgcas.ts` também foi acertado.

## 2. Painel e Acompanhamentos param de exibir o teto como total

**Era:** a API cortava `/cases/` em 100 e as telas tratavam o array recebido
como o conjunto completo.

- `src/app/dashboard/page.tsx:28` — "Casos em acompanhamento" era `casos.length`.
  Exibia **100** num município com 220.065 casos. E exibiria 100 para sempre.
- `src/app/casos/page.tsx:39-43` — os três cartões contavam as situações no
  cliente, sobre esses mesmos 100.

| | Tela | Banco |
| --- | --- | --- |
| Em triagem | 42 | **6.682** |
| Em atendimento | 10 | **4.420** |
| Finalizados/encaminhados | 41 | **186.958** |

"Em triagem: 42" quando há 6.682 é o tipo de número em que alguém decide
alocação de equipe.

**Ficou:** os contadores vêm de `GET /api/cases/resumo`, contados no banco e com
os mesmos filtros da lista — buscados **na mesma leva**, senão o número do topo
passa a descrever um recorte que não é mais o da lista de baixo.

O painel também avisa quando a lista está recortada e leva à tela completa, em
vez de mostrar seis linhas sem sinal de que existem outras.

## 3. Paginação e filtros

Não havia paginação em nenhuma tela — varri `src/app` inteiro. Com o teto de 100
na API, os outros 219.965 casos não tinham caminho pela interface.

| Tela | O que ganhou |
| --- | --- |
| **Acompanhamentos** | Busca (protocolo ou nome), situação, prioridade, período, ordenação e paginação. |
| **Cidadãos** | Busca paginada sobre o cadastro inteiro, com o total real ao lado do título. |
| **Usuários** | Busca por nome/e-mail, paginação, e contadores de "ativos" e "sem unidade" vindos de consulta própria. |
| **Painel, Fila, Recepção** | Passaram a ler o envelope e pedem o tamanho de página que a tela usa. |

Peças novas:

| Arquivo | Papel |
| --- | --- |
| `src/components/shared/paginacao.tsx` | Navegação. Mostra a faixa e o total ("26–50 de 220.065") e **some quando há uma página só** — controle de página numa lista que cabe inteira é ruído. |
| `src/lib/api.ts` | `comQuery()` monta a query ignorando valor vazio; `paginadoVazio()` é o resultado de falha. |
| `src/types/sgcas.ts` | `Paginado<T>`, `ResumoDeCasos`. |

Dois detalhes que não são óbvios no diff:

- **Filtro vazio não vai na query.** Enviar `?situacao=` faria a API filtrar por
  situação vazia e devolver nada: o filtro "todas" viraria o filtro "nenhuma".
- **Trocar de filtro volta para a página 1.** Manter a página 7 depois de mudar o
  recorte costuma cair além do fim do novo resultado e mostrar lista vazia, que
  a pessoa lê como "nada encontrado".

A busca tem espera de 350 ms: cada tecla dispararia uma consulta paginada e um
resumo sobre 220 mil casos.

## 4. Acentuação

Corrigidos os textos exibidos ao usuário no painel, na fila, no prontuário, no
cadastro de cidadão e na busca. Identificadores, chaves de formulário
(`name="endereco"`), slugs e nomes de rota ficaram como estão — não são texto
lido por ninguém.

## 5. Expor por túnel deixou de dar 403

Ao expor a aplicação por um túnel para alguém testar de fora, o dev server
recusava as requisições e devolvia **403 em `/_next/*`**: a página carregava,
nenhum script vinha junto, e o console enchia de 403 sem dizer o porquê. É
proteção do próprio Next contra outro site ler o dev server.

`next.config.ts` passou a ler `allowedDevOrigins` de `NEXT_DEV_ORIGINS` — a URL
do túnel muda a cada execução e não pertence ao repositório:

```bash
NEXT_DEV_ORIGINS="*.trycloudflare.com" npm run dev -- -p 3001
```

Mas o caminho certo para expor é **servir o build de produção**: `next start`
não tem esse bloqueio nem WebSocket de HMR tentando reconectar contra o túnel.
Está documentado no [README](README.md#expor-a-aplicação-por-um-túnel).

---

## 6. Componentes de formulário próprios

Os `<select>` nativos e os `<input type="date">` saíram das telas. Não é troca
estética: o nativo não aceita descrição por opção, não tem busca, e muda de
aparência, de idioma e de **ordem dos campos** conforme navegador e sistema — o
`type="date"` aparece como `mm/dd/aaaa` para quem tem o sistema em inglês, o que
numa tela em português é convite a registrar a data errada.

### `Dropdown` (`src/components/ui/dropdown.tsx`)

Substitui os **18** `<select>` do sistema.

- **Busca automática acima de 7 opções.** Sete é o ponto em que a lista deixa de
  ser lida de uma vez e passa a ser varrida. O caso que motivou o número: o
  seletor de serviço da recepção tem 137 opções. A busca ignora acento
  (`normalize("NFD")`), então "servico" encontra "Serviço".
- **Segunda linha por opção** (`hint`), onde cabe o que antes ficava espremido:
  a unidade do serviço, a dica do perfil, o prefixo da senha por prioridade.
- **Teclado completo**: setas, Home, End, Enter, Esc, Tab, e digitar para pular
  quando não há campo de busca — o comportamento que o nativo tinha e que se
  perde em quase toda substituição.
- **ARIA de combobox/listbox** com `aria-activedescendant`.
- **Funciona nos dois modos de uso do sistema**: controlado (`value`/`onChange`)
  e dentro de `<form>` lido por `FormData` — neste caso renderiza um input
  oculto com o `name`, porque metade dos formulários é lida com
  `new FormData(event.currentTarget)`.
- A lista é `position: fixed` em portal, para escapar de qualquer ancestral com
  `overflow` — e acompanha rolagem e redimensionamento enquanto aberta.

### `CampoData` (`src/components/ui/campo-data.tsx`)

Substitui os **6** campos de data.

- Máscara `dd/mm/aaaa` sempre nessa ordem, mais calendário para escolher
  olhando. Emite ISO.
- Valida o dia contra o mês: `31/02` casa com a máscara e não existe.
- **Nunca passa por `new Date(iso)`** para exibir. `new Date("2026-09-08")` é
  lido como meia-noite UTC e, num fuso a oeste, volta como dia 7 — o campo
  mostraria um dia a menos que o gravado.
- `min`/`max` desabilitam o que está fora, atalhos "Hoje" e "Limpar", e `comHora`
  para o caso do `datetime-local` das ações itinerantes.

## 7. Diálogo: animação corrigida e gaveta no celular

**Era:** o modal atravessava a tela na diagonal, do canto inferior direito até o
meio.

**Causa:** o conteúdo era centralizado com `translate(-50%, -50%)` e animado com
`zoom-in-95` do `tailwindcss-animate`. Aquele utilitário anima a propriedade
`transform` inteira — e, ao fazê-lo, apagava a centralização durante a animação.
O modal partia da posição sem translate (canto inferior direito) e escorregava
até o lugar.

**Ficou:** a centralização é do flex do contêiner, então nenhum `transform` é
necessário para posicionar, e a animação mexe só em opacidade e deslocamento
vertical — o "fade in up" pedido.

**No celular (< 640px) o diálogo é uma gaveta**: ancorada na borda inferior,
cantos superiores arredondados, alça visível, sobe deslizando, respeita
`env(safe-area-inset-bottom)` e **fecha arrastando para baixo**. O arrasto só
começa quando o conteúdo já está no topo, senão roubaria a rolagem.

Dois detalhes de comportamento: na gaveta o foco automático é suprimido
(focar o primeiro campo abriria o teclado por cima do que a pessoa acabou de
mandar abrir), e todas as animações respeitam `prefers-reduced-motion`.

Os mesmos princípios valem para o dropdown e o calendário: no celular, os dois
abrem como gaveta.


## 8. Acertos nos componentes, depois de usar

A primeira versão dos componentes tinha quatro problemas que só apareceram com
eles nas telas:

**O calendário abria dentro do modal e o clique não selecionava** — parecia
escolher um input em vez da data. Duas causas somadas:

- Enquanto um diálogo modal está aberto, o Radix põe `pointer-events: none` no
  `body`. Os painéis flutuantes são filhos do `body`, então **desenhavam na tela
  mas o clique atravessava** e caía no formulário atrás. Corrigido com
  `pointer-events-auto` explícito nos painéis.
- Para o Radix, um portal no `body` é o mundo exterior: clicar numa opção
  contava como clique fora e o diálogo devolvia o foco ao primeiro campo. Os
  painéis passaram a se marcar com `data-camada-flutuante`, e o `DialogContent`
  ignora `onPointerDownOutside`, `onInteractOutside` e `onFocusOutside` vindos
  deles.

**A barra de rolagem do diálogo pesava mais que o conteúdo.** Classe
`.rolagem-sutil` em `globals.css`: pista transparente, polegar só aparece com o
ponteiro sobre a área, e `scrollbar-gutter: stable` para o conteúdo não saltar
quando ela surge.

**Parecia haver uma caixa comendo os campos.** Era o `overflow-y-auto` do corpo
do diálogo cortando o anel de foco dos inputs rente à borda — o padding estava
no contêiner de fora. Movido para dentro da área que rola, o anel voltou a ter
espaço.

**Os campos novos pareciam desabilitados** ao lado dos antigos: usavam
`bg-background` (o cinza da página) enquanto o `.input` do design system usa
`bg-elevated`. Dropdown e campo de data passaram a repetir exatamente a caixa do
`.input` — fundo, borda e raio.

### Data antiga

O calendário ganhou **mês e ano navegáveis** no cabeçalho. Data de nascimento é
o caso comum deste campo, e chegar a 1958 clicando "mês anterior" são mais de
800 cliques. A faixa sai de `min`/`max` quando existirem; sem eles, 110 anos
para trás. Digitar continua sendo o caminho mais curto — o campo aceita
`dd/mm/aaaa` e mascara sozinho.

Digitar uma data que **não existe** (31/02, por exemplo) agora limpa o valor
enviado e mostra o aviso. Antes o campo exibia `31/02/1990` e o formulário
mandava calado a data anterior — a tela dizia uma coisa e o envio, outra.

## 9. Componentes de marcação

`src/components/ui/marcacao.tsx`:

| Componente | Onde |
| --- | --- |
| `Checkbox` | LGPD no cadastro de cidadão, "Ativo" na tela de usuários |
| `GrupoDeEscolha` | escolha única em rádio — disponível, ainda sem uso nas telas |
| `AreaDeTexto` | as 9 `<textarea>` do sistema |

O `<input type=checkbox>` do navegador tem cerca de 13×13 pixels e não aceita
estilo — pequeno demais para o dedo, já que o alvo confortável é 44px. Aqui o
input nativo continua existindo, invisível, com a caixa desenhada por cima:
é ele que carrega o valor no `FormData`, recebe foco e responde ao teclado, então
nada de acessibilidade se perde. A caixa ainda aceita `descricao`, que é onde
cabe a explicação que antes ficava solta embaixo.


## 10. Cantos: a escala de raio do design system passou a valer

Cartões, painéis, listas e estados vazios eram quadrados (`rounded-none`), ao
lado de botões e campos arredondados. Não havia decisão por trás — o próprio
`design-system/pmt-sem-reset.css` já anota a intenção de cada token, e ela não
estava sendo seguida.

| Token | Valor | Onde |
| --- | --- | --- |
| `--pmt-radius-md` | 7px | botão, campo, gatilho do dropdown, pastilha de senha |
| `--pmt-radius-lg` | 8px | cartão, painel, seção, linha de lista, estado vazio |
| `--pmt-radius-xl` | 14px | modal, dropdown aberto, calendário — as camadas flutuantes |

O contêiner ficou com raio maior que o conteúdo, que é a hierarquia esperada:
um campo de 7px dentro de um cartão de 8px acompanha a curva em vez de brigar
com ela.

Ficaram **sem** raio, de propósito: divisórias (`.line-row`, `.plain-row` — são
linhas, não caixas), contêineres de tela cheia, a barra lateral (encosta na
borda) e a variante `link` do botão, que não tem caixa nenhuma.


## 11. Nomes viraram links

Nome de cidadão, de servidor e protocolo de caso agora levam ao registro
correspondente, em vez de serem texto morto no meio da tela.

| Link | Vai para | Quem enxerga como link |
| --- | --- | --- |
| Nome do cidadão | `/cidadaos/:id` | ADMIN, coordenador, assistente social, técnico, gestor de ações |
| Nome do servidor | `/admin?busca=<nome>` | ADMIN e coordenador |
| Protocolo do caso | `/casos?busca=<protocolo>` | todos |

Fonte única em `src/components/shared/links.tsx`.

### O link respeita a permissão

`GET /api/citizens/:id` exige `EquipeDeAtendimento`, que **não inclui recepção
nem visualizador** — eles alcançam o histórico municipal, não o prontuário. Para
esses papéis o nome continua texto simples.

É deliberado: um link que leva a uma tela de erro é pior do que texto, porque
promete uma coisa e entrega outra. Conferido no navegador — como ADMIN, o painel
tem 12 nomes clicáveis; como recepcionista, zero, e os nomes seguem visíveis.

### Filtros passaram a nascer da URL

Para os links de servidor e de protocolo funcionarem, `/casos` e `/admin` leem
os filtros de `useSearchParams`. Efeito colateral bem-vindo: **qualquer recorte
virou compartilhável** — colar o link manda a outra pessoa para a mesma lista
que você está vendo.

`useSearchParams` obriga a um limite de `<Suspense>` em rota prerenderizada
(documentado em `node_modules/next/dist/docs/.../use-search-params.md`); sem
ele o build falha, porque a URL não existe na hora de gerar o HTML.

### Onde o nome **não** virou link

Nos cartões que já são um `<button>` inteiro — a lista de acompanhamentos e o
resultado da busca da recepção. Âncora dentro de botão é HTML inválido, e nesses
casos o próprio cartão já navega: a lista de cidadãos abre o prontuário, e o
cartão de caso abre o diálogo, onde o nome **é** link. Em `/casos` o protocolo
também não vira link, porque levaria à mesma tela.


## 12. Prontuário do cidadão virou ficha

A tela mostrava três linhas — endereço, NIS e observações — enquanto a API
devolvia trinta e poucos campos. Documento, escolaridade, raça/cor, perfil
socioeconômico, composição familiar e consentimentos estavam no banco, viajavam
na resposta e não apareciam em lugar nenhum.

Agora são **10 seções**: identificação, contato, endereço, perfil
socioeconômico, composição familiar, observações, consentimentos (LGPD),
anexos, acompanhamentos e histórico municipal.

### Valor de máquina não vai para a tela

`src/lib/rotulos.ts` traduz o que o banco guarda: `FUNDAMENTAL_INCOMPLETO` vira
"Fundamental incompleto", `NAO_DECLARADA` vira "Não declarada". Fica fora dos
componentes porque os mesmos valores aparecem em outras telas, e rótulo
divergente entre elas é o tipo de inconsistência que ninguém nota até alguém
perguntar por quê.

Quando o valor é desconhecido, o cru aparece **de propósito** — valor novo no
banco fica feio na tela, o que é um aviso; sumir com ele esconderia a informação
e o fato de a tradução ter ficado para trás.

Também dali saem as máscaras (CPF, NIS, CEP, telefone), o dinheiro em reais e a
idade. A idade compara mês e dia em vez de dividir milissegundos por 365 — a
conta por subtração erra em ano bissexto e em quem faz aniversário hoje.

### Campo vazio continua aparecendo

Marcado como "Não informado", em cinza. Some com ele e a ficha ganha buracos
irregulares — e, pior, esconde que o dado **falta**. Numa ficha de assistência
social isso é informação: é o que diz à próxima pessoa o que ainda precisa ser
perguntado.

### O que a ficha ganhou além do cadastro

- **Aviso no topo** quando há caso em aberto, deficiência declarada, cadastro
  vindo de ação itinerante ou uso de imagem revogado.
- **Acompanhamentos** da pessoa, com o protocolo levando à lista filtrada.
- **Histórico municipal** com a marca de "mês corrente", que é o que a recepção
  precisa ver antes de conceder de novo.


## 13. Cabeçalho da barra lateral parou de estourar

Com a barra aberta, a marca "SGCAS / Assistência Social" aparecia deslocada para
a direita, o botão de minimizar ficava espremido contra a borda, sobrava um vão
grande até o primeiro item do menu e surgia uma **barra de rolagem horizontal**
no rodapé da barra lateral.

Causa única: o `Brand` (`src/components/app-shell.tsx`) tinha `mb-8 px-6`
próprios, e o cabeçalho que o contém **também** aplicava `mb-8 px-6`. O
espaçamento somava — 48px de recuo à esquerda e 64px abaixo — e o conteúdo
passava dos 256px da barra. Como a coluna tem `overflow-y-auto`, o navegador
liga a rolagem nos dois eixos, e o estouro virou barra horizontal.

- O `Brand` ficou sem margem nem padding: quem posiciona é o cabeçalho
  (`px-5`, `gap-2`).
- Ícone e texto usam `gap-3` em vez de `mr-3` condicional; o texto tem `min-w-0`
  para nunca empurrar o botão para fora.
- A coluna ganhou `overflow-x-hidden` como rede de segurança.
- A prop `compact` do `Brand` perdeu a razão de existir e saiu.

**Como conferir:** em 1366×700, com a barra aberta, o botão de minimizar termina
20px antes da borda e `scrollWidth` da coluna é igual a `clientWidth` (255px).
Minimizada, a marca continua centralizada e o botão de expandir segue sobre a
borda, como antes.


## 14. Esqueletos de carregamento

As telas mostravam "Carregando…" solto — e, na sessão, a frase no meio do vazio
fazia o sistema inteiro sumir por um instante a cada navegação. Agora a moldura
(barra lateral e cabeçalho) aparece na hora, e cada bloco que espera dado vira o
seu esqueleto.

- **Por tipo de bloco, não por página** — `src/components/skeletons/blocos.tsx`:
  indicador, faixa de resumos, lista, tabela, filtros, seção da ficha. Cada um
  espelha grid, alturas e espaçamento do bloco real, para o conteúdo entrar sem
  a página pular.
- **Só a primeira carga.** Trocar de página ou de filtro mantém a lista na tela
  em vez de piscar esqueleto de novo.
- **A ficha do cidadão** não renderiza mais com "Não informado" em todo campo
  enquanto a resposta não chega — parecia um cadastro vazio de verdade.
- `/casos` e `/admin` usam o esqueleto como fallback do `<Suspense>`.
- O `Skeleton` trocou o `animate-pulse` sobre `bg-border/70`, que sumia no fundo
  bege, por uma faixa clara atravessando a barra (`animate-brilho`). Com
  `prefers-reduced-motion`, a barra fica parada.


## 15. Celular com cara de app

Abaixo de `md` (768px) o sistema deixou de ser o site de desktop espremido.
Antes: menu hambúrguer no canto de cima, ação principal que sumia ao rolar,
tabelas estourando a tela (até 985px num celular de 390px) e modal com o
"Salvar" escondido no fim do formulário.

| Peça | Onde | O que faz |
| --- | --- | --- |
| Barra inferior | `src/components/app-shell.tsx` | 4 abas por papel + "Mais", fixa no pé, respeitando a barra de gestos |
| Gaveta "Mais" | `app-shell.tsx` (`GavetaMais`) | resto do menu, perfil (papel e unidade) e Sair; o avatar abre a mesma |
| Botão flutuante | `src/components/ui/botao-flutuante.tsx` | ação principal da tela acima da barra; com 2+ ações, abre gaveta de escolha |
| Cartões | `.tabela-responsiva` em `src/app/globals.css` | cada linha de tabela vira cartão quando o contêiner fica estreito |
| Rodapé da gaveta | `DialogFooter` em `src/components/ui/dialog.tsx` | botões grudados no pé da gaveta, lado a lado |
| Filtros na gaveta | `src/components/shared/filtros-na-gaveta.tsx` | em `/casos`, a busca fica à vista e o resto vira botão "Filtros e ordem" |
| Abas da Recepção | `src/app/recepcao/page.tsx` | três colunas iguais com rótulo curto, em vez de empilhadas |

### Abas por papel

A barra comporta 5 posições; a quinta é "Mais". As 4 primeiras seguem o uso de
cada papel (`ABAS_POR_PAPEL`), não a ordem da barra lateral:

| Papel | Abas |
| --- | --- |
| ADMIN | Painel · Cidadãos · Recepção · Atender |
| COORDENADOR | Painel · Casos · Atender · Cidadãos |
| ASSISTENTE_SOCIAL, TECNICO | Atender · Casos · Cidadãos · Painel |
| RECEPCIONISTA | Recepção · Cidadãos · Atender · Painel |
| GESTOR_ACOES_ITINERANTES | Ações · Cidadãos · Painel · Casos |
| VISUALIZADOR | Cidadãos · Painel · Casos · Atender |

Item que o papel não enxerga é pulado e a barra completa pela ordem da lateral,
para nunca nascer com buraco. Quando a tela atual mora na gaveta, a aba "Mais"
fica marcada.

### A ação da tela é declarada uma vez

`PageHeader` recebe `acoes={[{ rotulo, icone, onClick | href }]}` e desenha as
duas formas: botões no cabeçalho do desktop, botão flutuante no celular. A prop
`action`, que recebia JSX solto, saiu — com ela cada página teria de escrever as
duas formas à mão, e uma delas ficaria para trás na primeira mudança de regra. O
`main` reserva espaço para o botão com `has-[[data-fab]]`, para ele não cobrir
o último item da lista.

### Tabela → cartão

O corte é por **container query** (`48rem`), não por breakpoint de tela: a
mesma tabela aperta num celular, num tablet com a barra lateral aberta e numa
coluna de `grid two` no desktop. Toda `<td>` declara `data-rotulo` (o texto do
cabeçalho); `data-papel="titulo"` e `data-papel="acoes"` marcam a linha de
destaque e a faixa de botões.

```tsx
<div className="tabela-responsiva">
  <table className="table">
    …
    <td data-papel="titulo"><strong>{nome}</strong></td>
    <td data-rotulo="CPF">{cpf}</td>
    <td data-papel="acoes">…botões…</td>
```

A tabela de ações itinerantes caiu de 7 para 5 colunas: local foi para baixo do
título e unidade para baixo do responsável.

### De quebra

- `viewport-fit=cover` no layout — sem ele, `env(safe-area-inset-*)` vale zero
  e a barra inferior encosta na barra de gestos do iPhone.
- O link "Pular para o conteúdo" apontava para `#conteudo`, que não existia.
- A Recepção tinha `<Link><button>`, elemento interativo dentro de outro.
- O papel aparece como "Administrador", não `ADMIN`. A lista de papéis saiu de
  `/admin` para `src/lib/rotulos.ts` (`PAPEIS`, `rotuloDoPapel`).

**Como conferir:** abrir qualquer tela com a janela em 390px (DevTools, modo
dispositivo). `document.documentElement.scrollWidth` deve dar 390 em todas; em
`/cidadaos` e `/acoes-itinerantes` as linhas aparecem como cartões; o botão
"Novo cadastro" flutua sobre a barra; ao abri-lo, "Salvar cadastro" fica visível
no pé da gaveta sem rolar. Em 768px (tablet) a tabela de ações também vira
cartão; em 1366px tudo volta à tabela, com os botões no cabeçalho.


## 16. Grid sem colunas estourava a largura

Em `/admin`, num celular de 390px, os cartões de solicitações e operadores
mediam 479px e o lado direito ficava fora da tela.

Causa: `grid` sem `grid-cols-*` cria uma coluna `auto`, que cresce até a largura
mínima do conteúdo mais largo — e texto com `truncate` (o rótulo do `Dropdown`)
conta a largura inteira nesse cálculo. Não era só `/admin`: valia para as 38
grades `grid md:grid-cols-2` abaixo de `md`, que são justamente as de formulário
dentro dos modais.

A correção fica no `.grid` do projeto (`grid-template-columns: minmax(0, 1fr)`),
não grade a grade. Não existe `grid-flow-col` no código, então uma coluna
explícita não muda o arranjo de tela nenhuma; `grid-cols-*` continua vencendo
por ser utilitário.


## 17. Exclusão de ação itinerante pelo `ConfirmDialog`

`/acoes-itinerantes` excluía com `confirm()` e avisava erro com `alert()`: caixa
do navegador, fora da identidade visual, sem gaveta no celular, e o erro não
dizia o que tinha acontecido. Agora é o `ConfirmDialog` do projeto, que mostra a
mensagem da API e fica aberto para tentar de novo.

O texto diz o que o endpoint faz: a exclusão é **lógica** (`excluida_em`), o
registro continua no banco, mas nenhuma tela restaura.


## 18. Integração da `atualização-jhorlen`

A branch do Jhorlen (commit `a1af3f3`, 10/09) **não entrou por merge**: ela
partia de antes da identidade PMT 2026 da `main`, usava classes de estilo que
não existem mais (`meta-slate`, `rounded-card`, `shadow-lift`), lia `/queues/`
como lista simples (a API desta branch devolve envelope paginado) e dava
conflito em 5 arquivos. Decisão do Paulo: **a interface desta branch
prevalece**; o que veio dela foram as funcionalidades e o fluxo, reescritos
aqui, com o commit dele citado no corpo de cada commit.

Na API, a branch dele entrou por merge — ver `api-sgcas/AJUSTES.md`, item 11.

| O que | Onde | Diferença em relação ao original |
| --- | --- | --- |
| Retomada do atendimento aberto | `/fila` | ver abaixo |
| Indicadores clicáveis | `/fila` | lê o envelope paginado (10 por página); o cartão é o botão, sem `<section>` dentro de `<button>` |
| Mensagem de erro real da API | `src/lib/api.ts` | também lê validação do DRF (`{campo: [msg]}`) e passou a valer nos 17 pontos de falha das telas |
| Situação do caso traduzida no Painel | `/dashboard` | badge e rótulos do sistema, sem as cores soltas (blue/amber/violet) do original |
| CPF formatado, "Não encontrou? Cadastrar cidadão", "Trocar cidadão" | `/cidadaos`, `/recepcao` | — |

### Retomada do atendimento

O defeito: recarregar `/fila` no meio de um atendimento perdia a senha da tela.
Ela seguia `EM_ATENDIMENTO` no banco, sem ninguém, e o próximo "Chamar próximo"
puxava outra pessoa. Na base de carga, o ADMIN de teste tinha **10 senhas presas**
assim.

- Ao abrir `/fila`, a tela pergunta a `/queues/atendimento-atual` e devolve a
  senha aberta para "Atendimento atual", com aviso.
- Com um atendimento aberto, o botão do cabeçalho (e o flutuante no celular)
  deixa de ser "Chamar próximo" e vira **"Senha X"**, que leva de volta a ele —
  em vez de um botão desabilitado sem explicação, como no original.
- "Chamar próximo" trava contra duplo clique por `ref` síncrona.
- **"Senhas em atendimento"** lista as da unidade: as suas se retomam, as dos
  outros mostram quem está com elas.
- Aviso para quem não tem unidade ou não pode chamar. Falha ao carregar deixa de
  parecer "fila vazia". A fila ganhou "Atualizar".

A falha na busca do atendimento aberto **não trava** o botão (no original,
travava): a API devolve a senha aberta no `chamar-proximo` de qualquer jeito.

### Mensagem de erro com contexto

`mensagemDeErro(erro, contexto, reserva)` junta o que se tentava fazer com o
motivo da API — "Não foi possível cadastrar a unidade: Já existe unidade com esta
sigla". Sem motivo aproveitável, vale a reserva. Antes, 10 pontos descartavam o
motivo (`catch {}`) e 7 mostravam `error.message` cru, que com a rede caída
aparecia como "Failed to fetch", em inglês. Resposta HTML (502 do túnel) não
estoura mais `JSON.parse`.

### Achados na varredura, corrigidos junto

- **Permissões espelhadas numa fonte só** — `src/lib/permissoes.ts`
  (`ehEquipeDeAtendimento`, `ehSupervisao`). O original copiava a lista de
  papéis dentro da tela.
- O botão "Novo cidadão" da Recepção levava à lista `/cidadaos`, não ao cadastro.
- Nos resultados da busca da Recepção, havendo CPF, o bairro sumia.

**Não veio:** o teste de navegador `scripts/test-fila.mjs`. Ele simula o formato
antigo da API e os textos da interface antiga; reescrever é trabalho próprio.

**Como conferir:** entrar como ADMIN e abrir `/fila` — a senha presa volta para
"Atendimento atual" e o botão vira "Senha …". "Senhas em atendimento" lista 17 na
base de carga, 10 retomáveis. O cartão "Acompanhamento" abre "1–10 de 3.121
casos".


## 19. Situação do caso e prioridade: rótulo e cor únicos

A situação do caso tinha três traduções, com cores trocadas entre as telas:

| Tela | `EM_TRIAGEM` | `CONCLUIDO` |
| --- | --- | --- |
| `/casos` | "Em triagem", amarelo | badge "Finalizado", filtro "Concluído" |
| `/fila`, `/recepcao` | "Na fila/triagem", vermelho | "Concluído" |
| ficha do cidadão | "em triagem", minúsculo | — |
| Painel | `EM_TRIAGEM` cru | — |

A prioridade era a mesma função copiada em três telas, e no cartão "Atendimento
atual" aparecia crua (`URGENTE`) e sempre amarela.

Fonte única em `src/lib/rotulos.ts`: `SITUACOES_DO_CASO` e `PRIORIDADES`, cada
item com rótulo e tom, e o filtro de `/casos` deriva dela. As **cores seguem
`/casos`**, cujos cartões de resumo já as usam — o que muda para quem usa `/fila`
e `/recepcao`: "Em triagem" passa de vermelho a amarelo, "Em atendimento" de
amarelo a vermelho.


## 20. Espaçamento da fila e rodapé da gaveta

- **Cartões da fila encostados** em `/fila`: eram filhos diretos do `Card`, sem
  `gap`, e as bordas se tocavam. O esqueleto copiava o aperto de propósito;
  agora os dois usam `gap-3`.
- **Rodapé fixo da gaveta com folga** (defeito do item 15): `sticky` para no fim
  do conteúdo do contêiner de rolagem, descontado o padding, e sobrava uma faixa
  de 20px abaixo de "Salvar" em que o formulário aparecia passando. Medido: 20px
  antes, 0 depois.


## Como revisar

```bash
git fetch origin && git checkout ajustes-marreira
npm install
npm run lint && npx tsc --noEmit && npm run build
npm run dev -- -p 3001
```

A API precisa estar na branch `ajustes-marreira` do `api-sgcas`, com
`semear_demo` (ou `semear_carga`, para ver a paginação valendo a pena) rodado.

---

## O que **não** foi feito

Nenhuma tela ganhou estado de erro visível quando a chamada falha: `paginadoVazio()`
faz a lista aparecer vazia, que é indistinguível de "não há registros". Vale
tratar, mas era mudança de escopo maior do que o que estava sendo corrigido.

Da versão de celular (item 15):

- **Não é PWA.** Não há `manifest.json` nem ícone de instalação: a cara de app é
  de layout, a pessoa ainda abre pelo navegador.
- **Entre 640px e 767px** a barra inferior já aparece, mas o diálogo ainda abre
  centralizado (a gaveta vale abaixo de `sm`). É a faixa de tablet pequeno em
  retrato, rara no uso real.
- **No desktop, as tabelas de `/institucional` aparecem como cartões**: cada uma
  mora numa coluna de `grid two`, que fica abaixo do corte de 48rem. Não é
  efeito colateral escondido — era ali que as tabelas de 4 colunas apertavam.
- **Nenhum guard verifica `data-rotulo`.** Uma `<td>` nova sem o atributo vira
  linha sem rótulo no cartão; hoje depende de revisão.

---

## 21. Formulário de novo cidadão escrito duas vezes

**Era:** o mesmo formulário existia em dois lugares — a página
`/cidadaos/novo` e o diálogo "Novo cadastro" da lista — cada um com sua cópia
do markup.

**Estragava:** já tinham divergido em coisas que ninguém escolheu. A página não
tinha placeholder em campo nenhum, gravava a cidade como **"Tefe"** sem acento
(o diálogo gravava "Tefé"), e as duas dispunham os campos em grades diferentes.
Qualquer coisa nova precisaria ser escrita duas vezes — e as duas iam divergir
de novo na primeira correção.

**Ficou:** `src/components/cidadaos/campos-do-cidadao.tsx`, usado pelas duas
telas. As cascas de submit e de confirmação continuam separadas: o que era
comum eram os campos, não o fluxo.

Os campos passaram a ser **controlados**, que é o que permite preenchê-los de
fora (item 22). Todos mantêm o `name`, então as duas telas continuam lendo o
formulário com `FormData` sem saber que há estado dentro do componente. Como
`form.reset()` não limpa campo controlado, o diálogo remonta o componente
trocando a `key`.

De passagem, o CPF ganhou máscara progressiva e passou a enviar **só os
dígitos** por um campo oculto — a máscara ficou sendo só leitura. `formatCPFInput`
e `isValidCPF` já existiam em `src/lib/utils.ts` **sem nenhum uso**.

## 22. Consulta ao cadastro central ao informar o CPF

**Era:** cada secretaria redigitava a mesma pessoa do zero, e nada avisava o
atendente de que aquele CPF já tinha cadastro — nem na Prefeitura, nem no
próprio SGCAS.

**Ficou:** quando o atendente termina de digitar o CPF, o formulário pergunta ao
cadastro central da Prefeitura (`GET /api/citizens/consulta-central`).

| Resposta | O que a tela faz |
| --- | --- |
| Está na central, **não** está aqui | Diálogo "Encontramos esta pessoa no cadastro central" com **Preencher** / **Não preencher** |
| Já tem cadastro **aqui** | Aviso no topo do formulário, com link para a ficha existente. **Sem** diálogo de preenchimento |
| Não encontrado, falhou, desligado, CPF inválido | Nada. Silêncio |

**Por que a duplicata local tira o diálogo:** quem já tem cadastro aqui não
precisa de formulário preenchido, precisa que o atendente abra a ficha que
existe. Oferecer o preenchimento convidaria exatamente a duplicata que o aviso
está tentando evitar — e o diálogo ainda cobriria o aviso.

**Por que o aviso é no topo:** no rodapé, a duplicata só seria vista depois de o
atendente ter redigitado a pessoa inteira.

**Campos preenchidos ficam destacados**, com a linha "confirme com a pessoa
antes de salvar". Editar um deles à mão tira o destaque — mantê-lo passaria a
afirmar uma origem que não é mais verdade.

### CPF errado é acusado ao sair do campo

A validação existia só no servidor: o atendente digitava o número errado, não
recebia sinal nenhum, preenchia **o formulário inteiro** e só descobria o erro
ao salvar. O CPF é o primeiro campo — o mais caro de voltar para corrigir.

| Estado ao sair do campo | Mensagem |
| --- | --- |
| Vazio | nenhuma (o CPF é opcional — atendimento de rua às vezes começa sem documento) |
| Menos de 11 dígitos | "CPF incompleto — faltam dígitos." |
| 11 dígitos, verificador errado | "CPF inválido — confira o número digitado." |

**Só no `blur`, nunca a cada tecla** — a cada tecla, todo CPF pela metade
estaria "errado" enquanto a pessoa ainda digita. Mas **enquanto há erro na
tela** ele é reconferido a cada tecla, para sumir no instante em que o número
fica certo, em vez de continuar acusando quem já corrigiu.

O erro também trava o envio, por `setCustomValidity`: é o próprio navegador que
barra e devolve o foco ao campo, o mesmo mecanismo do `required` que já existe
em nome e e-mail. O servidor continua sendo a autoridade — isto é o aviso, não
a garantia.

Com erro na tela, a consulta à central **não** sai: número que não é CPF não
tem por que gastar requisição.

Para isso, dois ajustes em `src/components/ui.tsx`:

- `Field` passou a aceitar `erro`. A mensagem fica **fora** do `<label>` — que
  só aceita conteúdo de frase, e um `<p>` dentro dele é HTML inválido.
- `Input` passou a aceitar `ref` (`ComponentPropsWithRef` no lugar de
  `InputHTMLAttributes`). Em React 19 a ref é prop comum, mas o tipo antigo não
  a declarava e quem precisasse dela caía num erro de tipo sem saída.
- A grade de duas colunas ganhou `items-start`: sem isso, o campo que ganha a
  mensagem estica o irmão da mesma linha, que fica com o input mais alto.

> Existe um `src/components/shared/form-field.tsx` com rótulo + erro, **sem uso
> em lugar nenhum** e com estilo de rótulo diferente do `Field` que o app
> inteiro usa. Adotá-lo deixaria só o CPF com cara diferente. Ficou onde está.

### Cuidado com o teto da central

São 120 requisições por minuto **por IP**, e todos os atendentes do prédio saem
pelo mesmo. Por isso:

- a consulta só dispara com 11 dígitos **e** verificador válido, no `blur` —
  nunca a cada tecla;
- a resposta fica guardada por CPF na aba: voltar ao campo para conferir um
  dígito não gera consulta nova.

O verificador também resolve uma ambiguidade do lado da API: a central responde
**404 tanto para CPF inexistente quanto para malformado**. Sem validar antes,
"essa pessoa não está cadastrada" e "esse número não é um CPF" chegariam ao
atendente como a mesma resposta.

### Falha é silenciosa

A consulta é conveniência. A pessoa está na frente do atendente, e o formulário
tem que seguir preenchível à mão — central fora do ar, timeout ou integração
desligada não mostram erro nenhum.

### O que ficou de fora

| Fora | Por quê |
| --- | --- |
| Rua e número separados | O formulário tem um campo `endereço` de linha única. A central guarda `street` e `number`; a volta junta os dois nesse campo, e o próximo envio devolve tudo como `street`. Separar pede campo novo no formulário |
| Botão "atualizar da central" no prontuário | Depende de um `PATCH` de cidadão, que a API não tem |
| Sexo, RG e observações no formulário | A consulta já traz os três, mas o formulário de cadastro não tem esses campos — eles só existem no prontuário |

> Depende da branch `ajustes-marreira` da API: o endpoint
> `/api/citizens/consulta-central` e o campo `integracoes` na resposta do
> cadastro não existem na `main`.
