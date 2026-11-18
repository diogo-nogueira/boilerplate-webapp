from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient, APITestCase

from accounts.testing import make_user


class AuthTests(APITestCase):
    def setUp(self):
        # O limite de tentativas vive na cache: limpar para os testes não se influenciarem.
        cache.clear()
        self.user = make_user("ana", first_name="Ana", last_name="Silva")

    def test_me_requires_login(self):
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 403)

    def test_login_returns_username_and_display_name(self):
        r = self.client.post("/api/auth/login/", {"username": "ana", "password": "pw-teste-123"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data, {"username": "ana", "display_name": "Ana Silva"})

    def test_wrong_password_returns_portuguese_message(self):
        r = self.client.post("/api/auth/login/", {"username": "ana", "password": "x"}, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.data["detail"], "Utilizador ou palavra-passe incorretos.")

    def test_login_without_csrf_token_is_rejected(self):
        client = APIClient(enforce_csrf_checks=True)
        r = client.post("/api/auth/login/", {"username": "ana", "password": "pw-teste-123"}, format="json")
        self.assertEqual(r.status_code, 403)

    def test_login_with_csrf_token_from_csrf_endpoint_works(self):
        client = APIClient(enforce_csrf_checks=True)
        client.get("/api/auth/csrf/")
        token = client.cookies["csrftoken"].value
        r = client.post("/api/auth/login/", {"username": "ana", "password": "pw-teste-123"},
                        format="json", HTTP_X_CSRFTOKEN=token)
        self.assertEqual(r.status_code, 200)

    def test_eleventh_login_attempt_within_a_minute_is_throttled(self):
        wrong = {"username": "ana", "password": "errada"}
        for _ in range(10):
            self.assertEqual(self.client.post("/api/auth/login/", wrong, format="json").status_code, 400)
        r = self.client.post("/api/auth/login/", wrong, format="json")
        self.assertEqual(r.status_code, 429)
        self.assertIn("Retry-After", r)
        self.assertIn("Demasiadas tentativas", r.data["detail"])

    def test_forged_forwarded_for_header_does_not_bypass_the_throttle(self):
        wrong = {"username": "ana", "password": "errada"}
        for i in range(10):
            r = self.client.post("/api/auth/login/", wrong, format="json", HTTP_X_FORWARDED_FOR=f"10.0.0.{i}")
            self.assertEqual(r.status_code, 400)
        r = self.client.post("/api/auth/login/", wrong, format="json", HTTP_X_FORWARDED_FOR="10.0.0.99")
        self.assertEqual(r.status_code, 429)

    def test_logout_without_csrf_token_is_rejected_for_a_logged_in_user(self):
        client = APIClient(enforce_csrf_checks=True)
        client.force_login(self.user)
        self.assertEqual(client.post("/api/auth/logout/").status_code, 403)

    def test_logout_ends_session(self):
        self.client.force_login(self.user)
        self.client.post("/api/auth/logout/")
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 403)

    def test_me_returns_username_and_display_name(self):
        self.client.force_login(self.user)
        r = self.client.get("/api/auth/me/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data, {"username": "ana", "display_name": "Ana Silva"})

    def test_display_name_falls_back_to_username(self):
        self.client.force_login(make_user("rui"))
        self.assertEqual(self.client.get("/api/auth/me/").data["display_name"], "rui")

    def test_superuser_with_no_extra_setup_can_log_in_and_see_me(self):
        User.objects.create_superuser("admin", password="pw-teste-123")
        r = self.client.post("/api/auth/login/", {"username": "admin", "password": "pw-teste-123"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data, {"username": "admin", "display_name": "admin"})
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 200)

    def test_csrf_endpoint_returns_204_to_anonymous(self):
        self.assertEqual(self.client.get("/api/auth/csrf/").status_code, 204)

    def test_unknown_api_paths_are_not_found(self):
        self.client.force_login(self.user)
        self.assertEqual(self.client.get("/api/dashboard/").status_code, 404)


class AdminAccessTests(TestCase):
    def test_normal_user_cannot_open_admin(self):
        self.client.force_login(make_user("gestor"))
        r = self.client.get("/admin/")
        self.assertEqual(r.status_code, 302)
        self.assertIn("/admin/login/", r["Location"])

    def test_staff_user_cannot_open_admin(self):
        # O Django deixa entrar qualquer is_staff; aqui o admin é só para superutilizadores.
        staff = make_user("gestor")
        staff.is_staff = True
        staff.save()
        self.client.force_login(staff)
        r = self.client.get("/admin/")
        self.assertEqual(r.status_code, 302)
        self.assertIn("/admin/login/", r["Location"])

    def test_superuser_can_open_admin(self):
        User.objects.create_superuser("admin", password="pw-teste-123")
        self.client.login(username="admin", password="pw-teste-123")
        self.assertEqual(self.client.get("/admin/").status_code, 200)
