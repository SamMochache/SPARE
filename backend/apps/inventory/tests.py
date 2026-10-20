from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Branch
from apps.catalog.models import Product
from .models import StockBalance, StockMovement

User = get_user_model()


class InventoryAPITests(TestCase):
    def setUp(self):
        self.branch_a = Branch.objects.create(code="nairobi", name="Nairobi")
        self.branch_b = Branch.objects.create(code="mombasa", name="Mombasa")
        self.product = Product.objects.create(sku="OIL-001", name="Engine Oil", cost_price="500.00", selling_price="750.00")
        self.inventory_user = User.objects.create_user(username="stock", password="test-pass-123", role=User.Role.INVENTORY, branch=self.branch_a)
        self.cashier = User.objects.create_user(username="cashier", password="test-pass-123", role=User.Role.CASHIER, branch=self.branch_a)
        self.other_branch_user = User.objects.create_user(username="other", password="test-pass-123", role=User.Role.MANAGER, branch=self.branch_b)
        self.owner = User.objects.create_user(username="owner", password="test-pass-123", role=User.Role.OWNER)
        self.client = APIClient()

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_unauthenticated_cannot_read_stock(self):
        response = self.client.get("/api/v1/stock-balances/")
        self.assertEqual(response.status_code, 401)

    def test_inventory_staff_can_receive_stock_and_ledger_is_written(self):
        self.authenticate(self.inventory_user)
        response = self.client.post("/api/v1/stock/receive/", {"product": self.product.pk, "quantity": 8, "reason": "Opening delivery"}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        balance = StockBalance.objects.get(branch=self.branch_a, product=self.product)
        self.assertEqual(balance.quantity_on_hand, 8)
        movement = StockMovement.objects.get()
        self.assertEqual(movement.movement_type, StockMovement.MovementType.RECEIPT)
        self.assertEqual(movement.balance_after, 8)
        self.assertEqual(movement.created_by, self.inventory_user)

    def test_cashier_cannot_change_stock(self):
        self.authenticate(self.cashier)
        response = self.client.post("/api/v1/stock/receive/", {"product": self.product.pk, "quantity": 8}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_staff_cannot_read_another_branch_stock(self):
        StockBalance.objects.create(branch=self.branch_b, product=self.product, quantity_on_hand=14)
        self.authenticate(self.inventory_user)
        response = self.client.get("/api/v1/stock-balances/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 0)

    def test_staff_cannot_force_another_branch_in_write_payload(self):
        self.authenticate(self.inventory_user)
        response = self.client.post("/api/v1/stock/receive/", {"branch": self.branch_b.pk, "product": self.product.pk, "quantity": 8}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_adjustment_cannot_reduce_stock_below_zero(self):
        StockBalance.objects.create(branch=self.branch_a, product=self.product, quantity_on_hand=3)
        self.authenticate(self.inventory_user)
        response = self.client.post("/api/v1/stock/adjust/", {"product": self.product.pk, "quantity_delta": -4, "reason": "Count correction"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(StockBalance.objects.get(branch=self.branch_a, product=self.product).quantity_on_hand, 3)
        self.assertEqual(StockMovement.objects.count(), 0)

    def test_owner_can_select_branch_for_receipt(self):
        self.authenticate(self.owner)
        response = self.client.post("/api/v1/stock/receive/", {"branch": self.branch_b.pk, "product": self.product.pk, "quantity": 5}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(StockBalance.objects.get(branch=self.branch_b, product=self.product).quantity_on_hand, 5)

    def test_negative_adjustment_records_auditable_movement(self):
        StockBalance.objects.create(branch=self.branch_a, product=self.product, quantity_on_hand=10)
        self.authenticate(self.inventory_user)
        response = self.client.post("/api/v1/stock/adjust/", {"product": self.product.pk, "quantity_delta": -2, "reason": "Damaged packaging"}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(StockBalance.objects.get(branch=self.branch_a, product=self.product).quantity_on_hand, 8)
        movement = StockMovement.objects.get()
        self.assertEqual(movement.movement_type, StockMovement.MovementType.ADJUSTMENT_OUT)
        self.assertEqual(movement.quantity, 2)
        self.assertEqual(movement.balance_after, 8)
