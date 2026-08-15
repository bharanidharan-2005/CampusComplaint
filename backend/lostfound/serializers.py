from django.utils import timezone
from rest_framework import serializers
from .models import LostItem, FoundItem, ClaimRequest


class LostItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = LostItem
        fields = '__all__'
        read_only_fields = ['reported_by', 'created_at']


class FoundItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoundItem
        fields = '__all__'
        read_only_fields = ['reported_by', 'created_at']


class LostItemCreateSerializer(serializers.ModelSerializer):
    """Accepts the React Lost & Found form payload (item_name/date) and maps it to the model."""
    type = serializers.CharField(write_only=True, required=False)
    item_name = serializers.CharField(write_only=True, required=False)
    date = serializers.DateField(write_only=True, required=False)
    title = serializers.CharField(required=False, allow_blank=True)
    date_reported = serializers.DateField(required=False)
    date_found = serializers.DateField(required=False)
    image = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = LostItem
        fields = [
            'title', 'type', 'item_name', 'date', 'date_reported', 'date_found',
            'category', 'location', 'description', 'contact_details', 'photo_url', 'image'
        ]

    def validate(self, attrs):
        if not attrs.get('title'):
            attrs['title'] = attrs.pop('item_name', 'Untitled Item')
        attrs.pop('item_name', None)
        item_type = attrs.pop('type', 'Lost')

        if item_type == 'Found':
            date_val = attrs.pop('date_found', None) or attrs.pop('date', None) or attrs.pop('date_reported', None)
            attrs['date_found'] = date_val or timezone.now().date()
        else:
            date_val = attrs.pop('date_reported', None) or attrs.pop('date', None) or attrs.pop('date_found', None)
            attrs['date_reported'] = date_val or timezone.now().date()
        attrs.pop('date', None)
        return attrs


class ClaimRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClaimRequest
        fields = ['claim_id', 'item_type', 'item_id', 'claimed_by', 'proof_description', 'status', 'requested_at']
