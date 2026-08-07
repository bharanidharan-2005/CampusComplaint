from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class Role(models.Model):
    role_id = models.AutoField(primary_key=True, db_column='RoleID')
    role_name = models.CharField(max_length=50, unique=True, db_column='RoleName')

    class Meta:
        db_table = 'Roles'
        # Removed managed = False so Django can create this table

    # FIXED: Added the string method INSIDE the original class
    def __str__(self):
        return self.role_name


class Department(models.Model):
    department_id = models.AutoField(primary_key=True, db_column='DepartmentID')
    department_name = models.CharField(max_length=100, unique=True, db_column='DepartmentName')

    class Meta:
        db_table = 'Departments'
        # Removed managed = False

    def __str__(self):
        return self.department_name


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        
        email = self.normalize_email(email)

        # If a string or integer (like '6') is passed from the terminal,
        # assign it to 'role_id' instead of 'role' so the ForeignKey accepts it.
        if 'role' in extra_fields and isinstance(extra_fields['role'], (int, str)):
            extra_fields['role_id'] = extra_fields.pop('role')

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    role = models.ForeignKey('Role', on_delete=models.CASCADE, db_column='RoleID')
    email = models.EmailField(max_length=150, unique=True, db_column='Email')
    is_active = models.BooleanField(default=True, db_column='IsActive')
    is_staff = models.BooleanField(default=False) 
    created_at = models.DateTimeField(auto_now_add=True, db_column='CreatedAt')

    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        related_name="custom_user_groups"
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        related_name="custom_user_permissions"
    )

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['role']

    class Meta:
        db_table = 'Users'

    def __str__(self):
        return self.email


# --- ROLE PROFILES ---

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, db_column='UserID')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, db_column='DepartmentID')
    full_name = models.CharField(max_length=150, db_column='FullName')
    register_number = models.CharField(max_length=50, unique=True, db_column='RegisterNumber')
    study_year = models.IntegerField(db_column='StudyYear')
    phone_number = models.CharField(max_length=15, db_column='PhoneNumber')

    class Meta:
        db_table = 'Students'
        # Removed managed = False

    def __str__(self):
        return f"{self.full_name} ({self.register_number})"


class Faculty(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, db_column='UserID')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, db_column='DepartmentID')
    full_name = models.CharField(max_length=150, db_column='FullName')
    faculty_id = models.CharField(max_length=50, unique=True, db_column='FacultyID')

    class Meta:
        db_table = 'Faculty'
        # Removed managed = False

    def __str__(self):
        return f"{self.full_name} (Faculty)"


class HOD(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, db_column='UserID')
    department = models.OneToOneField(Department, on_delete=models.CASCADE, db_column='DepartmentID')
    full_name = models.CharField(max_length=150, db_column='FullName')

    class Meta:
        db_table = 'HOD'
        # Removed managed = False

    def __str__(self):
        return f"{self.full_name} (HOD - {self.department.department_name})"

 