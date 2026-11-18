"""
Configuração WSGI do projeto.

Expõe a aplicação WSGI na variável ``application``, usada pelos servidores de produção.

Mais informação: https://docs.djangoproject.com/en/6.1/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

# Por defeito usa os settings de produção: sem as variáveis de ambiente, falha logo ao arrancar.
# Em desenvolvimento usa-se o manage.py, que escolhe os settings de dev.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.prod")

application = get_wsgi_application()
