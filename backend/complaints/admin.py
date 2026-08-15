from django.contrib import admin
from .models import Complaint  # <-- Added LostFoundItem to the import

# 1. Complaint Admin Configuration
@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    # This dictates which columns show up in the admin list view
    list_display = ('id', 'student_name', 'register_number', 'category', 'status', 'created_at')
    
    # This adds a filter sidebar on the right side of the screen
    list_filter = ('status', 'category', 'department', 'year')
    
    # This adds a search bar at the top to easily find specific students or issues
    search_fields = ('student_name', 'register_number', 'title', 'description')
    
    # This makes the ID and student name clickable to view the full details
    list_display_links = ('id', 'student_name')


# 2. Lost & Found Admin Configuration












