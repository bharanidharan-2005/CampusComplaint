from django.contrib import admin

from .models import LostItem, FoundItem, ClaimRequest


@admin.register(LostItem)
class LostItemAdmin(admin.ModelAdmin):
    list_display = ('item_id', 'title', 'category', 'department', 'status', 'date_reported', 'reported_by')
    list_filter = ('status', 'category', 'department')
    search_fields = ('title', 'description', 'location', 'contact_details')
    list_display_links = ('item_id', 'title')


@admin.register(FoundItem)
class FoundItemAdmin(admin.ModelAdmin):
    list_display = ('item_id', 'title', 'category', 'department', 'status', 'date_found', 'reported_by')
    list_filter = ('status', 'category', 'department')
    search_fields = ('title', 'description', 'location', 'contact_details')
    list_display_links = ('item_id', 'title')


@admin.register(ClaimRequest)
class ClaimRequestAdmin(admin.ModelAdmin):
    list_display = ('claim_id', 'item_type', 'item_id', 'claimed_by', 'status', 'requested_at')
    list_filter = ('status', 'item_type')
    search_fields = ('proof_description',)
    list_display_links = ('claim_id',)
