from rest_framework.permissions import BasePermission, SAFE_METHODS


class CatalogueReadOrInventoryWrite(BasePermission):
    """Authenticated staff may read the catalogue; inventory managers maintain it."""

    message = "Only owners, managers, or inventory staff may modify the catalogue."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated or not user.is_active:
            return False
        if request.method in SAFE_METHODS:
            return True
        return bool(user.is_superuser or user.role in ("owner", "manager", "inventory"))
