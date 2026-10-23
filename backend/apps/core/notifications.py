from apps.inventory.models import StockBalance

from .models import Notification


LOW_STOCK_THRESHOLD = 10


def sync_low_stock_notifications(user):
    """Create/update branch-scoped low-stock alerts without resetting read status."""
    balances = StockBalance.objects.select_related("branch", "product").filter(
        quantity_on_hand__lt=LOW_STOCK_THRESHOLD,
        product__is_active=True,
        branch__is_active=True,
    )
    if not (user.is_superuser or user.role == "owner"):
        if not user.branch_id:
            return
        balances = balances.filter(branch_id=user.branch_id)

    for balance in balances.iterator():
        event_key = f"low-stock:{balance.branch_id}:{balance.product_id}"
        Notification.objects.update_or_create(
            recipient=user,
            event_key=event_key,
            defaults={
                "branch": balance.branch,
                "title": (
                    f"Out of stock: {balance.product.name}"
                    if balance.quantity_on_hand == 0
                    else f"Low stock: {balance.product.name}"
                ),
                "body": (
                    f"{balance.quantity_on_hand} left at {balance.branch.name}; "
                    f"SKU {balance.product.sku}. Reorder threshold is {LOW_STOCK_THRESHOLD}."
                ),
                "tone": "danger" if balance.quantity_on_hand == 0 else "warning",
                "link": f"/products?q={balance.product.sku}",
            },
            create_defaults=None,
        )
