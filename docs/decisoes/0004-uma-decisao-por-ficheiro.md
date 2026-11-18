# 0004: uma decisão por ficheiro, com índice

- Estado: Aceite
- Data: 2026-11-18

## Contexto

As decisões estavam todas num único `docs/decisoes.md`. Com o tempo esse ficheiro cresceria sem limite, ficaria difícil de referenciar e acabaria com decisões que se contradizem.

## Decisão

Cada decisão é um registo de decisão (ADR) próprio em `docs/decisoes/NNNN-titulo.md`, a partir de `docs/decisoes/modelo.md` (estado, data, contexto, decisão, alternativas, consequências). `docs/decisoes/README.md` tem um índice de uma linha por decisão. Uma decisão aceite nunca se apaga: é substituída por uma nova e o estado da antiga passa a "Substituída por NNNN".

Ao mesmo tempo, o CLAUDE.md fica com o que vale sempre, e as convenções do backend e do frontend passam para `.claude/rules/backend.md` e `.claude/rules/frontend.md`, que o Claude Code só carrega quando trabalha nessas pastas.

## Alternativas consideradas

- Um ficheiro único por ano: continua a crescer e não resolve as decisões que mudam.
- Só o histórico do git: as decisões ficam difíceis de encontrar.
- Importar ficheiros no CLAUDE.md com `@`: não poupa contexto, porque os ficheiros importados são carregados na mesma.

## Consequências

O índice cresce uma linha por decisão. O Claude lê o índice e abre só a decisão de que precisa. Fontes: a prática dos ADR (Michael Nygard, MADR) e a documentação do Claude Code sobre memória e regras por pasta (https://code.claude.com/docs/en/memory).
