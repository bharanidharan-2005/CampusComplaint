from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Role, Department
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Get the default tokens (access and refresh)
        data = super().validate(attrs)
        
        # Attach the user's exact role name from your Role table to the JSON response
        if self.user.role:
            data['role'] = self.user.role.role_name
        else:
            data['role'] = 'Student'  # Safe fallback if they somehow have no role
            
        return data

class UserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.role_name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'role_name', 'is_active']