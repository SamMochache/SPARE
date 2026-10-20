from decimal import Decimal
from django.db.models import Count, DecimalField, ExpressionWrapper, F, Sum
from django.db.models.functions import TruncDate
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Branch
from apps.inventory.models import StockBalance
from apps.purchasing.models import PurchaseOrder
from apps.sales.models import Sale, SaleItem, SaleReturn
from .permissions import ReportingReadPermission
from .serializers import ReportFilterSerializer


class ReportingBaseView(APIView):
    permission_classes = (ReportingReadPermission,)

    def get_context(self, request):
        serializer = ReportFilterSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        user = request.user
        requested_branch = values.get("branch")

        if user.is_superuser or user.role == "owner":
            branch_id = requested_branch
            if branch_id:
                get_object_or_404(Branch, pk=branch_id, is_active=True)
        else:
            if not user.branch_id or not user.branch.is_active:
                raise PermissionDenied("Your account must be assigned to an active branch.")
            if requested_branch is not None and requested_branch != user.branch_id:
                raise PermissionDenied("You cannot view reports for another branch.")
            branch_id = user.branch_id

        sales = Sale.objects.all()
        stock = StockBalance.objects.select_related("branch", "product").all()
        purchase_orders = PurchaseOrder.objects.all()
        returns = SaleReturn.objects.select_related("sale").all()
        if branch_id is not None:
            sales = sales.filter(branch_id=branch_id)
            stock = stock.filter(branch_id=branch_id)
            purchase_orders = purchase_orders.filter(branch_id=branch_id)
            returns = returns.filter(sale__branch_id=branch_id)

        start_date, end_date = values["start_date"], values["end_date"]
        sales = sales.filter(created_at__date__gte=start_date, created_at__date__lte=end_date)
        returns = returns.filter(created_at__date__gte=start_date, created_at__date__lte=end_date)
        purchase_orders = purchase_orders.filter(created_at__date__gte=start_date, created_at__date__lte=end_date)
        return {
            "filters": values,
            "branch_id": branch_id,
            "sales": sales,
            "stock": stock,
            "purchase_orders": purchase_orders,
            "returns": returns,
            "start_date": start_date,
            "end_date": end_date,
        }


class DashboardSummaryView(ReportingBaseView):
    def get(self, request):
        ctx = self.get_context(request)
        sales = ctx["sales"]
        stock = ctx["stock"]
        purchase_orders = ctx["purchase_orders"]
        returns = ctx["returns"]

        sales_totals = sales.aggregate(
            sale_count=Count("id"),
            gross_revenue=Sum("total"),
            refunded_total=Sum("refunded_total"),
        )
        gross = sales_totals["gross_revenue"] or Decimal("0.00")
        refunded = sales_totals["refunded_total"] or Decimal("0.00")
        valuation_expression = ExpressionWrapper(
            F("quantity_on_hand") * F("product__cost_price"),
            output_field=DecimalField(max_digits=20, decimal_places=2),
        )
        stock_totals = stock.aggregate(
            units_on_hand=Sum("quantity_on_hand"),
            inventory_cost_value=Sum(valuation_expression),
            product_positions=Count("id"),
        )
        sold_units = SaleItem.objects.filter(
            sale__in=sales
        ).aggregate(quantity=Sum("quantity"))["quantity"] or 0
        return Response({
            "period": {"start_date": ctx["start_date"], "end_date": ctx["end_date"]},
            "branch": ctx["branch_id"],
            "sales": {
                "count": sales_totals["sale_count"] or 0,
                "gross_revenue": gross,
                "refunded_total": refunded,
                "net_revenue": gross - refunded,
                "units_sold": sold_units,
            },
            "inventory": {
                "product_positions": stock_totals["product_positions"] or 0,
                "units_on_hand": stock_totals["units_on_hand"] or 0,
                "inventory_cost_value": stock_totals["inventory_cost_value"] or Decimal("0.00"),
                "low_stock_positions": stock.filter(
                    quantity_on_hand__lte=ctx["filters"].get("low_stock_threshold", 5)
                ).count(),
            },
            "purchasing": {
                "purchase_orders": purchase_orders.count(),
                "open_purchase_orders": purchase_orders.filter(
                    status__in=("draft", "ordered", "partially_received")
                ).count(),
            },
            "returns": {
                "count": returns.count(),
                "recorded_refund_value": returns.aggregate(total=Sum("total"))["total"] or Decimal("0.00"),
            },
            "notes": [
                "Revenue is based on recorded sales, not verified payment settlement.",
                "Inventory valuation uses each product's current catalogue cost price, not historical purchase cost.",
            ],
        })


class SalesReportView(ReportingBaseView):
    def get(self, request):
        ctx = self.get_context(request)
        rows = (
            ctx["sales"].annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(
                sale_count=Count("id"),
                gross_revenue=Sum("total"),
                refunded_total=Sum("refunded_total"),
            )
            .order_by("day")
        )
        results = []
        for row in rows:
            gross = row["gross_revenue"] or Decimal("0.00")
            refunded = row["refunded_total"] or Decimal("0.00")
            results.append({
                "date": row["day"],
                "sale_count": row["sale_count"],
                "gross_revenue": gross,
                "refunded_total": refunded,
                "net_revenue": gross - refunded,
            })
        return Response({
            "period": {"start_date": ctx["start_date"], "end_date": ctx["end_date"]},
            "branch": ctx["branch_id"],
            "results": results,
        })


class InventoryReportView(ReportingBaseView):
    def get(self, request):
        ctx = self.get_context(request)
        threshold = ctx["filters"].get("low_stock_threshold", 5)
        rows = ctx["stock"].filter(quantity_on_hand__lte=threshold).order_by(
            "quantity_on_hand", "product__name"
        )
        results = [{
            "branch": row.branch_id,
            "branch_name": row.branch.name,
            "product": row.product_id,
            "sku": row.product.sku,
            "name": row.product.name,
            "quantity_on_hand": row.quantity_on_hand,
            "cost_price": row.product.cost_price,
            "estimated_cost_value": row.product.cost_price * row.quantity_on_hand,
        } for row in rows]
        valuation = ctx["stock"].aggregate(
            total=Sum(ExpressionWrapper(
                F("quantity_on_hand") * F("product__cost_price"),
                output_field=DecimalField(max_digits=20, decimal_places=2),
            ))
        )["total"] or Decimal("0.00")
        units = ctx["stock"].aggregate(total=Sum("quantity_on_hand"))["total"] or 0
        return Response({
            "branch": ctx["branch_id"],
            "low_stock_threshold": threshold,
            "inventory": {"units_on_hand": units, "estimated_cost_value": valuation},
            "low_stock": results,
            "note": "Estimated valuation uses current catalogue cost prices.",
        })


class TopProductsReportView(ReportingBaseView):
    def get(self, request):
        ctx = self.get_context(request)
        rows = (
            SaleItem.objects.filter(sale__in=ctx["sales"])
            .values("product_id", "sku_snapshot", "name_snapshot")
            .annotate(units_sold=Sum("quantity"), sales_value=Sum("line_total"), sale_count=Count("sale_id", distinct=True))
            .order_by("-units_sold", "-sales_value", "name_snapshot")[:20]
        )
        return Response({
            "period": {"start_date": ctx["start_date"], "end_date": ctx["end_date"]},
            "branch": ctx["branch_id"],
            "results": list(rows),
            "note": "Sales values are item line totals before sale-level discounts and do not represent net profit.",
        })
