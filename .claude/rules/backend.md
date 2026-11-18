---
paths:
  - "backend/**"
---

# Convenções do backend

- Views DRF explícitas (`APIView`, `ListAPIView`), funções curtas, nomes claros. Cada endpoint declara sempre `permission_classes` (exemplo: `backend/accounts/views.py`).
- "Hoje" é sempre `django.utils.timezone.localdate()`.
- Regras de cálculo, se a aplicação as tiver: funções puras num ficheiro próprio, sem base de dados nem rede, com testes; o acesso à base de dados fica num ficheiro de serviços à parte. Se mudar uma regra, mude o código, os testes e a documentação dela.
- Sem SQL escrito à mão; tudo pelo ORM.

## Peças reutilizáveis (`backend/core/`, testes em `backend/core/tests/test_pieces.py`)

- `paginate(items, page)` e `PAGE_SIZE` (20), em `core/pagination.py`: devolvem `{count, page, total_pages, results}`, ou `None` se a página não existe.
- `page_field()` e `IsoDateField` (data só `AAAA-MM-DD`, anos 2000 a 2100), em `core/serializers.py`.
- `invalid_filter_response(query)` e `invalid_page_response()`, em `core/responses.py`: 400 com `{"detail": "Filtro inválido: <nome>."}`.

## Padrões

- Filtro de lista (query params): validado à entrada com um `serializers.Serializer` da própria app (com `page_field()` e `IsoDateField`); se `is_valid()` falha, a view responde com `invalid_filter_response(query)`. Os serviços recebem só valores já validados.
- Lista paginada: o serviço chama `paginate()`; página para lá da última dá `invalid_page_response()`. A resposta é `{count, page, total_pages, results}`.
- Pedido de escrita: um serializer valida o corpo, o serviço grava com `full_clean()` e a view responde 400 com `{campo: [mensagens]}` (também quando falha o `full_clean()`).
- Testes: um teste por regra e por "não pode" (sem sessão, sem CSRF, dados de outra pessoa), ao lado da app em `tests/`. Correm com `DJANGO_SECRET_KEY=test-key python manage.py test` quando não há `backend/.env`.
