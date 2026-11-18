import os
import secrets
import subprocess
import sys
from pathlib import Path
from unittest import mock

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from config.settings.database import database_settings


POSTGRES_VARS = {
    "DB_ENGINE": "postgres",
    "DB_NAME": "appdb",
    "DB_USER": "app",
    "DB_PASSWORD": "palavra-passe-secreta",
    "DB_HOST": "db.exemplo.pt",
}


def strong_secret_key() -> str:
    # Só letras, dígitos, - e _. Uma chave a começar por $ seria lida pelo
    # django-environ como referência a outra variável (falhava ao acaso).
    return secrets.token_urlsafe(50)


class DefaultPermissionTests(SimpleTestCase):
    def test_api_requires_login_by_default(self):
        # Um endpoint que não declare permission_classes continua fechado a anónimos.
        self.assertEqual(
            settings.REST_FRAMEWORK["DEFAULT_PERMISSION_CLASSES"],
            ["rest_framework.permissions.IsAuthenticated"],
        )


class ProdSettingsTests(SimpleTestCase):
    def run_check(self, extra_env):
        env = {k: v for k, v in os.environ.items() if not k.startswith(("DJANGO_", "DB_"))}
        env.update(extra_env)
        env["DJANGO_SETTINGS_MODULE"] = "config.settings.prod"
        return subprocess.run(
            [sys.executable, "manage.py", "check", "--deploy", "--fail-level", "WARNING"],
            cwd=settings.BASE_DIR, env=env, capture_output=True, text=True,
        )

    def test_prod_refuses_to_start_without_secret_key(self):
        result = self.run_check({"DJANGO_ALLOWED_HOSTS": "app.exemplo.pt"})
        self.assertNotEqual(result.returncode, 0)

    def test_prod_passes_deploy_checks(self):
        result = self.run_check({
            "DJANGO_SECRET_KEY": strong_secret_key(),
            "DJANGO_ALLOWED_HOSTS": "app.exemplo.pt",
        })
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_prod_passes_deploy_checks_with_postgres(self):
        result = self.run_check({
            "DJANGO_SECRET_KEY": strong_secret_key(),
            "DJANGO_ALLOWED_HOSTS": "app.exemplo.pt",
            **POSTGRES_VARS,
        })
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_wsgi_and_asgi_default_to_prod_settings(self):
        env = {k: v for k, v in os.environ.items() if not k.startswith(("DJANGO_", "DB_"))}
        env.update({"DJANGO_SECRET_KEY": strong_secret_key(), "DJANGO_ALLOWED_HOSTS": "app.exemplo.pt"})
        for module in ("config.wsgi", "config.asgi"):
            result = subprocess.run(
                [sys.executable, "-c", f"import {module}; from django.conf import settings; print(settings.SETTINGS_MODULE)"],
                cwd=settings.BASE_DIR, env=env, capture_output=True, text=True,
            )
            self.assertEqual(result.stdout.strip(), "config.settings.prod", result.stderr)


class DatabaseSettingsTests(SimpleTestCase):
    base_dir = Path("/tmp/projeto")

    def build(self, variables):
        # Ambiente limpo de variáveis DB_*, só com as do teste.
        clean = {k: v for k, v in os.environ.items() if not k.startswith("DB_")}
        clean.update(variables)
        with mock.patch.dict(os.environ, clean, clear=True):
            return database_settings(self.base_dir)

    def test_sqlite_by_default(self):
        config = self.build({})
        self.assertEqual(config["ENGINE"], "django.db.backends.sqlite3")
        self.assertEqual(config["NAME"], self.base_dir / "db.sqlite3")

    def test_sqlite_ignores_postgres_variables(self):
        config = self.build({**POSTGRES_VARS, "DB_ENGINE": "sqlite", "DB_PORT": "abc"})
        self.assertEqual(config["ENGINE"], "django.db.backends.sqlite3")
        self.assertEqual(config["NAME"], self.base_dir / "db.sqlite3")

    def test_postgres_with_all_variables(self):
        config = self.build(POSTGRES_VARS)
        self.assertEqual(config["ENGINE"], "django.db.backends.postgresql")
        self.assertEqual(config["NAME"], "appdb")
        self.assertEqual(config["USER"], "app")
        self.assertEqual(config["PASSWORD"], "palavra-passe-secreta")
        self.assertEqual(config["HOST"], "db.exemplo.pt")
        self.assertEqual(config["PORT"], "5432")
        self.assertEqual(config["OPTIONS"], {"sslmode": "require"})

    def test_postgres_port_and_sslmode_can_be_changed(self):
        config = self.build({**POSTGRES_VARS, "DB_PORT": "55432", "DB_SSLMODE": "disable"})
        self.assertEqual(config["PORT"], "55432")
        self.assertEqual(config["OPTIONS"], {"sslmode": "disable"})

    def test_password_starting_with_dollar_is_kept_as_is(self):
        config = self.build({**POSTGRES_VARS, "DB_PASSWORD": "$abc#def ghi"})
        self.assertEqual(config["PASSWORD"], "$abc#def ghi")

    def test_empty_port_and_sslmode_use_the_defaults(self):
        config = self.build({**POSTGRES_VARS, "DB_PORT": "", "DB_SSLMODE": ""})
        self.assertEqual(config["PORT"], "5432")
        self.assertEqual(config["OPTIONS"], {"sslmode": "require"})

    def test_invalid_sslmode(self):
        with self.assertRaises(ImproperlyConfigured) as caught:
            self.build({**POSTGRES_VARS, "DB_SSLMODE": "segura"})
        self.assertEqual(
            str(caught.exception),
            "DB_SSLMODE tem de ser um destes valores: disable, allow, prefer, require, verify-ca, verify-full.",
        )

    def test_port_accepts_only_ascii_digits(self):
        for port in ("abc", "54.2", "-1", "\u00b2", "\u0665"):
            with self.subTest(port=port):
                with self.assertRaises(ImproperlyConfigured):
                    self.build({**POSTGRES_VARS, "DB_PORT": port})

    def test_name_user_and_host_are_stripped_but_not_the_password(self):
        config = self.build({
            **POSTGRES_VARS, "DB_NAME": " appdb ", "DB_USER": " app ",
            "DB_HOST": " db.exemplo.pt ", "DB_PASSWORD": " segredo ",
        })
        self.assertEqual(config["NAME"], "appdb")
        self.assertEqual(config["USER"], "app")
        self.assertEqual(config["HOST"], "db.exemplo.pt")
        self.assertEqual(config["PASSWORD"], " segredo ")

    def test_engine_ignores_case_and_spaces(self):
        config = self.build({**POSTGRES_VARS, "DB_ENGINE": " Postgres "})
        self.assertEqual(config["ENGINE"], "django.db.backends.postgresql")

    def test_missing_variable_names_it(self):
        for name in ("DB_NAME", "DB_USER", "DB_PASSWORD", "DB_HOST"):
            for empty in (False, True):
                with self.subTest(name=name, empty=empty):
                    variables = dict(POSTGRES_VARS)
                    if empty:
                        variables[name] = ""
                    else:
                        del variables[name]
                    with self.assertRaises(ImproperlyConfigured) as caught:
                        self.build(variables)
                    self.assertEqual(
                        str(caught.exception), f"Falta {name} no .env para usar postgres."
                    )

    def test_unknown_engine(self):
        with self.assertRaises(ImproperlyConfigured) as caught:
            self.build({"DB_ENGINE": "mysql"})
        self.assertEqual(str(caught.exception), "DB_ENGINE tem de ser sqlite ou postgres.")

    def test_invalid_port(self):
        with self.assertRaises(ImproperlyConfigured) as caught:
            self.build({**POSTGRES_VARS, "DB_PORT": "abc"})
        self.assertEqual(str(caught.exception), "DB_PORT tem de ser um número.")

    def test_errors_never_show_the_password(self):
        cases = [
            {**POSTGRES_VARS, "DB_HOST": ""},
            {**POSTGRES_VARS, "DB_PORT": "abc"},
            {**POSTGRES_VARS, "DB_ENGINE": "mysql"},
        ]
        for variables in cases:
            with self.assertRaises(ImproperlyConfigured) as caught:
                self.build(variables)
            self.assertNotIn(POSTGRES_VARS["DB_PASSWORD"], str(caught.exception))
