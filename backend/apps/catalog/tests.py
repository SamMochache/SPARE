from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Category, Product

User = get_user_model()


class CatalogueAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            username="catalog-owner",
            password="Strong-Test-Pass-2026!",
            role=User.Role.OWNER,
        )
        self.cashier = User.objects.create_user(
            username="catalog-cashier",
            password="Strong-Test-Pass-2026!",
            role=User.Role.CASHIER,
        )
        self.category = Category.objects.create(name="Engine Parts")
        self.product = Product.objects.create(
            sku="ENG-001",
            name="Oil Filter",
            brand="Bosch",
            category=self.category,
            barcode="600000001",
            cost_price=Decimal("350.00"),
            selling_price=Decimal("500.00"),
        )

    def test_catalogue_requires_authentication(self):
        response = self.client.get("/api/v1/products/")
        self.assertEqual(response.status_code, 401)

    def test_authenticated_staff_can_list_active_products(self):
        self.client.force_authenticate(self.cashier)
        response = self.client.get("/api/v1/products/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["sku"], "ENG-001")

    def test_product_search_and_category_filter(self):
        self.client.force_authenticate(self.cashier)
        response = self.client.get("/api/v1/products/?search=bosch&category={}".format(self.category.id))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        response = self.client.get("/api/v1/products/?search=not-found")
        self.assertEqual(response.json()["count"], 0)

    def test_cashier_cannot_create_product(self):
        self.client.force_authenticate(self.cashier)
        response = self.client.post(
            "/api/v1/products/",
            {"sku": "NEW-001", "name": "Brake Pad", "cost_price": "100.00", "selling_price": "150.00"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_inventory_role_can_create_product(self):
        inventory = User.objects.create_user(
            username="catalog-inventory",
            password="Strong-Test-Pass-2026!",
            role=User.Role.INVENTORY,
        )
        self.client.force_authenticate(inventory)
        response = self.client.post(
            "/api/v1/products/",
            {"sku": "BRK-001", "name": "Brake Pad", "cost_price": "100.00", "selling_price": "150.00"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["sku"], "BRK-001")

    def test_duplicate_sku_is_rejected_case_insensitively(self):
        self.client.force_authenticate(self.owner)
        response = self.client.post(
            "/api/v1/products/",
            {"sku": "eng-001", "name": "Duplicate Filter", "cost_price": "200.00", "selling_price": "300.00"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("sku", response.json())

    def test_negative_prices_are_rejected(self):
        self.client.force_authenticate(self.owner)
        response = self.client.post(
            "/api/v1/products/",
            {"sku": "NEG-001", "name": "Invalid Part", "cost_price": "-1.00", "selling_price": "10.00"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_delete_archives_product_instead_of_removing_it(self):
        self.client.force_authenticate(self.owner)
        response = self.client.delete("/api/v1/products/{}/".format(self.product.id))
        self.assertEqual(response.status_code, 204)
        self.product.refresh_from_db()
        self.assertFalse(self.product.is_active)
        response = self.client.get("/api/v1/products/")
        self.assertEqual(response.json()["count"], 0)
        response = self.client.get("/api/v1/products/?is_active=false")
        self.assertEqual(response.json()["count"], 1)

    def test_category_write_is_restricted_to_management_roles(self):
        self.client.force_authenticate(self.cashier)
        response = self.client.post("/api/v1/categories/", {"name": "Electrical"}, format="json")
        self.assertEqual(response.status_code, 403)
        self.client.force_authenticate(self.owner)
        response = self.client.post("/api/v1/categories/", {"name": "Electrical"}, format="json")
        self.assertEqual(response.status_code, 201)
