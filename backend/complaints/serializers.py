from rest_framework import serializers

from .models import Complaint, LostFoundItem

class ComplaintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = [
            'id', 'student_name', 'register_number', 'department', 'year', 
            'category', 'title', 'description', 'location', 'person_name', 
            'image', 'status', 'created_at'
        ]
        # These fields are set automatically by the backend, not the user
        read_only_fields = ['id', 'status', 'created_at']

class LostFoundItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = LostFoundItem
        fields = '__all__'
        # THIS IS THE FIX: Tell DRF not to expect these fields from the React form
        read_only_fields = ['student', 'status', 'created_at']        