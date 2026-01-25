# Dewaks Engineering - Cashflow Request Management System

A professional cash request management system for Dewaks Engineering Company with multi-level approval workflow, email notifications, and a premium glass morphism UI.

## Features

### Core Functionality
- **Staff Portal**: Create and track cash requests with amount, purpose, category, and urgency
- **Admin Review**: First-level approval with forwarding to management or rejection
- **Manager Approval**: Final approval authority and user role management
- **Email Notifications**: Automated email notifications at every workflow stage

### User Interface
- Premium glass morphism dark theme
- Animated transitions with Framer Motion
- Role-based dashboards with relevant stats
- Real-time status tracking with visual badges
- CSV export for all requests (admin/manager)

## Workflow

```
Staff creates request
        ↓
   PENDING_ADMIN
        ↓
  Admin reviews
    ↙        ↘
REJECTED    PENDING_MANAGER
              ↓
        Manager reviews
          ↙        ↘
    REJECTED     APPROVED
```

## User Roles

| Role | Permissions |
|------|-------------|
| **STAFF** | Create cash requests, view own requests and status |
| **ADMIN** | Review pending requests, approve/reject, forward to manager, view all users |
| **MANAGER** | Final approval, manage user roles, view all requests |

## Categories

- Travel
- Equipment
- Supplies
- Training
- Maintenance
- Consulting
- Other

## Urgency Levels

- **LOW** - Can wait a few days
- **NORMAL** - Standard processing
- **HIGH** - Needs attention soon
- **URGENT** - Immediate attention required

## Email Notifications

The system sends beautifully styled automated emails with icons and status badges for:

1. **New Request Created**:
   - Staff receives submission confirmation
   - All Admins AND Managers receive review notification (real-time)

2. **Admin Approval**:
   - Staff notified of admin approval status
   - Managers receive final approval request

3. **Admin Rejection**:
   - Staff receives rejection notice with reason

4. **Manager Approval**:
   - Staff receives celebratory final approval email with disbursement instructions
   - Admins notified of approval

5. **Manager Rejection**:
   - Staff receives final rejection with reason
   - Admins notified of rejection

## Tech Stack

### Frontend (webapp/)
- React + TypeScript + Vite
- Tailwind CSS with glass morphism design
- shadcn/ui components
- Framer Motion animations
- Better Auth (Email OTP authentication)

### Backend (backend/)
- Bun + Hono
- Prisma ORM with SQLite
- Better Auth with Email OTP
- Vibecode SDK for email notifications

## Currency

All amounts are displayed in **Ghanaian Cedis (GHS)**.

## Getting Started

1. **Login** with your email - you'll receive a 6-digit OTP code
2. New users are assigned **STAFF** role by default
3. To set up the first Manager:
   - Access the database directly (Prisma Studio)
   - Change a user's role to "MANAGER"
4. Managers can then assign ADMIN and MANAGER roles to other users via the User Management page
