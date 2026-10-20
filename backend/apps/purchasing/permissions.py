from rest_framework.permissions import SAFE_METHODS, BasePermission


class PurchasingPermission(BasePermission):
    message = "Only owners, managers, or inventory staff may manage purchasing."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated or not user.is_active:
            return False
        if request.method in SAFE_METHODS:
            return True
        return bool(user.is_superuser or user.role in ("owner", "manager", "inventory"))
