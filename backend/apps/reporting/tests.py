from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from apps.accounts.models import Branch
from apps.catalog.models import Product
from apps.inventory.models import StockBalance
from apps.sales.models import Sale, SaleItem

User = get_user_model()


class ReportingAPITests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(code="nairobi", name="Nairobi")
        self.other_branch = Branch.objects.create(code="mombasa", name="Mombasa")
        self.manager = User.objects.create_user(username="manager", password="pass12345", role="manager", branch=self.branch)
        self.client = APIClient()
        self.client.force_authenticate(self.manager)
        self.product = Product.objects.create(sku="FLT-01", name="Oil Filter", cost_price=Decimal("300"), selling_price=Decimal("500"))
        StockBalance.objects.create(branch=self.branch, product=self.product, quantity_on_hand=4)
        self.sale = Sale.objects.create(
            sale_number="POS-REPORT-1", branch=self.branch, cashier=self.manager, payment_method="cash",
            subtotal=Decimal("1000"), discount=Decimal("0"), total=Decimal("1000"), refunded_total=Decimal("200"),
        )
        SaleItem.objects.create(
            sale=self.sale, product=self.product, sku_snapshot=self.product.sku, name_snapshot=self.product.name,
            quantity=2, unit_price=Decimal("500"), line_total=Decimal("1000"),
        )
        Sale.objects.create(
            sale_number="POS-OTHER-BRANCH", branch=self.other_branch, cashier=self.manager, payment_method="cash",
            subtotal=Decimal("9000"), discount=Decimal("0"), total=Decimal("9000"),
        )

    def test_dashboard_uses_branch_scope_and_net_revenue(self):
        response = self.client.get("/api/v1/reports/dashboard/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["sales"]["count"], 1)
        self.assertEqual(response.data["sales"]["net_revenue"], Decimal("800"))
        self.assertEqual(response.data["inventory"]["units_on_hand"], 4)
        self.assertEqual(response.data["inventory"]["inventory_cost_value"], Decimal("1200"))

    def test_staff_cannot_request_another_branch(self):
        response = self.client.get(f"/api/v1/reports/dashboard/?branch={self.other_branch.pk}")
        self.assertEqual(response.status_code, 403)

    def test_sales_report_rejects_invalid_date_range(self):
        response = self.client.get("/api/v1/reports/sales/?start_date=2026-10-20&end_date=2026-10-01")
        self.assertEqual(response.status_code, 400)

    def test_inventory_report_shows_low_stock(self):
        response = self.client.get("/api/v1/reports/inventory/?low_stock_threshold=5")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["low_stock"]), 1)
        self.assertEqual(response.data["low_stock"][0]["sku"], "FLT-01")

    def test_top_products_uses_sale_snapshots(self):
        response = self.client.get("/api/v1/reports/top-products/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"][0]["sku_snapshot"], "FLT-01")
