from django.db import transaction
from rest_framework import serializers

from apps.accounts.models import Branch
from apps.catalog.models import Product
from .models import PurchaseOrder, PurchaseOrderItem, Supplier


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = (
            "id", "name", "code", "contact_name", "email", "phone", "address",
            "payment_terms", "notes", "is_active", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    outstanding_quantity = serializers.IntegerField(read_only=True)
    line_total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = (
            "id", "product", "product_sku", "product_name", "quantity_ordered",
            "quantity_received", "outstanding_quantity", "unit_cost", "line_total",
        )
        read_only_fields = ("id", "quantity_received", "outstanding_quantity", "line_total")


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    created_by_username = serializers.CharField(source="created_by.username", read_only=True, default=None)
    total_cost = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    received_cost = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = (
            "id", "order_number", "supplier", "supplier_name", "branch", "branch_name",
            "status", "notes", "items", "total_cost", "received_cost", "created_by",
            "created_by_username", "ordered_at", "created_at", "updated_at",
        )
        read_only_fields = ("id", "status", "created_by", "created_by_username", "ordered_at", "created_at", "updated_at", "total_cost", "received_cost")

    def validate_order_number(self, value):
        value = value.strip()
        qs = PurchaseOrder.objects.filter(order_number__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A purchase order with this number already exists.")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        branch = attrs.get("branch", getattr(self.instance, "branch", None))
        supplier = attrs.get("supplier", getattr(self.instance, "supplier", None))
        if self.instance and self.instance.status != PurchaseOrder.Status.DRAFT:
            raise serializers.ValidationError("Only draft purchase orders can be edited.")
        if supplier and not supplier.is_active:
            raise serializers.ValidationError({"supplier": "Select an active supplier."})
        if branch and not branch.is_active:
            raise serializers.ValidationError({"branch": "Select an active branch."})
        if user and user.is_authenticated and not (user.is_superuser or user.role == "owner"):
            if not user.branch_id:
                raise serializers.ValidationError({"branch": "Your account must be assigned to a branch."})
            if branch and branch.pk != user.branch_id:
                raise serializers.ValidationError({"branch": "You cannot create a purchase order for another branch."})
        items = attrs.get("items")
        if items is not None:
            if not items:
                raise serializers.ValidationError({"items": "Add at least one product to the purchase order."})
            product_ids = [item["product"].pk for item in items]
            if len(product_ids) != len(set(product_ids)):
                raise serializers.ValidationError({"items": "Each product may appear only once per purchase order."})
            for item in items:
                if not item["product"].is_active:
                    raise serializers.ValidationError({"items": "Archived products cannot be ordered."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        request = self.context["request"]
        user = request.user
        if not (user.is_superuser or user.role == "owner"):
            validated_data["branch_id"] = user.branch_id
        order = PurchaseOrder.objects.create(created_by=user, **validated_data)
        PurchaseOrderItem.objects.bulk_create([
            PurchaseOrderItem(purchase_order=order, **item) for item in items_data
        ])
        return order

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        if instance.status != PurchaseOrder.Status.DRAFT:
            raise serializers.ValidationError("Only draft purchase orders can be edited.")
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            PurchaseOrderItem.objects.bulk_create([
                PurchaseOrderItem(purchase_order=instance, **item) for item in items_data
            ])
        return instance


class ReceivePurchaseOrderSerializer(serializers.Serializer):
    items = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False,
    )

    def validate_items(self, items):
        cleaned = []
        seen = set()
        for index, item in enumerate(items):
            if set(item.keys()) - {"item_id", "quantity"} or "item_id" not in item or "quantity" not in item:
                raise serializers.ValidationError(f"Item {index + 1} must contain only item_id and quantity.")
            try:
                item_id = int(item["item_id"])
                quantity = int(item["quantity"])
            except (TypeError, ValueError):
                raise serializers.ValidationError(f"Item {index + 1} item_id and quantity must be integers.")
            if item_id <= 0 or quantity <= 0:
                raise serializers.ValidationError(f"Item {index + 1} item_id and quantity must be positive.")
            if item_id in seen:
                raise serializers.ValidationError("Each purchase order line may appear only once per receipt.")
            seen.add(item_id)
            cleaned.append({"item_id": item_id, "quantity": quantity})
        return cleaned
