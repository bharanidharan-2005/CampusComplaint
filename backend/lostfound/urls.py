from django.urls import path
from .views import (
    LostFoundCreateView, LostFoundManageView, LostFoundItemUpdateView,
    ClaimRequestListView, ClaimRequestActionView,
)

urlpatterns = [
    path('lost-found/', LostFoundCreateView.as_view(), name='lost-found-list-create'),
    path('lost-found/manage/', LostFoundManageView.as_view(), name='lost-found-manage'),
    path('lost-found/<int:pk>/', LostFoundItemUpdateView.as_view(), name='lost-found-item-update'),
    path('lost-found/claims/', ClaimRequestListView.as_view(), name='claim-list'),
    path('lost-found/claims/<int:pk>/', ClaimRequestActionView.as_view(), name='claim-action'),
]
