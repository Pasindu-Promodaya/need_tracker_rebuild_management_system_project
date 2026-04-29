# Enhanced Donation Form - Architecture & Data Flow

## 🏗️ System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + TypeScript)           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  NeedsPage Component                     │  │
│  │  - Displays list of need items                          │  │
│  │  - Handles donate button click                          │  │
│  │  - Manages donation submission                          │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │ onDonate                                     │
│                   ↓                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              DonateModal Component (NEW)                │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │ 1. Fetch section & organization details         │   │  │
│  │  │    - getSection(need.section)                   │   │  │
│  │  │    - getOrganization(section.organization)      │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                   ↓                                      │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │ 2. Display Item Context                         │   │  │
│  │  │    - Item name, unit, quantity                  │   │  │
│  │  │    - Organization & section info                │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                   ↓                                      │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │ 3. Donor Type Selection                         │   │  │
│  │  │    ○ Private/NGO/Corporate                      │   │  │
│  │  │    ○ Government Sponsor                         │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                   ↓                                      │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │ 4. Conditional Form Rendering                   │   │  │
│  │  │    - Private: Personal info fields              │   │  │
│  │  │    - Government: Dept/Program fields            │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                   ↓                                      │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │ 5. Collect Pledge Details                       │   │  │
│  │  │    - Quantity                                   │   │  │
│  │  │    - Delivery date                              │   │  │
│  │  │    - Optional message                           │   │  │
│  │  │    - Confirmation                               │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                   ↓                                      │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │ 6. Validation (Client-Side)                     │   │  │
│  │  │    - Required fields check                      │   │  │
│  │  │    - Quantity bounds (1 to max)                 │   │  │
│  │  │    - Email format validation                    │   │  │
│  │  │    - Confirmation checkbox required             │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                   ↓                                      │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │ 7. Submit DonationFormData                       │   │  │
│  │  │    (onSubmit handler called)                    │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │ onSubmit(DonationFormData)                 │
│                   ↓                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         API Layer (frontend/lib/api.ts)                 │  │
│  │  createDonation({                                       │  │
│  │    need_item, quantity, message,                       │  │
│  │    donor_type, donor_name, ...                         │  │
│  │  })                                                     │  │
│  │  ↓ POST /api/donations/                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                   │ HTTP Request w/ Auth Token                 │
│                   ↓                                            │
└─────────────────────────────────────────────────────────────────┘
                    │
                    │
────────────────────┼──────────────────────────────────────────────
                    │
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Django + DRF)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              DonationViewSet (REST API)                 │  │
│  │  - POST /donations/ (create)                           │  │
│  │  - GET /donations/ (list)                              │  │
│  │  - GET /donations/{id}/ (retrieve)                     │  │
│  │  - PATCH /donations/{id}/ (partial update)            │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │ Serialization (DonationSerializer)         │
│                   ↓                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Donation Model Validation                     │  │
│  │  - All fields validated                               │  │
│  │  - Foreign keys resolved                              │  │
│  │  - Choice fields validated                            │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                            │
│                   ↓                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        Database Layer (PostgreSQL/SQLite)              │  │
│  │                                                         │  │
│  │  INSERT INTO core_donation (                          │  │
│  │    donor_id, need_item_id, quantity,                 │  │
│  │    status, message, created_at,                      │  │
│  │    donor_type, donor_name, donor_contact,            │  │
│  │    donor_organization, donor_address,                │  │
│  │    donor_email, donor_phone,                         │  │
│  │    government_department, government_program,        │  │
│  │    government_officer, government_officer_contact,  │  │
│  │    estimated_delivery_date                           │  │
│  │  ) VALUES (...)                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow Sequence Diagram

```
User              Frontend           Backend            Database
 │                  │                  │                   │
 │─── Click Donate ─→ │                  │                   │
 │                  │ Fetch Section ────→ │                   │
 │                  │ Fetch Org ────────→ │                   │
 │                  │ Display Modal ←────── │                   │
 │                  │                  │                   │
 │ Select Type       │                  │                   │
 │ & Fill Form ────→ │                  │                   │
 │                  │ Validate ←─────────│                   │
 │                  │ Prepare Payload ──→ │                   │
 │                  │                  POST /donations/     │
 │                  │                  │── Create Donor ────→ │
 │                  │                  │                  INSERT │
 │                  │ 201 Created ←─────── │                   │
 │ Success Msg ←──── │ Refresh List ──────→ │ Get Updated Items │
 │                  │ Close Modal ←────────── │                   │
 │                  │                  │                   │
```

## 🔄 Component State Management

```
DonateModal Component State:

┌─────────────────────────────────────────────────┐
│ Form State Variables                            │
├─────────────────────────────────────────────────┤
│ donorType: "private" | "government"             │
│ quantity: number                                │
│ message: string                                 │
│ estimatedDeliveryDate: string                   │
│ confirmApproval: boolean                        │
│ error: string                                   │
│ section: Section | null                        │
│ organization: Organization | null              │
│ loadingDetails: boolean                        │
│                                                 │
│ Private Donor Fields:                          │
│ ├─ donorName: string                          │
│ ├─ donorContact: string                       │
│ ├─ donorOrganization: string                  │
│ ├─ donorAddress: string                       │
│ ├─ donorEmail: string                         │
│ └─ donorPhone: string                         │
│                                                 │
│ Government Fields:                             │
│ ├─ governmentDepartment: string               │
│ ├─ governmentProgram: string                  │
│ ├─ governmentOfficer: string                  │
│ └─ governmentOfficerContact: string           │
└─────────────────────────────────────────────────┘
```

## 🎯 Validation Flow

```
User Submits Form
      │
      ↓
Client-Side Validation
├── quantity >= 1 && quantity <= maxQuantity?  ✓/✗
├── estimatedDeliveryDate exists?              ✓/✗
├── confirmApproval === true?                  ✓/✗
│
└─ If Private Donor:
   ├── donorName && donorContact?              ✓/✗
   ├── donorAddress?                           ✓/✗
   ├── donorEmail valid?                       ✓/✗
   └── donorPhone?                             ✓/✗
│
└─ If Government Sponsor:
   ├── governmentDepartment?                   ✓/✗
   ├── governmentProgram?                      ✓/✗
   ├── governmentOfficer?                      ✓/✗
   └── governmentOfficerContact?               ✓/✗
      │
      ↓ (If all valid)
      │
   Send to Backend
      │
      ↓
Server-Side Validation (Django)
├── Model validation
├── Serializer validation
├── Foreign key constraints
└── Business logic checks
      │
      ↓ (If valid)
      │
   Create Donation Record
      │
      ↓
   Return Success Response
      │
      ↓
Client Updates UI
├── Close modal
├── Refresh needs list
└── Show success message
```

## 📈 Database Schema

```
┌─── core_donation ───────────────────────────────┐
│ PrimaryKey                                      │
│ ├─ id (AutoField)                              │
│                                                 │
│ Foreign Keys                                   │
│ ├─ donor_id (ForeignKey → User, nullable)     │
│ └─ need_item_id (ForeignKey → NeedItem)       │
│                                                 │
│ Core Fields                                    │
│ ├─ quantity (PositiveIntegerField)            │
│ ├─ status (CharField)                         │
│ │   • PENDING, CONFIRMED, FULFILLED, CANCELLED│
│ ├─ message (TextField)                        │
│ └─ created_at (DateTimeField, auto)           │
│                                                 │
│ Pledge Details (NEW)                           │
│ ├─ donor_type (CharField)                     │
│ │   • "private", "government"                 │
│ └─ estimated_delivery_date (DateField)        │
│                                                 │
│ Private Donor Info (NEW)                       │
│ ├─ donor_name (CharField)                     │
│ ├─ donor_contact (CharField)                  │
│ ├─ donor_organization (CharField)             │
│ ├─ donor_address (TextField)                  │
│ ├─ donor_email (EmailField)                   │
│ └─ donor_phone (CharField)                    │
│                                                 │
│ Government Info (NEW)                          │
│ ├─ government_department (CharField)          │
│ ├─ government_program (CharField)             │
│ ├─ government_officer (CharField)             │
│ └─ government_officer_contact (CharField)     │
│                                                 │
│ Timestamps                                     │
│ └─ created_at (DateTimeField, auto_add)       │
└─────────────────────────────────────────────────┘
```

## 🔗 API Relationships

```
Frontend Services:
  api.ts
  ├── getNeeds()                 → GET /needs/
  ├── getNeed(id)                → GET /needs/{id}/
  ├── getSection(id)             → GET /sections/{id}/
  ├── getOrganization(id)        → GET /organizations/{id}/
  ├── createDonation(data)       → POST /donations/
  ├── updateDonation(id, data)   → PATCH /donations/{id}/
  └── getDonationsForNeed(id)    → GET /donations/?need_item={id}

Backend Views:
  viewsets.py
  ├── DonationViewSet
  │   ├── list()                 → GET /donations/
  │   ├── create()               → POST /donations/
  │   ├── retrieve()             → GET /donations/{id}/
  │   └── partial_update()       → PATCH /donations/{id}/
  ├── NeedItemViewSet
  ├── SectionViewSet
  └── OrganizationViewSet
```

## 🎨 Component Hierarchy

```
                    App
                     │
                     ├── NeedsPage
                     │   ├── PriorityFilter
                     │   ├── NeedCard (multiple)
                     │   │   └── [Donate Button Click]
                     │   │
                     │   └── DonateModal ✨ (NEW)
                     │       ├── Target Info Display
                     │       ├── Donor Type Selection
                     │       ├── Conditional Form Fields
                     │       ├── Pledge Details
                     │       ├── Confirmation
                     │       └── Action Buttons
                     │
                     └── Other Pages
```

## 🔐 Security Considerations

```
Authentication
├── Bearer token in Authorization header
├── User ID associated with donation
└── Backend validates user role
    └── Only DONOR role can create donations

Authorization
├── Donations tied to user (if logged in)
├── Optional guest donations
└── Backend enforces donation rules

Data Validation
├── Client-side (UX feedback)
├── Server-side (integrity)
├── Email validation
├── Quantity bounds checking
└── Required field validation

Database Constraints
├── Foreign key constraints
├── Nullable fields for guest donations
├── Choices enforcement
└── Type validation
```

## 📱 Responsive Breakpoints

```
Mobile-First Design:

320px - 600px (Mobile Phones)
├── Single column layout
├── Full-width form
├── Stacked buttons
└── Optimized touch targets

601px - 768px (Tablets - Portrait)
├── Optimized form width
├── Responsive spacing
└── Improved readability

769px - 1024px (Tablets - Landscape)
├── Wider form container
├── Better use of space
└── Multi-column support

1025px+ (Desktop)
├── Maximum width: 700px
├── Centered layout
├── Full feature set
└── Enhanced typography
```

## 🚀 Deployment Pipeline

```
Development
    │
    ├── Frontend Build
    │   ├── Run tests
    │   ├── Lint check
    │   ├── Type checking
    │   └── Build output
    │
    ├── Backend Build
    │   ├── Run tests
    │   ├── Migration check
    │   ├── Static files
    │   └── Collectstatic
    │
    └── Testing
        ├── Unit tests
        ├── Integration tests
        ├── Manual testing
        └── QA approval
            │
            ↓
        Staging
            │
            ├── Deploy frontend
            ├── Deploy backend
            ├── Run migrations
            └── Smoke testing
                │
                ↓
            Production
                │
                ├── Blue-green deployment
                ├── Health checks
                ├── Monitor logs
                └── Rollback plan
```

---

This architecture ensures:

- **Scalability**: Clean separation of concerns
- **Maintainability**: Clear data flow
- **Reliability**: Validation at multiple layers
- **Security**: Authentication & authorization checks
- **User Experience**: Responsive design, smooth interactions
