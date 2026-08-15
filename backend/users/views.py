from django.contrib.auth import get_user_model, authenticate
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone

from rest_framework import status, permissions
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from complaints.models import Complaint, Notification
from complaints.serializers import ComplaintSerializer
from lostfound.models import LostItem

from .models import Role, Student, Department, HOD, Category, SystemLog
from .permissions import IsExecutiveUser, IsAdminUser, get_user_role
from .utils import log_event
from .serializers import (
    UserRegistrationSerializer, 
    UserSerializer, 
    CustomTokenObtainPairSerializer,
    _display_name,
)

User = get_user_model()


# =========================================================
# AUTHENTICATION & PROFILE VIEWS
# =========================================================

class CustomLoginView(APIView):
    """Standard username/password JWT authentication."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CustomTokenObtainPairSerializer(data=request.data)
        if serializer.is_valid():
            log_event(
                user=getattr(serializer, 'user', None),
                action='User login',
                ip_address=request.META.get('REMOTE_ADDR'),
                status='Success',
            )
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


class StudentCustomLoginView(APIView):
    """Custom student login using Register Number and Custom ID (email or name)."""
    permission_classes = [AllowAny]

    def post(self, request):
        reg_no = request.data.get('register_number')
        custom_id = request.data.get('custom_id')

        if not reg_no or not custom_id:
            return Response(
                {"error": "Both Register Number and Custom ID are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        student = Student.objects.select_related('user').filter(register_number=reg_no).first()

        if not student or not student.user.is_active:
            return Response({"error": "Invalid Register Number or Custom ID."}, status=status.HTTP_401_UNAUTHORIZED)

        accepted_ids = {
            student.user.email.strip().lower(),
            student.full_name.strip().lower(),
        }
        if custom_id.strip().lower() not in accepted_ids:
            return Response({"error": "Invalid Register Number or Custom ID."}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(student.user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'role': 'student',
            'name': student.full_name
        }, status=status.HTTP_200_OK)    


class RegisterView(APIView):
    """New user self-registration view."""
    permission_classes = [AllowAny] 

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": "Registration successful!",
                "generated_id": serializer.context.get('generated_id'),
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "role": serializer.context.get('assigned_role')
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """Retrieve details for the currently authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProfileUpdateView(APIView):
    """Update the current student's profile details."""
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        student = getattr(user, 'student_profile', None) or getattr(user, 'student', None)

        if not student:
            return Response(
                {"error": "Only students can update profile details through this endpoint."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            name = request.data.get('name', '').strip()
            reg_no = request.data.get('registerNumber', '').strip()
            year = request.data.get('year')
            dept_name = request.data.get('department', '').strip()

            if name:
                student.full_name = name
            if reg_no:
                student.register_number = reg_no
            if year:
                student.study_year = int(year)
            if dept_name:
                dept_obj, _ = Department.objects.get_or_create(department_name=dept_name)
                student.department = dept_obj

            student.save()
            return Response({"message": "Profile updated successfully!", "custom_id": user.email}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =========================================================
# COMPLAINT ACTIONS
# =========================================================

class ComplaintCreateView(APIView):
    """Automatically populates complaint details from registered student profile."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            title = request.data.get('title')

            if not title:
                return Response({"error": "Complaint title is required."}, status=status.HTTP_400_BAD_REQUEST)

            user = request.user

            # Resolve the creator's profile across every role so the department
            # (and identity fields) are captured correctly for students AND staff.
            student = getattr(user, 'student_profile', None) or getattr(user, 'student', None)
            faculty = getattr(user, 'faculty_profile', None)
            hod = getattr(user, 'hod_profile', None)
            dean = getattr(user, 'dean_profile', None)
            principal = getattr(user, 'principal_profile', None)

            profile = student or faculty or hod or dean or principal
            dept_obj = getattr(profile, 'department', None) if profile else None

            display_name = getattr(profile, 'full_name', '') or user.email
            register_number = getattr(student, 'register_number', '') if student else ''
            study_year = getattr(student, 'study_year', None) if student else None

            department_name = (
                dept_obj.department_name if dept_obj
                else request.data.get('department', 'General')
            )

            # Determine the actual role of the person raising the complaint
            requester_role = get_user_role(user)
            raised_by_role = 'Student' if requester_role == 'student' else 'Faculty'

            complaint_kwargs = {
                'user': user,
                'student_name': display_name,
                'register_number': register_number,
                'department': department_name or 'General',
                'year': str(study_year) if study_year else '',
                'category': request.data.get('category', 'Construction'),
                'title': title,
                'description': request.data.get('description', ''),
                'status': 'Pending',
                'raised_by_role': raised_by_role
            }

            location = request.data.get('location')
            if location:
                complaint_kwargs['location'] = location

            person_name = request.data.get('person_name')
            if person_name:
                complaint_kwargs['person_name'] = person_name

            image = request.FILES.get('image')
            if image:
                complaint_kwargs['image'] = image

            new_complaint = Complaint.objects.create(**complaint_kwargs)

            log_event(
                user=request.user,
                action=f"Complaint submitted: {title}",
                ip_address=request.META.get('REMOTE_ADDR'),
                status='Success',
            )

            return Response({
                "message": "Complaint submitted successfully!",
                "id": new_complaint.id
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get(self, request):
        """Return the currently authenticated user's own complaints."""
        complaints = Complaint.objects.filter(user=request.user).order_by('-created_at')
        return Response(
            ComplaintSerializer(complaints, many=True).data,
            status=status.HTTP_200_OK
        )


class ComplaintDetailView(APIView):
    """Full detail of a single complaint including live student identity info."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            complaint = Complaint.objects.select_related('user').get(pk=pk)
        except Complaint.DoesNotExist:
            return Response({"error": "Complaint not found."}, status=status.HTTP_404_NOT_FOUND)

        student_user = complaint.user
        profile = getattr(student_user, 'student_profile', None) or getattr(student_user, 'student', None) if student_user else None

        student_name = getattr(profile, 'full_name', None) or complaint.student_name or getattr(student_user, 'email', '') if student_user else complaint.student_name
        reg_no = getattr(profile, 'register_number', None) or complaint.register_number or ''
        dept_obj = getattr(profile, 'department', None)
        dept_name = getattr(dept_obj, 'department_name', None) or complaint.department or 'General'
        year_val = str(getattr(profile, 'study_year', None) or complaint.year or '')
        student_email = getattr(student_user, 'email', '') if student_user else ''

        priority_map = {
            'Escalated': 'Critical',
            'Pending': 'High',
            'In Progress': 'Medium',
            'Completed': 'Low',
            'Resolved': 'Low',
        }

        image_url = None
        if complaint.image:
            image_url = request.build_absolute_uri(complaint.image.url)

        return Response({
            "id": complaint.id,
            "title": complaint.title,
            "description": complaint.description,
            "category": complaint.category,
            "status": complaint.status,
            "raised_by_role": complaint.raised_by_role,
            "priority": priority_map.get(complaint.status, 'Medium'),
            "created_at": complaint.created_at.strftime("%Y-%m-%d %H:%M") if complaint.created_at else "",
            "location": complaint.location,
            "person_name": complaint.person_name,
            "image": image_url,
            
            "student_name": student_name,
            "register_number": reg_no,
            "department": dept_name,
            "year": year_val,
            "email": student_email,
            "student_email": student_email,

            "student": {
                "name": student_name,
                "register_number": reg_no,
                "department": dept_name,
                "year": year_val,
                "email": student_email
            }
        }, status=status.HTTP_200_OK)


class AllComplaintsView(APIView):
    """Fetch all complaints in the system."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        complaints = Complaint.objects.all().order_by('-created_at')
        serializer = ComplaintSerializer(complaints, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ComplaintStatusUpdateView(APIView):
    """Allows Faculty/HOD/Admin to update the status of a complaint."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            complaint = Complaint.objects.get(pk=pk)
        except Complaint.DoesNotExist:
            return Response({"error": "Complaint not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if not new_status:
            return Response({"error": "Status field is required."}, status=status.HTTP_400_BAD_REQUEST)

        complaint.status = new_status
        complaint.save()

        log_event(
            user=request.user,
            action=f"Complaint #{complaint.id} status updated to {new_status}",
            ip_address=request.META.get('REMOTE_ADDR'),
            status='Success',
        )

        # Notify the complainant and anyone assigned/forwarded.
        recipients = {complaint.user, complaint.assigned_to, complaint.forwarded_to}
        recipients.discard(None)
        for recipient in recipients:
            if recipient == request.user:
                continue
            Notification.objects.create(
                user=recipient,
                message=f"Complaint #{complaint.id} ({complaint.title}) status changed to {new_status}.",
                link=f"/complaints/{complaint.id}",
                type='status',
            )

        return Response({
            "message": f"Complaint status updated to {new_status}.",
            "id": complaint.id,
            "status": complaint.status
        }, status=status.HTTP_200_OK)

    def put(self, request, pk):
        """Fallback for PUT requests updating status."""
        return self.patch(request, pk)


# =========================================================
# ROLE-BASED DASHBOARD VIEWS
# =========================================================

class StudentDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        student = getattr(user, 'student_profile', None) or getattr(user, 'student', None)
        display_name = getattr(student, 'full_name', None) or getattr(user, 'email', 'Student')
        user_complaints = Complaint.objects.filter(user=user).order_by('-created_at')
        
        return Response({
            "email": getattr(user, 'email', ''),
            "name": display_name,
            "registerNumber": getattr(student, 'register_number', '') if student else '',
            "department": getattr(getattr(student, 'department', None), 'department_name', '') if student else '',
            "year": getattr(student, 'study_year', '') if student else '',
            "totalComplaints": user_complaints.count(),  
            "inProgress": user_complaints.filter(status__iexact='In Progress').count(),
            "resolved": user_complaints.filter(status__iexact='Resolved').count(),
            "recentComplaints": [
                {
                    "id": c.id,
                    "title": c.title,
                    "category": c.category,
                    "status": c.status,
                    "date": c.created_at.strftime("%Y-%m-%d") if c.created_at else ""
                } for c in user_complaints[:5]
            ]
        }, status=status.HTTP_200_OK)


class FacultyDashboardView(APIView):
    """Faculty dashboard showing assigned student issues and personal issues."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        my_complaints = Complaint.objects.filter(user=user).order_by('-created_at')
        student_complaints = Complaint.objects.filter(raised_by_role='student').order_by('-created_at')
        
        return Response({
            "assignedToMe": student_complaints.count(),
            "raisedByMe": my_complaints.count(),
            "pendingReplies": student_complaints.filter(status__iexact="Pending").count(),
            "assignedComplaintsList": [
                {
                    "id": c.id,
                    "title": c.title,
                    "category": c.category,
                    "studentRegisterNo": c.register_number or 'N/A',
                    "registerNumber": c.register_number or 'N/A',
                    "studentName": c.student_name or '',
                    "year": c.year or 'N/A',
                    "department": c.department or 'General',
                    "raised_by_role": c.raised_by_role,
                    "status": c.status
                } for c in student_complaints[:10]
            ],
            "myComplaintsList": [
                {
                    "id": c.id, 
                    "title": c.title, 
                    "status": c.status, 
                    "lastUpdate": c.created_at.strftime("%Y-%m-%d") if hasattr(c, 'created_at') and c.created_at else ""
                } for c in my_complaints[:10]
            ]
        }, status=status.HTTP_200_OK)


class FacultyComplaintsView(APIView):
    """Student complaints visible to faculty for review, status updates and remarks."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        complaints = (
            Complaint.objects.filter(raised_by_role='student')
            .select_related('user')
            .order_by('-created_at')
        )
        return Response(
            ComplaintSerializer(complaints, many=True).data,
            status=status.HTTP_200_OK
        )


class HodDashboardView(APIView):
    """Head of Department dashboard displaying department-level metrics."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Scope to the HOD's own department (fall back to all if unset).
        hod_profile = getattr(request.user, 'hod_profile', None)
        hod_dept = getattr(getattr(hod_profile, 'department', None), 'department_name', None)
        qs = Complaint.objects.select_related('user').all()
        if hod_dept:
            qs = qs.filter(department=hod_dept)
        complaints = qs.order_by('-created_at')

        student_complaints = []
        faculty_complaints = []

        for c in complaints:
            user_obj = getattr(c, 'user', None)
            is_faculty = c.raised_by_role == 'Faculty'
            if user_obj and getattr(user_obj, 'faculty_profile', None) is not None:
                is_faculty = True

            if is_faculty:
                faculty = getattr(user_obj, 'faculty_profile', None) if user_obj else None
                faculty_name = (faculty.full_name if faculty else c.student_name) or \
                    (getattr(user_obj, 'email', '') if user_obj else 'Unknown')
                dept = (faculty.department.department_name if (faculty and faculty.department) else c.department) or 'General'

                faculty_complaints.append({
                    "id": c.id,
                    "title": c.title,
                    "category": c.category,
                    "faculty_name": faculty_name,
                    "department": dept,
                    "raised_by_role": "Faculty",
                    "status": c.status,
                    "created_at": c.created_at.strftime("%Y-%m-%d") if c.created_at else ""
                })
            else:
                student = getattr(user_obj, 'student_profile', None) if user_obj else None
                student_name = (student.full_name if student else c.student_name) or \
                    (getattr(user_obj, 'email', '') if user_obj else 'Unknown')
                reg_no = (student.register_number if student else c.register_number) or 'N/A'
                year = str(student.study_year) if (student and student.study_year) else (c.year or 'N/A')
                dept = (student.department.department_name if (student and student.department) else c.department) or 'General'

                student_complaints.append({
                    "id": c.id,
                    "title": c.title,
                    "category": c.category,
                    "student_name": student_name,
                    "register_number": reg_no,
                    "year": year,
                    "department": dept,
                    "raised_by_role": "Student",
                    "status": c.status,
                    "created_at": c.created_at.strftime("%Y-%m-%d") if c.created_at else ""
                })

        # Aggregates for the analytics page.
        status_counts = complaints.values('status').annotate(count=Count('id'))
        complaints_by_status = [{"status": s['status'] or 'Unknown', "count": s['count']} for s in status_counts]
        category_counts = complaints.values('category').annotate(count=Count('id'))
        complaints_by_category = [
            {"category": c['category'] or 'Uncategorized', "count": c['count']} for c in category_counts
        ]
        recent_complaints = [
            {
                "id": c.id, "title": c.title, "status": c.status, "department": c.department,
                "category": c.category,
            } for c in complaints[:8]
        ]

        return Response({
            "stats": {
                "total_staff": User.objects.exclude(role__role_name__iexact='student').count(),
                "active_complaints": complaints.exclude(status__iexact='Resolved').count(),
                "resolved_this_month": complaints.filter(
                    status__iexact='Resolved',
                    updated_at__month=timezone.now().month,
                    updated_at__year=timezone.now().year,
                ).count(),
                "student_complaints_count": len(student_complaints),
                "faculty_complaints_count": len(faculty_complaints)
            },
            "student_complaints": student_complaints,
            "faculty_complaints": faculty_complaints,
            "department_activity": [
                {
                    "id": c.id,
                    "issue": c.title,
                    "reported_by": getattr(c.user, 'email', 'System') if getattr(c, 'user', None) else "System",
                    "raised_by_role": c.raised_by_role,
                    "status": c.status
                } for c in complaints[:10]
            ],
            # Keys consumed by the role-aware AnalyticsPage.
            "total_complaints": complaints.count(),
            "pending": complaints.filter(status__iexact='Pending').count(),
            "in_process": complaints.filter(status__iexact='In Progress').count(),
            "resolved": complaints.filter(status__iexact='Resolved').count(),
            "closed": complaints.filter(status__iexact='Closed').count(),
            "complaints_by_status": complaints_by_status,
            "complaints_by_category": complaints_by_category,
            "recent_complaints": recent_complaints,
        }, status=status.HTTP_200_OK)


class DeanDashboardView(APIView):
    """Dean dashboard providing campus-wide complaint analytics, counts, and escalation tracking."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        all_complaints = Complaint.objects.all().select_related('user').order_by('-created_at')
        active_issues = all_complaints.exclude(status__iexact='Resolved')

        total_students = User.objects.filter(role__role_name__iexact='student').count()
        total_staff = User.objects.exclude(role__role_name__iexact='student').count()

        depts_monitored = Complaint.objects.exclude(department__isnull=True).exclude(department__exact='').values('department').distinct().count() or 1

        complaints_data = []
        student_escalations = []
        faculty_escalations = []

        for c in all_complaints:
            student_obj = getattr(c, 'user', None)
            is_faculty = c.raised_by_role == 'Faculty'
            if student_obj and getattr(student_obj, 'faculty_profile', None) is not None:
                is_faculty = True

            if is_faculty:
                faculty = getattr(student_obj, 'faculty_profile', None) if student_obj else None
                display_name = (faculty.full_name if faculty else c.student_name) or \
                    (getattr(student_obj, 'email', '') if student_obj else 'Unknown')
                dept = (faculty.department.department_name if (faculty and faculty.department) else c.department) or 'General'
                reg_no = 'N/A'
                year = 'N/A'
            else:
                profile = getattr(student_obj, 'student_profile', None) or getattr(student_obj, 'student', None)
                display_name = (profile.full_name if profile else c.student_name) or \
                    (getattr(student_obj, 'email', '') if student_obj else 'Unknown')
                reg_no = (profile.register_number if profile else c.register_number) or 'N/A'
                year = str(profile.study_year) if (profile and profile.study_year) else (c.year or 'N/A')
                dept = (profile.department.department_name if (profile and profile.department) else c.department) or 'General'

            raised_by_role = 'Faculty' if is_faculty else 'Student'
            description = c.description or c.title

            item_payload = {
                "id": c.id,
                "title": c.title,
                "issue": c.title,
                "description": description,
                "category": c.category,
                "status": c.status,
                "urgency": 'High' if str(c.status).lower() in ['pending', 'escalated'] else 'Normal',
                "raised_by_role": raised_by_role,
                "department": dept,
                "student_name": display_name,
                "register_number": reg_no,
                "year": year,
                "student_email": getattr(student_obj, 'email', 'N/A') if student_obj else 'N/A',
                "created_at": c.created_at.strftime("%Y-%m-%d %H:%M") if c.created_at else ""
            }

            complaints_data.append(item_payload)

            if is_faculty:
                faculty_escalations.append(item_payload)
            else:
                student_escalations.append(item_payload)

        escalated_count = all_complaints.filter(status__iexact='Escalated').count()

        # Aggregates for the role-aware AnalyticsPage.
        status_counts = all_complaints.values('status').annotate(count=Count('id'))
        all_complaints_by_status = [{"status": s['status'] or 'Unknown', "count": s['count']} for s in status_counts]
        dept_counts = all_complaints.values('department').annotate(count=Count('id'))
        complaints_by_department = [{"department": d['department'] or 'Unknown', "count": d['count']} for d in dept_counts]
        category_counts = all_complaints.values('category').annotate(count=Count('id'))
        complaints_by_category = [{"category": c['category'] or 'Uncategorized', "count": c['count']} for c in category_counts]
        recent_complaints = [
            {"id": c.id, "title": c.title, "status": c.status, "department": c.department, "category": c.category}
            for c in all_complaints[:8]
        ]

        return Response({
            "depts_monitored": depts_monitored,
            "escalated_issues_count": escalated_count,
            "total_students": total_students,
            "escalations": student_escalations + faculty_escalations,
            "student_escalations": student_escalations,
            "faculty_escalations": faculty_escalations,

            "stats": {
                "total_complaints": all_complaints.count(),
                "active_issues": active_issues.count(),
                "resolved_issues": all_complaints.filter(status__iexact='Resolved').count(),
                "total_students": total_students,
                "total_staff": total_staff,
                "departments_monitored": depts_monitored,
                "escalated_issues": escalated_count
            },
            "complaints": complaints_data,

            # Keys consumed by the role-aware AnalyticsPage.
            "total": all_complaints.count(),
            "all_complaints_by_status": all_complaints_by_status,
            "complaints_by_department": complaints_by_department,
            "complaints_by_category": complaints_by_category,
            "recent_complaints": recent_complaints,
        }, status=status.HTTP_200_OK)


class ExecutiveDashboardView(APIView):
    """Executive dashboard with high-level complaint breakdowns."""
    permission_classes = [IsExecutiveUser]

    def get(self, request):
        total_complaints = Complaint.objects.count()
        pending = Complaint.objects.filter(status__iexact='Pending').count()
        in_progress = Complaint.objects.filter(status__iexact='In Progress').count()
        resolved = Complaint.objects.filter(status__iexact='Resolved').count()

        department_summary = Complaint.objects.values('department').annotate(total=Count('id'))

        return Response({
            "overview": {
                "total_complaints": total_complaints,
                "pending": pending,
                "in_progress": in_progress,
                "resolved": resolved
            },
            "department_breakdown": department_summary
        }, status=status.HTTP_200_OK)


class PrincipalAnalyticsView(APIView):
    """Analytics view for executive leadership with month-over-month trend data."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        total = Complaint.objects.count()
        resolved = Complaint.objects.filter(status__iexact='Resolved').count()
        pending = Complaint.objects.filter(status__iexact='Pending').count()
        escalated = Complaint.objects.filter(status__iexact='Escalated').count()
        department_performance = [
            {
                "department": item['department'] or "Unknown",
                "resolved": item['resolved'],
                "pending": item['pending'],
                "escalated": item['escalated']
            }
            for item in Complaint.objects.values('department').annotate(
                resolved=Count('id', filter=Q(status__iexact='Resolved')),
                pending=Count('id', filter=Q(status__iexact='Pending')),
                escalated=Count('id', filter=Q(status__iexact='Escalated'))
            )
        ]
        resolution_rate = round((resolved / total) * 100) if total else 0
        return Response({
            "total": total,
            "today": Complaint.objects.filter(created_at__date=today).count(),
            "pending": pending,
            "resolved": resolved,
            "critical": escalated,
            "lostFound": Complaint.objects.filter(category__iexact='Lost & Found').count(),
            "resolutionRate": resolution_rate,
            "activeDepartments": len(department_performance),
            "statusBreakdown": self._status_breakdown(),
            "monthlyTrend": [
                {"month": item['month'].strftime('%b'), "complaints": item['complaints']}
                for item in Complaint.objects.annotate(month=TruncMonth('created_at')).values('month').annotate(complaints=Count('id')).order_by('month')
                if item['month']
            ],
            "categoryDistribution": [
                {"name": item['category'] or "Uncategorized", "value": item['value']}
                for item in Complaint.objects.values('category').annotate(value=Count('id'))
            ],
            "departmentPerformance": department_performance,
        }, status=status.HTTP_200_OK)

    def _status_breakdown(self):
        return [
            {"status": item['status'] or "Unknown", "count": item['count']}
            for item in Complaint.objects.values('status').annotate(count=Count('id'))
        ]


class AdminDashboardView(APIView):
    """System Administrator overview."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        return Response({
            "name": getattr(request.user, 'email', 'Admin'), 
            "totalUsers": User.objects.count(),
            "totalRoles": Role.objects.count() if 'Role' in globals() else 1, 
            "totalDepartments": Complaint.objects.exclude(department__isnull=True).exclude(department__exact='').values('department').distinct().count(), 
            "systemLogsCount": 0 
        }, status=status.HTTP_200_OK)


# =========================================================
# MANAGEMENT LIST & UTILITY VIEWS
# =========================================================

class StudentListView(APIView):
    """Lists active students by joining Student and User profiles."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        students = Student.objects.filter(user__is_active=True).select_related('user', 'department')
        data = [
            {
                "id": s.user.id,
                "student_id": s.id,
                "name": s.full_name or getattr(s.user, 'first_name', '') or s.user.email,
                "email": s.user.email,
                "register_number": s.register_number or '',
                "department": s.department.department_name if s.department else '',
                "year": s.study_year or ''
            }
            for s in students
        ]
        return Response(data, status=status.HTTP_200_OK)


class DeleteStudentView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        # Restrict to HOD, Dean, Executive, or Admin users
        user_role = str(getattr(request.user, 'role', '')).lower()
        if user_role not in ['hod', 'dean', 'admin', 'executive'] and not request.user.is_staff:
            return Response(
                {"error": "Permission denied. Only HODs or Admins can delete student accounts."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            student = Student.objects.filter(Q(user__id=pk) | Q(id=pk), user__is_active=True).select_related('user').first()
            if not student:
                return Response({"error": "Active student record not found."}, status=status.HTTP_404_NOT_FOUND)
            
            user = student.user
            user.is_active = False
            user.save()
            
            return Response({"message": "Student account deactivated successfully by HOD."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserListView(APIView):
    """Admin endpoint to list all users."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        users = User.objects.all()
        data = [
            {
                "id": u.id,
                "name": _display_name(u),
                "email": getattr(u, 'email', 'No Email'),
                "role": str(getattr(u, 'role', 'Admin' if u.is_staff else 'User')),
                "status": "Active" if getattr(u, 'is_active', True) else "Inactive"
            } for u in users
        ]
        return Response(data, status=status.HTTP_200_OK)


class RoleListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        roles = Role.objects.all().order_by('role_name')
        data = [
            {
                "id": r.role_id,
                "name": r.role_name,
                "description": f"Accounts operating under the {r.role_name} role.",
                "user_count": User.objects.filter(role=r).count(),
            }
            for r in roles
        ]
        return Response(data, status=status.HTTP_200_OK)


class DepartmentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        departments = Department.objects.all().order_by('department_name')
        data = [
            {
                "id": d.department_id,
                "name": d.department_name,
                "hod_name": (HOD.objects.filter(department=d).first().full_name
                             if HOD.objects.filter(department=d).first() else 'Not Assigned'),
            }
            for d in departments
        ]
        return Response(data, status=status.HTTP_200_OK)


class SystemLogListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        logs = SystemLog.objects.all()[:100]
        data = [
            {
                "id": l.log_id,
                "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S") if l.timestamp else "Unknown Time",
                "action": l.action,
                "ip_address": l.ip_address or "System",
                "status": l.status,
            }
            for l in logs
        ]
        return Response(data, status=status.HTTP_200_OK)


class CategoryListView(APIView):
    """Admin endpoint to list and create complaint categories."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        cats = Category.objects.all().order_by('name')
        data = [
            {"id": c.category_id, "name": c.name, "description": c.description or ''}
            for c in cats
        ]
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        name = (request.data.get('name') or '').strip()
        description = (request.data.get('description') or '').strip()
        if not name:
            return Response(
                {"error": "Category name is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        cat, created = Category.objects.get_or_create(
            name__iexact=name,
            defaults={'name': name, 'description': description}
        )
        if not created:
            return Response(
                {"error": "A category with this name already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response(
            {"id": cat.category_id, "name": cat.name, "description": cat.description or ''},
            status=status.HTTP_201_CREATED
        )