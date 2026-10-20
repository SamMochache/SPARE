from django.contrib import admin
from .models import Sale, SaleItem, SaleReturn, SaleReturnItem


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    can_delete = False
    readonly_fields = ("product", "sku_snapshot", "name_snapshot", "quantity", "unit_price", "line_total")


class SaleReturnItemInline(admin.TabularInline):
    model = SaleReturnItem
    extra = 0
    can_delete = False
    readonly_fields = ("sale_item", "quantity", "unit_price", "line_total")


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ("sale_number", "branch", "cashier", "status", "payment_method", "total", "created_at")
    list_filter = ("status", "payment_method", "branch", "created_at")
    search_fields = ("sale_number", "customer_name", "customer_phone")
    readonly_fields = ("sale_number", "idempotency_key", "branch", "cashier", "status", "payment_method",
                       "subtotal", "discount", "total", "refunded_total", "created_at")
    inlines = (SaleItemInline,)


@admin.register(SaleReturn)
class SaleReturnAdmin(admin.ModelAdmin):
    list_display = ("return_number", "sale", "reason", "refund_method", "total", "created_at")
    readonly_fields = ("sale", "return_number", "processed_by", "reason", "refund_method", "total", "created_at")
    inlines = (SaleReturnItemInline,)
