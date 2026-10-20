from django.contrib.auth.models import AbstractUser
from django.db import models


class Branch(models.Model):
    """A physical shop/stock location belonging to this spare-parts business."""

    code = models.SlugField(max_length=40, unique=True)
    name = models.CharField(max_length=120)
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=32, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("name",)
        verbose_name_plural = "branches"

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"


class User(AbstractUser):
    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        MANAGER = "manager", "Manager"
        CASHIER = "cashier", "Cashier"
        INVENTORY = "inventory", "Inventory"
        ACCOUNTANT = "accountant", "Accountant"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CASHIER)
    # Owners may be unassigned and manage all branches. Other staff are scoped
    # to one branch by default; endpoint permissions enforce this restriction.
    branch = models.ForeignKey(
        Branch,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="staff",
    )
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.get_full_name() or self.username
