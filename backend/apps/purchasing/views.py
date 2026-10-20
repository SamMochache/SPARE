from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import Branch
from apps.catalog.models import Product
from apps.inventory.models import StockBalance, StockMovement
from .models import PurchaseOrder, PurchaseOrderItem, Supplier
from .permissions import PurchasingPermission
from .serializers import (
    PurchaseOrderSerializer,
    ReceivePurchaseOrderSerializer,
    SupplierSerializer,
)


class BranchScopeMixin:
    def scope_branch(self, queryset):
        user = self.request.user
        if user.is_superuser or user.role == "owner":
            return queryset
        if not user.branch_id:
            return queryset.none()
        return queryset.filter(branch_id=user.branch_id)


class SupplierViewSet(viewsets.ModelViewSet):
    serializer_class = SupplierSerializer
    permission_classes = (IsAuthenticated, PurchasingPermission,)
    queryset = Supplier.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get("search")
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(code__icontains=search)
                | Q(contact_name__icontains=search)
                | Q(phone__icontains=search)
                | Q(email__icontains=search)
            )
        active = self.request.query_params.get("is_active")
        if active in ("true", "false"):
            queryset = queryset.filter(is_active=(active == "true"))
        elif active is None:
            queryset = queryset.filter(is_active=True)
        return queryset

    def perform_destroy(self, instance):
        # Preserve supplier history referenced by purchase orders.
        instance.is_active = False
        instance.save(update_fields=("is_active", "updated_at"))


class PurchaseOrderViewSet(BranchScopeMixin, viewsets.ModelViewSet):
    serializer_class = PurchaseOrderSerializer
    permission_classes = (IsAuthenticated, PurchasingPermission,)
    queryset = PurchaseOrder.objects.select_related("supplier", "branch", "created_by").prefetch_related("items__product")

    def get_queryset(self):
        queryset = self.scope_branch(super().get_queryset())
        params = self.request.query_params
        if params.get("status"):
            queryset = queryset.filter(status=params["status"])
        if params.get("supplier"):
            queryset = queryset.filter(supplier_id=params["supplier"])
        if params.get("branch") and (self.request.user.is_superuser or self.request.user.role == "owner"):
            queryset = queryset.filter(branch_id=params["branch"])
        return queryset

    def perform_update(self, serializer):
        instance = serializer.instance
        if instance.status != PurchaseOrder.Status.DRAFT:
            raise ValidationError("Only draft purchase orders can be edited.")
        serializer.save()

    @action(detail=True, methods=("post",), url_path="order")
    def order(self, request, pk=None):
        with transaction.atomic():
            order = get_object_or_404(
                self.get_queryset().select_for_update(),
                pk=pk,
            )
            if order.status != PurchaseOrder.Status.DRAFT:
                raise ValidationError({"status": "Only a draft purchase order can be ordered."})
            if not order.items.exists():
                raise ValidationError({"items": "Add at least one line item before ordering."})
            if not order.supplier.is_active or not order.branch.is_active:
                raise ValidationError("The supplier and branch must both be active.")
            order.status = PurchaseOrder.Status.ORDERED
            order.ordered_at = timezone.now()
            order.save(update_fields=("status", "ordered_at", "updated_at"))
        return Response(self.get_serializer(order).data)

    @action(detail=True, methods=("post",), url_path="receive")
    def receive(self, request, pk=None):
        payload = ReceivePurchaseOrderSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        receipt_items = payload.validated_data["items"]

        with transaction.atomic():
            order = get_object_or_404(
                self.get_queryset().select_for_update(),
                pk=pk,
            )
            if order.status not in (PurchaseOrder.Status.ORDERED, PurchaseOrder.Status.PARTIALLY_RECEIVED):
                raise ValidationError({"status": "Only ordered or partially received purchase orders can be received."})
            if not order.branch.is_active:
                raise ValidationError({"branch": "Cannot receive stock into an inactive branch."})

            item_ids = [row["item_id"] for row in receipt_items]
            lines = {
                line.pk: line
                for line in PurchaseOrderItem.objects.select_for_update()
                .filter(purchase_order=order, pk__in=item_ids)
                .select_related("product")
            }
            if len(lines) != len(item_ids):
                raise ValidationError({"items": "One or more line item IDs do not belong to this purchase order."})

            for receipt in receipt_items:
                line = lines[receipt["item_id"]]
                quantity = receipt["quantity"]
                if quantity > line.quantity_ordered - line.quantity_received:
                    raise ValidationError({
                        "items": f"Receipt quantity exceeds outstanding quantity for {line.product.sku}."
                    })
                product = Product.objects.select_for_update().filter(pk=line.product_id, is_active=True).first()
                if product is None:
                    raise ValidationError({"items": f"Product {line.product.sku} is inactive or missing."})

                balance, _ = StockBalance.objects.select_for_update().get_or_create(
                    branch=order.branch,
                    product=product,
                    defaults={"quantity_on_hand": 0},
                )
                balance.quantity_on_hand += quantity
                balance.save(update_fields=("quantity_on_hand", "updated_at"))

                line.quantity_received += quantity
                line.save(update_fields=("quantity_received",))

                StockMovement.objects.create(
                    branch=order.branch,
                    product=product,
                    movement_type=StockMovement.MovementType.RECEIPT,
                    quantity=quantity,
                    balance_after=balance.quantity_on_hand,
                    reason=f"Purchase order {order.order_number}",
                    reference=order.order_number,
                    created_by=request.user,
                )

            lines_qs = order.items.all()
            all_received = not lines_qs.filter(quantity_received__lt=F("quantity_ordered")).exists()
            any_received = lines_qs.filter(quantity_received__gt=0).exists()
            if all_received:
                order.status = PurchaseOrder.Status.RECEIVED
            elif any_received:
                order.status = PurchaseOrder.Status.PARTIALLY_RECEIVED
            order.save(update_fields=("status", "updated_at"))

        order.refresh_from_db()
        return Response(self.get_serializer(order).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=("post",), url_path="cancel")
    def cancel(self, request, pk=None):
        with transaction.atomic():
            order = get_object_or_404(self.get_queryset().select_for_update(), pk=pk)
            if order.status not in (PurchaseOrder.Status.DRAFT, PurchaseOrder.Status.ORDERED):
                raise ValidationError({"status": "Only draft or not-yet-received orders can be cancelled."})
            if order.items.filter(quantity_received__gt=0).exists():
                raise ValidationError("An order with received items cannot be cancelled; finish or reconcile it first.")
            order.status = PurchaseOrder.Status.CANCELLED
            order.save(update_fields=("status", "updated_at"))
        return Response(self.get_serializer(order).data)
