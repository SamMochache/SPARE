from django.urls import path

from .notification_views import NotificationListView, NotificationReadView
from .views import HealthView

urlpatterns = [
    path("", HealthView.as_view(), name="health"),
    path("notifications/", NotificationListView.as_view(), name="notification-list"),
    path("notifications/read-all/", NotificationReadView.as_view(), name="notification-read-all"),
    path("notifications/<int:pk>/read/", NotificationReadView.as_view(), name="notification-read"),
]
