import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

# Variáveis obrigatórias quando DB_ENGINE=postgres.
POSTGRES_REQUIRED = ("DB_NAME", "DB_USER", "DB_PASSWORD", "DB_HOST")
SSLMODES = ("disable", "allow", "prefer", "require", "verify-ca", "verify-full")


def read(name: str, default: str = "") -> str:
    # os.environ.get devolve o texto tal como está no .env. O django-environ
    # tomaria uma palavra-passe a começar por $ como referência a outra variável.
    value = os.environ.get(name, "").strip()
    return value or default


def database_settings(base_dir: Path) -> dict:
    """Devolve DATABASES["default"] a partir das variáveis DB_* do ambiente."""
    engine = read("DB_ENGINE", "sqlite").lower()

    if engine == "sqlite":
        # As outras variáveis DB_* são ignoradas.
        return {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": base_dir / "db.sqlite3",
        }

    if engine != "postgres":
        raise ImproperlyConfigured("DB_ENGINE tem de ser sqlite ou postgres.")

    # As mensagens de erro nunca incluem valores (a palavra-passe fica de fora).
    for name in POSTGRES_REQUIRED:
        if not read(name):
            raise ImproperlyConfigured(f"Falta {name} no .env para usar postgres.")

    # Porta vazia = 5432; só dígitos ASCII (isdigit aceitaria também, por exemplo, "²").
    port = read("DB_PORT", "5432")
    if not (port.isascii() and port.isdigit()):
        raise ImproperlyConfigured("DB_PORT tem de ser um número.")

    sslmode = read("DB_SSLMODE", "require")
    if sslmode not in SSLMODES:
        raise ImproperlyConfigured(
            "DB_SSLMODE tem de ser um destes valores: " + ", ".join(SSLMODES) + "."
        )

    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": read("DB_NAME"),
        "USER": read("DB_USER"),
        # A palavra-passe vai tal como está, sem retirar espaços.
        "PASSWORD": os.environ["DB_PASSWORD"],
        "HOST": read("DB_HOST"),
        "PORT": port,
        "OPTIONS": {"sslmode": sslmode},
    }
