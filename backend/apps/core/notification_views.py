from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .notifications import sync_low_stock_notifications
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        sync_low_stock_notifications(request.user)
        queryset = Notification.objects.filter(recipient=request.user).select_related("branch")
        return Response(NotificationSerializer(queryset[:100], many=True).data)


class NotificationReadView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, pk=None):
        queryset = Notification.objects.filter(recipient=request.user)
        if pk is None:
            updated = queryset.filter(is_read=False).update(is_read=True)
            return Response({"updated": updated}, status=status.HTTP_200_OK)

        notification = get_object_or_404(queryset, pk=pk)
        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=("is_read",))
        return Response(NotificationSerializer(notification).data, status=status.HTTP_200_OK)
