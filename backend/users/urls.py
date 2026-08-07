from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomLoginView, 
    UserProfileView, 
    StudentDashboardView, 
    AdminDashboardView, 
    UserListView,
    RoleListView,
    DepartmentListView,
    SystemLogListView,
    CategoryListView,
    FacultyDashboardView,     
    HodDashboardView,       
    DeanDashboardView, 
    ComplaintCreateView,     
    ComplaintStatusUpdateView,
    PrincipalAnalyticsView,
    ProfileUpdateView,
    RegisterView,
    StudentCustomLoginView
)

urlpatterns = [
    # --- AUTH & PROFILES ---
    path('auth/login/', CustomLoginView.as_view(), name='login'),
    path('auth/login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', UserProfileView.as_view(), name='user_profile'),
    path('auth/profile/update/', ProfileUpdateView.as_view(), name='profile_update'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    
    # --- DASHBOARDS ---
    # FIXED: Added trailing slashes to all dashboard endpoints
    path('dashboard/student/', StudentDashboardView.as_view(), name='student_dashboard'),
    path('dashboard/admin/', AdminDashboardView.as_view(), name='admin_dashboard'),
    path('dashboard/faculty/', FacultyDashboardView.as_view(), name='staff_dashboard'),
    path('dashboard/hod/', HodDashboardView.as_view(), name='hod_dashboard'),
    path('dashboard/dean/', DeanDashboardView.as_view(), name='dean_dashboard'),
    
    # --- COMPLAINTS ---
    # FIXED: Added '/status/' to match the React Axios PATCH request perfectly
    path('complaints/', ComplaintCreateView.as_view(), name='complaint-create'),
    path('complaints/<int:pk>/status/', ComplaintStatusUpdateView.as_view(), name='complaint-update'),
    path('auth/login/student/', StudentCustomLoginView.as_view(), name='student_custom_login'),
    path('dashboard/principal/analytics/', PrincipalAnalyticsView.as_view(), name='principal_analytics'),
    
    # --- ADMIN MANAGEMENT ENDPOINTS ---
    path('users/', UserListView.as_view(), name='user-list'),
    path('roles/', RoleListView.as_view(), name='role-list'),
    path('departments/', DepartmentListView.as_view(), name='department-list'),
    path('logs/', SystemLogListView.as_view(), name='system-log-list'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
]