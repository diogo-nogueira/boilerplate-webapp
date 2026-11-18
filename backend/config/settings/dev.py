from pathlib import Path

import environ

# O .env tem de ser lido antes de importar o base (que lê o SECRET_KEY).
environ.Env.read_env(Path(__file__).resolve().parents[2] / ".env")

from .base import *  # noqa: E402,F401,F403

DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1"]
