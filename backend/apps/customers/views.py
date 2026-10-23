from django.db.models import Q, Sum, Count
from decimal import Decimal
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Customer
from .permissions import CustomerAccess
from .serializers import CustomerSerializer
from apps.sales.models import Sale
from apps.sales.serializers import SaleSerializer
from apps.sales.views import scope_sales


class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = (CustomerAccess,)
    filter_backends = (filters.OrderingFilter,)
    ordering_fields = ("name", "created_at", "updated_at")
    ordering = ("name", "id")
    http_method_names = ("get", "post", "patch", "delete", "head", "options")

    def get_queryset(self):
        queryset = Customer.objects.all()
        if getattr(self, "action", None) == "restore":
            return queryset
        active = self.request.query_params.get("is_active")
        if active is None or active.lower() in ("true", "1"):
            queryset = queryset.filter(is_active=True)
        elif active.lower() in ("false", "0"):
            queryset = queryset.filter(is_active=False)
        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(phone__icontains=search) | Q(email__icontains=search) | Q(kra_pin__icontains=search))
        return queryset

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=("is_active", "updated_at"))

    @action(detail=True, methods=("get",), url_path="sales")
    def sales(self, request, pk=None):
        customer = self.get_object()
        queryset = scope_sales(Sale.objects.filter(customer=customer).select_related("branch", "cashier").prefetch_related("items"), request.user)
        summary = queryset.aggregate(count=Count("id"), total=Sum("total"), refunded=Sum("refunded_total"))
        page = self.paginate_queryset(queryset)
        serialized = SaleSerializer(page if page is not None else queryset, many=True)
        payload = {
            "customer_id": customer.pk,
            "count": summary["count"] or 0,
            "total": str(summary["total"] or Decimal("0.00")),
            "refunded": str(summary["refunded"] or Decimal("0.00")),
            "results": serialized.data,
        }
        if page is not None:
            response = self.get_paginated_response(serialized.data)
            response.data.update({"customer_id": customer.pk, "total_sales": payload["total"], "total_refunded": payload["refunded"]})
            return response
        return Response(payload)

    @action(detail=True, methods=("post",), url_path="restore")
    def restore(self, request, pk=None):
        customer = self.get_object()
        customer.is_active = True
        customer.save(update_fields=("is_active", "updated_at"))
        return Response(self.get_serializer(customer).data, status=status.HTTP_200_OK)
