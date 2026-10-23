from rest_framework import serializers
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated

from .models import Branch
from .permissions import OwnerOrManager
from .serializers import UserProfileSerializer


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ("id", "code", "name", "address", "phone", "is_active", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_code(self, value):
        value = value.strip().lower()
        if not value:
            raise serializers.ValidationError("A branch code is required.")
        return value


class BranchListView(ListCreateAPIView):
    """List active branches for authorized staff; owners/managers can create branches."""

    serializer_class = BranchSerializer
    permission_classes = (IsAuthenticated,)

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), OwnerOrManager()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        queryset = Branch.objects.filter(is_active=True)
        if user.is_superuser or user.role == "owner":
            return queryset
        if not user.branch_id:
            return queryset.none()
        return queryset.filter(pk=user.branch_id)

    def perform_create(self, serializer):
        serializer.save(is_active=True)


class CurrentUserView(RetrieveUpdateAPIView):
    """Read or update the authenticated user's own basic profile."""

    serializer_class = UserProfileSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user
