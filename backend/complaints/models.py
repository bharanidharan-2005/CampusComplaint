from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Complaint(models.Model):
    CATEGORY_CHOICES = [
        ('Construction', 'Construction / Maintenance'),
        ('Behavior', 'Behavioral Issue'),
    ]

    # Link to the authenticated user account
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints')

    # Student Identity Fields
    student_name = models.CharField(max_length=150)
    register_number = models.CharField(max_length=50)
    department = models.CharField(max_length=100)
    year = models.CharField(max_length=20)

    # Issue Details
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Construction')
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    # Status and Timestamps
    status = models.CharField(max_length=50, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    # Conditional Fields (Must be null/blank since they aren't always used)
    location = models.CharField(max_length=255, blank=True, null=True)
    person_name = models.CharField(max_length=150, blank=True, null=True)
    
    # Requires 'Pillow' library installed via pip
    image = models.ImageField(upload_to='complaints/images/', blank=True, null=True) 

    def __str__(self):
        return f"{self.register_number} - {self.title}"


class LostFoundItem(models.Model):
    ITEM_TYPES = [
        ('Lost', 'Lost'),
        ('Found', 'Found'),
    ]

    # Link to the student who reported it
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lost_found_items')

    # Item Details
    type = models.CharField(max_length=10, choices=ITEM_TYPES)
    item_name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    date = models.DateField()
    location = models.CharField(max_length=255)
    description = models.TextField()
    
    # Optional Image
    image = models.ImageField(upload_to='lost_found/images/', blank=True, null=True)
    
    # Timestamps & Status
    status = models.CharField(max_length=50, default='Active') # Active, Claimed, Resolved
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type} - {self.item_name}"