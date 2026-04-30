# Approval Workflow - Quick Start Guide

## What Was Built

The approval workflow system now allows system admins to:

1. ✅ **View pending requests** from users requesting to become organization admins
2. ✅ **Approve requests** - automatically saves with timestamp and admin ID
3. ✅ **Reject requests** - saves rejection reason with timestamp and admin ID
4. ✅ **View approval history** - separate tabs for Approved and Rejected requests
5. ✅ **View complete details** - all requester info with decision metadata

## Key Files Changed

### Backend

- `core/models.py` - Added approval tracking fields
- `core/views.py` - Updated approve/reject handlers to record decisions
- `core/serializers.py` - Updated to expose decision information
- `core/migrations/0008_*.py` - New migration (auto-created and applied)

### Frontend

- `lib/api.ts` - New functions for fetching approved/rejected requests
- `app/admin/approvals/page.tsx` - Tabbed interface with full workflow

## Starting the System

### Backend Setup

```bash
cd backend
source .venv/Scripts/activate  # or .venv\Scripts\Activate.ps1 on Windows
python manage.py migrate
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm run dev
# Open http://localhost:3000
```

## Testing the Workflow

### 1. Login as Admin

Navigate to `http://localhost:3000/login`

- Login with your superuser credentials

### 2. Go to Approvals Page

Navigate to `http://localhost:3000/admin/approvals`

### 3. See Pending Requests

- Tab shows "Pending (X)" with count
- Displays requester name, email, organization, phone
- Shows "Request Submitted" date/time

### 4. Approve a Request

- Click "Approve" button
- Request moves to "Approved" tab
- Shows:
  - "Decided On" date/time (when you clicked approve)
  - "Decided By" admin name (your username)
  - Request submitted date

### 5. Reject a Request

- From Pending tab, click "Reject"
- Enter rejection reason
- Click "Confirm Rejection"
- Request moves to "Rejected" tab
- Shows rejection reason in red box

### 6. View History

- Click "Approved" tab - view all approved admin requests
- Click "Rejected" tab - view all rejected admin requests
- Both show complete decision metadata

## Data Being Saved

When approval/rejection happens, the system saves in User table:

| Field                 | Value                     | Example              |
| --------------------- | ------------------------- | -------------------- |
| `approval_status`     | APPROVED or REJECTED      | APPROVED             |
| `approval_decided_at` | Timestamp                 | 2026-04-11T14:25:30Z |
| `approval_decided_by` | ID of admin user          | 1                    |
| `rejection_reason`    | Reason text (if rejected) | "Already has admin"  |

Plus existing fields:

- `requested_organization` - Organization being requested
- `approval_requested_at` - When request was submitted

## API Endpoints

The following endpoints are now fully functional:

```
GET  /api/admin/approvals/              → List pending requests
GET  /api/admin/approvals/{id}/         → Get request details
GET  /api/admin/approvals/approved_list/  → List approved admins
GET  /api/admin/approvals/rejected_list/  → List rejected admins
POST /api/admin/approvals/{id}/approve/   → Approve request
POST /api/admin/approvals/{id}/reject/    → Reject request (send {reason})
```

## Notable Features

1. **Automatic Tab Updates** - After approval/rejection, request immediately moves to correct tab
2. **Decision Audit Trail** - Always know when decision was made and by whom
3. **Request History** - Complete visibility of all decisions past and present
4. **Type Safe** - Full TypeScript support in frontend
5. **Error Handling** - User-friendly error messages for failed operations

## What Happens Next (Optional Enhancements)

The system is production-ready. Optional additions could include:

- 📧 Email notifications to applicant when approved/rejected
- 💬 Admin notes/comments on approval decisions
- 🔄 Bulk approval/rejection operations
- 🎯 Organization selection modal during approval
- 📊 Dashboard with approval statistics
- 🔔 Real-time notifications for new requests

## Troubleshooting

### "Failed to load approval requests"

- Check browser DevTools Console for detailed error
- Verify backend is running on correct port
- Check that migration was applied: `python manage.py showmigrations core`

### Rejected user can still login

- User approval_status might not have been updated
- Check database: User record should have `approval_status = 'REJECTED'`

### No organization assigned after approval

- This is normal if user didn't specify organization during registration
- Admin should assign organization during later organization admin update

---

Need help? Check the detailed implementation guide in `APPROVAL_WORKFLOW_IMPLEMENTATION.md`
