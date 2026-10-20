from types import SimpleNamespace

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient, APIRequestFactory
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Branch
from .permissions import (
    BranchObjectPermission,
    FinanceStaff,
    InventoryStaff,
    OwnerOrManager,
    SalesStaff,
)

User = get_user_model()


class CurrentUserEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="cashier1",
            password="Strong-Test-Pass-2026!",
            email="cashier@example.com",
            first_name="Test",
            role=User.Role.CASHIER,
        )

    def test_profile_requires_authentication(self):
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, 401)

    def test_user_can_read_own_profile(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["username"], "cashier1")
        self.assertEqual(response.json()["role"], "cashier")
        self.assertNotIn("password", response.json())

    def test_user_cannot_change_own_role(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch(
            "/api/v1/auth/me/",
            {"role": "owner", "first_name": "Updated"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, User.Role.CASHIER)
        self.assertEqual(self.user.first_name, "Updated")


class LogoutEndpointTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="logout-user",
            password="Strong-Test-Pass-2026!",
            role=User.Role.CASHIER,
        )

    def test_logout_blacklists_refresh_token(self):
        refresh = RefreshToken.for_user(self.user)
        refresh_value = str(refresh)
        response = APIClient().post(
            "/api/v1/auth/logout/",
            {"refresh": refresh_value},
            format="json",
        )
        self.assertEqual(response.status_code, 200)

        reuse_response = APIClient().post(
            "/api/v1/auth/token/refresh/",
            {"refresh": refresh_value},
            format="json",
        )
        self.assertEqual(reuse_response.status_code, 401)


class RolePermissionTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="owner", password="Strong-Test-Pass-2026!", role=User.Role.OWNER)
        self.manager = User.objects.create_user(username="manager", password="Strong-Test-Pass-2026!", role=User.Role.MANAGER)
        self.cashier = User.objects.create_user(username="cashier", password="Strong-Test-Pass-2026!", role=User.Role.CASHIER)
        self.inventory = User.objects.create_user(username="inventory", password="Strong-Test-Pass-2026!", role=User.Role.INVENTORY)
        self.accountant = User.objects.create_user(username="accountant", password="Strong-Test-Pass-2026!", role=User.Role.ACCOUNTANT)

    def allowed(self, permission_class, user):
        request = APIRequestFactory().get("/")
        request.user = user
        return permission_class().has_permission(request, view=None)

    def test_owner_and_manager_have_management_access(self):
        self.assertTrue(self.allowed(OwnerOrManager, self.owner))
        self.assertTrue(self.allowed(OwnerOrManager, self.manager))
        self.assertFalse(self.allowed(OwnerOrManager, self.cashier))

    def test_inventory_access_is_limited_to_inventory_roles(self):
        self.assertTrue(self.allowed(InventoryStaff, self.inventory))
        self.assertFalse(self.allowed(InventoryStaff, self.accountant))

    def test_sales_and_finance_roles_are_separated(self):
        self.assertTrue(self.allowed(SalesStaff, self.cashier))
        self.assertFalse(self.allowed(SalesStaff, self.accountant))
        self.assertTrue(self.allowed(FinanceStaff, self.accountant))
        self.assertFalse(self.allowed(FinanceStaff, self.cashier))


class BranchScopedAccessTests(TestCase):
    def setUp(self):
        self.branch_a = Branch.objects.create(code="nairobi", name="Nairobi Shop")
        self.branch_b = Branch.objects.create(code="mombasa", name="Mombasa Shop")
        self.staff = User.objects.create_user(
            username="nairobi-cashier",
            password="Strong-Test-Pass-2026!",
            role=User.Role.CASHIER,
            branch=self.branch_a,
        )
        self.owner = User.objects.create_user(
            username="business-owner",
            password="Strong-Test-Pass-2026!",
            role=User.Role.OWNER,
        )
        self.permission = BranchObjectPermission()
        self.request = APIRequestFactory().get("/")

    def can_access(self, user, branch_id):
        self.request.user = user
        obj = SimpleNamespace(branch_id=branch_id)
        return self.permission.has_object_permission(self.request, view=None, obj=obj)

    def test_staff_can_access_objects_in_their_branch(self):
        self.assertTrue(self.can_access(self.staff, self.branch_a.id))

    def test_staff_cannot_access_another_branch(self):
        self.assertFalse(self.can_access(self.staff, self.branch_b.id))

    def test_unassigned_staff_cannot_access_branch_objects(self):
        unassigned = User.objects.create_user(
            username="unassigned",
            password="Strong-Test-Pass-2026!",
            role=User.Role.CASHIER,
        )
        self.assertFalse(self.can_access(unassigned, self.branch_a.id))

    def test_owner_can_access_any_branch(self):
        self.assertTrue(self.can_access(self.owner, self.branch_b.id))
