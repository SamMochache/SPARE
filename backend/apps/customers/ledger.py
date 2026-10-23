from decimal import Decimal

from django.db.models import Sum
from .models import CustomerAccountEntry


def customer_balance(customer):
    totals = CustomerAccountEntry.objects.filter(customer=customer).aggregate(
        charges=Sum("amount", filter=__import__("django.db.models", fromlist=["Q"]).Q(entry_type=CustomerAccountEntry.EntryType.CHARGE)),
        credits=Sum("amount", filter=__import__("django.db.models", fromlist=["Q"]).Q(entry_type__in=(
            CustomerAccountEntry.EntryType.PAYMENT,
            CustomerAccountEntry.EntryType.CREDIT_NOTE,
            CustomerAccountEntry.EntryType.ADJUSTMENT_CREDIT,
        ))),
        debits=Sum("amount", filter=__import__("django.db.models", fromlist=["Q"]).Q(entry_type=CustomerAccountEntry.EntryType.ADJUSTMENT_DEBIT)),
    )
    return (totals["charges"] or Decimal("0.00")) + (totals["debits"] or Decimal("0.00")) - (totals["credits"] or Decimal("0.00"))
