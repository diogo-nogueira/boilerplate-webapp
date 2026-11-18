from django.contrib.auth.models import User


def make_user(username, password="pw-teste-123", **user_fields):
    # Nunca staff: o admin é só para superutilizadores.
    user_fields["is_staff"] = False
    return User.objects.create_user(username=username, password=password, **user_fields)
