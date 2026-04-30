# Enhanced Donation Form Implementation Guide

## Overview

The donation form has been enhanced to match the pledge forms shown in the reference images. The new form collects comprehensive donor information and provides a professional pledge interface.

## What Changed

### 1. Frontend Components

#### **DonateModal.tsx** (Enhanced)

- **New Features:**
  - Donor type selection: Private Citizen/NGO/Corporate vs Government Sponsor
  - Conditional fields based on donor type
  - Comprehensive donor information collection
  - Estimated delivery date field
  - Confirmation checkbox with context-specific text
  - Section and organization details display
  - Professional pledge form styling matching the reference design

- **New Interface - DonationFormData:**
  ```typescript
  interface DonationFormData {
    quantity: number;
    message?: string;
    donorType: "private" | "government";
    donorName?: string;
    donorContact?: string;
    donorOrganization?: string;
    donorAddress?: string;
    donorEmail?: string;
    donorPhone?: string;
    governmentDepartment?: string;
    governmentProgram?: string;
    governmentOfficer?: string;
    governmentOfficerContact?: string;
    estimatedDeliveryDate?: string;
    confirmApproval: boolean;
  }
  ```

#### **donor-modal-custom.css** (Enhanced)

- Added comprehensive pledge form styles including:
  - `.pledge-modal-overlay` - Modal overlay with proper z-index
  - `.pledge-modal-container` - Main form container with animations
  - `.pledge-modal-header` - Form header with title
  - `.pledge-target-info` - Target request information display
  - `.pledge-section` - Section containers
  - `.pledge-radio-group` - Donor type selection
  - `.pledge-form-group` - Form field groups
  - `.pledge-input` - Input styles with focus states
  - `.pledge-checkbox-label` - Confirmation checkbox
  - `.pledge-button-group` - Button group layout
  - `.pledge-btn` - Button styling (cancel and confirm)
  - Responsive design for mobile devices
  - Smooth animations and transitions

#### **NeedsPage** (Updated)

- Updated import to include `DonationFormData` type
- Modified `onSubmit` handler to accept complete donation data
- Passes all donor information to backend via `createDonation` API call

### 2. API Changes

#### **api.ts** (Updated)

- Extended `Donation` interface with new fields:
  - `donor_type` - Type of donor (private or government)
  - Private donor fields: `donor_name`, `donor_contact`, `donor_organization`, `donor_address`, `donor_email`, `donor_phone`
  - Government donor fields: `government_department`, `government_program`, `government_officer`, `government_officer_contact`
  - `estimated_delivery_date` - Delivery commitment date

### 3. Backend Changes

#### **models.py** (Updated)

- Extended `Donation` model with new fields
- Added `DONOR_TYPE_CHOICES` for donor classification
- All new fields are optional to maintain backward compatibility
- Generated migration: `0006_donation_donor_address_donation_donor_contact_and_more.py`

#### **serializers.py** (Updated)

- `DonationSerializer` now includes all new donor information fields
- Fields remain read-only for system-generated data
- Supports full serialization/deserialization of pledge information

## Form Structure

### Section 1: Donor Type Selection

- **Private Citizen / NGO / Corporate** → Prompts for personal details
- **Government Sponsor** → Prompts for departmental details

### Section 2: Donor/Sponsor Details

**For Private Citizens/NGO/Corporate:**

- Full Name/Contact (required)
- Organization (optional)
- Address (required)
- Email Address (required)
- Phone Number (required)
- Contact Details (required)

**For Government Sponsors:**

- Government Department (required)
- Funding Sponsor/Program (required)
- Authorized Officer (required)
- Official Contact Number (required)

### Section 3: Pledge Commitment

- Quantity Pledging (required, with max validation)
- Estimated Delivery Date [YYYY-MM-DD] (required)
- Message (optional)

### Section 4: Confirmation

- Confirmation checkbox with type-specific messaging:
  - Private: "I confirm that I intend to supply these items within the specified timeframe."
  - Government: "Official approval has been granted for this allocation."

## Validation Rules

1. **Quantity**: Must be between 1 and the remaining needed quantity
2. **Estimated Delivery Date**: Required for all donations
3. **Confirmation**: Must be checked before submission
4. **Private Donor**: All personal information fields required
5. **Government Sponsor**: All departmental information fields required
6. **Email**: Validated as proper email format
7. **Phone**: Standard phone number format

## Styling Features

- **Colors Used:**
  - Primary Blue: #2563eb (buttons, focus states)
  - Success Green: #22c55e (confirm button)
  - Gray Background: #f9fafb, #f3f4f6
  - Border Gray: #d1d5db, #e5e7eb
  - Alert Yellow: #fbbf24 (accent border)

- **Typography:**
  - Section titles: Uppercase, letter-spaced
  - Labels: Semi-bold, 0.9rem
  - Inputs: Regular weight, 0.95rem
  - Professional, clean appearance

- **Interactive Elements:**
  - Smooth transitions (0.18s)
  - Focus states with blue glow
  - Hover effects on buttons
  - Checked radio buttons with custom styling
  - Checkbox with SVG checkmark

## Mobile Responsiveness

- Adapts form width for screens < 768px
- Buttons stack vertically on mobile
- Proper touch targets (min 44px height)
- Readable font sizes on all devices

## Backend Migration Applied

```
Applying core.0006_donation_donor_address_donation_donor_contact_and_more... OK
```

All database changes have been successfully applied.

## Files Modified

1. `frontend/components/DonateModal.tsx` - Complete rewrite with new form
2. `frontend/app/donor-modal-custom.css` - Added comprehensive pledge form styles
3. `frontend/app/needs/page.tsx` - Updated to handle new donation data
4. `frontend/lib/api.ts` - Extended Donation interface
5. `backend/core/models.py` - Extended Donation model
6. `backend/core/serializers.py` - Updated DonationSerializer
7. `backend/core/migrations/0006_*.py` - Database migration (auto-generated)

## Testing the Form

1. **Private Donor Path:**
   - Click donate on any need item
   - Select "Private Citizen / NGO / Corporate"
   - Fill in all donor details
   - Enter quantity and delivery date
   - Check confirmation
   - Submit

2. **Government Sponsor Path:**
   - Click donate on any need item
   - Select "Government Sponsor"
   - Fill in government details
   - Enter quantity and delivery date
   - Check confirmation
   - Submit

3. **Error Validation:**
   - Missing required fields → Shows error
   - Invalid quantity → Shows error
   - Missing delivery date → Shows error
   - Confirmation unchecked → Shows error

## API Integration

The form sends POST request to `/api/donations/` with extended payload:

```json
{
  "need_item": 1,
  "quantity": 5,
  "message": "Optional message",
  "donor_type": "private",
  "donor_name": "John Doe",
  "donor_contact": "Contact info",
  "donor_organization": "Company XYZ",
  "donor_address": "Address",
  "donor_email": "john@example.com",
  "donor_phone": "+1-234-567-8900",
  "estimated_delivery_date": "2026-04-15"
}
```

## Future Enhancements

- Email confirmation notifications
- Donor dashboard to track pledges
- Pledge fulfillment tracking
- Export donation reports
- Automatic reminders for delivery dates
