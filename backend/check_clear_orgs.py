#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Organization

# Check and delete organizations
orgs = Organization.objects.all()
print(f"Found {orgs.count()} organizations:")
for org in orgs:
    print(f"  - {org.id}: {org.name}")
    org.delete()
    print(f"    ✓ Deleted")

if not Organization.objects.exists():
    print("\n✓ All organizations cleared successfully")
else:
    print("\n✗ Failed to clear organizations")
