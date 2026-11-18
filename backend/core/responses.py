from rest_framework.response import Response


def invalid_filter_response(query) -> Response:
    """400 com o nome do primeiro filtro inválido. O frontend mostra o detail."""
    name = next(iter(query.errors))
    return Response({"detail": f"Filtro inválido: {name}."}, status=400)


def invalid_page_response() -> Response:
    """400 quando a página pedida está para lá da última."""
    return Response({"detail": "Filtro inválido: page."}, status=400)
