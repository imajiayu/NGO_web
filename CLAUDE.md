# NGO Platform - Technical Documentation

## Project Overview

This is a modern NGO (Non-Governmental Organization) platform built around independent projects. The platform allows NGOs to showcase their projects and receive donations through an integrated payment system with full internationalization support.

### Core Concept
- **Project-Centric Architecture**: Each project is an independent entity with its own details, goals, and donation tracking
- **Donation Management**: Integrated WayForPay payment processing with refund support
- **Multi-language Support**: Full i18n support with next-intl (English, Chinese, Ukrainian)
- **Real-time Updates**: Leveraging Supabase real-time capabilities for live project updates
- **Email Notifications**: Automated donation confirmations via Resend
- **Simplified ID System**: Project-based donation IDs for easy tracking (format: {project_id}-{XXXXXX})

## Tech Stack

### Frontend & Framework
- **Next.js 14** (App Router)
  - Server Components for optimal performance
  - Server Actions for mutations
  - API Routes for backend logic
  - TypeScript for type safety
- **next-intl** for internationalization
  - Server-side translations
  - Route-based locale detection
  - Type-safe translation keys

### Backend & Database
- **Supabase**
  - PostgreSQL database
  - Built-in authentication (Email, OAuth, Magic Links)
  - Row Level Security (RLS) for data protection
  - Service Role Key for webhook operations
  - Real-time subscriptions
  - Storage for images and files

### Payment Processing
- **WayForPay**
  - Ukrainian payment gateway
  - Widget-based payment flow
  - Webhooks for payment confirmation
  - MD5 signature verification
  - Support for UAH, USD, EUR currencies

### Email Service
- **Resend**
  - Transactional email delivery
  - Multi-language email templates
  - Domain verification with SPF/DKIM
  - Delivery tracking and monitoring

### Deployment & Infrastructure
- **Vercel**
  - Edge functions
  - Automatic deployments from Git
  - Environment variable management
  - Analytics and monitoring

### Styling & UI
- **Tailwind CSS**
  - Utility-first styling
  - Responsive design
  - Custom color scheme
  - Component variants

## Architecture Design

### Application Layers

```
┌─────────────────────────────────────────────────┐
│          User Interface (UI)                    │
│    Next.js App Router Pages with i18n          │
│           [locale]/donate, [locale]/...         │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│         React Server Components                 │
│   (Data fetching, Server Actions, i18n)        │
└─────────────────────────────────────────────────┘
                      ↓
┌──────────────┬──────────────┬──────────────┬────────────┐
│  Supabase    │ WayForPay    │   Resend     │ next-intl  │
│ (Data/Auth)  │ (Payments)   │   (Email)    │(Translate) │
│ - Client     │              │              │            │
│ - Service    │              │              │            │
└──────────────┴──────────────┴──────────────┴────────────┘
```

### Key Design Decisions

1. **Server-First Rendering**
   - Use React Server Components by default
   - Client components only when needed (interactivity, browser APIs)
   - Reduces JavaScript bundle size
   - Improves initial page load

2. **Type Safety**
   - Database types generated from Supabase schema
   - Zod for runtime validation
   - TypeScript strict mode enabled

3. **Internationalization**
   - Server-side translations with next-intl
   - Locale detection via URL path (/en, /zh)
   - Fallback to default locale (en)
   - Translation files in /messages directory

4. **Dual Supabase Client Pattern**
   - **Regular Client**: For authenticated user operations (RLS enforced)
   - **Service Role Client**: For trusted server operations (RLS bypassed)
     - Used in webhooks for inserting donations
     - Never expose service role key to client

5. **Payment Flow**
   - WayForPay widget integration
   - MD5 signature verification for security
   - Order reference linking donations to projects
   - Pending status until payment confirmed
   - Per-unit donation records for granular tracking

6. **Email Notifications**
   - Resend for transactional emails
   - Localized templates based on user's language
   - Automated confirmation on payment success
   - HTML and plain text versions

## Directory Structure

```
NGO_web/
├── app/                           # Next.js App Router
│   ├── [locale]/                  # Internationalized routes
│   │   ├── donate/                # Donation flow
│   │   │   ├── wayforpay-widget.tsx # Client: WayForPay widget
│   │   │   ├── success/           # Payment success page
│   │   │   │   └── page.tsx       # Server: Success confirmation
│   │   │   └── page.tsx           # Server: Donation page
│   │   ├── layout.tsx             # Root layout with i18n provider
│   │   └── page.tsx               # Home page
│   │
│   ├── actions/                   # Server Actions
│   │   └── donation.ts            # Donation creation with pending status
│   │
│   ├── api/                       # API Routes
│   │   └── webhooks/
│   │       └── wayforpay/         # WayForPay webhook handler
│   │           └── route.ts       # Payment confirmation and email
│   │
│   └── globals.css                # Global styles
│
├── components/                    # React Components
│   └── (to be organized as needed)
│
├── i18n/                          # Internationalization
│   ├── config.ts                  # i18n configuration
│   ├── navigation.ts              # Localized navigation
│   └── request.ts                 # Request configuration
│
├── lib/                           # Utilities & Configuration
│   ├── supabase/
│   │   ├── client.ts              # Client-side Supabase client
│   │   ├── server.ts              # Server-side clients (regular + service)
│   │   └── queries.ts             # Database query functions
│   ├── wayforpay/
│   │   └── server.ts              # WayForPay integration & signature
│   ├── email/
│   │   └── server.ts              # Resend email service
│   ├── utils.ts                   # Helper functions
│   └── validations.ts             # Zod schemas
│
├── messages/                      # Translation files
│   ├── en.json                    # English translations
│   ├── zh.json                    # Chinese translations
│   └── ua.json                    # Ukrainian translations
│
├── supabase/                      # Supabase configuration
│   ├── migrations/                # Database migrations (current)
│   │   ├── 001_init_schema.sql           # Tables and constraints
│   │   ├── 002_init_functions_views.sql  # Functions and views
│   │   └── 003_init_policies.sql         # RLS policies
│   └── migrations_archive/        # Archived old migrations
│
├── types/                         # TypeScript Types
│   ├── database.ts                # Supabase generated types
│   └── index.ts                   # Application types
│
├── public/                        # Static Assets
│   ├── images/
│   └── icons/
│
├── .env.local                     # Environment variables (not in git)
├── .env.example                   # Environment variables template
├── i18n.ts                        # i18n request configuration
├── middleware.ts                  # Next.js middleware (i18n routing)
├── next.config.js                 # Next.js configuration
├── tailwind.config.js             # Tailwind configuration
├── tsconfig.json                  # TypeScript configuration
├── docs/                          # Documentation
│   ├── SUPABASE_CLI_GUIDE.md      # Supabase CLI usage guide
│   ├── PAYMENT_METHODS.md         # Payment configuration guide
│   ├── TROUBLESHOOTING.md         # Common issues and solutions
│   └── DONATE_PAGE_UI_DESIGN.md   # UI design specifications
├── CLAUDE.md                      # Technical documentation (this file)
├── README.md                      # Project overview
└── package.json                   # Dependencies
```

## Data Flow

### Project Viewing Flow
1. User navigates to `/en/donate` or `/zh/donate`
2. Middleware detects locale from URL
3. Server Component fetches active projects from Supabase
4. Translations loaded server-side via next-intl
5. Projects rendered on server with initial data
6. Client-side hydration for interactive elements

### Donation Flow (End-to-End)

```
User Side:
1. User selects project, quantity, and enters info
2. Form validated with Zod schema
3. Server Action creates pending donations in database
   ├─ Validates project exists and is active
   ├─ Calculates total amount
   ├─ For each unit: Generate unique donation_public_id (e.g., 1-A1B2C3)
   ├─ Insert donation records with status 'pending'
   ├─ Generate order_reference: DONATE-{project_id}-{timestamp}
   └─ Save donor info, locale (en/zh/ua), and order_reference

4. WayForPay widget loads with payment parameters
   ├─ Generate MD5 signature from payment data
   ├─ Include returnUrl and serviceUrl (webhook)
   └─ User sees payment form in modal/widget

5. User completes payment via WayForPay
6. WayForPay processes payment

Server Side (Webhook):
7. WayForPay sends payment notification to serviceUrl
8. MD5 signature verified for authenticity
9. Service Role Client bypasses RLS
10. For transaction status "Approved":
    ├─ Find pending donations by order_reference
    ├─ Update all donations to status 'paid'
    ├─ Database trigger auto-updates project current_units
    ├─ Send confirmation email via Resend
    └─ Email includes all donation IDs

11. User redirected to returnUrl (success page)
12. Success page fetches donations by order_reference
13. Display donation IDs and confirmation message

Donation Status Flow:
[pending] → [paid] → [confirmed] → [delivering] → [completed]
                ↓
           [refunding] → [refunded]
```

### Authentication Flow
1. User submits login/signup form
2. Supabase Auth validates credentials
3. Session cookie set via Auth Helpers
4. Middleware validates protected routes
5. User data available in Server Components

## Database Schema

### Tables

#### 1. `projects` - Core Project Information

Stores all NGO projects with their details and progress tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key, auto-incrementing |
| `project_name` | VARCHAR(255) | Name of the project |
| `location` | VARCHAR(255) | Geographic location where project is executed |
| `start_date` | DATE | Project start date |
| `end_date` | DATE (nullable) | Project end date (NULL for long-term projects) |
| `is_long_term` | BOOLEAN | Flag for projects without fixed end date |
| `target_units` | INTEGER | Goal number of units to fund (e.g., 100 kits) |
| `current_units` | INTEGER | Current number of units funded |
| `unit_price` | NUMERIC(10,2) | Price per unit in USD |
| `unit_name` | VARCHAR(50) | Name of the unit (default: 'kit') |
| `status` | VARCHAR(20) | Project status: 'planned', 'active', 'completed', 'paused' |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp (auto-updated) |

**Constraints:**
- `status` must be one of: planned, active, completed, paused
- `current_units` and `target_units` must be >= 0
- `unit_price` must be > 0
- `end_date` must be >= `start_date` (if not NULL)

**Indexes:**
- `idx_projects_status` on `status`
- `idx_projects_start_date` on `start_date`

#### 2. `donations` - Donation Records

Tracks all donations made to projects with payment details.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key, auto-incrementing |
| `donation_public_id` | VARCHAR(50) | **NEW FORMAT**: {project_id}-{XXXXXX} (e.g., 1-A1B2C3) |
| `project_id` | BIGINT | Foreign key to projects.id |
| `donor_name` | VARCHAR(255) | Donor's name (can be pseudonym) |
| `donor_email` | VARCHAR(255) | Donor's email address |
| `donor_message` | TEXT (nullable) | Optional message from donor |
| `contact_telegram` | VARCHAR(255) (nullable) | Telegram contact |
| `contact_whatsapp` | VARCHAR(255) (nullable) | WhatsApp contact |
| `amount` | NUMERIC(10,2) | Donation amount per unit |
| `currency` | VARCHAR(10) | Currency code (default: 'USD') |
| `payment_method` | VARCHAR(50) (nullable) | Payment method used (e.g., 'WayForPay') |
| `order_reference` | VARCHAR(255) (nullable) | WayForPay order reference (format: DONATE-{project_id}-{timestamp}) |
| `donation_status` | VARCHAR(20) | Status: 'pending', 'paid', 'confirmed', 'delivering', 'completed', 'refunding', 'refunded' |
| `locale` | VARCHAR(5) | User language at donation time: 'en', 'zh', 'ua' (default: 'en') |
| `donated_at` | TIMESTAMPTZ | When donation was made (default: now()) |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |

**Constraints:**
- `donation_public_id` must be unique
- `donation_status` must be one of: **pending, paid, confirmed, delivering, completed, refunding, refunded**
- `locale` must be one of: en, zh, ua
- `amount` must be > 0
- Foreign key to `projects(id)` with CASCADE delete

**Indexes:**
- `idx_donations_project_id` on `project_id`
- `idx_donations_status` on `donation_status`
- `idx_donations_public_id` on `donation_public_id`
- `idx_donations_email` on `donor_email`
- `idx_donations_order_reference` on `order_reference` (unique, partial index)
- `idx_donations_order_ref_status` on `(order_reference, donation_status)` (partial index)
- `idx_donations_locale` on `locale`
- `idx_donations_refund_status` on `donation_status` (for refunding/refunded)

### Views

#### 1. `project_stats` - Aggregated Project Statistics

Pre-computed statistics for each project including donation totals and progress.

**Columns:**
- `id`, `project_name`, `status`, `target_units`, `current_units`, `unit_name`
- `total_raised` - Sum of all confirmed donations
- `donation_count` - Number of confirmed donations
- `progress_percentage` - (current_units / target_units * 100)

#### 2. `public_donation_feed` - Anonymized Donation Feed

Public view of donations with anonymized donor names for privacy.

**Columns:**
- `donation_public_id`, `project_name`, `project_id`
- `donor_display_name` - Anonymized (e.g., "John D.")
- `amount`, `currency`, `donated_at`

**Anonymization Rules:**
- If name has space: "First Last" → "First L."
- If no space: "Name" → "N***"

### Database Functions

#### 1. `generate_donation_public_id(project_id_input BIGINT)`

**NEW FORMAT**: Generates unique project-scoped donation IDs.

**Format**: `{project_id}-{XXXXXX}`
- `project_id`: The project ID (1, 23, 456, etc.)
- `XXXXXX`: 6-character random alphanumeric uppercase

**Examples:**
- `1-A1B2C3` (Project 1)
- `23-D4E5F6` (Project 23)
- `456-G7H8I9` (Project 456)

**Benefits:**
- **Shorter**: 8-10 characters vs 17 characters
- **Project-scoped**: Each project has independent namespace
- **Low collision**: 16^6 = 16,777,216 combinations per project
- **Semantic**: Immediately shows which project

#### 2. `get_project_progress(project_id_input BIGINT)`

Returns detailed progress information for a specific project.

**Returns:**
- `project_id`, `project_name`
- `target_units`, `current_units`, `progress_percentage`
- `total_donations`, `total_amount`

#### 3. `get_recent_donations(project_id_input BIGINT, limit_count INTEGER)`

Returns recent donations for a project (default limit: 10).

#### 4. `is_project_goal_reached(project_id_input BIGINT)`

Returns boolean indicating if project has reached its goal.

### Triggers

#### 1. `update_projects_updated_at`
Automatically updates `updated_at` timestamp on projects table when records are modified.

#### 2. `update_project_units_trigger`
Automatically increments/decrements `current_units` when donation status changes:
- Increments when status is paid/confirmed/delivering/completed
- Decrements when status changes to refunded
- Handles refunding state transitions

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

**Projects:**
- ✅ Public can view active and completed projects
- 🔒 Admins can insert, update, and delete projects

**Donations:**
- ✅ Public can view confirmed donations
- 🔒 Admins can view and update all donations
- 🔑 Service role can insert and update donations (from WayForPay webhooks)

**Admin Identification:**
Admins are identified by checking `auth.users.raw_user_meta_data->>'role' = 'admin'`

### Migration Files

Database schema is defined in SQL migrations located in `supabase/migrations/`:
1. ✅ `001_init_schema.sql` - Core database tables, constraints, and indexes
2. ✅ `002_init_functions_views.sql` - Helper functions and database views
3. ✅ `003_init_policies.sql` - RLS policies and donation triggers

**Archived migrations**: Old migration files are preserved in `supabase/migrations_archive/` for reference.

**To apply migrations**: Use Supabase CLI `supabase db push` - See `SUPABASE_CLI_GUIDE.md`

## Internationalization (i18n)

### Supported Languages
- 🇺🇸 English (en) - Default
- 🇨🇳 Chinese (zh)
- 🇺🇦 Ukrainian (ua)

### Implementation

**Routing:**
- `/en/donate` - English donation page
- `/zh/donate` - Chinese donation page
- `/` - Redirects to `/en` (default locale)

**Middleware:**
```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'always'  // Always show locale in URL
})
```

**Server-side translations:**
```typescript
import { getTranslations } from 'next-intl/server'

const t = await getTranslations('donate')
<h1>{t('title')}</h1>  // "Make a Donation" or "进行捐赠"
```

**Translation files structure:**
```json
{
  "common": { ... },
  "navigation": { ... },
  "donate": {
    "title": "Make a Donation",
    "submit": "Complete Donation",
    "errors": {
      "invalidEmail": "Please enter a valid email address."
    }
  },
  "donateSuccess": { ... }
}
```

## Development Guidelines

### Code Style
- Use TypeScript strict mode
- Prefer Server Components over Client Components
- Use Server Actions for mutations
- Follow Next.js 14 best practices
- Use meaningful variable and function names
- Add 'use client' directive only when needed

### Component Patterns

```typescript
// Server Component (default) - can use async/await
export default async function DonatePage() {
  const projects = await getActiveProjects()
  const t = await getTranslations('donate')
  return <DonationForm projects={projects} />
}

// Client Component (when needed for interactivity)
'use client'
export default function DonationForm({ projects }) {
  const [amount, setAmount] = useState(0)
  const t = useTranslations('donate')  // Client hook
  return <form>{/* ... */}</form>
}
```

### Error Handling

- Use try-catch for async operations
- Show user-friendly error messages with i18n
- Log errors for debugging
- Handle WayForPay webhook errors gracefully
- Validate inputs with Zod schemas
- Email failures don't block payment processing

**Example:**
```typescript
try {
  const result = await createDonationIntent(data)
} catch (err) {
  if (err instanceof Error && err.message.includes('email')) {
    setError(t('errors.invalidEmail'))
  } else {
    setError(t('errors.serverError'))
  }
}
```

### Security Best Practices

1. **Row Level Security**: Enable RLS on all Supabase tables
2. **Service Role Isolation**: Use service role ONLY in trusted server contexts
3. **Input Validation**: Validate all user inputs with Zod
4. **Webhook Verification**: Always verify WayForPay MD5 signatures
5. **Environment Variables**: Never commit secrets to version control
6. **Type Safety**: Use TypeScript to catch errors at compile time
7. **Email Security**: Use verified domain with SPF/DKIM records

## Supabase Setup

### Client Types

**Regular Client (createServerClient)**
- Used for: User-facing operations
- RLS: ✅ Enforced
- Usage: Server Components, Server Actions
- Auth: Uses user's session cookie

**Service Role Client (createServiceClient)**
- Used for: Trusted server operations (webhooks)
- RLS: ❌ Bypassed
- Usage: API routes (webhooks only)
- Auth: Service role key

```typescript
// lib/supabase/server.ts
export const createServerClient = () => {
  return createServerComponentClient<Database>({ cookies })
}

export const createServiceClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

### Required Configuration

1. ✅ Create new Supabase project
2. ✅ Enable Email authentication
3. ✅ Run database migrations
4. ✅ Set up Row Level Security policies
5. ⏳ Configure storage buckets for images (if needed)

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # ⚠️ Keep secret!
```

## WayForPay Setup

### Implementation Details

**Payment Flow:**
1. Create pending donations in database
2. Generate order reference: DONATE-{project_id}-{timestamp}
3. Generate WayForPay payment parameters with MD5 signature
4. Load WayForPay widget with payment data
5. User completes payment in widget
6. WayForPay sends webhook to serviceUrl
7. Verify signature and update donations to 'paid'
8. Send confirmation email via Resend

**Payment Parameters:**
```typescript
{
  merchantAccount: "merchant_name",
  merchantAuthType: "SimpleSignature",
  merchantDomainName: "yourdomain.com",
  merchantSignature: "generated_md5_hash",
  orderReference: "DONATE-1-1234567890",
  orderDate: 1234567890, // Unix timestamp
  amount: 100.00,
  currency: "UAH", // or "USD", "EUR"
  productName: ["Clean Water Kit"],
  productPrice: [20.00],
  productCount: [5],
  clientFirstName: "John",
  clientLastName: "Doe",
  clientEmail: "john@example.com",
  language: "UA", // or "EN"
  returnUrl: "https://yourdomain.com/en/donate/success?orderReference=...",
  serviceUrl: "https://yourdomain.com/api/webhooks/wayforpay"
}
```

**MD5 Signature Generation:**
Order matters! Signature includes:
```
merchantAccount;merchantDomainName;orderReference;orderDate;amount;currency;productName;productCount;productPrice
```

### Required Configuration

1. ✅ Create WayForPay merchant account
2. ✅ Get merchant account name and secret key
3. ✅ Set up webhook endpoint: `/api/webhooks/wayforpay`
4. ✅ Configure returnUrl for success page
5. ✅ Test with test credentials

### Environment Variables

```bash
WAYFORPAY_MERCHANT_ACCOUNT=your_merchant_account
WAYFORPAY_SECRET_KEY=your_secret_key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Testing

**Test Mode:**
- Use test merchant credentials provided by WayForPay
- Test card numbers available in WayForPay documentation
- Monitor webhook logs for debugging

**Webhook Verification:**
```bash
# Test webhook locally with ngrok
ngrok http 3000

# Update serviceUrl temporarily to ngrok URL
# https://xxxx.ngrok.io/api/webhooks/wayforpay
```

## Resend Setup

### Implementation Details

**Email Flow:**
1. Payment confirmed via WayForPay webhook
2. Fetch donation details from database
3. Generate localized email content (en/zh/ua)
4. Send email via Resend API
5. Log email delivery status

**Email Templates:**
- HTML version with styling
- Plain text version for compatibility
- Localized content based on user's locale
- Includes donation IDs, project name, amount
- Next steps and contact information

### Required Configuration

1. ✅ Create Resend account
2. ✅ Add and verify custom domain
3. ✅ Configure DNS records (SPF, DKIM, DMARC)
4. ✅ Get API key
5. ✅ Set sender email address

### Domain Verification

**DNS Records Required:**
```
# SPF Record
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all

# DKIM Records (provided by Resend)
Type: TXT
Name: resend._domainkey
Value: [provided by Resend]

# DMARC Record (recommended)
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

### Environment Variables

```bash
RESEND_API_KEY=re_your-resend-api-key
RESEND_FROM_EMAIL=noreply@send.yourdomain.com
```

### Testing

**Test Email Sending:**
```bash
# Run test script
npm run test:email

# Test with specific locale
npm run test:email:zh
```

**Monitor Delivery:**
- Check Resend dashboard for delivery status
- Review bounce and spam reports
- Monitor email open rates (if enabled)

## Deployment

### Vercel Deployment Steps

1. ✅ Push code to GitHub repository
2. ⏳ Import project in Vercel
3. ⏳ Configure environment variables
4. ⏳ Deploy

### Environment Configuration

Add all environment variables in Vercel dashboard:

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**WayForPay:**
- `WAYFORPAY_MERCHANT_ACCOUNT`
- `WAYFORPAY_SECRET_KEY`

**Resend:**
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

**App:**
- `NEXT_PUBLIC_APP_URL` (e.g., https://yourdomain.vercel.app)

### Post-Deployment Checklist

⏳ To be completed after deployment:
1. Test authentication flow
2. Configure Resend DNS records (SPF, DKIM, DMARC)
3. Verify email domain in Resend dashboard
4. Test donation flow end-to-end
5. Configure WayForPay webhook URL: `https://yourdomain.com/api/webhooks/wayforpay`
6. Verify webhook is receiving events
7. Test email delivery to different providers (Gmail, Outlook)
8. Check database connections
9. Monitor error logs
10. Test all locales (/en, /zh, /ua)

## Current Implementation Status

### ✅ Phase 1 - Core Features (MOSTLY COMPLETE)

#### Database & Schema
- ✅ Projects table with all fields
- ✅ Donations table with enhanced fields
- ✅ Helper functions (donation ID generation)
- ✅ RLS policies
- ✅ Views (project_stats, public_donation_feed)
- ✅ Triggers (auto-update units)
- ✅ Updated donation ID format (project-based)

#### Internationalization
- ✅ next-intl configuration
- ✅ Middleware for locale routing
- ✅ English translations
- ✅ Chinese translations
- ✅ Server-side translation loading
- ✅ Client-side hooks

#### Donation Flow
- ✅ Project selection form
- ✅ Donor information form
- ✅ Contact methods (Telegram, WhatsApp)
- ✅ Donation message field
- ✅ Pending donation creation in database
- ✅ WayForPay widget integration
- ✅ MD5 signature generation and verification
- ✅ Webhook handler for payment confirmation
- ✅ Service role client for RLS bypass
- ✅ Multiple donation record creation (per unit)
- ✅ Success page with donation details
- ✅ Error handling with localized messages
- ✅ Automated email confirmation via Resend
- ✅ Localized email templates (en/zh/ua)

#### Pages & Routes
- ✅ Home page ([locale]/page.tsx)
- ✅ Donate page ([locale]/donate/page.tsx)
- ✅ Success page ([locale]/donate/success/page.tsx)
- ⏳ Projects listing page (to be built)
- ⏳ Project detail page (to be built)

#### Supabase Integration
- ✅ Client setup (regular + service role)
- ✅ Database queries module
- ✅ Type generation from schema
- ⏳ Authentication pages (to be built)

#### WayForPay Integration
- ✅ Server-side signature generation
- ✅ Widget integration
- ✅ Webhook endpoint
- ✅ Signature verification
- ✅ Error handling

#### Resend Integration
- ✅ Email service setup
- ✅ Multi-language templates
- ✅ HTML and text versions
- ✅ Domain verification
- ✅ Automated sending on payment

### 🚧 Phase 1 - Remaining Items

- ⏳ Navigation header with language switcher
- ⏳ Footer component
- ⏳ Projects listing page
- ⏳ Project detail page with progress bar
- ⏳ Public donation feed display
- ⏳ Authentication (login/signup)
- ⏳ Admin dashboard (basic)
- ⏳ Email notifications

### 📋 Phase 2 - Planned Enhancements

- Recurring donations support
- Project updates timeline
- Advanced email notifications
- Social sharing features
- Donor dashboard
- Project categories/tags
- Search and filtering
- Analytics dashboard

### 🔮 Phase 3 - Future Vision

- Advanced analytics
- Multi-currency support
- Mobile app (React Native)
- Volunteer management
- Impact reporting
- API for third-party integrations

## Testing Strategy

### Manual Testing Checklist

#### Donation Flow
- ✅ Can view active projects
- ✅ Can select project and quantity
- ✅ Can enter donor information
- ✅ Email validation works
- ✅ Can proceed to payment
- ✅ Stripe payment form loads
- ✅ Can complete payment with test card (4242 4242 4242 4242)
- ✅ Webhook receives payment confirmation
- ✅ Donations created in database
- ✅ Correct donation_public_id format (e.g., 1-A1B2C3)
- ✅ Project current_units updated
- ✅ Success page shows correct details
- ✅ Multiple units create multiple donation records

#### Internationalization
- ✅ Root path (/) redirects to /en
- ✅ /en shows English content
- ✅ /zh shows Chinese content
- ✅ All pages accessible in both locales
- ⏳ Language switcher works (when built)

#### Error Handling
- ✅ Invalid email shows localized error
- ✅ Validation errors display correctly
- ✅ Payment failure handled gracefully
- ⏳ Network errors handled

### Automated Testing (To Be Implemented)

#### Unit Tests
- Test utility functions
- Test validation schemas
- Test component logic
- Test helper functions

#### Integration Tests
- Test API routes
- Test Server Actions
- Test database queries
- Test webhook handling

#### E2E Tests (Recommended: Playwright)
- Test complete donation flow
- Test language switching
- Test form validation
- Test payment success/failure scenarios

## Performance Optimization

### Implemented ✅
- Server-side rendering for initial load
- Server Components reduce client JS
- Code splitting via Next.js App Router
- Tailwind CSS with minimal output
- next-intl translations loaded server-side

### Planned 📋
- Database query optimization with proper indexes
- Implement caching strategy (Next.js cache, Redis)
- Optimize images with next/image
- Add CDN for static assets
- Implement rate limiting on API routes

## Common Issues & Solutions

### Issue: 404 on all pages after fresh install
**Cause**: `next-intl` package not installed
**Solution**:
```bash
npm install next-intl
rm -rf .next && npm run dev
```

### Issue: Middleware redirects not working
**Solution**: Ensure `matcher` config in middleware.ts is correct and next-intl is properly configured

### Issue: WayForPay webhook returns 400 "Invalid signature"
**Cause**: Signature calculation mismatch
**Solution**:
- Verify field order matches exactly: merchantAccount;orderReference;amount;currency;authCode;cardPan;transactionStatus;reasonCode
- Ensure secret key is correct in environment variables
- Check for extra spaces or encoding issues in fields
- Log both received and calculated signatures for debugging

### Issue: WayForPay webhook returns 500 error
**Cause**: RLS blocking webhook update operations
**Solution**:
- Use `createServiceClient()` in webhook handlers
- Service role key must be set in environment variables
- Never use service role client in user-facing operations

### Issue: Emails not being delivered
**Cause**: Domain not verified or DNS records missing
**Solution**:
1. Verify domain in Resend dashboard
2. Add SPF record: `v=spf1 include:_spf.resend.com ~all`
3. Add DKIM records provided by Resend
4. Add DMARC record (recommended)
5. Wait for DNS propagation (can take up to 48 hours)
6. Test with `npm run test:email`

### Issue: donation_public_id generation fails
**Cause**: Function signature updated to require project_id
**Solution**:
- Apply migration 004_update_donation_id_format.sql
- Pass project_id when calling the function
- Update database types in types/database.ts

### Issue: Translations not loading
**Cause**: i18n.ts configuration issue with `requestLocale`
**Solution**:
```typescript
// i18n.ts - Use requestLocale (not locale)
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  // ... rest of config
})
```

### Issue: Supabase RLS blocking queries
**Solution**:
1. Review RLS policies in Supabase dashboard
2. Use service role key for admin operations
3. Check user authentication state
4. Verify policy matches your use case

### Issue: TypeScript errors with Supabase types
**Solution**:
1. Regenerate types: `npx supabase gen types typescript`
2. Update types/database.ts with new types
3. Update function signatures if schema changed

## Monitoring & Analytics (To Be Implemented)

### Recommended Tools
- **Vercel Analytics**: Page views and performance
- **Sentry**: Error tracking and monitoring
- **WayForPay Dashboard**: Payment monitoring and reconciliation
- **Resend Dashboard**: Email delivery and bounce tracking
- **Supabase Dashboard**: Database performance and queries
- **PostHog**: Product analytics (optional)

## Resources

### Documentation
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Supabase Documentation](https://supabase.com/docs)
- [WayForPay API Documentation](https://wiki.wayforpay.com)
- [Resend Documentation](https://resend.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Project-Specific Guides
- `docs/SUPABASE_CLI_GUIDE.md` - Supabase CLI usage and migration guide
- `docs/PAYMENT_METHODS.md` - Payment methods configuration
- `docs/TROUBLESHOOTING.md` - Common issues and solutions
- `docs/DONATE_PAGE_UI_DESIGN.md` - UI design specifications
- `.env.example` - Environment variable template

## Next Steps

### Immediate (Now)
1. ✅ Database schema consolidated (3 migration files)
2. ✅ Refund workflow implemented (paid/confirmed/delivering/completed/refunding/refunded)
3. ✅ Locale tracking added (en/zh/ua)
4. ⏳ Build donation status tracking UI
5. ⏳ Build project donation list component

### Short-term (This Week)
6. ⏳ Build donation tracking page (by email)
7. ⏳ Implement refund request functionality
8. ⏳ Email notifications with localization
9. ⏳ Update user terms for refunds
10. ⏳ Test complete refund workflow

### Medium-term (Next 2 Weeks)
11. ⏳ Write automated tests
12. ⏳ Optimize performance
13. ⏳ Add monitoring and analytics
14. ⏳ User acceptance testing
15. ⏳ Production deployment

### Long-term (Next Month+)
16. ⏳ Phase 2 features (recurring donations, updates timeline)
17. ⏳ Advanced analytics dashboard
18. ⏳ Mobile app planning
19. ⏳ API documentation

---

**Last Updated**: 2025-12-19
**Version**: 0.4.0
**Status**: Payment Gateway Migrated - WayForPay + Resend Integration Complete

**Recent Updates (v0.4.0):**
- ✅ Migrated from Stripe to WayForPay payment gateway
- ✅ Integrated Resend for email notifications
- ✅ Localized email templates for 3 languages
- ✅ Automated email confirmation on payment success
- ✅ Updated documentation with WayForPay and Resend setup
- ✅ Updated deployment guides and troubleshooting

**Key Achievements:**
- ✅ Internationalization with 3 languages (en/zh/ua)
- ✅ Donation flow complete end-to-end
- ✅ WayForPay integration with webhooks
- ✅ Resend email notifications with localization
- ✅ Modern donation ID format (project-based)
- ✅ Service role pattern for webhook security
- ✅ Comprehensive error handling
- ✅ Clean database migration structure

**Next Milestone**: Build refund workflow UI and admin dashboard
