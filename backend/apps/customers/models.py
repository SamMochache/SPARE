from decimal import Decimal
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class Customer(models.Model):
    class CustomerType(models.TextChoices):
        RETAIL = "retail", "Retail"
        WHOLESALE = "wholesale", "Wholesale"

    name = models.CharField(max_length=180, db_index=True)
    phone = models.CharField(max_length=40, blank=True, db_index=True)
    email = models.EmailField(blank=True)
    customer_type = models.CharField(max_length=20, choices=CustomerType.choices, default=CustomerType.RETAIL)
    kra_pin = models.CharField(max_length=20, blank=True)
    discount_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0.00"), validators=[MinValueValidator(0), MaxValueValidator(100)])
    credit_limit = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0.00"), validators=[MinValueValidator(0)])
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("name", "id")

    def __str__(self):
        return self.name


class CustomerAccountEntry(models.Model):
    class EntryType(models.TextChoices):
        CHARGE = "charge", "Credit sale charge"
        PAYMENT = "payment", "Customer payment"
        CREDIT_NOTE = "credit_note", "Credit note / returned credit sale"
        ADJUSTMENT_DEBIT = "adjustment_debit", "Audited debit adjustment"
        ADJUSTMENT_CREDIT = "adjustment_credit", "Audited credit adjustment"

    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="account_entries")
    entry_type = models.CharField(max_length=24, choices=EntryType.choices)
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    sale = models.ForeignKey("sales.Sale", null=True, blank=True, on_delete=models.PROTECT, related_name="account_entries")
    reference = models.CharField(max_length=80, blank=True)
    notes = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="customer_account_entries")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at", "id")
        indexes = [models.Index(fields=("customer", "created_at"), name="custacct_customer_date"), models.Index(fields=("customer", "entry_type"), name="custacct_customer_type")]
