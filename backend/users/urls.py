from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    StudentCustomLoginView,
    RegisterView,
    UserProfileView, 
    ProfileUpdateView,
    StudentDashboardView, 
    AdminDashboardView, 
    FacultyDashboardView,
    FacultyComplaintsView,
    HodDashboardView,       
    DeanDashboardView, 
    ExecutiveDashboardView,
    PrincipalAnalyticsView,
    ComplaintCreateView,     
    AllComplaintsView,
    ComplaintStatusUpdateView,
    ComplaintDetailView,
    StudentListView,
    DeleteStudentView,
    UserListView,
    RoleListView,
    DepartmentListView,
    SystemLogListView,
    CategoryListView,
)

urlpatterns = [
    # --- AUTHENTICATION & PROFILES ---
    path('auth/login/student/', StudentCustomLoginView.as_view(), name='student_custom_login'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('profile/update/', ProfileUpdateView.as_view(), name='profile_update'),
    
    # --- DASHBOARDS & ANALYTICS ---
    path('dashboard/student/', StudentDashboardView.as_view(), name='student_dashboard'),
    path('dashboard/faculty/', FacultyDashboardView.as_view(), name='staff_dashboard'),
    path('dashboard/hod/', HodDashboardView.as_view(), name='hod_dashboard'),
    path('dashboard/dean/', DeanDashboardView.as_view(), name='dean_dashboard'),
    path('dashboard/executive/', ExecutiveDashboardView.as_view(), name='executive-dashboard'),
    path('dashboard/principal/analytics/', PrincipalAnalyticsView.as_view(), name='principal_analytics'),
    path('dashboard/admin/', AdminDashboardView.as_view(), name='admin_dashboard'),
    
    # --- COMPLAINTS ---
    path('complaints/', ComplaintCreateView.as_view(), name='complaint-create'),
    path('complaints/all/', AllComplaintsView.as_view(), name='complaint-list-all'),
    path('complaints/faculty/', FacultyComplaintsView.as_view(), name='complaint-faculty'),
    path('complaints/<int:pk>/status/', ComplaintStatusUpdateView.as_view(), name='complaint-update'),
    path('complaints/<int:pk>/detail/', ComplaintDetailView.as_view(), name='complaint-detail'),

    # --- STUDENT MANAGEMENT ---
    path('students/', StudentListView.as_view(), name='student-list'),
    path('students/<int:pk>/delete/', DeleteStudentView.as_view(), name='delete-student'),
    
    # --- ADMIN MANAGEMENT ENDPOINTS ---
    path('users/', UserListView.as_view(), name='user-list'),
    path('roles/', RoleListView.as_view(), name='role-list'),
    path('departments/', DepartmentListView.as_view(), name='department-list'),
    path('logs/', SystemLogListView.as_view(), name='system-log-list'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
]