import os
import uuid

from django.conf import settings
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import LostItem, FoundItem, ClaimRequest
from .serializers import (
    LostItemSerializer, FoundItemSerializer, LostItemCreateSerializer, ClaimRequestSerializer
)


def _save_uploaded_image(image_file):
    """Persist an uploaded image under MEDIA_ROOT/lostfound and return its URL."""
    if not image_file:
        return None
    folder = os.path.join(settings.MEDIA_ROOT, 'lostfound')
    os.makedirs(folder, exist_ok=True)
    ext = os.path.splitext(image_file.name)[1] or ''
    filename = f"{uuid.uuid4().hex}{ext}"
    full_path = os.path.join(folder, filename)
    with open(full_path, 'wb') as f:
        for chunk in image_file.chunks():
            f.write(chunk)
    return f"/{settings.MEDIA_URL.strip('/')}/lostfound/{filename}"


class LostFoundCreateView(generics.ListCreateAPIView):
    queryset = LostItem.objects.all()
    serializer_class = LostItemSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return LostItemCreateSerializer
        return LostItemSerializer

    def get_queryset(self):
        return LostItem.objects.filter(reported_by=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        item_type = self.request.data.get('type', 'Lost')
        image = serializer.validated_data.pop('image', None)
        validated = serializer.validated_data
        photo_url = _save_uploaded_image(image)
        if item_type == 'Found':
            FoundItem.objects.create(reported_by=self.request.user, photo_url=photo_url, **validated)
        else:
            serializer.save(reported_by=self.request.user, photo_url=photo_url)


class LostFoundManageView(APIView):
    """Staff-only listing of all lost & found items for management."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        lost = LostItem.objects.all().order_by('-created_at')
        found = FoundItem.objects.all().order_by('-created_at')
        return Response({
            'lost': LostItemSerializer(lost, many=True).data,
            'found': FoundItemSerializer(found, many=True).data,
        })


class LostFoundItemUpdateView(APIView):
    """Staff can resolve an item."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        item = LostItem.objects.filter(pk=pk).first() or FoundItem.objects.filter(pk=pk).first()
        if not item:
            return Response({'error': 'Item not found.'}, status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get('status')
        if new_status:
            item.status = new_status
            item.save()
        return Response({'status': 'ok', 'id': pk})


class ClaimRequestListView(APIView):
    """Staff listing of claim requests (optionally filtered by status)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        status_filter = request.query_params.get('status')
        qs = ClaimRequest.objects.all().order_by('-requested_at')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(ClaimRequestSerializer(qs, many=True).data)


class ClaimRequestActionView(APIView):
    """Staff approve/reject a claim request."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        claim = ClaimRequest.objects.filter(pk=pk).first()
        if not claim:
            return Response({'error': 'Claim not found.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        if action not in ('approve', 'reject'):
            return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)

        claim.status = 'Approved' if action == 'approve' else 'Rejected'
        claim.save()

        if action == 'approve':
            item = LostItem.objects.filter(pk=claim.item_id).first() or FoundItem.objects.filter(pk=claim.item_id).first()
            if item:
                item.status = 'Resolved'
                item.save()

        return Response(ClaimRequestSerializer(claim).data)
