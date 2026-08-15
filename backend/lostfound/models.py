from django.db import models

class LostItem(models.Model):
    item_id = models.AutoField(primary_key=True, db_column='ItemID')
    title = models.CharField(max_length=100, db_column='Title')
    description = models.TextField(db_column='Description')
    category = models.CharField(max_length=50, blank=True, null=True, db_column='Category')
    
    department = models.ForeignKey(
        'users.Department', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        db_column='DepartmentID'
    )
    
    location = models.CharField(max_length=255, blank=True, null=True, db_column='Location')
    date_reported = models.DateField(db_column='DateReported')
    photo_url = models.CharField(max_length=500, blank=True, null=True, db_column='PhotoURL')
    contact_details = models.CharField(max_length=100, blank=True, null=True, db_column='ContactDetails')
    status = models.CharField(max_length=50, default='Open', db_column='Status')
    
    reported_by = models.ForeignKey(
        'users.User', 
        on_delete=models.CASCADE, 
        db_column='ReportedBy',
        related_name='lost_items'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, db_column='CreatedAt')

    def __str__(self):
        return self.title

    class Meta:
        db_table = 'LostItems'


class FoundItem(models.Model):
    item_id = models.AutoField(primary_key=True, db_column='ItemID')
    title = models.CharField(max_length=100, db_column='Title')
    description = models.TextField(db_column='Description')
    category = models.CharField(max_length=50, blank=True, null=True, db_column='Category')
    
    department = models.ForeignKey(
        'users.Department', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        db_column='DepartmentID'
    )
    
    location = models.CharField(max_length=255, blank=True, null=True, db_column='Location')
    date_found = models.DateField(db_column='DateFound')
    photo_url = models.CharField(max_length=500, blank=True, null=True, db_column='PhotoURL')
    contact_details = models.CharField(max_length=100, blank=True, null=True, db_column='ContactDetails')
    status = models.CharField(max_length=50, default='Open', db_column='Status')
    
    reported_by = models.ForeignKey(
        'users.User', 
        on_delete=models.CASCADE, 
        db_column='ReportedBy',
        related_name='found_items'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, db_column='CreatedAt')

    def __str__(self):
        return self.title

    class Meta:
        db_table = 'FoundItems'


class ClaimRequest(models.Model):
    claim_id = models.AutoField(primary_key=True, db_column='ClaimID')
    item_type = models.CharField(max_length=10, db_column='ItemType')  # 'Lost' or 'Found'
    item_id = models.IntegerField(db_column='ItemID')
    
    claimed_by = models.ForeignKey(
        'users.User', 
        on_delete=models.CASCADE, 
        db_column='ClaimedBy',
        related_name='claim_requests'
    )
    
    proof_description = models.TextField(db_column='ProofDescription')
    status = models.CharField(max_length=50, default='Pending', db_column='Status')
    requested_at = models.DateTimeField(auto_now_add=True, db_column='RequestedAt')

    def __str__(self):
        return f"Claim #{self.claim_id} for {self.item_type} Item ID {self.item_id}"

    class Meta:
        db_table = 'ClaimRequests'