from django.contrib.auth import get_user_model
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Branch
from .permissions import OwnerOrManager
from .staff_serializers import StaffUserSerializer

User = get_user_model()


class StaffUserListCreateView(generics.ListCreateAPIView):
    serializer_class = StaffUserSerializer
    permission_classes = (IsAuthenticated, OwnerOrManager)

    def get_queryset(self):
        user = self.request.user
        queryset = User.objects.select_related("branch").order_by("username")
        if user.is_superuser or user.role == "owner":
            return queryset
        if not user.branch_id:
            return queryset.none()
        return queryset.filter(branch_id=user.branch_id)


class StaffUserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = StaffUserSerializer
    permission_classes = (IsAuthenticated, OwnerOrManager)
    http_method_names = ("get", "patch", "head", "options")

    def get_queryset(self):
        user = self.request.user
        queryset = User.objects.select_related("branch")
        if user.is_superuser or user.role == "owner":
            return queryset
        if not user.branch_id:
            return queryset.none()
        return queryset.filter(branch_id=user.branch_id)
