#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User

# Update admin password
admin_user = User.objects.filter(username='admin').first()
if admin_user:
    admin_user.set_password('admin@1234')
    admin_user.save()
    print(f"✓ Admin password updated to: admin@1234")
else:
    print("✗ Admin user not found!")
