from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Branch
from apps.catalog.models import Product
from apps.inventory.models import StockBalance, StockMovement
from .models import PurchaseOrder, PurchaseOrderItem, Supplier

User = get_user_model()


class PurchasingAPITests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="nairobi", name="Nairobi")
        self.other_branch = Branch.objects.create(code="mombasa", name="Mombasa")
        self.product = Product.objects.create(
            sku="BRK-001",
            name="Brake Pad",
            cost_price="900.00",
            selling_price="1400.00",
        )
        self.supplier = Supplier.objects.create(
            code="acme-parts",
            name="Acme Parts",
            phone="+254700000000",
        )
        self.manager = User.objects.create_user(
            username="manager",
            password="test-pass-123",
            role=User.Role.MANAGER,
            branch=self.branch,
        )
        self.other_manager = User.objects.create_user(
            username="other-manager",
            password="test-pass-123",
            role=User.Role.MANAGER,
            branch=self.other_branch,
        )
        self.cashier = User.objects.create_user(
            username="cashier",
            password="test-pass-123",
            role=User.Role.CASHIER,
            branch=self.branch,
        )
        self.owner = User.objects.create_user(
            username="owner",
            password="test-pass-123",
            role=User.Role.OWNER,
        )
        self.client = APIClient()

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def create_order(self, order_number="PO-100", branch=None, quantity=10):
        return PurchaseOrder.objects.create(
            order_number=order_number,
            supplier=self.supplier,
            branch=branch or self.branch,
            created_by=self.manager,
            status=PurchaseOrder.Status.ORDERED,
        ), PurchaseOrderItem.objects.create(
            purchase_order=PurchaseOrder.objects.get(order_number=order_number),
            product=self.product,
            quantity_ordered=quantity,
            unit_cost="900.00",
        )

    def test_unauthenticated_cannot_read_suppliers(self):
        response = self.client.get("/api/v1/suppliers/")
        self.assertEqual(response.status_code, 401)

    def test_cashier_cannot_create_supplier(self):
        self.authenticate(self.cashier)
        response = self.client.post(
            "/api/v1/suppliers/",
            {"name": "New Supplier", "code": "new-supplier"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_manager_can_create_purchase_order_for_assigned_branch(self):
        self.authenticate(self.manager)
        response = self.client.post(
            "/api/v1/purchase-orders/",
            {
                "order_number": "PO-101",
                "supplier": self.supplier.pk,
                "branch": self.branch.pk,
                "items": [{"product": self.product.pk, "quantity_ordered": 5, "unit_cost": "900.00"}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        order = PurchaseOrder.objects.get(order_number="PO-101")
        self.assertEqual(order.branch, self.branch)
        self.assertEqual(order.created_by, self.manager)
        self.assertEqual(order.status, PurchaseOrder.Status.DRAFT)
        self.assertEqual(order.items.get().quantity_ordered, 5)

    def test_manager_cannot_create_purchase_order_for_another_branch(self):
        self.authenticate(self.manager)
        response = self.client.post(
            "/api/v1/purchase-orders/",
            {
                "order_number": "PO-102",
                "supplier": self.supplier.pk,
                "branch": self.other_branch.pk,
                "items": [{"product": self.product.pk, "quantity_ordered": 5, "unit_cost": "900.00"}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400, response.data)

    def test_receipt_updates_balance_and_writes_ledger(self):
        self.authenticate(self.manager)
        order, line = self.create_order()
        response = self.client.post(
            f"/api/v1/purchase-orders/{order.pk}/receive/",
            {"items": [{"item_id": line.pk, "quantity": 4}]},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(StockBalance.objects.get(branch=self.branch, product=self.product).quantity_on_hand, 4)
        line.refresh_from_db()
        self.assertEqual(line.quantity_received, 4)
        order.refresh_from_db()
        self.assertEqual(order.status, PurchaseOrder.Status.PARTIALLY_RECEIVED)
        movement = StockMovement.objects.get()
        self.assertEqual(movement.reference, order.order_number)
        self.assertEqual(movement.quantity, 4)
        self.assertEqual(movement.created_by, self.manager)

    def test_receipt_can_be_completed_in_multiple_deliveries(self):
        self.authenticate(self.manager)
        order, line = self.create_order(quantity=10)
        first = self.client.post(
            f"/api/v1/purchase-orders/{order.pk}/receive/",
            {"items": [{"item_id": line.pk, "quantity": 6}]},
            format="json",
        )
        self.assertEqual(first.status_code, 200, first.data)
        second = self.client.post(
            f"/api/v1/purchase-orders/{order.pk}/receive/",
            {"items": [{"item_id": line.pk, "quantity": 4}]},
            format="json",
        )
        self.assertEqual(second.status_code, 200, second.data)
        order.refresh_from_db()
        self.assertEqual(order.status, PurchaseOrder.Status.RECEIVED)
        self.assertEqual(StockBalance.objects.get(branch=self.branch, product=self.product).quantity_on_hand, 10)
        self.assertEqual(StockMovement.objects.count(), 2)

    def test_cannot_receive_more_than_outstanding_quantity(self):
        self.authenticate(self.manager)
        order, line = self.create_order(quantity=5)
        response = self.client.post(
            f"/api/v1/purchase-orders/{order.pk}/receive/",
            {"items": [{"item_id": line.pk, "quantity": 6}]},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(StockBalance.objects.filter(branch=self.branch, product=self.product).exists())
        self.assertEqual(StockMovement.objects.count(), 0)

    def test_staff_cannot_view_another_branch_purchase_order(self):
        order, _ = self.create_order("PO-200", branch=self.other_branch)
        self.authenticate(self.manager)
        response = self.client.get(f"/api/v1/purchase-orders/{order.pk}/")
        self.assertEqual(response.status_code, 404)

    def test_owner_can_view_purchase_orders_across_branches(self):
        order, _ = self.create_order("PO-201", branch=self.other_branch)
        self.authenticate(self.owner)
        response = self.client.get(f"/api/v1/purchase-orders/{order.pk}/")
        self.assertEqual(response.status_code, 200, response.data)
