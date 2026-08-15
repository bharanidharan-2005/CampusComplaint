from rest_framework import serializers

from .models import Complaint, ComplaintRemark, Notification


class ComplaintRemarkSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = ComplaintRemark
        fields = ['id', 'complaint', 'user', 'user_name', 'text', 'created_at']
        read_only_fields = ['user']

    def get_user_name(self, obj):
        return obj.user.email


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'message', 'link', 'type', 'is_read', 'created_at']
        read_only_fields = ['user']


class ComplaintSerializer(serializers.ModelSerializer):
    priority = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    forwarded_to_name = serializers.SerializerMethodField()
    remarks = ComplaintRemarkSerializer(many=True, read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id',
            'student_name',
            'register_number',
            'department',
            'year',
            'category',
            'title',
            'description',
            'location',
            'person_name',
            'image',
            'status',
            'created_at',
            'priority',
            'raised_by_role',
            'assigned_to',
            'assigned_to_name',
            'forwarded_to',
            'forwarded_to_name',
            'remarks',
        ]

    def get_priority(self, obj):
        priority_map = {
            'Escalated': 'Critical',
            'Pending': 'High',
            'In Progress': 'Medium',
            'Resolved': 'Low',
            'Closed': 'Low',
        }
        return priority_map.get(obj.status, 'Medium')

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.email if obj.assigned_to else None

    def get_forwarded_to_name(self, obj):
        return obj.forwarded_to.email if obj.forwarded_to else None
