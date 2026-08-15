from .models import SystemLog, User


def log_event(user=None, action='', ip_address=None, status='Success'):
    """Best-effort audit logging. Never raises so it can't break request flow."""
    try:
        SystemLog.objects.create(
            user=user if isinstance(user, User) else None,
            action=action,
            ip_address=ip_address,
            status=status,
        )
    except Exception:
        pass
