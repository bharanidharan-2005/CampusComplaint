from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from users.views import CustomLoginView  # Import your actual login view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('lostfound.urls')), 
    path('api/', include('users.urls')),
    path('api/', include('complaints.urls')),
    path('api/login/', CustomLoginView.as_view(), name='api-login'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)