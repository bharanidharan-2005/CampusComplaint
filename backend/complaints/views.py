from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import Complaint, ComplaintRemark, Notification
from .serializers import ComplaintSerializer, ComplaintRemarkSerializer, NotificationSerializer
from users.utils import log_event


class ComplaintDetailView(APIView):
    """Full detail for a single complaint (used by the frontend detail modal)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        complaint = Complaint.objects.filter(pk=pk).first()
        if not complaint:
            return Response({'error': 'Complaint not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ComplaintSerializer(complaint).data)


class ComplaintAssignView(APIView):
    """Faculty/HOD assign a complaint to a user, or forward it (e.g. to Dean)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            complaint = Complaint.objects.get(pk=pk)
        except Complaint.DoesNotExist:
            return Response({'error': 'Complaint not found.'}, status=status.HTTP_404_NOT_FOUND)

        user_id = request.data.get('user_id')
        forward_to_role = request.data.get('forward_to_role')

        target_user = None
        if user_id:
            target_user = get_user_model().objects.filter(pk=user_id).first()
        elif forward_to_role:
            # Forward to the first user holding the target role.
            target_user = get_user_model().objects.filter(
                role__role_name__iexact=forward_to_role
            ).first()

        if not target_user:
            return Response({'error': 'Target user not found.'}, status=status.HTTP_400_BAD_REQUEST)

        if forward_to_role:
            complaint.forwarded_to = target_user
            complaint.status = 'Escalated'
            notif_type = 'forward'
            message = f"Complaint #{complaint.id} ({complaint.title}) was forwarded to you."
        else:
            complaint.assigned_to = target_user
            notif_type = 'assignment'
            message = f"Complaint #{complaint.id} ({complaint.title}) was assigned to you."

        complaint.save()

        Notification.objects.create(
            user=target_user,
            message=message,
            link=f"/complaints/{complaint.id}",
            type=notif_type,
        )

        action = f"Complaint #{complaint.id} forwarded to {target_user.email}" if forward_to_role \
            else f"Complaint #{complaint.id} assigned to {target_user.email}"
        log_event(
            user=request.user,
            action=action,
            ip_address=request.META.get('REMOTE_ADDR'),
            status='Success',
        )

        return Response(ComplaintSerializer(complaint, context={'request': request}).data)


class ComplaintRemarksView(APIView):
    """List and add remarks on a complaint."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        remarks = ComplaintRemark.objects.filter(complaint_id=pk)
        return Response(ComplaintRemarkSerializer(remarks, many=True).data)

    def post(self, request, pk):
        try:
            complaint = Complaint.objects.get(pk=pk)
        except Complaint.DoesNotExist:
            return Response({'error': 'Complaint not found.'}, status=status.HTTP_404_NOT_FOUND)

        text = (request.data.get('text') or '').strip()
        if not text:
            return Response({'error': 'Remark text is required.'}, status=status.HTTP_400_BAD_REQUEST)

        remark = ComplaintRemark.objects.create(
            complaint=complaint, user=request.user, text=text
        )
        return Response(ComplaintRemarkSerializer(remark).data, status=status.HTTP_201_CREATED)


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)
        return Response(NotificationSerializer(notifications, many=True).data)

    def post(self, request):
        # Mark one or all as read.
        notif_id = request.data.get('id')
        if notif_id:
            Notification.objects.filter(pk=notif_id, user=request.user).update(is_read=True)
        else:
            Notification.objects.filter(user=request.user).update(is_read=True)
        return Response({'status': 'ok'})