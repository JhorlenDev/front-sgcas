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
