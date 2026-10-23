from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Tone(models.TextChoices):
        DANGER = "danger", "Danger"
        WARNING = "warning", "Warning"
        INFO = "info", "Information"
        SUCCESS = "success", "Success"

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="app_notifications")
    branch = models.ForeignKey("accounts.Branch", null=True, blank=True, on_delete=models.CASCADE, related_name="notifications")
    event_key = models.CharField(max_length=160)
    title = models.CharField(max_length=180)
    body = models.CharField(max_length=500)
    tone = models.CharField(max_length=12, choices=Tone.choices, default=Tone.INFO)
    link = models.CharField(max_length=255, default="/")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at", "-id")
        constraints = [models.UniqueConstraint(fields=("recipient", "event_key"), name="uniq_user_notification_event")]
        indexes = [models.Index(fields=("recipient", "is_read", "created_at"))]

    def __str__(self):
        return f"{self.recipient_id}: {self.title}"
