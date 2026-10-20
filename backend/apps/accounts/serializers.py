from rest_framework import serializers

from .models import User


class UserProfileSerializer(serializers.ModelSerializer):
    """Expose safe profile fields; role and privilege flags are read-only."""

    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "email", "role")
        read_only_fields = ("id", "username", "role")
