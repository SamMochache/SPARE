from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import StockBalanceViewSet, StockMovementViewSet, StockOperationsViewSet

router = DefaultRouter()
router.register("stock-balances", StockBalanceViewSet, basename="stock-balance")
router.register("stock-movements", StockMovementViewSet, basename="stock-movement")
router.register("stock", StockOperationsViewSet, basename="stock-operations")

urlpatterns = [path("", include(router.urls))]
