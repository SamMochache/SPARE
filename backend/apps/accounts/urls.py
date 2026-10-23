from django.urls import path

from .views import BranchListView, CurrentUserView
from .staff_views import StaffUserDetailView, StaffUserListCreateView

urlpatterns = [
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path("branches/", BranchListView.as_view(), name="branch-list"),
    path("users/", StaffUserListCreateView.as_view(), name="staff-user-list-create"),
    path("users/<int:pk>/", StaffUserDetailView.as_view(), name="staff-user-detail"),
]
