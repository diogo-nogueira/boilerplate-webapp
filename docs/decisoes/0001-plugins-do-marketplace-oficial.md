# 0001: plugins do marketplace oficial em vez de skills próprias

- Estado: Aceite
- Data: 2026-11-16

## Contexto

O projeto precisava de ajudas para o Claude Code: planear, testar primeiro, rever segurança, manter o CLAUDE.md e criar ecrãs.

## Decisão

O `.claude/settings.json` liga `superpowers`, `security-guidance`, `claude-md-management` e `frontend-design`, do marketplace oficial da Anthropic. Depois foi acrescentado o plugin `impeccable`, do marketplace do seu autor (ver o README).

## Alternativas consideradas

- Escrever skills próprias (por exemplo, uma revisão de segurança): fariam o mesmo que estes plugins e teriam de ser mantidas por nós.

## Consequências

Os plugins são mantidos por quem os publica. Cada pessoa instala-os uma vez (instruções no README).
