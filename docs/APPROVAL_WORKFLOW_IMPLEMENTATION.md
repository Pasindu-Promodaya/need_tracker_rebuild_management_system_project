# Organization Admin Approval Workflow - Implementation Guide

## Overview

This document describes the complete implementation of the Organization Admin approval workflow, which allows system admins to review, approve, or reject requests from users wanting to become organization admins.

## Features Implemented

### 1. **Approval Management System**

- **Pending Requests**: Display requests awaiting approval
- **Approved Requests**: View history of approved admin requests with decision details
- **Rejected Requests**: View history of rejected requests with rejection reasons

### 2. **Data Storage & Tracking**

When an approval/rejection decision is made, the following information is saved:

**Saved Fields in User Model:**

- `approval_status` - Status of the request (PENDING, APPROVED, REJECTED)
- `approval_requested_at` - Timestamp when the request was submitted
- `approval_decided_at` - Timestamp when the approval/rejection decision was made
- `approval_decided_by` - The admin user who made the decision
- `rejection_reason` - Reason for rejection (if rejected)
- `requested_organization` - The organization the user is requesting to administer

### 3. **Admin Interface** (`/admin/approvals`)

#### Tab Navigation

The approvals page now features three tabs:

- **Pending** - Shows all pending approval requests (count displayed)
- **Approved** - Shows all approved requests with decision details
- **Rejected** - Shows all rejected requests with rejection reasons

#### Pending Request Card

- Requester details (name, email, username, phone)
- Organization information (name and type)
- Status badge (PENDING - yellow)
- Two buttons: **Approve** and **Reject**

#### Approve Action

When clicking Approve:

1. System saves the decision with current timestamp and admin user ID
2. Links the organization to the approved admin user
3. Request moves from Pending to Approved tab
4. Admin can later view the approval in the Approved tab

#### Reject Action

When clicking Reject:

1. Admin is prompted to enter a rejection reason
2. System saves the rejection reason, timestamp, and admin user ID
3. Request moves from Pending to Rejected tab
4. Admin can view the rejection reason in the Rejected tab

#### Approved/Rejected Request Cards

- Display all requester details
- Show organization information
- Display decision information:
  - Request submitted date/time
  - Decision date/time
  - Admin who made the decision
  - For rejected requests: the rejection reason

## Backend Architecture

### Models (Updated)

```python
class User(AbstractUser):
    # ... existing fields ...

    # Approval Workflow Fields
    approval_status = CharField(PENDING, APPROVED, REJECTED)
    requested_organization = ForeignKey(Organization)
    rejection_reason = TextField()
    approval_requested_at = DateTimeField()  # Auto-set on creation
    approval_decided_at = DateTimeField()    # Set when approved/rejected
    approval_decided_by = ForeignKey(User)   # The admin who decided
```

### API Endpoints

#### GET `/api/admin/approvals/`

Lists all pending org admin requests that need approval.

**Response:**

```json
[
  {
    "id": 1,
    "username": "sadev_bandara",
    "email": "probusinessinfinity7@gmail.com",
    "first_name": "Sadev",
    "last_name": "Bandara",
    "phone_number": "+94 76 337 2067",
    "approval_status": "PENDING",
    "organization_name": "General Hospital",
    "organization_type": "HOSPITAL",
    "rejection_reason": "",
    "approval_requested_at": "2026-04-11T10:30:00Z",
    "approval_decided_at": null,
    "approval_decided_by_username": null
  }
]
```

#### POST `/api/admin/approvals/{id}/approve/`

Approves an organization admin request.

**Response:**

```json
{
  "message": "Org admin sadev_bandara approved and assigned to General Hospital",
  "user": {
    "id": 1,
    "approval_status": "APPROVED",
    "approval_decided_at": "2026-04-11T14:25:30Z",
    "approval_decided_by_username": "admin_user"
  }
}
```

#### POST `/api/admin/approvals/{id}/reject/`

Rejects an organization admin request with a reason.

**Request Body:**

```json
{
  "reason": "Organization already has an approved admin"
}
```

**Response:**

```json
{
  "message": "Org admin sadev_bandara rejected",
  "user": {
    "id": 1,
    "approval_status": "REJECTED",
    "rejection_reason": "Organization already has an approved admin",
    "approval_decided_at": "2026-04-11T14:25:30Z",
    "approval_decided_by_username": "admin_user"
  }
}
```

#### GET `/api/admin/approvals/approved_list/`

Lists all approved organization admin requests.

#### GET `/api/admin/approvals/rejected_list/`

Lists all rejected organization admin requests.

## Frontend Implementation

### Components & Pages

#### `/admin/approvals` Page

- **State Management**: Uses React hooks to manage pending, approved, and rejected requests
- **Tab Navigation**: Switch between query results (Pending/Approved/Rejected)
- **Real-time Updates**: After approval/rejection, requests update in tabs immediately

#### RequestCard Component

- Reusable component for displaying approval request details
- Shows different UI based on status:
  - **Pending**: Shows Approve/Reject buttons and rejection reason input
  - **Approved/Rejected**: Shows readonly decision information

### API Calls

Added new frontend functions in `lib/api.ts`:

- `getApprovedOrgAdmins()` - Fetch approved requests
- `getRejectedOrgAdmins()` - Fetch rejected requests
- `approveOrgAdmin(userId)` - Approve a request
- `rejectOrgAdmin(userId, reason)` - Reject a request

## User Workflow

### For Super Admin

1. Navigate to `/admin/approvals`
2. Review "Pending" tab to see new approval requests
3. Click **Approve** to approve a request
   - Request moves to "Approved" tab
   - User becomes admin of their requested organization
4. Click **Reject** to reject a request
   - Enter rejection reason
   - Request moves to "Rejected" tab

### For Organization Admin Applicant

1. Navigate to organization registration page
2. Fill in registration details including organization name
3. Submit request
4. Receives message: "Pending approval from system administrator"
5. Once approved by admin, can login with full organization admin rights
6. Cannot login if status is PENDING or REJECTED

## Database Changes

### New Migration

File: `core/migrations/0008_user_approval_decided_at_user_approval_decided_by_and_more.py`

**Changes:**

- Added `approval_requested_at` field to User model
- Added `approval_decided_at` field to User model
- Added `approval_decided_by` ForeignKey to User model

## Testing Checklist

### Setup Test Data

```bash
# Create a superuser if not exists
python manage.py createsuperuser

# Register as organization admin (create test user)
POST /api/auth/register-org-admin/
{
  "username": "test_org_admin",
  "password": "SecurePass123",
  "password2": "SecurePass123",
  "email": "test@example.com",
  "phone_number": "555-0123",
  "first_name": "Test",
  "last_name": "Admin",
  "organization_name": "Test Hospital"
}
```

### Test Cases

1. **Test Pending Requests Display**
   - Login as super admin
   - Navigate to `/admin/approvals`
   - Verify pending request appears in Pending tab
   - Verify correct details displayed

2. **Test Approval Flow**
   - Click Approve button
   - Verify user status changes to APPROVED
   - Verify organization is linked to user
   - Verify request moves to Approved tab
   - Verify decision timestamp and admin name are saved

3. **Test Rejection Flow**
   - From Pending tab, click Reject
   - Enter rejection reason
   - Click Confirm Rejection
   - Verify request moves to Rejected tab
   - Verify rejection reason is displayed
   - Verify user cannot login

4. **Test View Approved/Rejected History**
   - Click Approved tab - view all approved admins
   - Click Rejected tab - view all rejected admins
   - Verify all details including decision info displayed

5. **Test Rejected User Cannot Login**
   - Try to login as rejected user
   - Verify login fails with message about pending/rejected status

## Configuration & Settings

No special configuration needed. The system uses Django's default settings with:

- JWT token authentication
- Default timezone for timestamps
- Standard Django ORM for data persistence

## Troubleshooting

### Issue: Approval endpoint returns 404

**Solution**: Ensure the backend is running and migration 0008 has been applied

```bash
python manage.py migrate
```

### Issue: Frontend shows "Failed to load approval requests"

**Solution**:

- Check browser console for API error details
- Verify authentication token is valid
- Ensure backend API is accessible at `NEXT_PUBLIC_API_URL`

### Issue: Rejected users can still login

**Solution**: This is expected behavior if the user was approved before. The system checks:

```python
if user.approval_status != 'APPROVED':
    return error
```

Make sure user's approval_status is actually 'REJECTED' in database.

## Future Enhancements

1. **Email Notifications**
   - Send email to applicant when approved/rejected
   - Send email to admin when new request submitted

2. **Comments/Notes**
   - Allow admin to add comments to pending requests
   - Store approval/rejection notes

3. **Bulk Operations**
   - Bulk approve/reject multiple requests
   - Batch reject inactive requests

4. **Organization Assignment**
   - Allow admin to assign different organization during approval
   - Show available organizations in dropdown

5. **Audit Logging**
   - Create detailed audit trail of all approval decisions
   - Track all admin actions

## Support & Documentation

For more information:

- See `README.md` for general system documentation
- See backend `API_DOCUMENTATION.md` for complete API reference
- See frontend README for Next.js setup details
