from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class Role(models.Model):
    role_id = models.AutoField(primary_key=True, db_column='RoleID')
    role_name = models.CharField(max_length=50, unique=True, db_column='RoleName')

    class Meta:
        db_table = 'Roles'

    def __str__(self):
        return self.role_name


class Department(models.Model):
    department_id = models.AutoField(primary_key=True, db_column='DepartmentID')
    department_name = models.CharField(max_length=100, unique=True, db_column='DepartmentName')

    class Meta:
        db_table = 'Departments'

    def __str__(self):
        return self.department_name


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        
        email = self.normalize_email(email)
        
        # Pop 'role' or 'role_id' if passed into create_user kwargs to avoid unexpected keyword errors
        role = extra_fields.pop('role', None) or extra_fields.pop('role_id', None)

        user = self.model(email=email, **extra_fields)
        if role:
            user.role = role

        user.set_password(password)  # Handles password hashing
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.AutoField(primary_key=True, db_column='UserID')
    
    password = models.CharField(db_column='PasswordHash', max_length=255)
    email = models.EmailField(db_column='Email', unique=True, max_length=100)
    
    # Named 'role' so user.role returns the Role object and user.role_id returns the database ID integer
    role = models.ForeignKey('Role', on_delete=models.SET_NULL, null=True, blank=True, db_column='RoleID')
    
    is_active = models.BooleanField(db_column='IsActive', default=True)
    created_at = models.DateTimeField(db_column='CreatedAt', auto_now_add=True)
    
    last_login = models.DateTimeField(null=True, blank=True)
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = [] 

    class Meta:
        db_table = 'Users'

    def __str__(self):
        return self.email


# --- ROLE PROFILES ---

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, db_column='UserID', related_name='student_profile')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, db_column='DepartmentID', null=True, blank=True)
    full_name = models.CharField(max_length=150, db_column='FullName')
    register_number = models.CharField(max_length=50, unique=True, db_column='RegisterNumber')
    study_year = models.IntegerField(db_column='StudyYear', null=True, blank=True)
    phone_number = models.CharField(max_length=15, db_column='PhoneNumber', null=True, blank=True)

    class Meta:
        db_table = 'Students'

    def __str__(self):
        return f"{self.full_name} ({self.register_number})"


class Faculty(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, db_column='UserID', related_name='faculty_profile')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, db_column='DepartmentID', null=True, blank=True)
    full_name = models.CharField(max_length=150, db_column='FullName')
    faculty_id = models.CharField(max_length=50, unique=True, db_column='FacultyID')

    class Meta:
        db_table = 'Faculty'

    def __str__(self):
        return f"{self.full_name} (Faculty)"


class HOD(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, db_column='UserID', related_name='hod_profile')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, db_column='DepartmentID', null=True, blank=True)
    full_name = models.CharField(max_length=150, db_column='FullName')

    class Meta:
        db_table = 'HOD'

    def __str__(self):
        return f"{self.full_name} (HOD - {self.department.department_name})"


class Principal(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, db_column='UserID', related_name='principal_profile')
    full_name = models.CharField(max_length=150, db_column='FullName')
    employee_id = models.CharField(max_length=50, unique=True, db_column='EmployeeID')

    class Meta:
        db_table = 'Principal'

    def __str__(self):
        return f"{self.full_name} (Principal)"


class Dean(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, db_column='UserID', related_name='dean_profile')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, db_column='DepartmentID', null=True, blank=True)
    full_name = models.CharField(max_length=150, db_column='FullName')
    employee_id = models.CharField(max_length=50, unique=True, db_column='EmployeeID')

    class Meta:
        db_table = 'Deans'

    def __str__(self):
        return f"{self.full_name} (Dean)"


class Category(models.Model):
    category_id = models.AutoField(primary_key=True, db_column='CategoryID')
    name = models.CharField(max_length=100, unique=True, db_column='CategoryName')
    description = models.TextField(blank=True, null=True, db_column='Description')
    created_at = models.DateTimeField(auto_now_add=True, db_column='CreatedAt')

    class Meta:
        db_table = 'Categories'

    def __str__(self):
        return self.name


class SystemLog(models.Model):
    log_id = models.AutoField(primary_key=True, db_column='LogID')
    timestamp = models.DateTimeField(auto_now_add=True, db_column='Timestamp')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                             db_column='UserID', related_name='system_logs')
    action = models.CharField(max_length=255, db_column='Action')
    ip_address = models.CharField(max_length=50, blank=True, null=True, db_column='IPAddress')
    status = models.CharField(max_length=50, default='Success', db_column='Status')

    class Meta:
        db_table = 'SystemLogs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} @ {self.timestamp}"