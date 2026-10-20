from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import Branch
from apps.catalog.models import Product
from .models import StockBalance, StockMovement
from .permissions import InventoryReadWritePermission
from .serializers import AdjustStockSerializer, ReceiveStockSerializer, StockBalanceSerializer, StockMovementSerializer


class BranchScopedInventoryQuerysetMixin:
    """Owners can see all branches; other staff see only their assigned branch."""

    def scope_to_user_branch(self, queryset):
        user = self.request.user
        if user.is_superuser or user.role == "owner":
            return queryset
        if not user.branch_id:
            return queryset.none()
        return queryset.filter(branch_id=user.branch_id)


class StockBalanceViewSet(BranchScopedInventoryQuerysetMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = StockBalanceSerializer
    permission_classes = (IsAuthenticated, InventoryReadWritePermission,)

    def get_queryset(self):
        queryset = StockBalance.objects.select_related("branch", "product").all()
        queryset = self.scope_to_user_branch(queryset)
        branch = self.request.query_params.get("branch")
        product = self.request.query_params.get("product")
        if branch:
            queryset = queryset.filter(branch_id=branch)
        if product:
            queryset = queryset.filter(product_id=product)
        return queryset


class StockMovementViewSet(BranchScopedInventoryQuerysetMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = StockMovementSerializer
    permission_classes = (IsAuthenticated, InventoryReadWritePermission,)

    def get_queryset(self):
        queryset = StockMovement.objects.select_related("branch", "product", "created_by").all()
        queryset = self.scope_to_user_branch(queryset)
        params = self.request.query_params
        if params.get("branch"):
            queryset = queryset.filter(branch_id=params["branch"])
        if params.get("product"):
            queryset = queryset.filter(product_id=params["product"])
        if params.get("movement_type"):
            queryset = queryset.filter(movement_type=params["movement_type"])
        if params.get("reference"):
            queryset = queryset.filter(reference=params["reference"])
        return queryset


class StockOperationsViewSet(viewsets.GenericViewSet):
    permission_classes = (IsAuthenticated, InventoryReadWritePermission,)
    serializer_class = ReceiveStockSerializer

    def _resolve_branch(self, request, requested_branch_id):
        user = request.user
        if user.is_superuser or user.role == "owner":
            if not requested_branch_id:
                raise ValidationError({"branch": "Owners must specify a branch for this stock operation."})
            branch = get_object_or_404(Branch, pk=requested_branch_id, is_active=True)
            return branch

        if not user.branch_id:
            raise PermissionDenied("Your account must be assigned to an active branch.")
        if requested_branch_id and requested_branch_id != user.branch_id:
            raise PermissionDenied("You cannot modify stock for another branch.")
        if not user.branch.is_active:
            raise PermissionDenied("Your assigned branch is inactive.")
        return user.branch

    def _apply_movement(self, request, *, product_id, quantity_delta, movement_type, reason="", reference=""):
        if quantity_delta == 0:
            raise ValidationError({"quantity_delta": "Stock change must be non-zero."})

        with transaction.atomic():
            # Serializing operations on the product row also prevents duplicate
            # first-time balance creation for concurrent requests on PostgreSQL.
            product = get_object_or_404(
                Product.objects.select_for_update(),
                pk=product_id,
                is_active=True,
            )
            requested_branch_id = request.data.get("branch")
            if requested_branch_id not in (None, ""):
                try:
                    requested_branch_id = int(requested_branch_id)
                except (TypeError, ValueError):
                    raise ValidationError({"branch": "Enter a valid branch ID."})
            else:
                requested_branch_id = None
            branch = self._resolve_branch(request, requested_branch_id)

            balance, _ = StockBalance.objects.select_for_update().get_or_create(
                branch=branch,
                product=product,
                defaults={"quantity_on_hand": 0},
            )
            new_quantity = balance.quantity_on_hand + quantity_delta
            if new_quantity < 0:
                raise ValidationError({
                    "quantity_delta": f"Insufficient stock. Available quantity is {balance.quantity_on_hand}."
                })

            balance.quantity_on_hand = new_quantity
            balance.save(update_fields=("quantity_on_hand", "updated_at"))
            movement = StockMovement.objects.create(
                branch=branch,
                product=product,
                movement_type=movement_type,
                quantity=abs(quantity_delta),
                balance_after=new_quantity,
                reason=reason,
                reference=reference,
                created_by=request.user,
            )
            return movement

    @action(detail=False, methods=("post",), url_path="receive")
    def receive(self, request):
        serializer = ReceiveStockSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        movement = self._apply_movement(
            request,
            product_id=values["product"],
            quantity_delta=values["quantity"],
            movement_type=StockMovement.MovementType.RECEIPT,
            reason=values.get("reason", ""),
            reference=values.get("reference", ""),
        )
        return Response(StockMovementSerializer(movement).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=("post",), url_path="adjust")
    def adjust(self, request):
        serializer = AdjustStockSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        delta = values["quantity_delta"]
        movement_type = (
            StockMovement.MovementType.ADJUSTMENT_IN
            if delta > 0
            else StockMovement.MovementType.ADJUSTMENT_OUT
        )
        movement = self._apply_movement(
            request,
            product_id=values["product"],
            quantity_delta=delta,
            movement_type=movement_type,
            reason=values["reason"],
            reference=values.get("reference", ""),
        )
        return Response(StockMovementSerializer(movement).data, status=status.HTTP_200_OK)
