#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User

# Check for admin user
admin_user = User.objects.filter(role='ADMIN').first()
if admin_user:
    print(f"Admin user found: {admin_user.username}")
else:
    print("No admin user found. Creating one...")
    admin_user = User.objects.create_superuser(
        username='admin',
        email='admin@needtracker.com',
        password='admin123456',
        role='ADMIN'
    )
    print(f"Created admin user: {admin_user.username}")
