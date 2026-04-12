
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Organization, Section, NeedItem, DocumentUpload, Donation

User = get_user_model()

# 1. User Serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone_number', 'first_name', 'last_name', 'approval_status', 'requested_organization']
        read_only_fields = ['role', 'approval_status', 'requested_organization']

class UpdateProfileSerializer(serializers.ModelSerializer):
    current_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    new_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    new_password2 = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone_number', 'current_password', 'new_password', 'new_password2']

    def validate(self, attrs):
        new_password = attrs.get('new_password', '')
        new_password2 = attrs.get('new_password2', '')
        current_password = attrs.get('current_password', '')

        if new_password or new_password2 or current_password:
            if not current_password:
                raise serializers.ValidationError({'current_password': 'Current password is required to set a new password.'})
            if not self.instance or not self.instance.check_password(current_password):
                raise serializers.ValidationError({'current_password': 'Current password is incorrect.'})
            if new_password != new_password2:
                raise serializers.ValidationError({'new_password2': 'New passwords do not match.'})
            if len(new_password) < 8:
                raise serializers.ValidationError({'new_password': 'Password must be at least 8 characters.'})
        return attrs

    def update(self, instance, validated_data):
        new_password = validated_data.pop('new_password', None)
        validated_data.pop('new_password2', None)
        validated_data.pop('current_password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if new_password:
            instance.set_password(new_password)

        instance.save()
        return instance

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'password2', 'email', 'phone_number', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            phone_number=validated_data.get('phone_number', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role='DONOR'  # Default role
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

class OrgAdminRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    organization_name = serializers.CharField(write_only=True, required=True)
    organization_type = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'password2', 'email', 'phone_number', 'first_name', 'last_name', 'organization_name', 'organization_type']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Extract organization info (write-only fields)
        org_name = attrs.pop('organization_name')
        org_type = attrs.pop('organization_type')
        
        # Store organization details for later display
        attrs['requested_organization_name'] = org_name
        attrs['requested_organization_type'] = org_type
        
        # Try to find organization by name
        try:
            organization = Organization.objects.get(name__iexact=org_name)
            attrs['requested_organization'] = organization
        except Organization.DoesNotExist:
            # Store None - admin will assign organization during approval
            attrs['requested_organization'] = None
        
        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            phone_number=validated_data.get('phone_number', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role='ORG_ADMIN',
            approval_status='PENDING',  # Pending approval
            requested_organization=validated_data.get('requested_organization'),  # Can be None
            requested_organization_name=validated_data.get('requested_organization_name', ''),
            requested_organization_type=validated_data.get('requested_organization_type', '')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

# Admin Approval Serializer (for displaying pending requests)
class AdminApprovalSerializer(serializers.ModelSerializer):
    organization_name = serializers.SerializerMethodField()
    organization_type = serializers.SerializerMethodField()
    approval_decided_by_username = serializers.CharField(source='approval_decided_by.username', read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'phone_number', 'approval_status', 'requested_organization',
            'organization_name', 'organization_type', 'rejection_reason',
            'approval_requested_at', 'approval_decided_at', 'approval_decided_by',
            'approval_decided_by_username'
        ]
        read_only_fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone_number',
                           'approval_requested_at', 'approval_decided_at', 'approval_decided_by',
                           'approval_decided_by_username']
    
    def get_organization_name(self, obj):
        # Use the organization name submitted during registration
        if obj.requested_organization_name:
            return obj.requested_organization_name
        # Fallback to organization's name if it exists and is linked
        if obj.requested_organization:
            return obj.requested_organization.name
        # Default to N/A
        return 'Not assigned'
    
    def get_organization_type(self, obj):
        # Use the organization type submitted during registration
        if obj.requested_organization_type:
            return obj.requested_organization_type
        # Fallback to organization's type if it exists
        if obj.requested_organization:
            return obj.requested_organization.org_type
        # Default to N/A
        return 'N/A'

class SectionDetailSerializer(serializers.ModelSerializer):
    organization_name = serializers.SerializerMethodField()
    
    def get_organization_name(self, obj):
        return obj.organization.name if obj.organization else None
    
    class Meta:
        model = Section
        fields = ['id', 'name', 'organization', 'organization_name']

# 2.5 Need Item Serializer with section detail
class NeedItemSerializer(serializers.ModelSerializer):
    section_detail = SectionDetailSerializer(source='section', read_only=True)
    
    class Meta:
        model = NeedItem
        fields = [
            'id', 'section', 'section_detail', 'name', 'priority', 
            'quantity_required', 'quantity_received', 'unit', 
            'description', 'created_at'
        ]

# 3. Section Serializer (Includes the needs inside it)
class SectionSerializer(serializers.ModelSerializer):
    needs = NeedItemSerializer(many=True, read_only=True)

    class Meta:
        model = Section
        fields = ['id', 'organization', 'name', 'head_of_section', 'needs']

# 4. Organization Serializer (Includes sections inside it)
class OrganizationSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)
    admin_username = serializers.CharField(source='admin_user.username', read_only=True)

    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'registration_number', 'address', 'district',
            'org_type', 'description', 'phone', 'email_contact', 'website',
            'established_year', 'admin_user', 'admin_username', 'sections',
        ]

    def validate_name(self, value):
        """Check if organization name is unique"""
        queryset = Organization.objects.filter(name__iexact=value)
        # If updating, exclude the current object
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(f"Organization with name '{value}' already exists.")
        return value

# 5. Document Upload Serializer
class DocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentUpload
        fields = '__all__'
        read_only_fields = ['uploaded_by', 'uploaded_at', 'status', 'ai_extracted_json']
    
    def validate_file(self, value):
        """
        Validate the uploaded file.
        """
        # Check if file exists
        if not value:
            raise serializers.ValidationError(
                "No file was uploaded. Please attach a PDF file."
            )
        
        # Check file extension
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError(
                f"Invalid file type: '{value.name}'. Only PDF files are supported. "
                f"Please upload a file with .pdf extension."
            )
        
        # Check file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB in bytes
        if value.size > max_size:
            raise serializers.ValidationError(
                f"File too large: {value.size / (1024*1024):.1f}MB. "
                f"Maximum file size is 10MB. Please upload a smaller file."
            )
        
        # Check minimum file size (at least 1KB)
        min_size = 1024  # 1KB
        if value.size < min_size:
            raise serializers.ValidationError(
                "File too small. The PDF appears to be empty or corrupted. "
                "Please upload a valid PDF document."
            )
        
        return value
    
    def validate_organization(self, value):
        """
        Validate the organization exists.
        """
        if not value:
            raise serializers.ValidationError(
                "Organization is required. Please specify which organization this document belongs to."
            )
        return value

# 6. Donation Serializer
class NeedItemDetailSerializer(serializers.ModelSerializer):
    """Nested serializer for displaying need item details in donation responses"""
    class Meta:
        model = NeedItem
        fields = ['id', 'name', 'unit']

class DonationSerializer(serializers.ModelSerializer):
    need_item_detail = NeedItemDetailSerializer(source='need_item', read_only=True)
    
    class Meta:
        model = Donation
        fields = [
            'id', 'donor', 'need_item', 'need_item_detail', 'quantity', 'status', 
            'message', 'estimated_delivery_date', 'created_at', 'donor_type',
            'donor_name', 'donor_contact', 'donor_organization', 'donor_address',
            'donor_email', 'donor_phone', 'government_department', 'government_program',
            'government_officer_name', 'government_officer_designation',
            'government_officer_contact', 'donation_letter_file'
        ]
