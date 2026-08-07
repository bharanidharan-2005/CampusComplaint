from django.contrib import admin
from .models import Complaint, LostFoundItem  # <-- Added LostFoundItem to the import

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
@admin.register(LostFoundItem)
class LostFoundItemAdmin(admin.ModelAdmin):
    # Dictates columns for the Lost & Found list view
    list_display = ('id', 'item_name', 'type', 'category', 'date', 'status')
    
    # Filter sidebar for quick sorting
    list_filter = ('type', 'category', 'status')
    
    # Search bar to easily find lost or found items
    search_fields = ('item_name', 'description', 'location')
    
    # Clickable links to view details
    list_display_links = ('id', 'item_name')