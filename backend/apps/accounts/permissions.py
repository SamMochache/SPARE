from rest_framework.exceptions import PermissionDenied
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


class BranchScopedQuerysetMixin:
    """
    Scope a DRF generic view's queryset to the signed-in user's branch.

    Use on views whose model has a ForeignKey named branch. Owners and Django
    superusers can see all branches. Unassigned non-owner staff see no records.
    Pair this with BranchObjectPermission on detail/update/delete endpoints.
    """

    branch_lookup = "branch_id"

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user or not user.is_authenticated:
            return queryset.none()
        if user.is_superuser or user.role == "owner":
            return queryset
        if not user.branch_id:
            return queryset.none()
        return queryset.filter(**{self.branch_lookup: user.branch_id})

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_superuser or user.role == "owner":
            serializer.save()
            return
        if not user.branch_id:
            raise PermissionDenied("Your account must be assigned to a branch.")
        serializer.save(branch_id=user.branch_id)


class BranchObjectPermission(BasePermission):
    """Prevent staff from retrieving or changing another branch's object."""

    message = "You do not have access to records from another branch."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated or not user.is_active:
            return False
        if user.is_superuser or user.role == "owner":
            return True

        object_branch_id = getattr(obj, "branch_id", None)
        return bool(user.branch_id and object_branch_id == user.branch_id)
