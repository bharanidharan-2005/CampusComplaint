from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # CHANGED: Removed 'auth/' from the include prefix.
    # Now it routes everything starting with 'api/' into users.urls
    path('api/', include('users.urls')),
    
    path('api/', include('complaints.urls')),
]