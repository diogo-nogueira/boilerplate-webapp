"""Paginação por número de página, igual em todas as listas.

Os serviços chamam paginate() com o queryset (ou lista) já filtrado e ordenado.
"""

from django.core.paginator import Paginator

PAGE_SIZE = 20


def paginate(items, page: int) -> dict | None:
    """Os dados da página pedida, ou None se a página não existe.

    A página já vem validada como inteiro de 1 a MAX_ID (ver page_field() em core/serializers.py).
    Uma lista vazia tem uma página (vazia), por isso page=1 é sempre válida.
    """
    paginator = Paginator(items, PAGE_SIZE)
    if page > paginator.num_pages:
        return None
    return {
        "count": paginator.count,
        "page": page,
        "total_pages": paginator.num_pages,
        "results": list(paginator.page(page).object_list),
    }
