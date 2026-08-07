from rest_framework.permissions import BasePermission

class BaseRolePermission(BasePermission):
    """Base class to check if a user has a specific role."""
    required_role = None

    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role and 
            request.user.role.role_name == self.required_role
        )

# Define all 6 roles based on your project spec
class IsAdminRole(BaseRolePermission):
    required_role = 'Admin'

class IsPrincipalRole(BaseRolePermission):
    required_role = 'Principal'

class IsDeanRole(BaseRolePermission):
    required_role = 'Dean'

class IsHODRole(BaseRolePermission):
    required_role = 'HOD'

class IsFacultyRole(BaseRolePermission):
    required_role = 'Faculty'

class IsStudentRole(BaseRolePermission):
    required_role = 'Student'