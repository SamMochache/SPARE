from rest_framework.generics import ListAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.serializers import ModelSerializer

from .models import Branch
from .serializers import UserProfileSerializer


class BranchSerializer(ModelSerializer):
    class Meta:
        model = Branch
        fields = ("id", "code", "name", "address", "is_active")
        read_only_fields = fields


class BranchListView(ListAPIView):
    """Owners can select any active branch; staff see only their assigned branch."""

    serializer_class = BranchSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        queryset = Branch.objects.filter(is_active=True)
        if user.is_superuser or user.role == "owner":
            return queryset
        if not user.branch_id:
            return queryset.none()
        return queryset.filter(pk=user.branch_id)


class CurrentUserView(RetrieveUpdateAPIView):
    """Read or update the authenticated user's own basic profile."""

    serializer_class = UserProfileSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user
