from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ComplaintViewSet, AllComplaintsListView, LostFoundCreateView,LostFoundListView
from users.views import CustomLoginView
router = DefaultRouter()
router.register(r'complaints', ComplaintViewSet, basename='complaint')

urlpatterns = [
    path('api/auth/login/', CustomLoginView.as_view(), name='login'),
    path('complaints/all/', AllComplaintsListView.as_view(), name='all-complaints'),
    path('lost-found/', LostFoundCreateView.as_view(), name='lost-found-create'),
    path('lost-found/list/', LostFoundListView.as_view(), name='lost-found-list'),
    path('', include(router.urls)),
    
]