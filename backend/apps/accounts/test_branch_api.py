from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Branch

User = get_user_model()


class BranchListAPITests(TestCase):
    def setUp(self):
        self.branch_a = Branch.objects.create(code="nairobi", name="Nairobi", is_active=True)
        self.branch_b = Branch.objects.create(code="mombasa", name="Mombasa", is_active=True)
        Branch.objects.create(code="closed", name="Closed branch", is_active=False)
        self.staff = User.objects.create_user(
            username="branch-staff", password="test-pass-123", role=User.Role.INVENTORY, branch=self.branch_a
        )
        self.owner = User.objects.create_user(username="branch-owner", password="test-pass-123", role=User.Role.OWNER)
        self.client = APIClient()

    def test_staff_only_sees_assigned_active_branch(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get("/api/v1/auth/branches/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([row["id"] for row in response.data["results"]], [self.branch_a.id])

    def test_owner_sees_all_active_branches(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.get("/api/v1/auth/branches/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual({row["id"] for row in response.data["results"]}, {self.branch_a.id, self.branch_b.id})

    def test_current_user_exposes_branch_assignment(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["branch_id"], self.branch_a.id)
        self.assertEqual(response.data["branch_name"], self.branch_a.name)
        self.assertFalse(response.data["is_superuser"])
