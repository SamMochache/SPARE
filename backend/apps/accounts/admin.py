from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Branch, User


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "phone", "is_active", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("name", "code", "address", "phone")
    prepopulated_fields = {"code": ("name",)}


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("Shop access", {"fields": ("role", "branch")}),)
    add_fieldsets = UserAdmin.add_fieldsets + (("Shop access", {"fields": ("role", "branch")}),)
    list_display = ("username", "email", "role", "branch", "is_staff", "is_active")
    list_filter = ("role", "branch", "is_staff", "is_active")
    search_fields = ("username", "email", "first_name", "last_name")
