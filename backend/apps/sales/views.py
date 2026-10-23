from decimal import Decimal
from django.db import IntegrityError, transaction
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import Branch
from apps.catalog.models import Product
from apps.customers.models import Customer
from apps.inventory.models import StockBalance, StockMovement
from .models import Sale, SaleItem, SaleReturn, SaleReturnItem
from .permissions import SalesPermission
from .serializers import CheckoutSerializer, SaleSerializer, ReturnSerializer, SaleReturnSerializer


def resolve_branch(user, requested_id=None):
    if user.is_superuser or user.role == "owner":
        if not requested_id:
            raise ValidationError({"branch": "Owners must specify a branch."})
        return get_object_or_404(Branch, pk=requested_id, is_active=True)
    if not user.branch_id or not user.branch.is_active:
        raise PermissionDenied("Your account must be assigned to an active branch.")
    if requested_id:
        try:
            requested_id = int(requested_id)
        except (TypeError, ValueError):
            raise ValidationError({"branch": "Enter a valid branch ID."})
        if requested_id != user.branch_id:
            raise PermissionDenied("You cannot transact at another branch.")
    return user.branch


def scope_sales(queryset, user):
    if user.is_superuser or user.role == "owner":
        return queryset
    if not user.branch_id:
        return queryset.none()
    return queryset.filter(branch_id=user.branch_id)


class SaleViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SaleSerializer
    permission_classes = (IsAuthenticated, SalesPermission)
    queryset = Sale.objects.all()

    def get_queryset(self):
        qs = Sale.objects.select_related("branch", "cashier").prefetch_related("items", "items__product")
        qs = scope_sales(qs, self.request.user)
        params = self.request.query_params
        if params.get("status"):
            qs = qs.filter(status=params["status"])
        if params.get("payment_method"):
            qs = qs.filter(payment_method=params["payment_method"])
        if params.get("sale_number"):
            qs = qs.filter(sale_number__icontains=params["sale_number"])
        if params.get("from"):
            qs = qs.filter(created_at__date__gte=params["from"])
        if params.get("to"):
            qs = qs.filter(created_at__date__lte=params["to"])
        if params.get("customer"):
            qs = qs.filter(customer_id=params["customer"])
        return qs

    @action(detail=False, methods=("post",), url_path="checkout")
    def checkout(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        key = values.get("idempotency_key")
        if key:
            existing = Sale.objects.filter(idempotency_key=key).first()
            if existing:
                if existing.cashier_id != request.user.id:
                    raise PermissionDenied("This idempotency key belongs to another cashier.")
                return Response(SaleSerializer(existing).data, status=status.HTTP_200_OK)

        branch = resolve_branch(request.user, values.get("branch"))
        try:
            with transaction.atomic():
                product_ids = sorted(item["product"] for item in values["items"])
                products = {
                    p.pk: p for p in Product.objects.select_for_update().filter(
                        pk__in=product_ids, is_active=True
                    ).order_by("pk")
                }
                if len(products) != len(product_ids):
                    raise ValidationError({"items": "One or more products do not exist or are inactive."})

                balances = {}
                for product_id in product_ids:
                    balance, _ = StockBalance.objects.select_for_update().get_or_create(
                        branch=branch, product_id=product_id, defaults={"quantity_on_hand": 0}
                    )
                    balances[product_id] = balance

                subtotal = Decimal("0.00")
                lines = []
                for item in values["items"]:
                    product = products[item["product"]]
                    balance = balances[product.pk]
                    quantity = item["quantity"]
                    if balance.quantity_on_hand < quantity:
                        raise ValidationError({"items": f"Insufficient stock for {product.sku}. Available: {balance.quantity_on_hand}."})
                    price = product.selling_price
                    line_total = price * quantity
                    subtotal += line_total
                    lines.append((product, balance, quantity, price, line_total))

                discount = values["discount"]
                if discount > subtotal:
                    raise ValidationError({"discount": "Discount cannot exceed the subtotal."})
                total = subtotal - discount
                if "expected_total" in values and values["expected_total"] != total:
                    raise ValidationError({"expected_total": "The sale total changed. Refresh prices and review the cart before retrying."})
                if "amount_paid" in values:
                    amount_paid = values["amount_paid"]
                    if amount_paid < total:
                        raise ValidationError({"amount_paid": "Amount received is less than the server-calculated sale total."})
                    if values["payment_method"] != Sale.PaymentMethod.CASH and amount_paid != total:
                        raise ValidationError({"amount_paid": "For non-cash methods, the recorded amount must equal the sale total."})
                customer = None
                if values.get("customer") is not None:
                    customer = Customer.objects.filter(pk=values["customer"], is_active=True).first()
                    if customer is None:
                        raise ValidationError({"customer": "Select an active customer record."})
                sale = Sale.objects.create(
                    sale_number=values["sale_number"], idempotency_key=key or None,
                    branch=branch, cashier=request.user, payment_method=values["payment_method"],
                    customer=customer,
                    customer_name=customer.name if customer else values.get("customer_name", ""),
                    customer_phone=customer.phone if customer else values.get("customer_phone", ""),
                    subtotal=subtotal, discount=discount, total=total, notes=values.get("notes", ""),
                )
                for product, balance, quantity, price, line_total in lines:
                    balance.quantity_on_hand -= quantity
                    balance.save(update_fields=("quantity_on_hand", "updated_at"))
                    SaleItem.objects.create(
                        sale=sale, product=product, sku_snapshot=product.sku, name_snapshot=product.name,
                        quantity=quantity, unit_price=price, line_total=line_total,
                    )
                    StockMovement.objects.create(
                        branch=branch, product=product, movement_type=StockMovement.MovementType.SALE,
                        quantity=quantity, balance_after=balance.quantity_on_hand,
                        reason=f"POS sale {sale.sale_number}", reference=sale.sale_number, created_by=request.user,
                    )
                return Response(SaleSerializer(sale).data, status=status.HTTP_201_CREATED)
        except IntegrityError:
            if key:
                existing = Sale.objects.filter(idempotency_key=key).first()
                if existing and existing.cashier_id == request.user.id:
                    return Response(SaleSerializer(existing).data, status=status.HTTP_200_OK)
            raise ValidationError({"sale_number": "Sale number or idempotency key already exists."})

    @action(detail=True, methods=("post",), url_path="returns")
    def create_return(self, request, pk=None):
        sale = get_object_or_404(scope_sales(Sale.objects.all(), request.user), pk=pk)
        serializer = ReturnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        try:
            with transaction.atomic():
                sale = get_object_or_404(scope_sales(Sale.objects.select_for_update(), request.user), pk=pk)
                if sale.status == Sale.Status.REFUNDED:
                    raise ValidationError({"sale": "This sale has already been fully refunded."})
                lines_by_id = {line.pk: line for line in SaleItem.objects.filter(sale=sale)}
                total = Decimal("0.00")
                resolved = []
                for item in values["items"]:
                    line = lines_by_id.get(item["sale_item"])
                    if not line:
                        raise ValidationError({"items": "A selected sale line does not belong to this sale."})
                    already_returned = SaleReturnItem.objects.filter(sale_item=line).aggregate(qty=Sum("quantity"))["qty"] or 0
                    if item["quantity"] > line.quantity - already_returned:
                        raise ValidationError({"items": f"Return quantity exceeds remaining sold quantity for {line.sku_snapshot}."})
                    amount = line.unit_price * item["quantity"]
                    total += amount
                    resolved.append((line, item["quantity"], amount))
                if sale.refunded_total + total > sale.total:
                    raise ValidationError({"items": "Refund would exceed the amount paid for this sale."})
                sale_return = SaleReturn.objects.create(
                    sale=sale, return_number=values["return_number"], processed_by=request.user,
                    reason=values["reason"], refund_method=values["refund_method"], total=total,
                )
                for line, quantity, amount in resolved:
                    balance, _ = StockBalance.objects.select_for_update().get_or_create(
                        branch=sale.branch, product=line.product, defaults={"quantity_on_hand": 0}
                    )
                    balance.quantity_on_hand += quantity
                    balance.save(update_fields=("quantity_on_hand", "updated_at"))
                    SaleReturnItem.objects.create(
                        sale_return=sale_return, sale_item=line, quantity=quantity,
                        unit_price=line.unit_price, line_total=amount,
                    )
                    StockMovement.objects.create(
                        branch=sale.branch, product=line.product, movement_type=StockMovement.MovementType.RETURN,
                        quantity=quantity, balance_after=balance.quantity_on_hand,
                        reason=f"Customer return {sale_return.return_number}", reference=sale.sale_number,
                        created_by=request.user,
                    )
                sale.refunded_total += total
                returned_qty = SaleReturnItem.objects.filter(sale_item__sale=sale).aggregate(qty=Sum("quantity"))["qty"] or 0
                sold_qty = SaleItem.objects.filter(sale=sale).aggregate(qty=Sum("quantity"))["qty"] or 0
                sale.status = Sale.Status.REFUNDED if returned_qty == sold_qty else Sale.Status.PARTIALLY_REFUNDED
                sale.save(update_fields=("refunded_total", "status"))
                return Response(SaleReturnSerializer(sale_return).data, status=status.HTTP_201_CREATED)
        except IntegrityError:
            raise ValidationError({"return_number": "Return number already exists."})
