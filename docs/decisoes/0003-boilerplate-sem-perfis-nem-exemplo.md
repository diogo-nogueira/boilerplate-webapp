# 0003: o repositório é um boilerplate, sem perfis, sem funcionalidade de exemplo e com aspeto neutro

- Estado: Aceite
- Data: 2026-11-18

## Contexto

Quem recebe o repositório constrói a partir dele uma aplicação pequena. Uma aplicação já feita obrigava a apagar primeiro o que não interessa.

## Decisão

O repositório é um ponto de partida (Django, React e SQLite): login por sessão, definições seguras, base de dados configurável e peças reutilizáveis (paginação, filtros validados, erros por campo, cliente da API). Não tem apps nem ecrãs de negócio, nem perfis e permissões por perfil: qualquer utilizador autenticado vê tudo. Não tem funcionalidade de exemplo: só o login e uma página inicial. O aspeto é neutro (tipo de letra do sistema, cinzentos, uma só cor de destaque, claro e escuro), com o nome da aplicação num único sítio (`frontend/src/appName.ts`).

## Alternativas consideradas

- Manter perfis genéricos (administrador e utilizador): cada aplicação tem perfis diferentes, ou nenhum.
- Trazer uma funcionalidade de exemplo completa: mostraria os padrões de ponta a ponta, mas influenciaria a aplicação de quem começa.

## Consequências

Uma base sem domínio nem identidade visual própria serve qualquer ideia. As peças reutilizáveis não têm exemplo de uso: os padrões estão descritos em texto no CLAUDE.md e nas regras em `.claude/rules/`. A primeira conta cria-se com `python manage.py createsuperuser`.
