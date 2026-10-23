from django.contrib import admin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "email", "customer_type", "is_active", "updated_at")
    list_filter = ("customer_type", "is_active")
    search_fields = ("name", "phone", "email", "kra_pin")
