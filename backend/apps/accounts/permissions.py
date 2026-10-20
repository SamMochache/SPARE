from rest_framework.permissions import BasePermission


class RoleRequiredPermission(BasePermission):
    """Base class for role-based endpoint access."""

    allowed_roles = ()

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and (user.is_superuser or user.role in self.allowed_roles)
        )


class OwnerOrManager(RoleRequiredPermission):
    allowed_roles = ("owner", "manager")


class InventoryStaff(RoleRequiredPermission):
    allowed_roles = ("owner", "manager", "inventory")


class SalesStaff(RoleRequiredPermission):
    allowed_roles = ("owner", "manager", "cashier")


class FinanceStaff(RoleRequiredPermission):
    allowed_roles = ("owner", "manager", "accountant")
