from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("customers", "0002_customeraccountentry"),
    ]

    operations = [
        migrations.AddField(
            model_name="customeraccountentry",
            name="idempotency_key",
            field=models.CharField(blank=True, max_length=128, null=True, unique=True),
        ),
    ]
