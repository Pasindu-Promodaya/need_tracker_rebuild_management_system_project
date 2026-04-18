#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User

# Get or create admin user
admin_user = User.objects.filter(role='ADMIN').first()
if admin_user:
    # Set password
    admin_user.set_password('password123')
    admin_user.save()
    print(f"Password set for admin user: {admin_user.username}")
else:
    print("No admin user found!")
