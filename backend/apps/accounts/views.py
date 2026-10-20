from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated

from .serializers import UserProfileSerializer


class CurrentUserView(RetrieveUpdateAPIView):
    """Read or update the authenticated user's own basic profile."""

    serializer_class = UserProfileSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user
