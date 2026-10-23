import decimal
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name="Customer",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(db_index=True, max_length=180)),
                ("phone", models.CharField(blank=True, db_index=True, max_length=40)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("customer_type", models.CharField(choices=[("retail", "Retail"), ("wholesale", "Wholesale")], default="retail", max_length=20)),
                ("kra_pin", models.CharField(blank=True, max_length=20)),
                ("discount_rate", models.DecimalField(decimal_places=2, default=decimal.Decimal("0.00"), max_digits=5, validators=[MinValueValidator(0), MaxValueValidator(100)])),
                ("credit_limit", models.DecimalField(decimal_places=2, default=decimal.Decimal("0.00"), max_digits=14, validators=[MinValueValidator(0)])),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ("name", "id")},
        ),
    ]
