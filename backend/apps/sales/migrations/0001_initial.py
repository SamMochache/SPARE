import django.conf
import django.core.validators
from decimal import Decimal
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = [
        ("accounts", "0002_branch_and_user_branch"),
        ("catalog", "0001_initial"),
        ("inventory", "0001_initial"),
        migrations.swappable_dependency(django.conf.settings.AUTH_USER_MODEL),
    ]
    operations = [
        migrations.CreateModel(name="Sale", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("sale_number", models.CharField(max_length=40, unique=True)),
            ("idempotency_key", models.CharField(blank=True, max_length=128, null=True, unique=True)),
            ("status", models.CharField(choices=[("completed", "Completed"), ("partially_refunded", "Partially refunded"), ("refunded", "Refunded")], db_index=True, default="completed", max_length=24)),
            ("payment_method", models.CharField(choices=[("cash", "Cash"), ("mpesa", "M-Pesa (recorded, not verified)"), ("card", "Card"), ("bank", "Bank transfer"), ("credit", "Credit")], max_length=20)),
            ("customer_name", models.CharField(blank=True, max_length=180)),
            ("customer_phone", models.CharField(blank=True, max_length=40)),
            ("subtotal", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=14)),
            ("discount", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=14)),
            ("total", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=14)),
            ("refunded_total", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=14)),
            ("notes", models.TextField(blank=True)),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("branch", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="sales", to="accounts.branch")),
            ("cashier", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="sales", to=django.conf.settings.AUTH_USER_MODEL)),
        ], options={"ordering": ("-created_at", "-id")}),
        migrations.AddIndex(model_name="sale", index=models.Index(fields=["branch", "created_at"], name="sales_sale_branch_created_idx")),
        migrations.AddIndex(model_name="sale", index=models.Index(fields=["branch", "status"], name="sales_sale_branch_status_idx")),
        migrations.CreateModel(name="SaleItem", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("sku_snapshot", models.CharField(max_length=64)),
            ("name_snapshot", models.CharField(max_length=180)),
            ("quantity", models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
            ("unit_price", models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
            ("line_total", models.DecimalField(decimal_places=2, max_digits=14)),
            ("product", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="sale_items", to="catalog.product")),
            ("sale", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="items", to="sales.sale")),
        ], options={"ordering": ("id",)}),
        migrations.AddConstraint(model_name="saleitem", constraint=models.UniqueConstraint(fields=("sale", "product"), name="uniq_sale_product")),
        migrations.AddConstraint(model_name="saleitem", constraint=models.CheckConstraint(condition=models.Q(("quantity__gte", 1)), name="sale_item_qty_positive")),
        migrations.CreateModel(name="SaleReturn", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("return_number", models.CharField(max_length=40, unique=True)),
            ("reason", models.CharField(max_length=255)),
            ("refund_method", models.CharField(choices=[("cash", "Cash"), ("mpesa", "M-Pesa (recorded, not verified)"), ("card", "Card"), ("bank", "Bank transfer"), ("credit", "Credit")], max_length=20)),
            ("total", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=14)),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("processed_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="sales_returns", to=django.conf.settings.AUTH_USER_MODEL)),
            ("sale", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="returns", to="sales.sale")),
        ], options={"ordering": ("-created_at", "-id")}),
        migrations.CreateModel(name="SaleReturnItem", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("quantity", models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
            ("unit_price", models.DecimalField(decimal_places=2, max_digits=12)),
            ("line_total", models.DecimalField(decimal_places=2, max_digits=14)),
            ("sale_item", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="return_items", to="sales.saleitem")),
            ("sale_return", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="items", to="sales.salereturn")),
        ], options={}),
        migrations.AddConstraint(model_name="salereturnitem", constraint=models.UniqueConstraint(fields=("sale_return", "sale_item"), name="uniq_return_sale_item")),
        migrations.AddConstraint(model_name="salereturnitem", constraint=models.CheckConstraint(condition=models.Q(("quantity__gte", 1)), name="sale_return_qty_positive")),
    ]
