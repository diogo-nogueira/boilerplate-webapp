from .base import *  # noqa: F401,F403
from .base import REST_FRAMEWORK, env

# Em produção as variáveis vêm do ambiente; o .env nunca é lido.
DEBUG = False
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")

# Em produção a API responde só JSON (sem a interface navegável do DRF).
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    # Tem de ser igual ao número de proxies inversos à frente da app no cliente (0 se não houver).
    # Se estiver errado, o limite de login pode ser contornado ou bloquear toda a gente.
    "NUM_PROXIES": env.int("DJANGO_NUM_PROXIES", default=0),
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
}

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT", default=True)
SECURE_HSTS_SECONDS = env.int("DJANGO_HSTS_SECONDS", default=3600)
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_REFERRER_POLICY = "same-origin"

# Incluir subdomínios e preload no HSTS é decisão do domínio do cliente, não da app.
SILENCED_SYSTEM_CHECKS = ["security.W005", "security.W021"]
