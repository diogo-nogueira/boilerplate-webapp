from datetime import date

from django.contrib.auth.models import User
from django.http import QueryDict
from django.test import SimpleTestCase, TestCase
from rest_framework import serializers

from core.pagination import PAGE_SIZE, paginate
from core.responses import invalid_filter_response, invalid_page_response
from core.serializers import MAX_ID, IsoDateField, page_field


class DateQuery(serializers.Serializer):
    day = IsoDateField(required=False)


class PageQuery(serializers.Serializer):
    page = page_field()


class PaginateTests(SimpleTestCase):
    def test_page_size_is_20(self):
        self.assertEqual(PAGE_SIZE, 20)

    def test_first_page_has_20_and_totals(self):
        data = paginate(list(range(25)), 1)
        self.assertEqual(data["count"], 25)
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["total_pages"], 2)
        self.assertEqual(data["results"], list(range(20)))

    def test_second_page_has_the_rest(self):
        data = paginate(list(range(25)), 2)
        self.assertEqual(data["results"], list(range(20, 25)))
        self.assertEqual(data["page"], 2)

    def test_page_past_the_last_is_none(self):
        self.assertIsNone(paginate(list(range(25)), 3))

    def test_empty_list_has_one_empty_page(self):
        self.assertEqual(
            paginate([], 1), {"count": 0, "page": 1, "total_pages": 1, "results": []}
        )
        self.assertIsNone(paginate([], 2))


class PaginateQuerysetTests(TestCase):
    def test_works_with_a_queryset(self):
        for i in range(21):
            User.objects.create_user(username=f"u{i:02d}")
        data = paginate(User.objects.order_by("username"), 2)
        self.assertEqual(data["count"], 21)
        self.assertEqual([u.username for u in data["results"]], ["u20"])


class PageFieldTests(SimpleTestCase):
    def validate(self, text):
        serializer = PageQuery(data=QueryDict(text))
        return serializer, serializer.is_valid()

    def test_missing_page_is_page_one(self):
        serializer, ok = self.validate("")
        self.assertTrue(ok)
        self.assertEqual(serializer.validated_data["page"], 1)

    def test_valid_page(self):
        serializer, ok = self.validate(f"page={MAX_ID}")
        self.assertTrue(ok)
        self.assertEqual(serializer.validated_data["page"], MAX_ID)

    def test_invalid_pages_are_errors_in_page(self):
        for value in ("0", "-1", "abc", "1.5", "99999999999999999999", str(MAX_ID + 1)):
            with self.subTest(value=value):
                serializer, ok = self.validate(f"page={value}")
                self.assertFalse(ok)
                self.assertIn("page", serializer.errors)

    def test_messages(self):
        self.assertEqual(self.validate("page=abc")[0].errors["page"], ["Número de página inválido."])
        self.assertEqual(self.validate("page=0")[0].errors["page"], ["A página tem de ser pelo menos 1."])
        self.assertEqual(self.validate(f"page={MAX_ID + 1}")[0].errors["page"], ["Página demasiado grande."])


class IsoDateFieldTests(SimpleTestCase):
    def test_valid_date_becomes_a_date(self):
        serializer = DateQuery(data=QueryDict("day=2026-11-18"))
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["day"], date(2026, 11, 18))

    def test_missing_or_empty_is_left_out(self):
        for text in ("", "day="):
            with self.subTest(text=text):
                serializer = DateQuery(data=QueryDict(text))
                self.assertTrue(serializer.is_valid())
                self.assertNotIn("day", serializer.validated_data)

    def test_only_strict_dates_between_2000_and_2100_are_accepted(self):
        for value in ("2026-1-5", "20261118", "2026-02-30", "1999-12-31", "2101-01-01", "٢٠٢٦-١١-١٨"):
            with self.subTest(value=value):
                serializer = DateQuery(data=QueryDict(f"day={value}"))
                self.assertFalse(serializer.is_valid())
                self.assertIn("day", serializer.errors)

    def test_limits_are_accepted(self):
        for value in ("2000-01-01", "2100-12-31"):
            with self.subTest(value=value):
                self.assertTrue(DateQuery(data=QueryDict(f"day={value}")).is_valid())

    def test_non_string_is_rejected(self):
        self.assertFalse(DateQuery(data={"day": 20261118}).is_valid())


class ResponsesTests(SimpleTestCase):
    def test_invalid_filter_names_the_first_invalid_field(self):
        query = PageQuery(data=QueryDict("page=abc"))
        self.assertFalse(query.is_valid())
        response = invalid_filter_response(query)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data, {"detail": "Filtro inválido: page."})

    def test_invalid_page_response(self):
        response = invalid_page_response()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data, {"detail": "Filtro inválido: page."})
