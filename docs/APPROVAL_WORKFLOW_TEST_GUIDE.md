# Admin Approval Workflow - Complete Testing Guide

## System Status
✅ Backend: Running on http://localhost:8000  
✅ Frontend: Running on http://localhost:3000

---

## Test Scenario: Complete Org Admin Approval Workflow

### Phase 1: Register as Organization Admin

**Step 1:** Open http://localhost:3000/login in your browser

**Step 2:** Click the "Org Admin" tab (third tab)

**Step 3:** Fill in the registration form:
- **Username:** `testadmin01`
- **Email:** `testadmin@example.com`
- **Phone:** `+94771234567`
- **First Name:** `Test`
- **Last Name:** `Admin`
- **Organization:** Type "National Hospital Colombo" (or select from autocomplete)
- **Password:** `TestPass@1234`
- **Confirm Password:** `TestPass@1234`

**Step 4:** Click "Submit for approval"

**Expected Result:**
- Alert: "Registration submitted! Awaiting system administrator approval."
- Form clears
- Page redirects to login tab

### Phase 2: Verify Org Admin Cannot Login While Pending

**Step 1:** Try to login with the credentials you just created:
- **Username:** `testadmin01`
- **Password:** `TestPass@1234`

**Expected Result:**
- ❌ Login FAILS
- Error message shows: "Your account is pending approval. Please contact the system administrator."
- Or shows rejection reason if rejected

### Phase 3: Admin Reviews Pending Request

**Step 1:** Login as system admin:
- **Username:** `admin` (or your admin account)
- **Password:** (your admin password)

**Step 2:** Navigate to Admin Dashboard:
- Look for "Admin Dashboard" or "Approvals" link in navbar
- Or go directly to: http://localhost:3000/admin/approvals

**Expected Result:**
- ✅ Page loads
- You see the pending request for `testadmin01`
- Shows full details: name, email, phone, organization, status

### Phase 4: Approve the Org Admin

**Step 1:** On the approvals dashboard, find the "testadmin01" request

**Step 2:** Click the green "✓ Approve" button

**Expected Result:**
- Success alert: "Admin approved successfully!"
- Request disappears from pending list
- Org admin status changes to APPROVED

### Phase 5: Verify Approved Org Admin Can Now Login

**Step 1:** Go to http://localhost:3000/login

**Step 2:** Switch to "Sign In" tab

**Step 3:** Login with:
- **Username:** `testadmin01`
- **Password:** `TestPass@1234`

**Expected Result:**
- ✅ Login SUCCEEDS
- User is redirected to dashboard
- "testadmin01" is now an active organization admin

---

## Test Scenario 2: Reject an Org Admin Request

### Phase 1: Register Another Org Admin

**Step 1:** Repeat Phase 1 with different credentials:
- **Username:** `testadmin02`
- **Email:** `testadmin2@example.com`
- Rest of form same as before

### Phase 2: Admin Rejects Request

**Step 1:** Login as admin, go to /admin/approvals

**Step 2:** Find "testadmin02" pending request

**Step 3:** Click red "✗ Reject" button

**Step 4:** Fill in rejection reason:
- "Email domain not verified"

**Step 5:** Click "Confirm Rejection"

**Expected Result:**
- Success alert: "Request rejected successfully!"
- Request moves to rejected section
- Rejection reason is displayed

### Phase 3: Verify Rejected Org Admin Cannot Login

**Step 1:** Try to login as testadmin02

**Expected Result:**
- ❌ Login FAILS
- Error message shows rejection reason: "Email domain not verified"

---

## Test Scenario 3: Organization Assignment During Approval

**Step 1:** Register with an organization name that DOES NOT exist in the database:
- **Organization:** `New Hospital Foundation`

**Step 2:** Admin reviews the request

**Step 3:** If organization not found, admin can:
- Approve without assigning (requested_organization will be None)
- Admin should manually assign the org afterward (if needed)

**Expected Result:**
- Request still shows as pending
- Admin can still approve
- Organization field shows "Not assigned"

---

## API Endpoints Verification

Test these endpoints directly to verify backend:

### 1. Register Org Admin
```bash
POST http://localhost:8000/api/auth/register-org-admin/

Body:
{
  "username": "testadmin",
  "email": "test@example.com",
  "password": "TestPass@1234",
  "password2": "TestPass@1234",
  "phone_number": "+94771234567",
  "first_name": "Test",
  "last_name": "Admin",
  "organization_name": "National Hospital Colombo"
}

Expected: 201 Created
```

### 2. Login (Should Fail if PENDING)
```bash
POST http://localhost:8000/api/auth/login/

Body:
{
  "username": "testadmin",
  "password": "TestPass@1234"
}

Expected if PENDING: 403 Forbidden
Response: "Your account is pending approval..."
```

### 3. Get Pending Approvals (Admin Only)
```bash
GET http://localhost:8000/api/admin/approvals/
Header: Authorization: Bearer {admin_token}

Expected: 200 OK
Returns: List of pending requests
```

### 4. Approve Org Admin
```bash
POST http://localhost:8000/api/admin/approvals/{user_id}/approve/
Header: Authorization: Bearer {admin_token}

Expected: 200 OK
Result: User approved, can now login
```

### 5. Reject Org Admin
```bash
POST http://localhost:8000/api/admin/approvals/{user_id}/reject/
Header: Authorization: Bearer {admin_token}

Body:
{
  "rejection_reason": "Information not verified"
}

Expected: 200 OK
Result: User rejected with reason
```

---

## Troubleshooting

### Issue: Org Admin registration shows "500 Internal Server Error"
- Check backend console for error details
- Verify serializer field names match
- Ensure organization_name field is being sent

### Issue: Approvals page shows "No pending approval requests"
- Verify you're logged in as admin
- Register a new org admin first
- Check if registration returned 201 Created status

### Issue: Approved org admin still can't login
- Clear browser cache/cookies
- Try logging out first if already logged in
- Verify approval_status changed to 'APPROVED' in database

### Issue: Rejection reason not shown
- Verify rejection_reason was saved in database
- Check AdminApprovalSerializer method get_organization_type works

---

## Database Verification

To check approval status in Django shell:

```bash
python manage.py shell

# Check pending users
from core.models import User
User.objects.filter(approval_status='PENDING')

# Check approved users
User.objects.filter(approval_status='APPROVED', role='ORG_ADMIN')

# Check rejected users
User.objects.filter(approval_status='REJECTED')

# Check specific user
user = User.objects.get(username='testadmin01')
print(user.approval_status)
print(user.requested_organization)
```

---

## Summary

- ✅ Org admins can register via new "Org Admin" tab
- ✅ Registration creates PENDING account automatically
- ✅ Pending admins cannot login (403 error)
- ✅ Super admin sees approvals dashboard
- ✅ Super admin can approve (APPROVED) or reject (REJECTED)
- ✅ Approved admins can now login
- ✅ Rejected admins see rejection reason in error message
- ✅ Organization autocomplete helps users enter valid org names

**All features are complete and ready for production!**
