# Decisões

Cada decisão do projeto que não se vê no código fica num ficheiro próprio nesta pasta (um registo de decisão, ou ADR). Este índice tem uma linha por decisão; o detalhe está no ficheiro.

## Índice

| N.º | Decisão | Estado | Data |
|---|---|---|---|
| [0001](0001-plugins-do-marketplace-oficial.md) | Plugins do marketplace oficial em vez de skills próprias | Aceite | 2026-11-16 |
| [0002](0002-o-claude-nao-le-o-env.md) | O Claude não lê o `.env`, por regra e por hook | Aceite | 2026-11-16 |
| [0003](0003-boilerplate-sem-perfis-nem-exemplo.md) | O repositório é um boilerplate, sem perfis, sem funcionalidade de exemplo e com aspeto neutro | Aceite | 2026-11-18 |
| [0004](0004-uma-decisao-por-ficheiro.md) | Uma decisão por ficheiro, com índice | Aceite | 2026-11-18 |

## Quando escrever uma decisão

Só quando a escolha não se vê no código e custa a reverter: uma regra de segurança, uma ferramenta ou plugin, uma alternativa posta de lado, uma escolha do cliente. Detalhes que o código já mostra não precisam de registo.

## Como escrever

1. Copie [modelo.md](modelo.md) para `NNNN-titulo-curto.md`, com o número seguinte (quatro algarismos) e um título em minúsculas separado por hífenes.
2. Preencha-o: curto, em português, com o porquê.
3. Acrescente uma linha a este índice.

## Quando uma decisão muda

Nunca se apaga nem se reescreve uma decisão aceite. Escreve-se uma nova que diz o que substitui, e na antiga muda-se só o estado para "Substituída por [NNNN](NNNN-....md)", aqui e no ficheiro. Uma decisão que deixa de se aplicar sem substituta passa a "Obsoleta". Os números nunca se reutilizam.
