from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers


class ReportFilterSerializer(serializers.Serializer):
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    branch = serializers.IntegerField(required=False, min_value=1)
    low_stock_threshold = serializers.IntegerField(required=False, min_value=0, max_value=100000)

    def validate(self, attrs):
        today = timezone.localdate()
        attrs.setdefault("end_date", today)
        attrs.setdefault("start_date", attrs["end_date"] - timedelta(days=29))
        if attrs["start_date"] > attrs["end_date"]:
            raise serializers.ValidationError({"start_date": "Start date must be on or before end date."})
        return attrs
