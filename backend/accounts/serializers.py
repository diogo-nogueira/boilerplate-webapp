from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False)


def serialize_me(user):
    """Corpo devolvido por /me/ e pelo login."""
    return {
        "username": user.username,
        "display_name": user.get_full_name() or user.username,
    }
