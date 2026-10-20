from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        MANAGER = "manager", "Manager"
        CASHIER = "cashier", "Cashier"
        INVENTORY = "inventory", "Inventory"
        ACCOUNTANT = "accountant", "Accountant"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CASHIER)
    # Branch scoping will be linked to the Branch model in a later migration.
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.get_full_name() or self.username
