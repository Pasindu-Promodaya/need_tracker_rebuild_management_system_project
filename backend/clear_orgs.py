#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Organization

# Delete all organizations
count, _ = Organization.objects.all().delete()
print(f"✓ Deleted {count} organization(s) from database")
