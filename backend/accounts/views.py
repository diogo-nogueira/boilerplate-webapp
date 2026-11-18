from django.contrib.auth import authenticate, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import status
from rest_framework.exceptions import Throttled
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .serializers import LoginSerializer, serialize_me


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)


# O DRF não aplica CSRF a pedidos anónimos, por isso o login protege-se aqui.
@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    permission_classes = [AllowAny]
    # Limita as tentativas por endereço (taxa "login" nos settings): trava adivinhar palavras-passe.
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    # A mensagem por defeito do DRF vem meio em inglês.
    def throttled(self, request, wait):
        raise Throttled(
            wait=wait,
            detail="Demasiadas tentativas de início de sessão. Tente de novo dentro de um minuto.",
        )

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            return Response(
                {"detail": "Utilizador ou palavra-passe incorretos."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        login(request, user)
        return Response(serialize_me(user))


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(serialize_me(request.user))
