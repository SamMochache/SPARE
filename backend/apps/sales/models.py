from decimal import Decimal
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Sale(models.Model):
    class Status(models.TextChoices):
        COMPLETED = "completed", "Completed"
        PARTIALLY_REFUNDED = "partially_refunded", "Partially refunded"
        REFUNDED = "refunded", "Refunded"

    class PaymentMethod(models.TextChoices):
        CASH = "cash", "Cash"
        MPESA = "mpesa", "M-Pesa (recorded, not verified)"
        CARD = "card", "Card"
        BANK = "bank", "Bank transfer"
        CREDIT = "credit", "Credit"

    sale_number = models.CharField(max_length=40, unique=True)
    idempotency_key = models.CharField(max_length=128, unique=True, null=True, blank=True)
    branch = models.ForeignKey("accounts.Branch", on_delete=models.PROTECT, related_name="sales")
    cashier = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="sales")
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.COMPLETED, db_index=True)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    customer_name = models.CharField(max_length=180, blank=True)
    customer_phone = models.CharField(max_length=40, blank=True)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0.00"))
    discount = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0.00"))
    total = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0.00"))
    refunded_total = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0.00"))
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at", "-id")
        indexes = [models.Index(fields=("branch", "created_at")), models.Index(fields=("branch", "status"))]

    def __str__(self):
        return self.sale_number


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.PROTECT, related_name="items")
    product = models.ForeignKey("catalog.Product", on_delete=models.PROTECT, related_name="sale_items")
    sku_snapshot = models.CharField(max_length=64)
    name_snapshot = models.CharField(max_length=180)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    line_total = models.DecimalField(max_digits=14, decimal_places=2)

    class Meta:
        ordering = ("id",)
        constraints = [
            models.UniqueConstraint(fields=("sale", "product"), name="uniq_sale_product"),
            models.CheckConstraint(condition=models.Q(quantity__gte=1), name="sale_item_qty_positive"),
        ]


class SaleReturn(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.PROTECT, related_name="returns")
    return_number = models.CharField(max_length=40, unique=True)
    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="sales_returns")
    reason = models.CharField(max_length=255)
    refund_method = models.CharField(max_length=20, choices=Sale.PaymentMethod.choices)
    total = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0.00"))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at", "-id")


class SaleReturnItem(models.Model):
    sale_return = models.ForeignKey(SaleReturn, on_delete=models.PROTECT, related_name="items")
    sale_item = models.ForeignKey(SaleItem, on_delete=models.PROTECT, related_name="return_items")
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    line_total = models.DecimalField(max_digits=14, decimal_places=2)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("sale_return", "sale_item"), name="uniq_return_sale_item"),
            models.CheckConstraint(condition=models.Q(quantity__gte=1), name="sale_return_qty_positive"),
        ]
