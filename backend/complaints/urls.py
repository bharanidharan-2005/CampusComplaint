from django.urls import path
from .views import (
    ComplaintDetailView,
    ComplaintAssignView, ComplaintRemarksView, NotificationListView,
)

# NOTE: complaint create/list-all/detail are served by users.urls. Only the
# endpoints unique to this app (assign, remarks, notifications) are wired here
# to avoid duplicate path/name collisions with users.urls.
urlpatterns = [
    path('complaints/<int:pk>/assign/', ComplaintAssignView.as_view(), name='complaint-assign'),
    path('complaints/<int:pk>/remarks/', ComplaintRemarksView.as_view(), name='complaint-remarks'),
    path('notifications/', NotificationListView.as_view(), name='notifications'),
]
