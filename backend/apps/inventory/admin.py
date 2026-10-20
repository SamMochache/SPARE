from django.contrib import admin

from .models import StockBalance, StockMovement


@admin.register(StockBalance)
class StockBalanceAdmin(admin.ModelAdmin):
    list_display = ("branch", "product", "quantity_on_hand", "updated_at")
    list_filter = ("branch",)
    search_fields = ("product__sku", "product__name", "branch__name")
    readonly_fields = ("branch", "product", "quantity_on_hand", "updated_at")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ("created_at", "branch", "product", "movement_type", "quantity", "balance_after", "created_by")
    list_filter = ("branch", "movement_type", "created_at")
    search_fields = ("product__sku", "product__name", "reference", "reason")
    readonly_fields = ("branch", "product", "movement_type", "quantity", "balance_after", "reason", "reference", "created_by", "created_at")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
