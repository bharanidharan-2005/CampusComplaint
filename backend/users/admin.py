from django.contrib import admin
from .models import User, Role

# Registering these makes them visible in the Django UI
admin.site.register(User)
admin.site.register(Role)