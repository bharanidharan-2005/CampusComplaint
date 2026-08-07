from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status  # <-- FIXED: Added missing status import
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from django.contrib.auth.hashers import make_password
from .serializers import UserSerializer
from .permissions import IsStudentRole 
from .models import Role
from complaints.models import Complaint, LostFoundItem
# <-- FIXED: Removed the duplicate "from .models import Complaint"

User = get_user_model()


# ---------------------------------------------------------
# AUTHENTICATION & PROFILE VIEWS
# ---------------------------------------------------------
class CustomLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # 1. Grab the login identifier
        login_id = request.data.get('username') or request.data.get('email')
        password = request.data.get('password')

        # 2. Tell authenticate to look up the user by their 'email' field
        user = authenticate(request, email=login_id, password=password)
        
        # 3. MUST check if the user actually exists before generating tokens!
        if user: 
            refresh = RefreshToken.for_user(user)
            
            # 4. Determine the user's role
            if user.is_superuser or user.is_staff:
                role = 'admin'
            else:
                # Grab the role object from the user
                role_obj = getattr(user, 'role', None)
                
                if role_obj:
                    # Extract the actual text (e.g., "Student") and make it lowercase
                    role = role_obj.role_name.lower()
                else:
                    role = 'student'

            # 5. Return the successful response
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'email': user.email,  
                    'role': role 
                }
            }, status=status.HTTP_200_OK)
            
        # 6. If user is None (wrong password), return 401
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# ---------------------------------------------------------
# DASHBOARD VIEWS
# ---------------------------------------------------------

class StudentDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Safely extract the name using getattr to prevent AttributeErrors
        # It checks for 'name', then 'first_name', then falls back to 'username'
        display_name = getattr(user, 'name', getattr(user, 'first_name', getattr(user, 'username', 'Default Student')))
        
        dashboard_data = {
            "name": display_name,
            "registerNumber": getattr(user, 'register_number', ''),
            "department": getattr(user, 'department', ''),
            "year": getattr(user, 'year', ''),
            
            # Default stats
            "totalComplaints": 0,  
            "inProgress": 0,
            "resolved": 0,
            "recentComplaints": []
        }
        
        return Response(dashboard_data)

class FacultyDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # 1. Complaints raised by this specific faculty member
        my_complaints = Complaint.objects.filter(student=user).order_by('-created_at')
        
        # 2. Complaints assigned to faculty (Student complaints)
        student_complaints = Complaint.objects.exclude(student=user).order_by('-created_at')

        assigned_complaints_data = [
            {
                "id": c.id,
                "title": c.title,
                "studentRegisterNo": c.register_number or "N/A",
                "status": c.status
            } for c in student_complaints[:10]
        ]

        my_complaints_data = [
            {
                "id": c.id,
                "title": c.title,
                "status": c.status,
                "lastUpdate": c.created_at.strftime("%Y-%m-%d")
            } for c in my_complaints[:10]
        ]

        data = {
            "assignedToMe": student_complaints.count(),
            "raisedByMe": my_complaints.count(),
            "pendingReplies": student_complaints.filter(status="Pending").count(),
            "assignedComplaintsList": assigned_complaints_data,
            "myComplaintsList": my_complaints_data
        }
        return Response(data)


class HodDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. FORCE FETCH ALL COMPLAINTS (Bypassing the department filter for now)
        complaints = Complaint.objects.all()

        # 2. Count the stats
        total_staff = User.objects.exclude(role__role_name__iexact='student').count() 
        active_complaints = complaints.exclude(status='Resolved').count()
        resolved_complaints = complaints.filter(status='Resolved').count()
        
        # 3. Get the latest 10 complaints for the table
        recent_activity = complaints.order_by('-created_at')[:10]
        
        activity_data = [
            {
                "id": c.id, 
                "issue": c.title, 
                "reported_by": c.student.email if getattr(c, 'student', None) else "System", 
                "status": c.status
            } for c in recent_activity
        ]

        # 4. Pack the data exactly how React expects it
        data = {
            "stats": {
                "total_staff": total_staff, 
                "active_complaints": active_complaints, 
                "resolved_this_month": resolved_complaints
            },
            "department_activity": activity_data
        }
        
        return Response(data)


class DeanDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_students = User.objects.filter(role__role_name__iexact='student').count()
        
        # Grab all complaints that need Dean attention (Pending, In Progress, or Escalated)
        active_issues = Complaint.objects.exclude(status='Resolved').order_by('-created_at')
        
        escalations_data = [
            {
                "id": c.id, 
                "department": c.department or "General", 
                "issue": c.title, 
                "urgency": "High" if c.status == 'Escalated' else "Normal"
            } for c in active_issues[:10]
        ]

        data = {
            "stats": {
                "departments_monitored": 5, 
                "escalated_issues": active_issues.count(), 
                "total_students": total_students
            },
            "escalations": escalations_data
        }
        return Response(data)


class PrincipalAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        
        # 1. KPI CARDS (Real-time counts)
        total = Complaint.objects.count()
        today_volume = Complaint.objects.filter(created_at__date=today).count()
        pending = Complaint.objects.filter(status='Pending').count()
        resolved = Complaint.objects.filter(status='Resolved').count()
        critical = Complaint.objects.filter(status='Escalated').count()
        
        # CHANGED: Changed category__name to just category
        lost_found = Complaint.objects.filter(category='Lost & Found').count() 

        # 2. MONTHLY TREND (Area Chart)
        monthly_data = Complaint.objects.annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            complaints=Count('id')
        ).order_by('month')

        monthly_trend = [
            {"month": item['month'].strftime('%b'), "complaints": item['complaints']}
            for item in monthly_data if item['month']
        ]

        # 3. CATEGORY DISTRIBUTION (Pie Chart)
        # CHANGED: Changed category__name to just category
        category_data = Complaint.objects.values('category').annotate(
            value=Count('id')
        )
        category_distribution = [
            {"name": item['category'] or "Uncategorized", "value": item['value']}
            for item in category_data
        ]

        # 4. DEPARTMENT PERFORMANCE (Bar Chart)
        # CHANGED: Changed department__name to just department
        dept_data = Complaint.objects.values('department').annotate(
            resolved=Count('id', filter=Q(status='Resolved')),
            pending=Count('id', filter=Q(status='Pending')),
            escalated=Count('id', filter=Q(status='Escalated')) 
        )
        department_performance = [
            {
                "department": item['department'] or "Unknown",
                "resolved": item['resolved'],
                "pending": item['pending'],
                "escalated": item['escalated']
            }
            for item in dept_data
        ]

        # 5. SEND REAL-TIME PAYLOAD TO REACT
        data = {
            "total": total,
            "today": today_volume,
            "pending": pending,
            "resolved": resolved,
            "critical": critical,
            "lostFound": lost_found,
            "monthlyTrend": monthly_trend,
            "categoryDistribution": category_distribution,
            "departmentPerformance": department_performance
        }
        
        return Response(data)



class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # 1. Real Total Users
        total_users = User.objects.count()
        
        # 2. Real Total Roles
        # This looks at all users and counts how many distinct/unique roles are actually in use.
        total_roles = User.objects.exclude(role__isnull=True).values('role').distinct().count()
        
        # Add 1 to account for the default Django 'superuser/admin' role if it isn't in your custom role table
        if User.objects.filter(is_superuser=True).exists():
            total_roles += 1

        # 3. Real Total Departments
        # This looks at all submitted complaints and counts how many unique departments exist.
        # It excludes empty or null department fields.
        total_departments = Complaint.objects.exclude(
            department__isnull=True
        ).exclude(
            department__exact=''
        ).values('department').distinct().count()

        # 4. Real System Logs
        # Since we haven't built a SystemLog model yet, the true real number is 0.
        # (Once you build a log model later, you can change this to Log.objects.count())
        system_logs_count = 0 

        return Response({
            "name": request.user.email, 
            "totalUsers": total_users,
            "totalRoles": total_roles, 
            "totalDepartments": total_departments, 
            "systemLogsCount": system_logs_count 
        })


        

# ---------------------------------------------------------
# LIST VIEWS FOR ADMIN DASHBOARD
# ---------------------------------------------------------
class UserListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        users = User.objects.all()
        user_data = []
        
        for user in users:
            role_obj = getattr(user, 'role', None)
            if role_obj:
                role_name = str(role_obj) 
            else:
                role_name = 'Admin' if user.is_staff else 'User'

            user_data.append({
                "id": user.id,
                "name": getattr(user, 'first_name', getattr(user, 'username', 'Unknown')),
                "email": getattr(user, 'email', 'No Email'),
                "role": role_name, 
                "status": "Active" if getattr(user, 'is_active', True) else "Inactive"
            })
            
        return Response(user_data)

class RoleListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    def get(self, request):
        return Response([]) 

class DepartmentListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    def get(self, request):
        return Response([]) 

class SystemLogListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    def get(self, request):
        return Response([])

class CategoryListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # Your future database GET query goes here
        return Response([]) 

    def post(self, request):
        name = request.data.get('name')
        description = request.data.get('description', '')
        
        # For now, just send a fake success response back to React so the UI works
        return Response({
            "id": 999, 
            "name": name, 
            "description": description
        }, status=status.HTTP_201_CREATED)

class ComplaintStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            # Find the exact complaint by its ID (pk)
            complaint = Complaint.objects.get(pk=pk)
        except Complaint.DoesNotExist:
            return Response({"error": "Complaint not found"}, status=status.HTTP_404_NOT_FOUND)

        # Grab the new status sent from React
        new_status = request.data.get('status')
        
        # Check if the status is valid, then save it
        valid_statuses = ['Pending', 'In Progress', 'Completed', 'Resolved'] # Adjust if needed
        
        if new_status in valid_statuses:
            complaint.status = new_status
            complaint.save()
            return Response({
                "message": "Status updated successfully", 
                "new_status": complaint.status
            }, status=status.HTTP_200_OK)
            
        return Response({"error": "Invalid or missing status"}, status=status.HTTP_400_BAD_REQUEST)


class ComplaintCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = request.data.get('title')
        category = request.data.get('category')

        if not title or not category:
            return Response(
                {"error": "Title and Category are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Removed the 'priority' field (and other fallback guesses) 
            # to perfectly match your database model!
            new_complaint = Complaint.objects.create(
                student=request.user, 
                title=title,
                category=category,
                status='Pending'
            )
            
            return Response({
                "message": "Complaint raised successfully", 
                "id": new_complaint.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        
        try:
            name = request.data.get('name', '')
            reg_no = request.data.get('registerNumber', '')
            
            # --- GENERATE CUSTOM ID: first 4 letters of name + last 5 digits of register number ---
            # Example: "Bharanidharan" (bhar) + "911723104001" (last 5 digits or similar slice)
            clean_name = name.strip().lower()
            name_prefix = clean_name[:4] if len(clean_name) >= 4 else clean_name.ljust(4, 'x')
            
            # Extract numbers or characters from the end of the register number (e.g., last 5 digits)
            reg_suffix = reg_no[-5:] if len(reg_no) >= 5 else reg_no
            
            custom_student_id = f"{name_prefix}{reg_suffix}"

            # Save fields to user model
            if hasattr(user, 'first_name'):
                user.first_name = name
            elif hasattr(user, 'name'):
                user.name = name
                
            if hasattr(user, 'register_number'):
                user.register_number = reg_no
            if hasattr(user, 'department'):
                user.department = request.data.get('department', '')
            if hasattr(user, 'year'):
                user.year = request.data.get('year', '')
                
            # Store the custom login ID in the username or a custom field
            user.username = custom_student_id
            user.save()
            
            return Response({
                "message": "Profile updated successfully!",
                "custom_id": custom_student_id
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class StudentCustomLoginView(APIView):
    # Allow any user to access this endpoint without being logged in
    permission_classes = [AllowAny] 

    def post(self, request):
        reg_no = request.data.get('register_number')
        custom_id = request.data.get('custom_id')

        if not reg_no or not custom_id:
            return Response({"error": "Both Register Number and Custom ID are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Look for a user that matches BOTH the custom ID (saved in username) and the register number
        # Note: adjust 'register_number' if your User model field is named differently!
        user = User.objects.filter(username=custom_id, register_number=reg_no).first()

        if user:
            # Generate JWT tokens for the student manually
            refresh = RefreshToken.for_user(user)
            
            # Send back the tokens and role just like standard login
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'role': 'student',
                'name': getattr(user, 'name', getattr(user, 'first_name', user.username))
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid Register Number or Custom ID. Please try again."}, status=status.HTTP_401_UNAUTHORIZED)    

class RegisterView(APIView):
    permission_classes = [AllowAny] 

    def post(self, request):
        role_type = request.data.get('role', 'student')
        name = request.data.get('name')
        email = request.data.get('email')
        password = request.data.get('password')

        # 1. Validate the incoming core data
        if not name or not email or not password:
            return Response({"error": "Name, email, and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Check if the email is already taken
        if User.objects.filter(email=email).exists():
            return Response({"error": "An account with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 3. Fetch the actual Role object from the database based on the dropdown
            user_role, created = Role.objects.get_or_create(role_name=role_type)

            # 4. Generate the Specific ID based on the Role
            specific_id = None
            
            if role_type == 'student':
                reg_number = request.data.get('register_number', '').strip()
                if not reg_number:
                    return Response({"error": "Register number is required for students."}, status=status.HTTP_400_BAD_REQUEST)
                
                # Generate Student ID: First 4 letters of name (lowercase) + Register Number
                # e.g., "Bharanidharan" + "23104" = "bhar23104"
                name_prefix = name.replace(" ", "")[:4].lower()
                specific_id = f"{name_prefix}{reg_number}"

            elif role_type == 'faculty':
                # Faculty use the ID provided by the college
                specific_id = request.data.get('faculty_id', '').strip()

            elif role_type == 'hod':
                # HODs can use a department-based ID or just their email
                department = request.data.get('department', '').strip()
                specific_id = f"HOD-{department}"

            # 5. Create the new user 
            # (Assuming your user model uses 'custom_id' to store this specific ID)
            user = User.objects.create(
                email=email,
                password=make_password(password),
                role=user_role,
                custom_id=specific_id 
            )
            
            # Save the name and role-specific fields
            if hasattr(user, 'name'):
                user.name = name
            elif hasattr(user, 'first_name'):
                user.first_name = name
                
            if role_type == 'student' and hasattr(user, 'register_number'):
                user.register_number = request.data.get('register_number')
            if role_type == 'faculty' and hasattr(user, 'faculty_id'):
                user.faculty_id = request.data.get('faculty_id')
            if role_type == 'hod' and hasattr(user, 'department'):
                user.department = request.data.get('department')
                
            user.save()

            return Response({
                "message": "Registration successful!",
                "generated_id": specific_id # Sending this back so we can verify it worked!
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"Registration Error: {str(e)}")
            return Response({"error": f"Failed to create account: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)