from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    time = serializers.SerializerMethodField()
    read = serializers.BooleanField(source="is_read", read_only=True)

    class Meta:
        model = Notification
        fields = ("id", "title", "body", "time", "tone", "read", "link", "created_at")
        read_only_fields = fields

    def get_time(self, obj):
        from django.utils.timesince import timesince

        elapsed = timesince(obj.created_at)
        return f"{elapsed.split(',')[0]} ago" if elapsed else "just now"
