from rest_framework.permissions import BasePermission


class ReportingReadPermission(BasePermission):
    """Authenticated staff can read reports, limited to their assigned branch."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_active and
                    (user.is_superuser or user.role in (
                        "owner", "manager", "cashier", "inventory", "accountant"
                    )))
