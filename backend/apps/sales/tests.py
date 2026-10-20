from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from apps.accounts.models import Branch
from apps.catalog.models import Category, Product
from apps.inventory.models import StockBalance, StockMovement
from .models import Sale, SaleItem, SaleReturn

User = get_user_model()


class SalesAPITests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="nairobi", name="Nairobi")
        self.cashier = User.objects.create_user(username="cashier", password="pass12345", role="cashier", branch=self.branch)
        self.other_branch = Branch.objects.create(code="mombasa", name="Mombasa")
        self.category = Category.objects.create(name="Filters")
        self.product = Product.objects.create(sku="FLT-01", name="Oil Filter", category=self.category, cost_price=Decimal("300"), selling_price=Decimal("500"))
        self.balance = StockBalance.objects.create(branch=self.branch, product=self.product, quantity_on_hand=10)
        self.client = APIClient()
        self.client.force_authenticate(self.cashier)

    def checkout_payload(self, **overrides):
        data = {
            "sale_number": "POS-1001", "payment_method": "cash",
            "items": [{"product": self.product.pk, "quantity": 2}],
        }
        data.update(overrides)
        return data

    def test_checkout_calculates_total_and_decrements_stock(self):
        response = self.client.post("/api/v1/sales/checkout/", self.checkout_payload(), format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Decimal(response.data["total"]), Decimal("1000.00"))
        self.balance.refresh_from_db()
        self.assertEqual(self.balance.quantity_on_hand, 8)
        movement = StockMovement.objects.get(reference="POS-1001")
        self.assertEqual(movement.movement_type, StockMovement.MovementType.SALE)
        self.assertEqual(movement.balance_after, 8)

    def test_checkout_rejects_insufficient_stock_without_partial_changes(self):
        response = self.client.post("/api/v1/sales/checkout/", self.checkout_payload(items=[{"product": self.product.pk, "quantity": 99}]), format="json")
        self.assertEqual(response.status_code, 400)
        self.balance.refresh_from_db()
        self.assertEqual(self.balance.quantity_on_hand, 10)
        self.assertEqual(Sale.objects.count(), 0)

    def test_idempotency_key_returns_existing_sale(self):
        payload = self.checkout_payload(idempotency_key="checkout-abc")
        first = self.client.post("/api/v1/sales/checkout/", payload, format="json")
        second = self.client.post("/api/v1/sales/checkout/", payload, format="json")
        self.assertEqual(first.status_code, 201, first.data)
        self.assertEqual(second.status_code, 200, second.data)
        self.assertEqual(Sale.objects.count(), 1)
        self.balance.refresh_from_db()
        self.assertEqual(self.balance.quantity_on_hand, 8)

    def test_discount_cannot_exceed_subtotal(self):
        response = self.client.post("/api/v1/sales/checkout/", self.checkout_payload(discount="1001"), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Sale.objects.count(), 0)

    def test_branch_staff_cannot_sell_from_another_branch(self):
        response = self.client.post("/api/v1/sales/checkout/", self.checkout_payload(branch=self.other_branch.pk), format="json")
        self.assertEqual(response.status_code, 403)

    def test_return_replenishes_stock_and_updates_sale_status(self):
        created = self.client.post("/api/v1/sales/checkout/", self.checkout_payload(), format="json")
        sale_item_id = created.data["items"][0]["id"]
        response = self.client.post(
            f"/api/v1/sales/{created.data['id']}/returns/",
            {"return_number": "RET-1001", "reason": "Wrong part", "refund_method": "cash",
             "items": [{"sale_item": sale_item_id, "quantity": 1}]},
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.balance.refresh_from_db()
        self.assertEqual(self.balance.quantity_on_hand, 9)
        sale = Sale.objects.get(pk=created.data["id"])
        self.assertEqual(sale.status, Sale.Status.PARTIALLY_REFUNDED)
        self.assertEqual(sale.refunded_total, Decimal("500.00"))
        self.assertEqual(StockMovement.objects.filter(movement_type=StockMovement.MovementType.RETURN).count(), 1)

    def test_return_cannot_exceed_sold_quantity(self):
        created = self.client.post("/api/v1/sales/checkout/", self.checkout_payload(), format="json")
        sale_item_id = created.data["items"][0]["id"]
        response = self.client.post(
            f"/api/v1/sales/{created.data['id']}/returns/",
            {"return_number": "RET-1002", "reason": "Wrong part", "refund_method": "cash",
             "items": [{"sale_item": sale_item_id, "quantity": 3}]},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(SaleReturn.objects.count(), 0)
