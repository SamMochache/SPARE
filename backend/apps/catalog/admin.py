from django.contrib import admin

from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("name", "description")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("sku", "name", "brand", "category", "cost_price", "selling_price", "is_active")
    list_filter = ("is_active", "category", "brand")
    search_fields = ("sku", "name", "brand", "barcode")
    list_select_related = ("category",)
