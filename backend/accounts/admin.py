from django.contrib import admin


def only_active_superusers(request):
    # Por defeito o Django deixa entrar no admin qualquer conta is_staff.
    # Aqui o admin é só para superutilizadores: as outras contas nunca lá entram.
    return request.user.is_active and request.user.is_superuser


admin.site.has_permission = only_active_superusers
