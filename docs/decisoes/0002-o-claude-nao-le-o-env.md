# 0002: o Claude não lê o `.env`, por regra e por hook

- Estado: Aceite
- Data: 2026-11-16

## Contexto

O `backend/.env` guarda os segredos (chave do Django, palavra-passe da base de dados). As regras `deny` em `.claude/settings.json` só apanham os comandos que listam; um `grep` ou um `python` que lesse o ficheiro passava.

## Decisão

Além das regras `deny`, o hook `.claude/hooks/bloquear-env.mjs` bloqueia qualquer ferramenta ou comando que aponte para o `.env`. O `.env.example` continua acessível.

## Alternativas consideradas

- Só as regras `deny`: deixam passar comandos não listados.

## Consequências

Criar e preencher o `backend/.env`, e correr as verificações que o citam, é feito pela pessoa e não pelo Claude (README e `docs/seguranca.md`). Os testes do hook correm com `node --test .claude/hooks/bloquear-env.test.mjs` e no CI.
