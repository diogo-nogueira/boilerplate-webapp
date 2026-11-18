# Boilerplate Django + React: guia para o Claude

Ponto de partida para uma aplicação: Django com Django REST Framework no backend, React com TypeScript e Vite no frontend, SQLite por omissão. Traz login por sessão, definições seguras, base de dados configurável, peças reutilizáveis e um aspeto neutro. Não tem funcionalidades de negócio, nem perfis: qualquer utilizador autenticado vê tudo. Perfis, se forem precisos, são trabalho de cada aplicação. Prefira código simples e explícito.

## Arquitetura

- `backend/`: Django 6 com Django REST Framework, base de dados SQLite em `backend/db.sqlite3` por omissão, ou PostgreSQL com `DB_ENGINE=postgres` e as variáveis `DB_*` no `backend/.env` (`backend/config/settings/database.py`). Autenticação por sessão.
- `frontend/`: React 19 com TypeScript e Vite. Em desenvolvimento o Vite reencaminha `/api` para o Django (porta 8000), por isso não há CORS.

Apps do backend (`backend/`):

- `accounts`: só autenticação, sem modelos. Endpoints em `/api/auth/`: `csrf/` (204, põe o cookie CSRF), `login/`, `logout/` e `me/` (`username` e `display_name`). `accounts/testing.py` tem `make_user`. O admin do Django é só para superutilizadores (`accounts/admin.py`).
- `core`: peças reutilizáveis, sem modelos (ver `.claude/rules/backend.md`).
- `config`: definições em `config/settings/` (`base.py`, `dev.py`, `prod.py`, `database.py`), URLs, WSGI e ASGI. Os testes das definições estão em `config/tests.py`.

Uma funcionalidade nova é uma app Django nova (`python manage.py startapp ...`): acrescente-a a `INSTALLED_APPS` em `base.py` e ligue as suas URLs em `config/urls.py`. Dependências num só sentido: `accounts` e `core` não importam das apps novas; as apps novas podem importar de `accounts` e de `core`.

Frontend: páginas em `frontend/src/pages/`, menu da barra de topo em `frontend/src/navigation.ts` (uma página nova acrescenta-se aí e em `frontend/src/App.tsx`), nome da aplicação em `frontend/src/appName.ts`, cliente da API em `frontend/src/api/client.ts`, autenticação em `frontend/src/auth/`, estilos em `frontend/src/styles/` (`tokens.css` tem as cores e medidas, em claro e escuro).

## Comandos

Backend, a partir de `backend/` com o ambiente virtual ativo:

- `python manage.py runserver`
- `python manage.py test` (ou uma app: `python manage.py test accounts`)
- `python manage.py makemigrations` (depois de mudar modelos) e `python manage.py migrate`
- `python manage.py createsuperuser` (é assim que se cria a primeira conta; não há dados de demonstração)

Frontend, a partir de `frontend/`:

- `npm run dev` (app em http://localhost:5173)
- `npm test -- --run` (testes, sem modo de vigia)
- `npm run build` (verifica os tipos e compila)
- `npm run lint`

Hook de proteção do ficheiro de segredos, a partir da raiz: `node --test .claude/hooks/bloquear-env.test.mjs`.

## Segurança

Resumo (detalhe e forma de verificar cada regra em [docs/seguranca.md](docs/seguranca.md)):

- Sessão Django com CSRF em todos os endpoints de escrita; permissão por omissão `IsAuthenticated`, e cada endpoint declara sempre `permission_classes` explicitamente (como em `backend/accounts/views.py`), no servidor.
- Toda a entrada é validada; o que é de cada pessoa só a ela se mostra (a cumprir em cada funcionalidade nova).
- Segredos só em variáveis de ambiente (`backend/.env`, fora do git), incluindo a palavra-passe da base de dados (`DB_PASSWORD`).
- Settings separados para desenvolvimento e produção; sem SQL à mão; erros sem fugas.
- Dependências fixadas e auditadas; testes dos "não pode"; limite de tentativas de login.

Nunca ler nem alterar `backend/.env`. Nunca apagar `backend/db.sqlite3`. A rede de segurança é dupla: as regras `deny` em `.claude/settings.json` (Read, Edit, Write e alguns comandos `cat`) e o hook `.claude/hooks/bloquear-env.mjs`, que bloqueia qualquer ferramenta ou comando que aponte para esse ficheiro. A regra é "nunca ler o `.env`", por qualquer meio. Se esse ficheiro faltar (erro "Set the DJANGO_SECRET_KEY..."), peça à pessoa que o crie seguindo o README e não contorne o bloqueio. Para correr os testes sem ele: `DJANGO_SECRET_KEY=test-key python manage.py test`.

## Convenções

- Interface em português de Portugal. Código, tabelas, campos e endpoints em inglês. Comentários em português, curtos, a explicar o porquê.
- Proibido em código, interface, documentação e commits: travessão longo, meia-risca como pontuação, setas, sinal de multiplicação unicode, reticências unicode, aspas curvas e emojis. Use `-`, `->`, `x`, `...` e aspas retas. Verificação, a partir da raiz (só ficheiros versionados):
  (corre em bash ou Git Bash, não em PowerShell)
  `git grep -nP '(*UTF)[\x{2014}\x{2013}\x{2192}\x{2190}\x{00D7}\x{2026}\x{201C}\x{201D}\x{2018}\x{2019}]' -- '*.py' '*.ts' '*.tsx' '*.md' '*.css' '*.json' '*.html'`
- Mensagens de commit em português, no imperativo.
- Convenções específicas do backend e do frontend, peças reutilizáveis e padrões (filtros validados, listas paginadas, pedidos de escrita, testes de ecrã): em `.claude/rules/backend.md` e `.claude/rules/frontend.md`, que o Claude Code carrega ao trabalhar nessas pastas.

## Decisões

Cada decisão que não se vê no código e custa a reverter fica num ficheiro próprio em `docs/decisoes/` (um por decisão, a partir de `docs/decisoes/modelo.md`), com uma linha no índice `docs/decisoes/README.md`. Antes de mudar algo, leia o índice e abra só as decisões que tocam no assunto. Uma decisão aceite nunca se apaga: escreve-se uma nova que a substitui e o estado da antiga passa a "Substituída por NNNN".

## Ciclo de trabalho: uma funcionalidade de cada vez

1. Pedido: perceber o que se quer, em frases simples.
2. Plano: propor os passos e esperar confirmação.
3. Testes primeiro: escrever o teste, vê-lo falhar.
4. Implementação: o mínimo para o teste passar.
5. Revisão de segurança com a checklist de [docs/seguranca.md](docs/seguranca.md).
6. Commit com mensagem em português.

Não começar a funcionalidade seguinte antes de a atual estar acabada e commitada.
