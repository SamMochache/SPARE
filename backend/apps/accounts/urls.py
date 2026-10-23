from django.urls import path

from .views import BranchListView, CurrentUserView

urlpatterns = [
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path("branches/", BranchListView.as_view(), name="branch-list"),
]
