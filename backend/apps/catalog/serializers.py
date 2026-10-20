from rest_framework import serializers

from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "description", "is_active", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)

    class Meta:
        model = Product
        fields = (
            "id",
            "sku",
            "name",
            "brand",
            "description",
            "category",
            "category_name",
            "barcode",
            "cost_price",
            "selling_price",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_sku(self, value):
        value = value.strip()
        qs = Product.objects.filter(sku__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A product with this SKU already exists.")
        return value

    def validate_barcode(self, value):
        value = value.strip()
        if not value:
            return value
        qs = Product.objects.filter(barcode__iexact=value).exclude(barcode="")
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A product with this barcode already exists.")
        return value

    def validate(self, attrs):
        cost = attrs.get("cost_price", getattr(self.instance, "cost_price", None))
        selling = attrs.get("selling_price", getattr(self.instance, "selling_price", None))
        if cost is not None and selling is not None and cost < 0:
            raise serializers.ValidationError({"cost_price": "Cost price cannot be negative."})
        if selling is not None and selling < 0:
            raise serializers.ValidationError({"selling_price": "Selling price cannot be negative."})
        return attrs
