"""Idempotently populate SPARE with clearly fictional demo data.

Run from backend/: python seed_demo_data.py
Safe to rerun: records are created or updated by stable codes/SKUs.
Does not create users or change existing sales.
"""
import os
import random
from decimal import Decimal

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
django.setup()

from django.db import transaction
from django.utils import timezone

from apps.accounts.models import Branch
from apps.catalog.models import Category, Product
from apps.customers.models import Customer
from apps.inventory.models import StockBalance, StockMovement
from apps.purchasing.models import Supplier
from apps.sales.models import Sale, SaleItem


BRANCHES = [
    {"code": "nairobi-central", "name": "SPARE Nairobi Central", "address": "Moi Avenue, Nairobi", "phone": "+254700000101"},
    {"code": "westlands", "name": "SPARE Westlands", "address": "Waiyaki Way, Nairobi", "phone": "+254700000102"},
    {"code": "thika-road", "name": "SPARE Thika Road", "address": "Thika Road, Nairobi", "phone": "+254700000103"},
]

CATEGORIES = [
    ("Engine Parts", "Engine service and repair components"),
    ("Braking System", "Brake pads, discs and hydraulic components"),
    ("Filters", "Oil, air and fuel filters"),
    ("Electrical", "Automotive electrical components"),
    ("Suspension & Steering", "Suspension and steering components"),
    ("Cooling System", "Radiators, hoses and cooling components"),
]

PRODUCTS = [
    ("ENG-001", "Oil Pump", "Toyota", "Engine Parts", "1800.00", "2600.00"),
    ("ENG-002", "Engine Mount", "Toyota", "Engine Parts", "950.00", "1450.00"),
    ("ENG-003", "Timing Belt Kit", "Gates", "Engine Parts", "3200.00", "4500.00"),
    ("ENG-004", "Spark Plug Set", "NGK", "Engine Parts", "1200.00", "1800.00"),
    ("BRK-001", "Front Brake Pads", "Brembo", "Braking System", "1800.00", "2800.00"),
    ("BRK-002", "Rear Brake Shoes", "Toyota", "Braking System", "1400.00", "2200.00"),
    ("BRK-003", "Brake Disc", "Bosch", "Braking System", "2500.00", "3700.00"),
    ("BRK-004", "Brake Fluid 500ml", "Castrol", "Braking System", "350.00", "550.00"),
    ("FLT-001", "Oil Filter", "Mann", "Filters", "280.00", "450.00"),
    ("FLT-002", "Air Filter", "Toyota", "Filters", "650.00", "950.00"),
    ("FLT-003", "Fuel Filter", "Denso", "Filters", "500.00", "800.00"),
    ("FLT-004", "Cabin Air Filter", "Bosch", "Filters", "600.00", "900.00"),
    ("ELC-001", "12V Battery", "Amaron", "Electrical", "7800.00", "9800.00"),
    ("ELC-002", "Alternator", "Denso", "Electrical", "8500.00", "11500.00"),
    ("ELC-003", "Starter Motor", "Bosch", "Electrical", "6500.00", "8900.00"),
    ("ELC-004", "Headlamp Bulb H4", "Osram", "Electrical", "350.00", "600.00"),
    ("SUS-001", "Shock Absorber", "KYB", "Suspension & Steering", "4200.00", "5900.00"),
    ("SUS-002", "Ball Joint", "555", "Suspension & Steering", "950.00", "1450.00"),
    ("SUS-003", "Tie Rod End", "CTR", "Suspension & Steering", "800.00", "1250.00"),
    ("SUS-004", "Wheel Bearing", "SKF", "Suspension & Steering", "1600.00", "2400.00"),
    ("CLG-001", "Radiator", "Denso", "Cooling System", "6500.00", "8900.00"),
    ("CLG-002", "Radiator Hose", "Toyota", "Cooling System", "550.00", "850.00"),
    ("CLG-003", "Thermostat", "Gates", "Cooling System", "750.00", "1150.00"),
    ("CLG-004", "Coolant 1L", "Total", "Cooling System", "300.00", "480.00"),
]

SUPPLIERS = [
    ("eastafrica-auto-parts", "East Africa Auto Parts Ltd", "Peter Mwangi", "orders@example.test", "+254711000201", "Nairobi Industrial Area", "Net 30 days"),
    ("motorhub-distributors", "Motorhub Distributors", "Faith Njeri", "sales@example.test", "+254711000202", "Mombasa Road, Nairobi", "Cash / 14 days"),
    ("prime-spares-wholesale", "Prime Spares Wholesale", "Daniel Otieno", "wholesale@example.test", "+254711000203", "Kirinyaga Road, Nairobi", "Net 30 days"),
]

CUSTOMERS = [
    ("Grace Wambui", "+254700100001", "grace.wambui@example.test", "retail", "0.00", "0.00"),
    ("Brian Otieno", "+254700100002", "brian.otieno@example.test", "retail", "0.00", "0.00"),
    ("Kamau Auto Garage", "+254700100003", "kamau.garage@example.test", "wholesale", "5.00", "50000.00"),
    ("Westlands Motors", "+254700100004", "westlandsmotors@example.test", "wholesale", "3.00", "75000.00"),
    ("Amina Hassan", "+254700100005", "amina.hassan@example.test", "retail", "0.00", "0.00"),
    ("Thika Road Garage", "+254700100006", "thikaroad.garage@example.test", "wholesale", "4.00", "40000.00"),
    ("Peter Maina", "+254700100007", "peter.maina@example.test", "retail", "0.00", "0.00"),
    ("City Fleet Services", "+254700100008", "cityfleet@example.test", "wholesale", "6.00", "100000.00"),
]


@transaction.atomic
def seed():
    branches = {}
    for item in BRANCHES:
        branch, _ = Branch.objects.update_or_create(code=item["code"], defaults={**item, "is_active": True})
        branches[item["code"]] = branch

    categories = {}
    for name, description in CATEGORIES:
        category, _ = Category.objects.update_or_create(name=name, defaults={"description": description, "is_active": True})
        categories[name] = category

    products = {}
    for sku, name, brand, category_name, cost, price in PRODUCTS:
        product, _ = Product.objects.update_or_create(
            sku=sku,
            defaults={
                "name": name, "brand": brand, "category": categories[category_name],
                "description": f"Fictional demo catalogue item: {name}. Confirm compatibility before ordering.",
                "cost_price": Decimal(cost), "selling_price": Decimal(price),
                "barcode": f"DEMO-{sku}", "is_active": True,
            },
        )
        products[sku] = product

    for code, name, contact, email, phone, address, terms in SUPPLIERS:
        Supplier.objects.update_or_create(
            code=code,
            defaults={"name": name, "contact_name": contact, "email": email, "phone": phone,
                      "address": address, "payment_terms": terms, "notes": "Fictional seed supplier; not a real trading account.",
                      "is_active": True},
        )

    for name, phone, email, customer_type, discount, credit_limit in CUSTOMERS:
        Customer.objects.update_or_create(
            phone=phone,
            defaults={"name": name, "email": email, "customer_type": customer_type,
                      "discount_rate": Decimal(discount), "credit_limit": Decimal(credit_limit),
                      "kra_pin": "", "is_active": True},
        )

    # Seed stock only for new/empty branch-product balances. Never overwrite
    # quantities that a user may already have changed while testing.
    stock_created = 0
    for branch_index, branch in enumerate(branches.values()):
        for product_index, product in enumerate(products.values()):
            quantity = 4 + ((branch_index * 7 + product_index * 3) % 32)
            _, created = StockBalance.objects.get_or_create(
                branch=branch, product=product, defaults={"quantity_on_hand": quantity}
            )
            stock_created += int(created)

    # Add a few completed, cash/card demo sales only once per deterministic sale number.
    # Keep the stock balance and append-only stock movement ledger in sync.
    sales_created = 0
    sale_specs = [
        ("DEMO-SALE-001", "nairobi-central", "FLT-001", 2, "cash", "Grace Wambui"),
        ("DEMO-SALE-002", "nairobi-central", "BRK-001", 1, "mpesa", "Brian Otieno"),
        ("DEMO-SALE-003", "westlands", "FLT-002", 2, "card", "Amina Hassan"),
        ("DEMO-SALE-004", "thika-road", "CLG-004", 4, "cash", "Peter Maina"),
        ("DEMO-SALE-005", "westlands", "SUS-002", 2, "mpesa", "Kamau Auto Garage"),
        ("DEMO-SALE-006", "nairobi-central", "ELC-004", 3, "cash", "Walk-in customer"),
    ]
    for number, branch_code, sku, quantity, method, customer_name in sale_specs:
        if Sale.objects.filter(sale_number=number).exists():
            continue
        branch = branches[branch_code]
        product = products[sku]
        balance = StockBalance.objects.select_for_update().get(branch=branch, product=product)
        if balance.quantity_on_hand < quantity:
            continue
        price = product.selling_price
        total = price * quantity
        sale = Sale.objects.create(
            sale_number=number, branch=branch, status=Sale.Status.COMPLETED,
            payment_method=method, customer_name=customer_name,
            subtotal=total, discount=Decimal("0.00"), total=total,
            notes="Fictional demo transaction; not a real payment.",
        )
        SaleItem.objects.create(
            sale=sale, product=product, sku_snapshot=product.sku,
            name_snapshot=product.name, quantity=quantity,
            unit_price=price, line_total=total,
        )
        balance.quantity_on_hand -= quantity
        balance.save(update_fields=["quantity_on_hand", "updated_at"])
        StockMovement.objects.create(
            branch=branch, product=product, movement_type=StockMovement.MovementType.SALE,
            quantity=quantity, balance_after=balance.quantity_on_hand,
            reason="Seeded fictional demo sale", reference=number, created_by=None,
        )
        sales_created += 1

    print("SPARE demo seed complete.")
    print(f"Branches: {Branch.objects.count()}")
    print(f"Categories: {Category.objects.count()}")
    print(f"Products: {Product.objects.filter(sku__in=list(products.keys())).count()}")
    print(f"Suppliers: {Supplier.objects.count()}")
    print(f"Customers: {Customer.objects.count()}")
    print(f"New stock balances created this run: {stock_created}")
    print(f"New demo sales created this run: {sales_created}")
    print("No user accounts were created. All seeded names, contacts, and transactions are fictional.")


if __name__ == "__main__":
    seed()
