from django.urls import path
from .views import DashboardSummaryView, InventoryReportView, SalesReportView, TopProductsReportView

urlpatterns = [
    path("reports/dashboard/", DashboardSummaryView.as_view(), name="report-dashboard"),
    path("reports/sales/", SalesReportView.as_view(), name="report-sales"),
    path("reports/inventory/", InventoryReportView.as_view(), name="report-inventory"),
    path("reports/top-products/", TopProductsReportView.as_view(), name="report-top-products"),
]
