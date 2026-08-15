from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import Complaint

@receiver(pre_save, sender=Complaint)
def track_previous_status(sender, instance, **kwargs):
    """Store the previous status before saving to detect changes."""
    if instance.pk:
        try:
            old_instance = Complaint.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except Complaint.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=Complaint)
def send_complaint_status_email(sender, instance, created, **kwargs):
    """Send email notifications on complaint creation or status update."""
    student_email = None
    if instance.user and getattr(instance.user, 'email', None):
        student_email = instance.user.email

    if not student_email:
        return

    # Scenario 1: New Complaint Created
    if created:
        subject = f"[Campus Portal] Complaint #{instance.id} Received - {instance.title}"
        message = (
            f"Hello {getattr(instance, 'student_name', 'Student')},\n\n"
            f"Your complaint '{instance.title}' has been successfully logged into the system.\n\n"
            f"Details:\n"
            f"- Complaint ID: #{instance.id}\n"
            f"- Category: {instance.category}\n"
            f"- Current Status: {instance.status}\n\n"
            f"You can track its progress live on your Student Dashboard.\n\n"
            f"Best regards,\nCampus Administration Team"
        )
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [student_email], fail_silently=True)

    # Scenario 2: Complaint Status Changed
    elif hasattr(instance, '_old_status') and instance._old_status != instance.status:
        subject = f"[Campus Portal] Update on Complaint #{instance.id} - {instance.status}"
        message = (
            f"Hello {getattr(instance, 'student_name', 'Student')},\n\n"
            f"The status of your complaint '{instance.title}' has been updated to: {instance.status}.\n\n"
            f"Complaint Details:\n"
            f"- Complaint ID: #{instance.id}\n"
            f"- New Status: {instance.status}\n\n"
            f"Log in to your student dashboard to review comments or status updates.\n\n"
            f"Best regards,\nCampus Administration Team"
        )
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [student_email], fail_silently=True)