# Move imports to the top
from django.db import models
from django.contrib.auth.models import AbstractUser

# 6. DONATIONS (Donors pledging or fulfilling needs)
class Donation(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('FULFILLED', 'Fulfilled'),
        ('CANCELLED', 'Cancelled'),
    )
    
    DONOR_TYPE_CHOICES = (
        ('private', 'Private Citizen / NGO / Corporate'),
        ('government', 'Government Sponsor'),
    )

    # Core donation info
    donor = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name="donations")
    need_item = models.ForeignKey('NeedItem', on_delete=models.CASCADE, related_name="donations")
    quantity = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    message = models.TextField(blank=True)
    estimated_delivery_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Donor type
    donor_type = models.CharField(max_length=20, choices=DONOR_TYPE_CHOICES, default='private', null=True, blank=True)
    
    # Private Citizen / NGO / Corporate fields
    donor_name = models.CharField(max_length=200, blank=True)
    donor_contact = models.CharField(max_length=200, blank=True)
    donor_organization = models.CharField(max_length=200, blank=True)
    donor_address = models.TextField(blank=True)
    donor_email = models.EmailField(blank=True)
    donor_phone = models.CharField(max_length=30, blank=True)
    
    # Government Sponsor fields
    government_department = models.CharField(max_length=200, blank=True)
    government_program = models.CharField(max_length=200, blank=True)
    government_officer_name = models.CharField(max_length=200, blank=True)
    government_officer_designation = models.CharField(max_length=200, blank=True)
    government_officer_contact = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"Donation by {self.donor_name or self.donor or 'Guest'} for {self.need_item.name} ({self.quantity})"

# 1. USERS
# Extending the default user to distinguish between Admin, Donors, and Gov Officials
class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'System Admin'),
        ('ORG_ADMIN', 'Hospital/Org Admin'),
        ('DONOR', 'Donor'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='DONOR')
    phone_number = models.CharField(max_length=15, blank=True)

    def save(self, *args, **kwargs):
        """
        Ensure that superusers always have the correct admin role.
        This prevents accidental downgrading of admin accounts if they're
        created through the registration endpoint instead of the management command.
        """
        # If this is a superuser, ensure role is ADMIN (not DONOR or ORG_ADMIN)
        if self.is_superuser and self.role != 'ADMIN':
            self.role = 'ADMIN'
        
        super().save(*args, **kwargs)


# 2. ORGANIZATION (The Hospital or Company)
class Organization(models.Model):
    ORG_TYPE_CHOICES = (
        ('HOSPITAL',   'Hospital'),
        ('CLINIC',     'Clinic'),
        ('SCHOOL',     'School'),
        ('NGO',        'NGO'),
        ('CHARITY',    'Charity'),
        ('GOVERNMENT', 'Government'),
        ('OTHER',      'Other'),
    )

    name = models.CharField(max_length=200)  # e.g., "National Hospital Colombo"
    registration_number = models.CharField(max_length=50, unique=True)
    address = models.TextField()
    district = models.CharField(max_length=50)

    org_type = models.CharField(max_length=20, choices=ORG_TYPE_CHOICES, default='HOSPITAL')
    description = models.TextField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email_contact = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    established_year = models.IntegerField(null=True, blank=True)

    # Link an admin user to this organization
    admin_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="managed_orgs")

    def __str__(self):
        return self.name


# 3. SECTIONS (Departments inside the Org)
class Section(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="sections")
    name = models.CharField(max_length=100) # e.g., "OPD", "Kitchen", "Maternity Ward"
    head_of_section = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.organization.name} - {self.name}"


# 4. NEEDS (The Hierarchy: Critical / Essential / Nice to Have)
class NeedItem(models.Model):
    PRIORITY_CHOICES = (
        ('CRITICAL', 'Critical'),       # High Priority
        ('ESSENTIAL', 'Essential'),     # Medium Priority
        ('NICE', 'Nice to Have'),       # Low Priority
    )

    UNIT_CHOICES = (
        ('UNIT', 'Units'),
        ('BOX', 'Boxes'),
        ('KG', 'Kilograms'),
        ('LITER', 'Liters'),
    )

    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="needs")
    name = models.CharField(max_length=200) # e.g., "Saline Bottles"
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES)
    
    quantity_required = models.IntegerField()
    quantity_received = models.IntegerField(default=0)
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES, default='UNIT')
    
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.priority})"


# 5. DOCUMENT UPLOADS (For the AI OCR Feature)
class DocumentUpload(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending Processing'),
        ('PROCESSED', 'Processed by AI'),
        ('APPROVED', 'Approved by Admin'),
        ('FAILED', 'Failed'),
    )

    id = models.AutoField(primary_key=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    file = models.FileField(upload_to='needs_pdfs/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # We will store the AI result here as JSON before adding it to the NeedItem table
    ai_extracted_json = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"Doc {self.id} - {self.status}"

