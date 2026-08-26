# front-sgcas

Frontend Next.js do SGCAS consumindo a API Django em `api-sgcas`.

## Rodar local

Suba a API primeiro:

```bash
cd /home/jhorlendev/api-sgcas
DEBUG=True ./.venv/bin/python manage.py runserver 0.0.0.0:8000
```

Depois suba o front:

```bash
cd /home/jhorlendev/front-sgcas
npm run dev
```

Abra:

```text
http://localhost:3000
```

O front usa rewrite interno para enviar `/api/*` para `http://localhost:8000/api/*`.
Isso mantem o callback do Keycloak em `http://localhost:3000/api/auth/keycloak/callback`.

Para trocar a API:

```bash
SGCAS_API_URL=http://localhost:8000 npm run dev
```
