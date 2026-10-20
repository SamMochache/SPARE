from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class StockBalance(models.Model):
    """Current stock position for one product at one physical branch."""

    branch = models.ForeignKey("accounts.Branch", on_delete=models.PROTECT, related_name="stock_balances")
    product = models.ForeignKey("catalog.Product", on_delete=models.PROTECT, related_name="stock_balances")
    quantity_on_hand = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("branch__name", "product__name")
        constraints = [
            models.UniqueConstraint(fields=("branch", "product"), name="uniq_stock_branch_product"),
            models.CheckConstraint(condition=models.Q(quantity_on_hand__gte=0), name="stock_qty_nonnegative"),
        ]
        indexes = [models.Index(fields=("branch", "quantity_on_hand"))]

    def __str__(self):
        return f"{self.branch.code} — {self.product.sku}: {self.quantity_on_hand}"


class StockMovement(models.Model):
    """Append-only audit ledger; stock changes are recorded, never edited in place."""

    class MovementType(models.TextChoices):
        RECEIPT = "receipt", "Supplier receipt"
        SALE = "sale", "Sale"
        RETURN = "return", "Customer return"
        ADJUSTMENT_IN = "adjustment_in", "Positive adjustment"
        ADJUSTMENT_OUT = "adjustment_out", "Negative adjustment"

    branch = models.ForeignKey("accounts.Branch", on_delete=models.PROTECT, related_name="stock_movements")
    product = models.ForeignKey("catalog.Product", on_delete=models.PROTECT, related_name="stock_movements")
    movement_type = models.CharField(max_length=24, choices=MovementType.choices)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    balance_after = models.PositiveIntegerField()
    reason = models.CharField(max_length=255, blank=True)
    reference = models.CharField(max_length=100, blank=True, db_index=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="stock_movements")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at", "-id")
        indexes = [
            models.Index(fields=("branch", "product", "created_at")),
            models.Index(fields=("branch", "movement_type", "created_at")),
        ]

    def __str__(self):
        return f"{self.branch.code} {self.product.sku} {self.movement_type} {self.quantity}"
