from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from .models import Customer


class CustomerApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        User = get_user_model()
        self.cashier = User.objects.create_user(username="cashier", password="safe-test-password", role="cashier")
        self.accountant = User.objects.create_user(username="accountant", password="safe-test-password", role="accountant")
        self.client.force_authenticate(self.cashier)

    def test_cashier_can_create_and_search_customer(self):
        response = self.client.post("/api/v1/customers/", {"name": "Kamau Garage", "phone": "+254722000000", "type": "wholesale", "discountRate": "5.00"}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["name"], "Kamau Garage")
        found = self.client.get("/api/v1/customers/?search=Kamau")
        self.assertEqual(found.status_code, 200)
        self.assertEqual(found.data["results"][0]["id"], response.data["id"])

    def test_duplicate_active_phone_is_rejected(self):
        Customer.objects.create(name="First", phone="+254700000001")
        response = self.client.post("/api/v1/customers/", {"name": "Second", "phone": "+254700000001"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_accountant_cannot_mutate_customers(self):
        self.client.force_authenticate(self.accountant)
        response = self.client.post("/api/v1/customers/", {"name": "Blocked customer"}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_delete_archives_customer(self):
        customer = Customer.objects.create(name="Archive me")
        response = self.client.delete(f"/api/v1/customers/{customer.id}/")
        self.assertEqual(response.status_code, 204)
        customer.refresh_from_db()
        self.assertFalse(customer.is_active)
