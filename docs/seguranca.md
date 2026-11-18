# Segurança

Esta página é a checklist de segurança da aplicação. Use-a no fim de cada funcionalidade: percorra as regras e confirme que a alteração não quebra nenhuma. Cada regra diz como se verifica.

O boilerplate só tem autenticação, por isso só essa parte tem testes feitos. As regras que dependem de funcionalidades (permissões por endpoint, isolamento por pessoa, validação de cada escrita) estão marcadas como "a cumprir em cada funcionalidade nova", com o que testar.

Os testes correm a partir da pasta `backend`:

```
python manage.py test
```

Para correr só um ficheiro, por exemplo `python manage.py test accounts.tests.test_auth`.

## 1. Sessão e CSRF

A pessoa entra com utilizador e palavra-passe e o Django guarda a sessão num cookie. Todos os pedidos que alteram dados têm de enviar o token CSRF, que impede outro site de fazer pedidos em nome da pessoa. O login também exige o token.

Endpoints de escrita do boilerplate: `POST /api/auth/login/` e `POST /api/auth/logout/`. Ambos aceitam qualquer pessoa (`AllowAny`); o login exige sempre o token CSRF, e o logout exige-o quando há sessão.

Como verificar, em `backend/accounts/tests/test_auth.py`: `test_login_without_csrf_token_is_rejected`, `test_login_with_csrf_token_from_csrf_endpoint_works` e `test_logout_without_csrf_token_is_rejected_for_a_logged_in_user` (uma sessão iniciada que faz POST sem token recebe 403).

A cumprir em cada funcionalidade nova: cada endpoint de escrita (`POST`, `PATCH`, `PUT`, `DELETE`) novo tem um teste sem token que dá 403 (com `APIClient(enforce_csrf_checks=True)`) e outro com token que funciona. Acrescente o endpoint a esta lista.

## 2. Permissões no servidor

A permissão por omissão do DRF é `IsAuthenticated` (`REST_FRAMEWORK` em `backend/config/settings/base.py`): sem sessão, a API responde 403, exceto `csrf`, `login` e `logout`, que declaram `AllowAny`. Não há perfis: qualquer utilizador autenticado pode usar os endpoints. O que o frontend esconde é só conforto; quem manda é o servidor.

Como verificar, em `backend/accounts/tests/test_auth.py`: `test_me_requires_login` e `test_csrf_endpoint_returns_204_to_anonymous`. O admin do Django é só para superutilizadores (`backend/accounts/admin.py`): `test_normal_user_cannot_open_admin`, `test_staff_user_cannot_open_admin` (nem com `is_staff` ligado) e `test_superuser_can_open_admin`. Que um superutilizador sem mais nada entra na aplicação prova-o `test_superuser_with_no_extra_setup_can_log_in_and_see_me`.

A cumprir em cada funcionalidade nova: cada view declara sempre `permission_classes` explicitamente (como em `backend/accounts/views.py`), mesmo quando é `IsAuthenticated`; o teste `test_api_requires_login_by_default` em `backend/config/tests.py` só prova a rede de segurança dos settings. Se a aplicação criar perfis, cada endpoint diz quais pode usar, e há um teste por perfil que não pode (403) e um para o anónimo.

## 3. Cada pessoa vê só o que é seu

O boilerplate não guarda dados de pessoas, por isso não há nada a isolar. A cumprir em cada funcionalidade nova: se os dados forem de cada utilizador, o serviço filtra sempre pelo utilizador da sessão (`request.user`), e há um teste em que a pessoa A pede um objeto da pessoa B pelo identificador e recebe 404 (ou 403), tanto na leitura como na escrita.

## 4. Toda a entrada é validada

Nada do que vem do browser é aceite sem validação: os serializers e as views verificam formatos, datas e valores, e respondem 400 com uma mensagem em português. Nos pedidos de escrita, o serializer valida o corpo e o serviço corre `full_clean()` do modelo antes de gravar; os erros chegam como `{campo: [mensagens]}`.

Como verificar, as peças reutilizáveis de `backend/core/tests/test_pieces.py`:

- página: `test_invalid_pages_are_errors_in_page`, `test_messages` e `test_invalid_page_response`;
- datas: `test_only_strict_dates_between_2000_and_2100_are_accepted`, `test_limits_are_accepted` e `test_non_string_is_rejected`;
- filtro inválido: `test_invalid_filter_names_the_first_invalid_field`;
- login: `test_wrong_password_returns_portuguese_message` em `backend/accounts/tests/test_auth.py`.

A cumprir em cada funcionalidade nova: cada filtro de lista usa um serializer de query (com `page_field()` e `IsoDateField`) e tem um teste com valores inválidos que dá 400; cada escrita tem um teste por regra de validação (campo em falta, formato errado, fora do intervalo, regra de negócio) que dá 400 por campo, e um teste de que os campos que não fazem parte do pedido não mudam nada.

## 5. Segredos fora do código

A chave secreta do Django e, se se usar PostgreSQL, os dados da ligação (`DB_*`, incluindo `DB_PASSWORD`) vêm de variáveis de ambiente, lidas do ficheiro `backend/.env`. Esse ficheiro está no `.gitignore` e nunca vai para o GitHub. O repositório só tem o modelo `backend/.env.example`, sem valores reais. Os erros de configuração da base de dados dizem só o nome da variável em falta, nunca valores. Em `backend/config/tests.py`, `test_errors_never_show_the_password` verifica-o.

Como verificar (corra-as você: o hook impede o Claude de as correr, porque nomeiam o ficheiro): `git check-ignore backend/.env` (deve escrever o caminho) e `git ls-files backend/.env` (não deve escrever nada). Em `backend/config/tests.py`, `test_prod_refuses_to_start_without_secret_key` prova que sem chave a aplicação não arranca.

Contra leituras acidentais do ficheiro pelo Claude Code: as regras `deny` em `.claude/settings.json` e o hook `.claude/hooks/bloquear-env.mjs`, testado com `node --test .claude/hooks/bloquear-env.test.mjs` (a partir da raiz).

A cumprir em cada funcionalidade nova: qualquer chave, token ou palavra-passe novo vem de uma variável de ambiente, com um valor de exemplo no `backend/.env.example` e nunca num ficheiro versionado (ver [integracoes.md](integracoes.md)).

## 6. Settings de desenvolvimento e de produção

Há dois ficheiros: `backend/config/settings/dev.py` e `backend/config/settings/prod.py`. Em produção o `DEBUG` está desligado, o `ALLOWED_HOSTS` é explícito, as cookies são seguras e os cabeçalhos de segurança do Django estão ativos.

Como verificar: em `backend/config/tests.py`, `test_prod_passes_deploy_checks` e `test_prod_passes_deploy_checks_with_postgres` correm `manage.py check --deploy` com os settings de produção (a segunda com as variáveis `DB_*` de PostgreSQL) e falham se houver avisos. `test_wsgi_and_asgi_default_to_prod_settings` prova que, sem indicação, o servidor arranca com a produção. Para correr à mão, defina `DJANGO_SETTINGS_MODULE=config.settings.prod`, `DJANGO_SECRET_KEY` e `DJANGO_ALLOWED_HOSTS` e execute `python manage.py check --deploy`.

## 7. Sem SQL escrito à mão

Todo o acesso à base de dados passa pelo ORM do Django. Nunca se junta texto do utilizador a uma instrução SQL.

Como verificar: na pasta `backend`, `grep -rnE "\.raw\(|\.extra\(|cursor\(|RawSQL" --include=*.py .` (sem a pasta `.venv`) não deve devolver nada. Faça-o para cada app nova.

## 8. Erros sem fugas

Em produção as respostas de erro não mostram stack traces nem detalhes internos (`DEBUG` desligado) e a API responde só JSON, sem a interface navegável do DRF. As mensagens de erro da API são curtas e em português.

Provas e limites:

- `test_prod_passes_deploy_checks` em `backend/config/tests.py` prova que o `DEBUG` está desligado em produção (`check --deploy` falharia com `security.W018`).
- `test_unknown_api_paths_are_not_found` em `backend/accounts/tests/test_auth.py` prova que um caminho desconhecido da API dá 404.
- Que a API responde só JSON em produção está configurado em `backend/config/settings/prod.py` (`JSONRenderer`), mas não há teste que o prove.
- Verificação manual: arranque com os settings de produção (`DJANGO_SETTINGS_MODULE=config.settings.prod`, `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS=localhost` e `DJANGO_SECURE_SSL_REDIRECT=False` só para este teste local) e peça um endereço que dê erro; a resposta não deve mostrar stack trace nem caminhos de ficheiros.

## 9. Dependências fixadas e auditadas

As versões estão fixas em `backend/requirements.txt` e em `frontend/package-lock.json`, e há ferramentas que avisam de vulnerabilidades conhecidas. A CI corre estas auditorias em cada push.

Como verificar: na pasta `backend` (com o ambiente virtual ativo) `pip-audit -r requirements.txt`, e na pasta `frontend` `npm audit --audit-level=high`. Ambos devem terminar sem vulnerabilidades.

## 10. Testes dos "não pode"

Além de provar o que se pode fazer, os testes provam o que não se pode. No boilerplate, em `backend/accounts/tests/test_auth.py`:

- anónimo não vê quem é: `test_me_requires_login`;
- sem token CSRF, o login e o logout são recusados: `test_login_without_csrf_token_is_rejected` e `test_logout_without_csrf_token_is_rejected_for_a_logged_in_user`;
- contas que não são de superutilizador não entram no admin: `test_normal_user_cannot_open_admin` e `test_staff_user_cannot_open_admin`.

A cumprir em cada funcionalidade nova: para cada endpoint, um teste do anónimo (403 e nada muda na base de dados), e, havendo dados de cada pessoa ou perfis, um teste de quem não pode (403 ou 404 e nada muda). Pense primeiro no que não deve acontecer e escreva esse teste.

## Extra: limite de tentativas de login

O endpoint de login aceita no máximo 10 tentativas por minuto por endereço. À 11.ª responde 429 com uma mensagem em português. Isto torna impraticável adivinhar palavras-passe por tentativa e erro.

Como verificar: em `backend/accounts/tests/test_auth.py`, `test_eleventh_login_attempt_within_a_minute_is_throttled`. O limite está em `REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]` em `backend/config/settings/base.py`.

Também em `backend/accounts/tests/test_auth.py`, `test_forged_forwarded_for_header_does_not_bypass_the_throttle` prova que mudar o cabeçalho `X-Forwarded-For` não dá tentativas novas.

Limites a conhecer: o contador vive na memória de cada processo (cache local), por isso com vários processos o limite é por processo. E depende de `NUM_PROXIES` estar certo: é 0 por defeito (usa o endereço da ligação); em produção, `DJANGO_NUM_PROXIES` tem de ser igual ao número de proxies inversos à frente da aplicação. O login do admin (`/admin/login/`) não tem limite de tentativas: só o login da API (`/api/auth/login/`) o tem. Em produção, proteja o admin com uma palavra-passe forte do superutilizador ou com um limite no proxy inverso.
