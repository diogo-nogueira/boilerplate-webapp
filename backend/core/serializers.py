"""Campos reutilizáveis para validar filtros que chegam no endereço (query params)."""

import re

from rest_framework import serializers

# Só AAAA-MM-DD com dígitos ASCII (o DateField do DRF também aceitaria 20261118 ou 2026-1-5).
DATE_PATTERN = re.compile(r"[0-9]{4}-[0-9]{2}-[0-9]{2}")
# Anos razoáveis: evita datas nos limites do calendário do Python.
MIN_YEAR = 2000
MAX_YEAR = 2100
# Até 9 dígitos: cabe sempre num inteiro da base de dados.
MAX_ID = 999_999_999


class IsoDateField(serializers.DateField):
    """Data só no formato AAAA-MM-DD e com o ano entre 2000 e 2100."""

    def to_internal_value(self, value):
        if not isinstance(value, str) or not DATE_PATTERN.fullmatch(value):
            self.fail("invalid", format="AAAA-MM-DD")
        day = super().to_internal_value(value)  # recusa dias que não existem, como 2026-02-30
        if not MIN_YEAR <= day.year <= MAX_YEAR:
            self.fail("invalid", format="AAAA-MM-DD")
        return day


def page_field():
    """Número da página (a partir de 1). Sem page, é a página 1."""
    return serializers.IntegerField(
        required=False, default=1, min_value=1, max_value=MAX_ID,
        error_messages={
            "invalid": "Número de página inválido.",
            "min_value": "A página tem de ser pelo menos 1.",
            "max_value": "Página demasiado grande.",
        },
    )
