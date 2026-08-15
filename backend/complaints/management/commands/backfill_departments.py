"""Backfill the department field of existing complaints.

Complaints raised by staff (faculty/HOD/Dean/Principal) were previously
stored with department="General" because only the student profile was
inspected at creation time. This command derives the correct department
from the creator's profile and updates any complaint that is still
"General"/empty and has a resolvable department.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from complaints.models import Complaint

User = get_user_model()

PROFILE_ATTRS = (
    'student_profile', 'student', 'faculty_profile',
    'hod_profile', 'dean_profile', 'principal_profile',
)


def resolve_department(user):
    if not user:
        return None
    for attr in PROFILE_ATTRS:
        profile = getattr(user, attr, None)
        dept = getattr(profile, 'department', None) if profile else None
        if dept:
            return dept.department_name
    return None


class Command(BaseCommand):
    help = 'Backfill complaint department from the creator profile.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Report what would change without saving.',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        complaints = Complaint.objects.filter(department__in=['General', '', None])
        updated = 0
        for complaint in complaints:
            dept = resolve_department(complaint.user)
            if not dept:
                continue
            if dry_run:
                self.stdout.write(
                    f'[dry-run] Complaint #{complaint.id} -> {dept}'
                )
            else:
                complaint.department = dept
                complaint.save(update_fields=['department'])
            updated += 1

        verb = 'Would update' if dry_run else 'Updated'
        self.stdout.write(self.style.SUCCESS(f'{verb} {updated} complaint(s).'))
