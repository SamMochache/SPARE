from django.db.models import Sum
from rest_framework import serializers
from apps.accounts.models import Branch
from apps.catalog.models import Product
from apps.customers.models import Customer
from .models import Sale, SaleItem, SaleReturn, SaleReturnItem


class CheckoutItemSerializer(serializers.Serializer):
    product = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1)


class CheckoutSerializer(serializers.Serializer):
    branch = serializers.IntegerField(required=False)
    sale_number = serializers.CharField(max_length=40)
    idempotency_key = serializers.CharField(max_length=128, required=False, allow_blank=False)
    payment_method = serializers.ChoiceField(choices=Sale.PaymentMethod.choices)
    customer = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    customer_name = serializers.CharField(max_length=180, required=False, allow_blank=True)
    customer_phone = serializers.CharField(max_length=40, required=False, allow_blank=True)
    discount = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=0, required=False, default=0)
    expected_total = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=0, required=False)
    amount_paid = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=0, required=False)
    notes = serializers.CharField(required=False, allow_blank=True)
    items = CheckoutItemSerializer(many=True, allow_empty=False)

    def validate_customer(self, value):
        if value is not None and not Customer.objects.filter(pk=value, is_active=True).exists():
            raise serializers.ValidationError("Select an active customer record.")
        return value

    def validate_items(self, items):
        ids = [item["product"] for item in items]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError("Each product may appear only once; combine its quantity.")
        return items

    def validate_discount(self, value):
        if value < 0:
            raise serializers.ValidationError("Discount cannot be negative.")
        return value


class SaleItemSerializer(serializers.ModelSerializer):
    product = serializers.IntegerField(source="product_id", read_only=True)
    quantity_returned = serializers.SerializerMethodField()

    def get_quantity_returned(self, obj):
        return obj.return_items.aggregate(quantity=Sum("quantity"))["quantity"] or 0

    class Meta:
        model = SaleItem
        fields = ("id", "product", "sku_snapshot", "name_snapshot", "quantity", "quantity_returned", "unit_price", "line_total")


class SaleSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    customer_id = serializers.IntegerField(source="customer_id", read_only=True, allow_null=True)
    cashier_username = serializers.CharField(source="cashier.username", read_only=True, default=None)
    items = SaleItemSerializer(many=True, read_only=True)

    class Meta:
        model = Sale
        fields = ("id", "sale_number", "idempotency_key", "branch", "branch_name", "cashier", "cashier_username",
                  "status", "payment_method", "customer_id", "customer_name", "customer_phone", "subtotal", "discount", "total",
                  "refunded_total", "notes", "created_at", "items")
        read_only_fields = fields


class ReturnItemSerializer(serializers.Serializer):
    sale_item = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1)


class ReturnSerializer(serializers.Serializer):
    return_number = serializers.CharField(max_length=40)
    reason = serializers.CharField(max_length=255)
    refund_method = serializers.ChoiceField(choices=Sale.PaymentMethod.choices)
    items = ReturnItemSerializer(many=True, allow_empty=False)

    def validate_items(self, items):
        ids = [item["sale_item"] for item in items]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError("Each sale line may appear only once per return.")
        return items


class SaleReturnItemReadSerializer(serializers.ModelSerializer):
    sku = serializers.CharField(source="sale_item.sku_snapshot", read_only=True)
    name = serializers.CharField(source="sale_item.name_snapshot", read_only=True)

    class Meta:
        model = SaleReturnItem
        fields = ("id", "sale_item", "sku", "name", "quantity", "unit_price", "line_total")


class SaleReturnSerializer(serializers.ModelSerializer):
    items = SaleReturnItemReadSerializer(many=True, read_only=True)

    class Meta:
        model = SaleReturn
        fields = ("id", "return_number", "sale", "processed_by", "reason", "refund_method", "total", "created_at", "items")
        read_only_fields = fields
