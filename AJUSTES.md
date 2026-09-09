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
