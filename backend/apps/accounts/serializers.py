from rest_framework import serializers

from .models import User


class UserProfileSerializer(serializers.ModelSerializer):
    """Expose safe profile fields and the authenticated user's branch assignment."""

    branch_id = serializers.IntegerField(read_only=True, allow_null=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True, allow_null=True, default=None)

    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "email", "role", "branch_id", "branch_name")
        read_only_fields = ("id", "username", "role", "branch_id", "branch_name")
