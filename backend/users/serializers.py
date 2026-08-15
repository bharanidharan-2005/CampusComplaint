from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import Role, Department
from .models import User, Student, Faculty, HOD, Dean, Principal

User = get_user_model()


def _user_profile(user):
    return (
        getattr(user, 'student_profile', None)
        or getattr(user, 'faculty_profile', None)
        or getattr(user, 'hod_profile', None)
        or getattr(user, 'dean_profile', None)
        or getattr(user, 'principal_profile', None)
    )


def _display_name(user):
    profile = _user_profile(user)
    if profile and getattr(profile, 'full_name', None):
        return profile.full_name
    return user.email


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['email'] = serializers.CharField(required=False, write_only=True)
        self.fields[self.username_field].required = False

    def validate(self, attrs):
        email = attrs.get('email')
        username = attrs.get(self.username_field)

        if email and not username:
            user_obj = User.objects.filter(email__iexact=email).first()
            if user_obj:
                attrs[self.username_field] = getattr(user_obj, User.USERNAME_FIELD)
            else:
                attrs[self.username_field] = email

        data = super().validate(attrs)

        if self.user.is_superuser or self.user.is_staff:
            role_name = 'admin'
        elif hasattr(self.user, 'role') and self.user.role:
            role_name = getattr(self.user.role, 'role_name', 'student').lower()
        else:
            role_name = 'student'

        data['role'] = role_name
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'name': _display_name(self.user),
            'role': role_name
        }
        return data


class UserSerializer(serializers.ModelSerializer):
    """Serializer required for UserProfileView"""
    role = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    register_number = serializers.SerializerMethodField()
    study_year = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'name', 'department_name',
                  'register_number', 'study_year']
        read_only_fields = ['id']

    def get_role(self, obj):
        if obj.is_superuser or obj.is_staff:
            return 'admin'
        if hasattr(obj, 'role') and obj.role:
            return getattr(obj.role, 'role_name', 'student').lower()
        return 'student'

    def get_name(self, obj):
        return _display_name(obj)

    def get_department_name(self, obj):
        profile = _user_profile(obj)
        dept = getattr(profile, 'department', None) if profile else None
        return getattr(dept, 'department_name', None)

    def get_register_number(self, obj):
        profile = getattr(obj, 'student_profile', None)
        return getattr(profile, 'register_number', None) if profile else None

    def get_study_year(self, obj):
        profile = getattr(obj, 'student_profile', None)
        return getattr(profile, 'study_year', None) if profile else None


class UserRegistrationSerializer(serializers.ModelSerializer):
    role = serializers.CharField(write_only=True, default='student')
    name = serializers.CharField(write_only=True, required=True)
    register_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    year = serializers.CharField(write_only=True, required=False, allow_blank=True)
    faculty_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    employee_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    department = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'role', 'name', 'register_number', 'year', 'faculty_id', 'employee_id', 'department']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        role_type = validated_data.pop('role', 'student').strip().lower()
        name = validated_data.pop('name', '').strip()
        reg_no = validated_data.pop('register_number', '').strip()
        year_input = validated_data.pop('year', '').strip()
        faculty_id = validated_data.pop('faculty_id', '').strip()
        employee_id = validated_data.pop('employee_id', '').strip()
        dept_name = validated_data.pop('department', '').strip()
        password = validated_data.pop('password')
        email = validated_data.get('email')

        study_year = int(year_input) if year_input and year_input.isdigit() else None

        with transaction.atomic():
            role_obj, _ = Role.objects.get_or_create(
                role_name__iexact=role_type,
                defaults={'role_name': role_type.capitalize()}
            )
            
            user = User.objects.create_user(email=email, password=password)
            user.role = role_obj

            if role_type == 'admin':
                user.is_staff = True
                user.is_superuser = True

            user.save()

            dept_obj = None
            if dept_name:
                dept_obj, _ = Department.objects.get_or_create(department_name=dept_name)

            if role_type == 'student':
                Student.objects.create(
                    user=user,
                    department=dept_obj,
                    full_name=name,
                    register_number=reg_no,
                    study_year=study_year
                )
            elif role_type == 'faculty':
                Faculty.objects.create(
                    user=user,
                    department=dept_obj,
                    full_name=name,
                    faculty_id=faculty_id
                )
            elif role_type == 'hod':
                HOD.objects.create(
                    user=user,
                    department=dept_obj,
                    full_name=name
                )
            elif role_type == 'principal':
                Principal.objects.create(
                    user=user,
                    full_name=name,
                    employee_id=employee_id or f"PRIN-{user.id}"
                )
            elif role_type == 'dean':
                Dean.objects.create(
                    user=user,
                    department=dept_obj,
                    full_name=name,
                    employee_id=employee_id or f"DEAN-{user.id}"
                )

        return user