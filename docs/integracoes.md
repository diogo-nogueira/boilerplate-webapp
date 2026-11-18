# Integrações com serviços externos

Este guia explica onde e como uma ligação a um serviço externo (uma API) deve entrar na app. Não tem código: é uma lista de regras para seguir ao fazê-la, por exemplo com o Claude Code.

## Regras de ouro

- O servidor chama a API externa. O browser nunca a chama.
- O token (ou qualquer chave) nunca vai para o código, para os testes, para o frontend, para o git nem para mensagens de erro e registos.
- Se a API falhar, a app continua a funcionar e nada é apagado.
- A chamada externa nunca entra nas regras de cálculo (funções puras, se a aplicação as tiver).

## 1. Onde entra uma integração

- Num módulo próprio, na app do Django a que os dados pertencem. Por exemplo, a importação de contactos de um serviço externo pertence à app dos contactos, num ficheiro à parte com um nome claro (como `contacts/api_client.py`). Um módulo faz uma coisa: falar com a API e devolver dados simples.
- É chamado a partir de um comando de gestão (`python manage.py ...`) ou de uma ação de quem usa a aplicação (um endpoint que se dispara com um botão). Nunca a partir de um pedido normal de leitura, por exemplo ao abrir uma lista.
- Nunca de dentro de funções de cálculo. Essas são funções puras: recebem valores e devolvem um resultado, sem rede nem base de dados. Os dados externos são gravados primeiro na base e as funções de cálculo lêem-nos de lá.
- Respeite o sentido das dependências entre apps (ver o [CLAUDE.md](../CLAUDE.md)): `accounts` e `core` não importam das apps novas.
- O endpoint que dispara a integração tem as mesmas proteções de qualquer outro: `permission_classes` adequadas, CSRF, e validação de toda a entrada (ver [seguranca.md](seguranca.md)).

## 2. Acrescentar uma variável de configuração

Tudo o que muda entre ambientes ou é secreto (endereço da API, token) vem de uma variável de ambiente. São três passos:

1. Em `backend/.env.example`, acrescente uma linha com um valor de exemplo, nunca real. Por exemplo, `NOME_DA_VARIAVEL=troque-por-o-seu-valor`. Este ficheiro vai para o git.
2. Em `backend/config/settings/base.py`, leia-a como as outras (a `DJANGO_SECRET_KEY` e as variáveis `DB_*` em `backend/config/settings/database.py` são os exemplos a seguir). Dê um valor por defeito vazio ou seguro quando a variável é opcional, e faça a app recusar arrancar quando for obrigatória.
3. No seu `backend/.env` (que não vai para o git), ponha o valor verdadeiro. Não peça ao Claude para ler este ficheiro: o projeto proíbe-o.

Depois, no resto do código, leia o valor dos settings (`from django.conf import settings`), nunca diretamente do ambiente nem de uma constante escrita no código.

Uma API pública sem chave só precisa do endereço base como variável; uma API com token precisa também do token, e esse é secreto.

## 3. Tratar falhas da API externa

Uma API externa falha: sem internet, lenta, fora do ar, responde erro, responde lixo. A app tem de aguentar.

- **Tempo máximo de espera:** toda a chamada tem um timeout curto (alguns segundos). Sem timeout, um servidor parado deixa a app pendurada.
- **Mensagem clara:** a pessoa vê uma frase em português a dizer o que aconteceu e o que fazer ("Não foi possível obter os dados do serviço externo. Tente outra vez mais tarde."). Nunca o erro técnico, o endereço com o token ou um stack trace.
- **Nada apagado:** uma importação falhada deixa os dados como estavam. Só grave depois de ter recebido e validado todos os dados, e preferencialmente numa única transação. Nunca apague dados existentes para os substituir pelos de fora.
- **Validar o que chega:** os dados externos são entrada não confiável, tal como os do browser. Confirme formatos e datas antes de gravar e ignore com aviso o que for inválido.
- **Sem duplicados:** repetir a importação não pode criar linhas repetidas. Guarde a origem e um identificador externo para o reconhecer.
- **Testes sem rede:** os testes simulam a resposta da API (um mock) e provam cada falha: timeout, erro, resposta inválida. Os testes nunca chamam a internet.

## Lista de verificação

- [ ] A chamada externa está num módulo próprio e é disparada por um comando ou por uma ação explícita de quem usa a aplicação.
- [ ] Não há chamadas à API no frontend nem em funções de cálculo.
- [ ] A variável está no `backend/.env.example` e lida nos settings; o token não aparece em nenhum ficheiro versionado.
- [ ] Há timeout, mensagem clara e nada apagado em caso de falha.
- [ ] Os testes cobrem sucesso e falhas sem usar a rede.
- [ ] `python manage.py test` continua a passar.
