from django.db.models import Q
from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Category, Product
from .permissions import CatalogueReadOrInventoryWrite
from .serializers import CategorySerializer, ProductSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = (IsAuthenticated, CatalogueReadOrInventoryWrite,)
    filter_backends = (filters.OrderingFilter,)
    ordering_fields = ("name", "created_at", "updated_at")
    ordering = ("name",)

    def get_queryset(self):
        queryset = Category.objects.all()
        active = self.request.query_params.get("is_active")
        if active is None:
            queryset = queryset.filter(is_active=True)
        elif active.lower() in ("true", "1"):
            queryset = queryset.filter(is_active=True)
        elif active.lower() in ("false", "0"):
            queryset = queryset.filter(is_active=False)
        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(description__icontains=search))
        return queryset

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=("is_active", "updated_at"))


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = (IsAuthenticated, CatalogueReadOrInventoryWrite,)
    filter_backends = (filters.OrderingFilter,)
    ordering_fields = ("name", "sku", "brand", "cost_price", "selling_price", "created_at", "updated_at")
    ordering = ("name", "sku")

    def get_queryset(self):
        queryset = Product.objects.select_related("category").all()
        params = self.request.query_params

        active = params.get("is_active")
        if active is None:
            queryset = queryset.filter(is_active=True)
        elif active.lower() in ("true", "1"):
            queryset = queryset.filter(is_active=True)
        elif active.lower() in ("false", "0"):
            queryset = queryset.filter(is_active=False)

        search = params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(sku__icontains=search)
                | Q(brand__icontains=search)
                | Q(barcode__icontains=search)
                | Q(description__icontains=search)
            )

        category = params.get("category")
        if category:
            queryset = queryset.filter(category_id=category)

        brand = params.get("brand", "").strip()
        if brand:
            queryset = queryset.filter(brand__icontains=brand)

        min_price = params.get("min_price")
        if min_price:
            queryset = queryset.filter(selling_price__gte=min_price)

        max_price = params.get("max_price")
        if max_price:
            queryset = queryset.filter(selling_price__lte=max_price)

        return queryset

    def perform_destroy(self, instance):
        # Preserve catalogue history and any future stock/sales references.
        instance.is_active = False
        instance.save(update_fields=("is_active", "updated_at"))
