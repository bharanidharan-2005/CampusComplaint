from rest_framework.permissions import BasePermission

def get_user_role(user):
    """Helper to safely retrieve the user's role across models and profiles."""
    if not user or not user.is_authenticated:
        return None
        
    if user.is_superuser or user.is_staff:
        return 'admin'

    # Check primary role relationship
    if hasattr(user, 'role') and user.role and getattr(user.role, 'role_name', None):
        return user.role.role_name.lower()

    # Fallback profile inspection
    if hasattr(user, 'principal_profile'):
        return 'principal'
    if hasattr(user, 'dean_profile'):
        return 'dean'
    if hasattr(user, 'hod_profile'):
        return 'hod'
    if hasattr(user, 'faculty_profile'):
        return 'faculty'
    if hasattr(user, 'student_profile'):
        return 'student'

    return None


class BaseRolePermission(BasePermission):
    """Base class to check if a user has a specific role."""
    required_role = None

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        # Superusers and staff always bypass role checks
        if request.user.is_superuser or request.user.is_staff:
            return True

        user_role = get_user_role(request.user)
        return user_role == self.required_role.lower() if self.required_role else False


# Define role classes (using lowercase string matching)
class IsAdminRole(BaseRolePermission):
    required_role = 'admin'

class IsPrincipalRole(BaseRolePermission):
    required_role = 'principal'

class IsDeanRole(BaseRolePermission):
    required_role = 'dean'

class IsHODRole(BaseRolePermission):
    required_role = 'hod'

class IsFacultyRole(BaseRolePermission):
    required_role = 'faculty'

class IsStudentRole(BaseRolePermission):
    required_role = 'student'


class IsExecutiveUser(BasePermission):
    """Allows access to Principal, Dean, and Admin users."""
    def has_permission(self, request, view):
        user_role = get_user_role(request.user)
        return user_role in ['principal', 'dean', 'admin']


class IsAdminUser(BasePermission):
    """Admin access for users whose role is 'admin' OR who are staff/superusers.

    Authorization was previously keyed only on ``is_staff`` (DRF's built-in
    IsAdminUser), but admin identity is tracked via the ``role`` FK. This keeps
    the two in sync so a user with ``role='admin'`` can reach admin endpoints
    even when ``is_staff`` is not set.
    """
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser or user.is_staff:
            return True
        return get_user_role(user) == 'admin'