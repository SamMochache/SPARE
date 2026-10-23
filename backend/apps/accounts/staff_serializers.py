from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Branch, User


class StaffUserSerializer(serializers.ModelSerializer):
    branch_id = serializers.IntegerField(required=False, allow_null=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])

    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "email", "role", "branch_id", "branch_name", "is_active", "last_login", "password")
        read_only_fields = ("id", "branch_name", "last_login")

    def validate_role(self, value):
        if value not in User.Role.values:
            raise serializers.ValidationError("Choose a valid staff role.")
        return value

    def validate_branch_id(self, value):
        if value is None:
            return value
        if not Branch.objects.filter(pk=value, is_active=True).exists():
            raise serializers.ValidationError("Choose an active branch.")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        if request and request.user.role != "owner" and not request.user.is_superuser:
            if attrs.get("role") == "owner":
                raise serializers.ValidationError({"role": "Only an owner can assign the owner role."})
            if "branch_id" in attrs and attrs["branch_id"] != request.user.branch_id:
                raise serializers.ValidationError({"branch_id": "Managers can only assign staff to their own branch."})
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "A temporary password is required."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        branch_id = validated_data.pop("branch_id", None)
        user = User(**validated_data)
        user.branch_id = branch_id
        user.set_password(password)
        user.save()
        return user
