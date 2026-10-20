from rest_framework import serializers

from .models import StockBalance, StockMovement


class StockBalanceSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = StockBalance
        fields = ("id", "branch", "branch_name", "product", "product_sku", "product_name", "quantity_on_hand", "updated_at")
        read_only_fields = fields


class StockMovementSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    created_by_username = serializers.CharField(source="created_by.username", read_only=True, default=None)

    class Meta:
        model = StockMovement
        fields = (
            "id", "branch", "branch_name", "product", "product_sku", "product_name",
            "movement_type", "quantity", "balance_after", "reason", "reference",
            "created_by", "created_by_username", "created_at",
        )
        read_only_fields = fields


class ReceiveStockSerializer(serializers.Serializer):
    branch = serializers.IntegerField(required=False)
    product = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    reason = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    reference = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")


class AdjustStockSerializer(serializers.Serializer):
    branch = serializers.IntegerField(required=False)
    product = serializers.IntegerField()
    quantity_delta = serializers.IntegerField()
    reason = serializers.CharField(max_length=255)
    reference = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")

    def validate_quantity_delta(self, value):
        if value == 0:
            raise serializers.ValidationError("Adjustment must change stock by a non-zero quantity.")
        return value
