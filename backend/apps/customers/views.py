from django.db.models import Q
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Customer
from .permissions import CustomerAccess
from .serializers import CustomerSerializer


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

    @action(detail=True, methods=("post",), url_path="restore")
    def restore(self, request, pk=None):
        customer = self.get_object()
        customer.is_active = True
        customer.save(update_fields=("is_active", "updated_at"))
        return Response(self.get_serializer(customer).data, status=status.HTTP_200_OK)
