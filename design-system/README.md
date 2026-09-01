# Sistema de design PMT 2026 — cópia local

Arquivos copiados de **SEDECTI/design-pmt-2026**, sem alteração.

| Arquivo | Origem no repositório do sistema |
| --- | --- |
| `pmt-sem-reset.css` | `dist/pmt-sem-reset.css` |
| `pmt.preset.js` | `integracoes/tailwind/pmt.preset.js` |

Versão copiada: commit `1613503`, em 2026-09-01.

## Por que copiado, e não instalado por npm

O repositório do design system é privado. Depender dele pelo `package.json`
exigiria credencial do GitHub em toda máquina e em todo ambiente de build —
Docker, CI, e a máquina de quem for dar manutenção. O README do próprio sistema
trata a cópia do CSS como o caminho principal ("O produto é um arquivo CSS"),
e as integrações como conveniência.

## Não edite estes arquivos

São gerados no repositório de origem e serão sobrescritos na próxima
atualização. Ajuste que valha para todos os projetos entra lá, não aqui.

## Como atualizar

```bash
git clone git@github.com:SEDECTI/design-pmt-2026.git /tmp/pmt
cp /tmp/pmt/dist/pmt-sem-reset.css                   design-system/
cp /tmp/pmt/integracoes/tailwind/pmt.preset.js       design-system/
```

Depois rode `npm run build` e confira a aparência: mudança de token no sistema
aparece aqui sem aviso.
