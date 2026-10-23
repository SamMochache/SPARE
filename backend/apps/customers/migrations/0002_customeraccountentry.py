import decimal
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("customers", "0001_initial"),
        ("sales", "0002_sale_customer"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="CustomerAccountEntry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("entry_type", models.CharField(choices=[("charge", "Credit sale charge"), ("payment", "Customer payment"), ("credit_note", "Credit note / returned credit sale"), ("adjustment_debit", "Audited debit adjustment"), ("adjustment_credit", "Audited credit adjustment")], max_length=24)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=14, validators=[MinValueValidator(decimal.Decimal("0.01"))])),
                ("reference", models.CharField(blank=True, max_length=80)),
                ("notes", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="customer_account_entries", to=settings.AUTH_USER_MODEL)),
                ("customer", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="account_entries", to="customers.customer")),
                ("sale", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="account_entries", to="sales.sale")),
            ],
            options={"ordering": ("created_at", "id")},
        ),
        migrations.AddIndex(model_name="customeraccountentry", index=models.Index(fields=["customer", "created_at"], name="custacct_customer_date")),
        migrations.AddIndex(model_name="customeraccountentry", index=models.Index(fields=["customer", "entry_type"], name="custacct_customer_type")),
    ]
