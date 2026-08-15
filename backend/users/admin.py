from django.contrib import admin

from .models import (
    User, Role, Department, Student, Faculty, HOD, Principal, Dean,
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'role', 'is_staff', 'is_active', 'created_at')
    list_filter = ('role', 'is_staff', 'is_active')
    search_fields = ('email',)
    list_display_links = ('id', 'email')


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('role_id', 'role_name')


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('department_id', 'department_name')


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'register_number', 'department', 'study_year')
    search_fields = ('full_name', 'register_number')
    list_filter = ('department', 'study_year')


@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'faculty_id', 'department')
    search_fields = ('full_name', 'faculty_id')


@admin.register(HOD)
class HODAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'department')
    search_fields = ('full_name',)


@admin.register(Principal)
class PrincipalAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'employee_id')
    search_fields = ('full_name', 'employee_id')


@admin.register(Dean)
class DeanAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'employee_id', 'department')
    search_fields = ('full_name', 'employee_id')
