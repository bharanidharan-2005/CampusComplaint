from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Complaint, LostFoundItem
from .serializers import ComplaintSerializer, LostFoundItemSerializer
from rest_framework import generics

class ComplaintViewSet(viewsets.ModelViewSet):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # The dashboard only fetches complaints belonging to the logged-in user
        return Complaint.objects.filter(student=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        # Automatically attach the logged-in user to the 'student' foreign key
        serializer.save(student=self.request.user)


class AllComplaintsListView(generics.ListAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated]
    # This fetches EVERYTHING, not just the user's own data
    queryset = Complaint.objects.all().order_by('-created_at')  

class LostFoundCreateView(generics.ListCreateAPIView): 
    queryset = LostFoundItem.objects.all()
    serializer_class = LostFoundItemSerializer
    permission_classes = [IsAuthenticated]

    # This ensures a student only sees their own lost/found items
    def get_queryset(self):
        return LostFoundItem.objects.filter(student_id=self.request.user)
        
    def perform_create(self, serializer):
        serializer.save(student_id=self.request.user)

class LostFoundListView(generics.ListAPIView):
    serializer_class = LostFoundItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Assuming you want to show only the logged-in student's items
        return LostFoundItem.objects.filter(student=self.request.user)