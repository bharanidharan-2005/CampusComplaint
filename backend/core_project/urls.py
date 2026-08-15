from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from users.views import CustomLoginView

def health_check(request):
    return JsonResponse({"status": "Backend service is live!"})

urlpatterns = [
    path('', health_check),
    path('admin/', admin.site.urls),

    # Routes for /login/ and /auth/register/
    path('login/', CustomLoginView.as_view(), name='direct-login'),
    path('auth/', include('users.urls')), 

    # Routes for /api/login/ and /api/register/
    path('api/login/', CustomLoginView.as_view(), name='api-login'),
    path('api/', include('users.urls')),
    path('api/', include('complaints.urls')),
    path('api/', include('lostfound.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)