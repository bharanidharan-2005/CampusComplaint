from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from complaints.models import Complaint

class Command(BaseCommand):
    help = 'Automatically escalates pending complaints older than specified days to Escalated status.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=3,
            help='Number of days pending before escalation (default: 3)'
        )

    def handle(self, *args, **options):
        days_threshold = options['days']
        cutoff_date = timezone.now() - timedelta(days=days_threshold)

        # Find complaints with Pending status created before the cutoff date
        pending_complaints = Complaint.objects.filter(
            status__iexact='Pending',
            created_at__lte=cutoff_date
        )

        count = pending_complaints.count()

        if count == 0:
            self.stdout.write(
                self.style.SUCCESS(f"No pending complaints require escalation (Threshold: {days_threshold} days).")
            )
            return

        # Escalate status to Escalated
        updated_count = pending_complaints.update(status='Escalated')

        self.stdout.write(
            self.style.SUCCESS(f"Successfully escalated {updated_count} complaint(s) older than {days_threshold} days to 'Escalated'.")
        )