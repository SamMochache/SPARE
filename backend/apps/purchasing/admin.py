from django.contrib import admin

from .models import PurchaseOrder, PurchaseOrderItem, Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "phone", "email", "is_active")
    list_filter = ("is_active",)
    search_fields = ("code", "name", "contact_name", "phone", "email")


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 0
    readonly_fields = ("quantity_received",)


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "supplier", "branch", "status", "created_at", "created_by")
    list_filter = ("status", "branch", "supplier")
    search_fields = ("order_number", "supplier__name", "supplier__code")
    readonly_fields = ("status", "created_by", "ordered_at", "created_at", "updated_at")
    inlines = (PurchaseOrderItemInline,)
