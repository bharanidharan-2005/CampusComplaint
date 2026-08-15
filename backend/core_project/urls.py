from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from users.views import CustomLoginView

def health_check(request):
    return JsonResponse({"status": "Backend service is live and running!"})

urlpatterns = [
    path('', health_check, name='health-check'),
    path('admin/', admin.site.urls),

    # Direct routes matching your frontend calls
    path('login/', CustomLoginView.as_view(), name='direct-login'),
    path('auth/', include('users.urls')),  # Routes /auth/register/ -> users.urls

    # Standard /api/ prefix routes
    path('api/', include('lostfound.urls')), 
    path('api/', include('users.urls')),
    path('api/', include('complaints.urls')),
    path('api/login/', CustomLoginView.as_view(), name='api-login'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)