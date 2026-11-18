# Boilerplate Django + React

Ponto de partida para uma aplicação pequena, com Django (backend) e React (frontend), sobre SQLite. Traz o que quase toda a aplicação precisa e deixa o resto para si:

- login e logout por sessão, com proteção CSRF e limite de tentativas;
- definições separadas para desenvolvimento e produção, segredos num ficheiro `.env`;
- base de dados configurável: SQLite por omissão, PostgreSQL com algumas variáveis;
- peças reutilizáveis: paginação, filtros validados, erros por campo, cliente da API, componente de paginação;
- um aspeto neutro (claro e escuro), com o nome da aplicação num único sítio;
- testes, auditoria de dependências e CI.

Não tem funcionalidades de negócio nem perfis: quem entra vê tudo. A primeira funcionalidade é sua.

## Pré-requisitos

- Python 3.12 ou mais recente (3.12 a 3.15 funcionam).
- Node.js 24 LTS (precisa de pelo menos a versão 22.22.2) e o npm que vem com ele.
- Git.
- Opcional: DBeaver, para ver a base de dados.

Não precisa de internet para correr a aplicação, só para instalar as dependências.

## Arranque

Faça tudo em duas janelas de terminal: uma para o backend, outra para o frontend.

### 1. Backend

No Windows (PowerShell), a partir da pasta do projeto:

```powershell
cd backend
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Se só tiver instalado um Python mais recente (por exemplo 3.13), use `py -m venv .venv` em vez de `py -3.12 -m venv .venv`.

No macOS ou Linux:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Este passo (copiar o modelo e preencher o ficheiro) é seu: faça-o no seu terminal e no seu editor, não peça ao Claude Code. O Claude Code está proibido de criar, ler ou alterar esse ficheiro, e o hook do projeto bloqueia qualquer comando que o nomeie.

Abra `backend/.env` e preencha `DJANGO_SECRET_KEY`: uma chave longa e aleatória. Para gerar uma: `python -c "import secrets; print(secrets.token_urlsafe(50))"` (só tem letras, números, `-` e `_`, por isso é seguro no `.env`).

Depois, com o ambiente virtual ativo (o terminal mostra `(.venv)`), crie as tabelas e a sua conta:

```
python manage.py migrate
python manage.py createsuperuser
```

Escolha o nome de utilizador e uma palavra-passe forte. Esta é a conta com que entra na aplicação e no admin do Django (http://127.0.0.1:8000/admin/, só para superutilizadores). Outras contas criam-se no admin; essas entram na aplicação, mas não no admin.

Arranque o backend:

```
python manage.py runserver
```

Deixe este terminal aberto: o backend fica em http://127.0.0.1:8000.

### 2. Frontend

Noutro terminal, a partir da pasta do projeto:

```
cd frontend
npm ci
npm run dev
```

Abra http://localhost:5173 no browser e entre com a conta que criou. O nome da aplicação ("Nova aplicação") muda-se só em `frontend/src/appName.ts`.

### 3. Plugins do Claude Code

O `.claude/settings.json` liga cinco plugins: quatro do marketplace oficial da Anthropic, `superpowers` (planear, testar primeiro, rever), `security-guidance` (avisos de segurança ao editar), `claude-md-management` (manter o CLAUDE.md atualizado) e `frontend-design` (criar ecrãs), e o `impeccable` (rever e afinar o design dos ecrãs), do marketplace do seu autor. Ligar não é instalar: cada pessoa instala-os uma vez.

Abra o Claude Code na pasta do projeto e aceite a pergunta de confiança na pasta. Depois, num terminal na pasta do projeto:

```
claude plugin install superpowers@claude-plugins-official --scope project
claude plugin install security-guidance@claude-plugins-official --scope project
claude plugin install claude-md-management@claude-plugins-official --scope project
claude plugin install frontend-design@claude-plugins-official --scope project
claude plugin install impeccable@impeccable --scope project
```

Confirme com `/plugin` dentro do Claude Code: os cinco aparecem instalados.

## Base de dados

Por omissão é um ficheiro SQLite: `backend/db.sqlite3`. No DBeaver, crie uma ligação SQLite e escolha esse ficheiro. Não o apague.

### Mudar para PostgreSQL

Por omissão a app usa SQLite. Para usar um PostgreSQL (por exemplo na cloud), muda-se só o `backend/.env`:

1. No serviço de PostgreSQL, crie uma base de dados vazia e um utilizador com acesso a ela.
2. Edite você o `backend/.env` (o Claude Code não o pode alterar) e acrescente (o modelo está em `backend/.env.example`):
   ```
   DB_ENGINE=postgres
   DB_NAME=nome-da-base
   DB_USER=utilizador
   DB_PASSWORD=palavra-passe-da-base
   DB_HOST=servidor.exemplo.com
   DB_PORT=5432
   DB_SSLMODE=require
   ```
   `DB_PORT` e `DB_SSLMODE` são opcionais (os valores acima são os por omissão, também quando ficam vazios). `DB_SSLMODE` aceita `disable`, `allow`, `prefer`, `require`, `verify-ca` e `verify-full`. Se faltar uma das outras, a app não arranca e diz qual.
3. A partir de `backend/`, crie as tabelas e a conta: `python manage.py migrate` e `python manage.py createsuperuser`.
4. Arranque como de costume: `python manage.py runserver`.

Três avisos:

- `python manage.py test` atua sobre a base de dados para onde o `.env` aponta. Com `postgres`, os testes criam e apagam uma base `test_<nome>`, o que exige o privilégio CREATEDB, que alguns fornecedores de cloud não dão. Nesse caso, corra os testes em SQLite (`DB_ENGINE=sqlite`).
- Um PostgreSQL local sem SSL precisa de `DB_SSLMODE=disable`.
- A palavra-passe pode começar por `$` e conter `#`.

Para voltar ao SQLite, ponha `DB_ENGINE=sqlite` (ou apague as linhas `DB_*`). Os dados ficam em cada base: o PostgreSQL e o `db.sqlite3` não se misturam.

## Testes

Backend (na pasta `backend`, com o ambiente virtual ativo):

```
python manage.py test
```

Auditoria das dependências (o `pip-audit` vem do `requirements-dev.txt`):

```
pip install -r requirements-dev.txt
pip-audit -r requirements.txt
```

Frontend (na pasta `frontend`):

```
npm test -- --run
npm run build
npm run lint
```

Hook que protege o ficheiro de segredos (na pasta do projeto):

```
node --test .claude/hooks/bloquear-env.test.mjs
```

Os testes de ecrã (React Testing Library) ficam ao lado das páginas, em ficheiros `*.test.tsx` (por exemplo `src/pages/LoginPage.test.tsx`). A API é simulada com `vi.mock("../api/client")`, por isso não precisam do backend a correr.

## Por onde começar uma funcionalidade

1. Leia o [CLAUDE.md](CLAUDE.md): tem a arquitetura, as convenções e as peças reutilizáveis (`backend/core/`, `frontend/src/`).
2. Trabalhe uma funcionalidade de cada vez: pedido, plano, testes primeiro, implementação, revisão de segurança com [docs/seguranca.md](docs/seguranca.md), commit.
3. No backend, crie uma app nova (`python manage.py startapp nome`), acrescente-a a `INSTALLED_APPS` em `backend/config/settings/base.py` e ligue os endpoints em `backend/config/urls.py`.
4. No frontend, crie a página em `frontend/src/pages/` e acrescente-a a `frontend/src/navigation.ts` e `frontend/src/App.tsx`.
5. Se a funcionalidade falar com um serviço externo, veja [docs/integracoes.md](docs/integracoes.md).
6. Registe as decisões que não se veem no código em [docs/decisoes/](docs/decisoes/README.md), um ficheiro por decisão.

## Problemas comuns

- Windows, o PowerShell recusa `Activate.ps1` ("a execução de scripts está desativada"): corra uma vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` e abra um terminal novo.
- O backend não arranca e mostra `Set the DJANGO_SECRET_KEY environment variable`: falta o ficheiro `backend/.env` ou a chave `DJANGO_SECRET_KEY` nele. Copie você o `.env.example` para `.env` (ver "Arranque") e preencha a chave; se estiver a trabalhar com o Claude Code, ele não o faz por si. Só para correr os testes, basta `DJANGO_SECRET_KEY=test-key python manage.py test`.
- Não consegue entrar: crie a conta com `python manage.py createsuperuser` (ver "Arranque").
- O login responde "Demasiadas tentativas": espere um minuto (há um limite de 10 tentativas por minuto).
- O frontend mostra erros de rede: confirme que o `runserver` está a correr.

## Mais informação

- [CLAUDE.md](CLAUDE.md): guia do projeto para o Claude Code. As convenções do backend e do frontend estão em [.claude/rules/](.claude/rules/), e o Claude Code só as carrega quando trabalha nessas pastas.
- [docs/seguranca.md](docs/seguranca.md): regras de segurança e como se verificam.
- [docs/integracoes.md](docs/integracoes.md): como ligar a app a uma API externa.
- [docs/decisoes/](docs/decisoes/README.md): decisões do projeto, uma por ficheiro, com índice.
