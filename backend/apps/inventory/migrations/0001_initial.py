import django.core.validators
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = [
        ("accounts", "0002_branch_and_user_branch"),
        ("catalog", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="StockBalance",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quantity_on_hand", models.PositiveIntegerField(default=0)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("branch", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="stock_balances", to="accounts.branch")),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="stock_balances", to="catalog.product")),
            ],
            options={"ordering": ("branch__name", "product__name")},
        ),
        migrations.AddConstraint(
            model_name="stockbalance",
            constraint=models.UniqueConstraint(fields=("branch", "product"), name="uniq_stock_branch_product"),
        ),
        migrations.AddConstraint(
            model_name="stockbalance",
            constraint=models.CheckConstraint(condition=models.Q(("quantity_on_hand__gte", 0)), name="stock_qty_nonnegative"),
        ),
        migrations.AddIndex(
            model_name="stockbalance",
            index=models.Index(fields=["branch", "quantity_on_hand"], name="inventor_branc_0f7d11_idx"),
        ),
        migrations.CreateModel(
            name="StockMovement",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("movement_type", models.CharField(choices=[("receipt", "Supplier receipt"), ("sale", "Sale"), ("return", "Customer return"), ("adjustment_in", "Positive adjustment"), ("adjustment_out", "Negative adjustment")], max_length=24)),
                ("quantity", models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
                ("balance_after", models.PositiveIntegerField()),
                ("reason", models.CharField(blank=True, max_length=255)),
                ("reference", models.CharField(blank=True, db_index=True, max_length=100)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("branch", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="stock_movements", to="accounts.branch")),
                ("created_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="stock_movements", to=settings.AUTH_USER_MODEL)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="stock_movements", to="catalog.product")),
            ],
            options={"ordering": ("-created_at", "-id")},
        ),
        migrations.AddIndex(
            model_name="stockmovement",
            index=models.Index(fields=["branch", "product", "created_at"], name="inventor_branc_12a7a1_idx"),
        ),
        migrations.AddIndex(
            model_name="stockmovement",
            index=models.Index(fields=["branch", "movement_type", "created_at"], name="inventor_branc_b7c1d4_idx"),
        ),
    ]
