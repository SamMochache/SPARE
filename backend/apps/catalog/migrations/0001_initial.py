# Generated for the initial product catalogue schema.
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Category",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120, unique=True)),
                ("description", models.TextField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ("name",), "verbose_name_plural": "categories"},
        ),
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("sku", models.CharField(max_length=64, unique=True)),
                ("name", models.CharField(db_index=True, max_length=180)),
                ("brand", models.CharField(blank=True, db_index=True, max_length=120)),
                ("description", models.TextField(blank=True)),
                ("barcode", models.CharField(blank=True, db_index=True, max_length=128)),
                ("cost_price", models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ("selling_price", models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("category", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="products", to="catalog.category")),
            ],
            options={"ordering": ("name", "sku")},
        ),
        migrations.AddIndex(
            model_name="product",
            index=models.Index(fields=["category", "is_active"], name="catalog_pro_categor_65d2e1_idx"),
        ),
        migrations.AddIndex(
            model_name="product",
            index=models.Index(fields=["brand", "is_active"], name="catalog_pro_brand_47aaf4_idx"),
        ),
    ]
