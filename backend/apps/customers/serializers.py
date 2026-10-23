from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    type = serializers.ChoiceField(source="customer_type", choices=Customer.CustomerType.choices, required=False)
    kraPin = serializers.CharField(source="kra_pin", required=False, allow_blank=True)
    discountRate = serializers.DecimalField(source="discount_rate", max_digits=5, decimal_places=2, required=False)
    creditLimit = serializers.DecimalField(source="credit_limit", max_digits=14, decimal_places=2, required=False)

    class Meta:
        model = Customer
        fields = ("id", "name", "phone", "email", "type", "kraPin", "discountRate", "creditLimit", "is_active", "created_at", "updated_at")
        read_only_fields = ("id", "is_active", "created_at", "updated_at")

    def validate_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Enter a customer name of at least two characters.")
        return value

    def validate_phone(self, value):
        value = value.strip()
        if value:
            qs = Customer.objects.filter(phone__iexact=value, is_active=True)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("An active customer with this phone number already exists.")
        return value

    def validate_email(self, value):
        return value.strip().lower()
