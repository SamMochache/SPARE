from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.inventory.models import StockBalance
from .models import Notification
from .serializers import NotificationSerializer

LOW_STOCK_THRESHOLD = 10


class NotificationListView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        user = request.user
        balances = StockBalance.objects.select_related("branch", "product").filter(
            quantity_on_hand__lt=LOW_STOCK_THRESHOLD,
            product__is_active=True,
            branch__is_active=True,
        )
        if not (user.is_superuser or user.role == "owner"):
            if not user.branch_id:
                balances = balances.none()
            else:
                balances = balances.filter(branch_id=user.branch_id)

        # Refresh low-stock alert text while preserving whether the user read it.
        for balance in balances.iterator():
            event_key = f"low-stock:{balance.branch_id}:{balance.product_id}"
            defaults = {
                "branch": balance.branch,
                "title": f"{'Out of stock' if balance.quantity_on_hand == 0 else 'Low stock'}: {balance.product.name}",
                "body": f"{balance.quantity_on_hand} left at {balance.branch.name}; SKU {balance.product.sku}. Reorder threshold is {LOW_STOCK_THRESHOLD}.",
                "tone": "danger" if balance.quantity_on_hand == 0 else "warning",
                "link": f"/products?q={balance.product.sku}",
            }
            Notification.objects.get_or_create(recipient=user, event_key=event_key, defaults=defaults)
            Notification.objects.filter(recipient=user, event_key=event_key).update(
                branch=defaults["branch"], title=defaults["title"], body=defaults["body"],
                tone=defaults["tone"], link=defaults["link"],
            )

        queryset = Notification.objects.filter(recipient=user).select_related("branch")[:100]
        return Response(NotificationSerializer(queryset, many=True).data)


class NotificationReadView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, pk=None):
        queryset = Notification.objects.filter(recipient=request.user)
        if pk is None:
            updated = queryset.filter(is_read=False).update(is_read=True)
            return Response({"updated": updated}, status=status.HTTP_200_OK)
        notification = get_object_or_404(queryset, pk=pk)
        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=("is_read",))
        return Response(NotificationSerializer(notification).data)
