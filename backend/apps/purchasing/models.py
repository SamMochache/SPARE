from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Supplier(models.Model):
    name = models.CharField(max_length=180)
    code = models.SlugField(max_length=50, unique=True)
    contact_name = models.CharField(max_length=120, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    address = models.CharField(max_length=255, blank=True)
    payment_terms = models.CharField(max_length=120, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("name",)

    def __str__(self):
        return f"{self.code} — {self.name}"


class PurchaseOrder(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ORDERED = "ordered", "Ordered"
        PARTIALLY_RECEIVED = "partially_received", "Partially received"
        RECEIVED = "received", "Received"
        CANCELLED = "cancelled", "Cancelled"

    order_number = models.CharField(max_length=40, unique=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name="purchase_orders")
    branch = models.ForeignKey("accounts.Branch", on_delete=models.PROTECT, related_name="purchase_orders")
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.DRAFT, db_index=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="purchase_orders_created")
    ordered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at", "-id")

    @property
    def total_cost(self):
        return sum((line.quantity_ordered * line.unit_cost for line in self.items.all()), Decimal("0.00"))

    @property
    def received_cost(self):
        return sum((line.quantity_received * line.unit_cost for line in self.items.all()), Decimal("0.00"))

    def __str__(self):
        return self.order_number


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("catalog.Product", on_delete=models.PROTECT, related_name="purchase_order_items")
    quantity_ordered = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    quantity_received = models.PositiveIntegerField(default=0)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])

    class Meta:
        ordering = ("id",)
        constraints = [
            models.UniqueConstraint(fields=("purchase_order", "product"), name="uniq_po_product"),
            models.CheckConstraint(condition=models.Q(quantity_received__lte=models.F("quantity_ordered")), name="po_received_lte_ordered"),
            models.CheckConstraint(condition=models.Q(quantity_ordered__gte=1), name="po_order_qty_positive"),
        ]

    @property
    def outstanding_quantity(self):
        return self.quantity_ordered - self.quantity_received

    @property
    def line_total(self):
        return self.quantity_ordered * self.unit_cost

    def __str__(self):
        return f"{self.purchase_order.order_number} — {self.product.sku}"
