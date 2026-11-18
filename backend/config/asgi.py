"""
Configuração ASGI do projeto.

Expõe a aplicação ASGI na variável ``application``, usada pelos servidores de produção.

Mais informação: https://docs.djangoproject.com/en/6.1/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

# Por defeito usa os settings de produção: sem as variáveis de ambiente, falha logo ao arrancar.
# Em desenvolvimento usa-se o manage.py, que escolhe os settings de dev.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.prod")

application = get_asgi_application()
