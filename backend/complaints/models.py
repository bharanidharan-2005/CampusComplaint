from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Complaint(models.Model):
    ROLE_CHOICES = (
        ('Student', 'Student'),
        ('Faculty', 'Faculty'),
    )

    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('In Progress', 'In Progress'),
        ('Resolved', 'Resolved'),
        ('Closed', 'Closed'),
        ('Escalated', 'Escalated'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='complaints')
    student_name = models.CharField(max_length=100, blank=True, null=True)
    register_number = models.CharField(max_length=50, blank=True, null=True)
    department = models.CharField(max_length=100)
    year = models.CharField(max_length=20, blank=True, null=True)
    category = models.CharField(max_length=100)
    title = models.CharField(max_length=200)
    description = models.TextField()
    location = models.CharField(max_length=200, blank=True, null=True)
    person_name = models.CharField(max_length=100, blank=True, null=True)
    image = models.ImageField(upload_to='complaints/', blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    # Workflow fields
    assigned_to = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_complaints'
    )
    forwarded_to = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='forwarded_complaints'
    )

    # Stores who created the record
    raised_by_role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='Student'
    )

    def __str__(self):
        return f"{self.title} ({self.raised_by_role})"


class ComplaintRemark(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='remarks')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Remark on #{self.complaint_id} by {self.user}"


class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('status', 'Status Update'),
        ('assignment', 'Assignment'),
        ('forward', 'Forwarded'),
        ('claim', 'Lost & Found Claim'),
        ('system', 'System'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=255)
    link = models.CharField(max_length=255, blank=True, null=True)
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='system')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user}: {self.message[:40]}"