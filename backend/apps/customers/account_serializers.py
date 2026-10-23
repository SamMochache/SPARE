from rest_framework import serializers
from .models import CustomerAccountEntry


class CustomerPaymentInputSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=0.01)
    reference = serializers.CharField(max_length=80, required=False, allow_blank=True)
    notes = serializers.CharField(max_length=255, required=False, allow_blank=True)


class CustomerAccountEntrySerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True, default=None)

    class Meta:
        model = CustomerAccountEntry
        fields = ("id", "entry_type", "amount", "sale", "reference", "notes", "created_by", "created_by_username", "created_at")
        read_only_fields = fields
