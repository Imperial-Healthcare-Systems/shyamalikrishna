# Shyamali Krishna Automobile — Project Analysis

## 📋 Project Overview

**Shyamali Krishna Automobile Private Limited** is an authorized dealer and distributor of premium agricultural machinery based in Nawada, Bihar. The company serves as a multi-OEM portfolio dealer bringing together implements from leading manufacturers.

- **Company Address:** KH-56, PLTO-357, Kendua, Nawada, Bihar 805110, India
- **GST ID:** 10ABUCS4908F1ZA
- **Primary Phone:** +91 7488095803
- **Website:** https://www.shyamalikrishna.com/

---

## 🎨 Design Theme & Visual Identity

### Color Palette

The theme uses a sophisticated, earthy palette inspired by agriculture and craftsmanship:

| Color        | Purpose                          | Primary Shade | Usage                              |
|--------------|----------------------------------|---------------|------------------------------------|
| **Charcoal** | Primary/Dark backgrounds         | #1A1A1A       | Text, headers, CTAs                |
| **Ivory**    | Light backgrounds, text contrast | #FAF8F3       | Backgrounds, light text            |
| **Gold**     | Accent/Premium feel              | #B8860B       | Highlights, links, hover states   |
| **Field**    | Secondary green (agricultural)   | #2C5F2D       | Secondary CTAs, badges            |
| **Stone**    | Neutral gray text                | #6B6B6B       | Body text, secondary content      |
| **Bone**     | Subtle backgrounds               | #E8E4DB       | Cards, subtle separation          |

**Extended Color System:**
- Charcoal scale: 9 shades (50-900)
- Ivory scale: 4 shades
- Gold scale: 9 shades (50-900)
- Field scale: 9 shades (50-900)
- Stone scale: 9 shades (50-900)
- Bone scale: 4 shades
- Status colors: Success (#2E7D32), Warning (#E65100), Error (#C62828), Info (#1565C0)

### Typography

| Family         | Usage                    | Font Stack                                   |
|----------------|--------------------------|----------------------------------------------|
| **Serif**      | Headings, premium feel   | Playfair Display, Georgia, serif             |
| **Sans-serif** | Body, UI elements        | Inter, system-ui, sans-serif                 |
| **Hindi**      | Devanagari text          | Noto Sans Devanagari, sans-serif             |

### Design Components

- **Button Variants:** `btn-primary`, `btn-gold`, `btn-field`, `btn-outline`, `btn-ghost`
- **Input Styling:** Custom `.input-field` with gold focus state
- **Animations:** `fadeIn`, `scaleIn` keyframes (250ms default duration)
- **Layout:** Max-width container (1280px) with responsive padding
- **Focus States:** Gold outline with 2px width and 2px offset
- **Tap Interaction:** Transparent tap highlight (mobile-friendly)

---

## 🛠 Technology Stack

### Core Framework
- **Next.js 15.1.6** (App Router)
- **React 19.0.0** with React DOM
- **TypeScript 5.5.3**

### Styling & UI
- **Tailwind CSS 3.4.1** (utility-first CSS)
- **PostCSS 8.4.35** with Autoprefixer
- **Lucide React 0.446.0** (modern icon library)

### Backend & Database
- **Supabase 2.57.4** (PostgreSQL, Auth, Storage)
- Uses server-side data fetching with React `cache()` for deduplication
- Service-role client for admin API operations

### Build & Development
- **Node.js** environment
- npm package manager
- Vercel deployment configured in `vercel.json`

### Key Scripts
```bash
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm start            # Start production server
npm run typecheck    # TypeScript validation
npm run lint         # Next.js linting
npm run check-env    # Environment validation
```

---

## 🏗 Architecture

### Rendering Model

```
Route Segment (Server Component)
  ↓
src/lib/data.ts (Cached server fetches)
  ↓
Client View Component (with initial* props)
  ↓
useAsync hooks (skips mount fetch when seeded)
```

**Key Points:**
- Route segments are **server components** by default
- Database queries are cached using React's `cache()` function
- Results passed to client views as `initial*` props
- Client-side `useAsync` starts seeded, preventing double-fetch
- ISR (Incremental Static Regeneration): `revalidate = 300` (5 minutes)
- Static routes: `/about/leadership`, `/about/legacy`, `/resources`

### File Structure

```
src/
├── app/                      # Next.js App Router (file-based routing)
│   ├── globals.css          # Global styles (Tailwind + animations)
│   ├── layout.tsx           # Root layout
│   ├── providers.tsx        # Client providers (i18n, etc.)
│   ├── (public)/            # Public routes segment
│   │   ├── layout.tsx
│   │   ├── page.tsx         # Home page
│   │   ├── portfolio/       # Product browsing
│   │   ├── services/        # Service details
│   │   ├── partners/        # OEM partners
│   │   ├── careers/         # Job listings
│   │   ├── contact/         # Contact form
│   │   └── [other pages]/
│   ├── admin/               # Protected admin routes
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── applications/    # Job applications
│   │   ├── jobs/            # Job management
│   │   ├── categories/      # Product categories
│   │   ├── products/        # Product management
│   │   ├── partners/        # Partner management
│   │   ├── resources/       # Knowledge base
│   │   ├── services/        # Service management
│   │   ├── leads/           # Lead management
│   │   ├── settings/        # Site settings
│   │   └── login/
│   └── api/
│       └── admin/[...path]/ # Admin API endpoints
│
├── components/              # Reusable components
│   ├── forms/              # Form components
│   │   ├── CallbackForm.tsx
│   │   ├── EnquiryForm.tsx
│   │   ├── JobApplicationForm.tsx
│   │   └── ServiceEnquiryForm.tsx
│   ├── layout/             # Layout components
│   │   ├── Header.tsx      # Navigation + mega menu
│   │   ├── Footer.tsx
│   │   └── WhatsAppButton.tsx
│   ├── products/           # Product display
│   │   └── ProductCard.tsx
│   └── ui/                 # Shared UI components
│       ├── Breadcrumbs.tsx
│       ├── Modal.tsx
│       ├── Reveal.tsx     # Reveal/Animation component
│       ├── Section.tsx    # Section layout component
│       ├── States.tsx     # Loading/Empty states
│       └── Toast.tsx      # Notifications
│
├── lib/                    # Utilities & hooks
│   ├── data.ts            # Server-side data fetches (cached)
│   ├── hooks.ts           # Client hooks (useAsync wrapper)
│   ├── auth.tsx           # Authentication logic
│   ├── i18n.tsx           # Internationalization (English/Hindi)
│   ├── seo.ts             # SEO utilities & structured data
│   ├── supabase.ts        # Supabase client initialization
│   ├── types.ts           # TypeScript interfaces
│   ├── utils.ts           # Utility functions
│   └── settings.ts        # Settings management
│
└── views/                 # Page-level client components
    ├── admin/            # Admin UI views
    │   ├── AdminLayout.tsx
    │   ├── AdminDashboard.tsx
    │   ├── AdminJobs.tsx
    │   ├── AdminJobEditor.tsx
    │   ├── AdminApplications.tsx
    │   ├── AdminApplicationDetail.tsx
    │   ├── AdminCategories.tsx
    │   ├── AdminProducts.tsx
    │   ├── AdminProductEditor.tsx
    │   ├── AdminPartners.tsx
    │   ├── AdminResources.tsx
    │   ├── AdminLeads.tsx
    │   ├── AdminLeadDetail.tsx
    │   ├── AdminSettings.tsx
    │   ├── AdminLogin.tsx
    │   └── ProtectedRoute.tsx
    └── public/           # Public page views
        ├── HomePage.tsx
        ├── PortfolioPage.tsx
        ├── CategoryPage.tsx
        ├── ProductDetailPage.tsx
        ├── PartnersPage.tsx
        ├── PartnerDetailPage.tsx
        ├── ServicesPage.tsx
        ├── ServiceDetailPage.tsx
        ├── CareersPage.tsx
        ├── JobDetailPage.tsx
        ├── JobApplyPage.tsx
        ├── ResourcesPage.tsx
        ├── ResourceDetailPage.tsx
        ├── FaqsPage.tsx
        ├── AboutPage.tsx
        ├── LeadershipPage.tsx
        ├── LegacyPage.tsx
        ├── ContactPage.tsx
        ├── EnquirePage.tsx
        └── [more pages]
```

---

## 📦 Product Ecosystem

### Product Categories (6-Stage Farming Cycle)

Products are organized by farming operation stages, each with specific icons and metadata:

| Stage | Category | Icon | Purpose | Tractor HP | Typical Products |
|-------|----------|------|---------|-----------|------------------|
| 1 | **Tillage & Soil Preparation** | 🔧 Shovel | Soil working before planting | 20-60 HP | Rotavators, Cultivators, Ploughs |
| 2 | **Sowing & Seeding** | 🌱 Sprout | Precise seed placement | 20-40 HP | Seeders, Happy Seeders, Seed Drills |
| 3 | **Residue Management** | 🍂 Leaf | Crop stubble handling | 30-75 HP | Straw Reapers, Choppers, Balers |
| 4 | **Harvesting** | 🌾 Wheat | Crop collection | 30-100 HP | Combine Harvesters, Reapers |
| 5 | **Post-Harvest** | 📦 Package | Threshing & cleaning | 10-30 HP | Threshers, Winnowers, Cleaners |
| 6 | **Specialist Implements** | 🔨 Specialist | Special operations | Variable | Boom Sprayers, Trailers, etc. |

### Product Database Structure

Each product record contains:

**Basic Information:**
- `name` (English), `name_hi` (Hindi)
- `slug` (URL-friendly identifier)
- `positioning`, `overview`, `features`, `benefits`, `applications`
- Bilingual versions for all text fields

**Technical Specifications:**
- `crops` — Compatible crops
- `soil_conditions` — Soil suitability
- `operator_scale` — Farm size suitability
- `tractor_hp` — Required tractor horsepower
- `working_width` — Machine width
- `weight` — Machine weight
- `blade_tine_config` — Blade/tine configuration (for tillers)
- `gearbox_drive` — Drive type
- `rpm` — Rotations per minute

**Commercial Information:**
- `warranty` — Warranty terms
- `financing` (English/Hindi) — EMI options
- `subsidy` (English/Hindi) — Government subsidy eligibility
- `is_published` — Publication status
- `display_order` — Sorting order

**Media:**
- `primary_image_url` — Main product image
- `gallery_images` — Array of additional images

**Relations:**
- `category_id` → Product Category (foreign key)
- `partner_id` → OEM Partner (foreign key)
- `category?` — Populated category object
- `partner?` — Populated partner object

**SEO:**
- `seo_title`, `seo_description`

---

## 🤝 OEM Partners (Brands)

Authorized distributor for 5+ international and Indian manufacturers:

| Partner | Origin | Specialization | Remarks |
|---------|--------|-----------------|----------|
| **Maschio Gaspardo** | Italy | Premium rotavators, tillers, seeders | European engineering |
| **Sitara AgroTech** | India | Happy Seeders, residue management | Specialized in crop residue |
| **Govind** | India | Cultivators, seeders, threshers | Multi-implement maker |
| **Agrimax** | India | Rotavators, seeders | Affordable range |
| **Hazarix** | India | Harvesters, threshers | Harvesting specialists |

**Partner Record Structure:**
- `name`, `name_hi` (bilingual)
- `slug` (URL identifier)
- `tagline`, `positioning` — Marketing copy
- `overview`, `partnership_context` — Company description
- `why_partnership_matters` — Partnership rationale
- `origin_country` — Country of origin
- `logo_url`, `hero_image_url` — Brand assets
- `display_order` — Menu ordering
- SEO fields: `seo_title`, `seo_description`

---

## 🛠 Services Offered

Five core service categories supporting the full product lifecycle:

| Service | Icon | Description | Bilingual |
|---------|------|-------------|-----------|
| **Sales Consultation** | 🤝 Handshake | Product selection advice, soil assessment, tractor compatibility | Yes |
| **After-Sales Service** | 🔧 Wrench | Maintenance, repair, technician support | Yes |
| **Spare Parts** | 📦 Package | Genuine replacement parts inventory | Yes |
| **Finance & EMI** | 💰 Banknote | Financing options, payment plans | Yes |
| **Subsidy Assistance** | 🏛️ Landmark | Government scheme navigation, subsidy coordination | Yes |

Each service:
- Has a dedicated detail page
- Includes short and long descriptions (bilingual)
- Has icon mapping in frontend
- Contains "what_we_cover" detailed information
- Linked to image assets

---

## 📱 Key Pages & Features

### Public Pages

| Page | Route | Purpose | Key Content |
|------|-------|---------|-------------|
| Home | `/` | Hero, value proposition | Hero section, 6 categories, featured partners, why choose, featured products |
| Portfolio | `/portfolio` | Product browsing hub | All categories grid, product count per category |
| Category Detail | `/portfolio/[slug]` | Products by stage | Filtered products, category details, related categories |
| Product Detail | `/portfolio/[...slug]` | Product information | Specs, gallery, partner info, related products, enquiry form |
| Partners | `/partners` | Brand showcase | Partner grid, brand positioning |
| Partner Detail | `/partners/[slug]` | Brand details | Brand story, products by partner, contact |
| Services | `/services` | Service overview | Service cards grid |
| Service Detail | `/services/[slug]` | Service description | Full service details, related services |
| Careers | `/careers` | Job listings | Job grid, job count |
| Job Detail | `/careers/[slug]` | Job application | Job specs, application form |
| Resources | `/resources` | Knowledge base | Blog/guides by type (type: "guide", "article", "video") |
| Resource Detail | `/resources/[slug]` | Content page | Full article content, related resources |
| FAQs | `/faqs` | Frequently asked questions | FAQ grid by category |
| Contact | `/contact` | Contact form | Contact form, company info |
| Enquiry | `/enquire` | Product enquiry | Enquiry form (for products/services) |
| About | `/about` | Company story | Company overview, mission, values |
| Leadership | `/about/leadership` | Team | Leadership team |
| Legacy | `/about/legacy` | History | Company history |

### Admin Pages

| Page | Route | Purpose |
|------|-------|---------|
| Login | `/admin` | Admin authentication |
| Dashboard | `/admin/dashboard` | Analytics, overview |
| Jobs | `/admin/jobs` | Job listing & creation |
| Job Editor | `/admin/jobs/[id]` | Job editing |
| Applications | `/admin/applications` | Job applications management |
| Categories | `/admin/categories` | Product category CRUD |
| Products | `/admin/products` | Product inventory management |
| Product Editor | `/admin/products/[id]` | Product creation/editing |
| Partners | `/admin/partners` | Partner management |
| Resources | `/admin/resources` | Knowledge base management |
| Leads | `/admin/leads` | CRM: Lead management |
| Lead Detail | `/admin/leads/[id]` | Lead notes, follow-up |
| Settings | `/admin/settings` | Site configuration (phone, email, GST, etc.) |

---

## 📊 Data Models & Database

### Core Entities

```typescript
// Categories (6-stage farming cycle)
Category {
  id: string
  name: string
  name_hi: string | null
  slug: string
  description: string | null
  short_description: string | null
  icon: string | null
  image_url: string | null
  display_order: number
  seo_title: string | null
  seo_description: string | null
}

// Products (machinery inventory)
Product {
  id: string
  name: string
  name_hi: string | null
  slug: string
  category_id: string | null        → Category
  partner_id: string | null         → Partner
  positioning: string
  overview: string
  features: string
  benefits: string
  applications: string
  
  // Technical specs
  crops: string
  soil_conditions: string
  operator_scale: string
  tractor_hp: string
  working_width: string
  weight: string
  blade_tine_config: string
  gearbox_drive: string
  rpm: string
  
  // Commercial
  warranty: string
  financing: string
  subsidy: string
  
  // Media
  primary_image_url: string
  gallery_images: string[]
  
  is_published: boolean
  display_order: number
  seo_title: string | null
  seo_description: string | null
}

// OEM Partners
Partner {
  id: string
  name: string
  name_hi: string | null
  slug: string
  tagline: string | null
  positioning: string | null
  overview: string | null
  partnership_context: string | null
  why_partnership_matters: string | null
  origin_country: string | null
  logo_url: string | null
  hero_image_url: string | null
  display_order: number
  seo_title: string | null
  seo_description: string | null
}

// Services
Service {
  id: string
  name: string
  name_hi: string | null
  slug: string
  short_description: string | null
  overview: string | null
  what_we_cover: string | null
  icon: string | null
  image_url: string | null
  display_order: number
  seo_title: string | null
  seo_description: string | null
}

// Resources (blog/knowledge base)
Resource {
  id: string
  title: string
  title_hi: string | null
  slug: string
  type: string              // "guide", "article", "video", etc.
  excerpt: string | null
  content: string | null
  is_published: boolean
  display_order: number
  seo_title: string | null
  seo_description: string | null
}

// FAQs
Faq {
  id: string
  question: string
  question_hi: string | null
  answer: string
  answer_hi: string | null
  category: string | null
  display_order: number
}

// Jobs
Job {
  id: string
  title: string
  title_hi: string | null
  slug: string
  department: string | null
  location: string | null
  employment_type: string | null
  experience: string | null
  summary: string | null
  responsibilities: string | null
  requirements: string | null
  preferred_qualifications: string | null
  what_we_offer: string | null
  application_deadline: string | null
  status: string            // "published", "draft", "closed"
  published_at: string | null
  seo_title: string | null
  seo_description: string | null
}

// Leads (CRM)
Lead {
  id: string
  lead_type: string         // "callback", "enquiry", "application"
  name: string
  phone: string
  whatsapp: string | null
  email: string | null
  district_village: string | null
  enquiry_type: string | null
  message: string | null
  product_id: string | null
  product_name: string | null
  category_name: string | null
  service_type: string | null
  tractor_hp: string | null
  preferred_callback_time: string | null
  source_page: string       // Which page submitted the form
  language: string          // "en" or "hi"
  status: string            // "new", "contacted", "qualified", "closed"
  priority: string          // "high", "medium", "low"
  assigned_to: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

// Job Applications
JobApplication {
  id: string
  job_id: string | null
  job_slug: string | null
  full_name: string
  email: string
  phone: string
  current_location: string | null
  highest_qualification: string | null
  years_of_experience: string | null
  resume_url: string | null
  cover_letter: string | null
}

// Site Settings
SiteSettings {
  [key: string]: string     // Key-value store (phone, email, GST, etc.)
}
```

---

## 🌐 Internationalization (i18n)

**Bilingual Support:** English (en) + Hindi (hi)

- Toggle via language switcher in header
- URL-agnostic (no `/en/` or `/hi/` prefixes in current setup)
- Text fields have `_hi` variants in database
- `useLang()` hook provides `t()` translation function
- Structured data (JSON-LD) uses English by default for SEO

### i18n Translation Pattern
```typescript
{t('English Text', 'हिंदी पाठ')}
```

---

## 📞 Lead Capture & CRM

### Form Types

1. **Callback Form** — Request a callback (header CTA)
2. **Enquiry Form** — General product/service inquiry
3. **Service Enquiry Form** — Service-specific inquiry
4. **Job Application Form** — Job application submission

### Lead Data Capture

Forms track:
- Lead source page (URL path)
- Language preference (en/hi)
- Product/Category/Service details
- Farmer context (tractor HP, district, farm size)
- Contact preferences (phone, WhatsApp, email)
- Auto-assignment to team members

### Lead Status Workflow
`new` → `contacted` → `qualified` → `closed`

---

## 🔐 Admin & Authentication

### Admin Access
- **Route:** `/admin`
- **Auth:** `ADMIN_PASSWORD` environment variable
- **API:** `/api/admin/[...path]`
- **Database Client:** Supabase service role (server-side only)

### Admin Features
- Job & job application management
- Product & category editor
- Lead/CRM management with notes
- Resource (blog/guide) management
- Service management
- Site settings configuration
- Partner management

### Protected Routes
- Uses `ProtectedRoute.tsx` wrapper
- Redirects unauthenticated users to `/admin` login
- Session stored in browser (logic in `lib/auth.tsx`)

---

## 🚀 Deployment & Performance

### Vercel Deployment
- Framework preset: Next.js
- Root directory: `shyamali-next` (if repo root is parent)
- Build command: `npm run build` (default)
- Output directory: **leave blank** (Vercel uses `.next`)
- Environment variables: `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`

### Content Freshness Strategy
- **ISR (Incremental Static Regeneration):** `revalidate = 300` (5 minutes)
  - All database-driven routes auto-revalidate every 5 minutes
  - Admin edits appear on live site within 5 minutes
  - **No redeploy required for content changes**
  
- **Fully Static Routes:** No revalidation
  - `/about/leadership`
  - `/about/legacy`
  - `/resources` (guides)

- **Redeploy Required For:**
  - Code changes
  - Layout changes
  - Committed asset changes

### Environment Variables

| Variable | Exposed | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Browser | Public Supabase endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Browser | Public Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ Server only | Admin API operations |
| `ADMIN_PASSWORD` | ❌ Server only | Admin panel authentication |

**Note:** The last two must be filled in `.env.local` before admin features work. Returns 503 if unset.

### Caching Strategy
- React `cache()` function deduplicates database queries within single request
- Page and its `generateMetadata` share one query
- `useAsync` hook starts seeded with `initial*` props, preventing double-fetch on mount

---

## 🎯 Core Value Propositions (Homepage)

The site emphasizes four key differentiators:

1. **Authorized Multi-OEM Portfolio**
   - Choice of brands (not single-brand locked-in)
   - Italian + Indian machinery
   - Specialist implement makers

2. **Genuine Parts & Service**
   - Technicians familiar with implements
   - Stock of genuine wear components
   - Regional support with national standards

3. **Subsidy & Finance Assistance**
   - Government scheme navigation
   - EMI options
   - Subsidy coordination

4. **Regional Presence, National Standards**
   - Based in Nawada, Bihar
   - Serves wider region
   - Professional like national dealers

---

## 📊 SEO & Structured Data

### Homepage SEO
- **Title:** "Shyamali Krishna Automobile | Premium Agricultural Machinery Dealer, Bihar"
- **Description:** Multi-brand dealer of Maschio Gaspardo, Sitara AgroTech, Govind, Agrimax, Hazarix
- **Canonical:** https://www.shyamalikrishna.com/

### Structured Data (JSON-LD)
- **Organization schema:** Company details, GST, address, contact
- **WebSite schema:** Site search action
- **CollectionPage schema:** For portfolio, category pages
- **Product schema:** Individual machinery with specs

### SEO Fields in Every Entity
- `seo_title` — Meta title (overrides default)
- `seo_description` — Meta description
- `slug` — URL-friendly identifier

---

## 🎨 Visual Design Highlights

### Hero Sections
- Background images with gradient overlay
- Large serif headings (Playfair Display)
- Gold accents and CTAs
- Responsive typography

### Product Cards
- Primary image + gallery
- Product name, category, partner
- Key specs highlighted
- "Quick Enquiry" CTA
- Hover animations

### Category Cards (6-Stage Grid)
- Icon per category
- Stage number
- Description excerpt
- Product count
- Hover state with gold background

### Service Cards
- Icon (with color change on hover)
- Name, description
- "Learn more" link
- Consistent grid layout

### Forms
- Accessible input styling
- Gold focus state
- Clear labels
- Error/success states
- Mobile-responsive

---

## 💡 Key Insights

1. **B2B Focus:** Products aimed at farmers, custom-hire operators, institutional buyers
2. **Regional Gateway:** Base in Nawada, Bihar serves agricultural heartland
3. **Integrated Support:** From selection → purchase → parts → service → subsidy
4. **Multi-Language:** English + Hindi for broader farmer accessibility
5. **Managed Content:** Most product/partner/service data lives in Supabase, editable via admin panel
6. **Fast Content Updates:** ISR strategy allows live content changes without redeploy
7. **SEO-Optimized:** Structure data for machinery, local SEO focus
8. **Lead-Driven:** Forms capture farmer contact info for CRM follow-up
9. **Premium Positioning:** Gold color, serif typography, Italian brands emphasize quality
10. **Machinery Specs:** Extensive technical fields (HP, width, weight, tractor compat) for farmer decision-making

---

## 📝 Summary Table

| Aspect | Details |
|--------|---------|
| **Project Type** | B2B Agricultural Machinery E-Commerce / Dealer Portal |
| **Framework** | Next.js 15 (App Router) + React 19 + TypeScript |
| **Styling** | Tailwind CSS with custom color palette & animations |
| **Backend** | Supabase (PostgreSQL) + Next.js API Routes |
| **Deployment** | Vercel with ISR (revalidate every 5 minutes) |
| **Languages** | English + Hindi (bilingual UI & content) |
| **Pages** | 20+ public pages + 12+ admin pages |
| **Products** | 6 categories × N products × 5 OEM brands |
| **Services** | 5 service categories (sales, service, parts, finance, subsidy) |
| **Lead Capture** | 4 form types (callback, enquiry, service, job application) |
| **Admin Features** | Jobs, leads, products, categories, resources, settings CMS |
| **Hero Feature** | Multi-OEM portfolio + integrated after-sales support |
| **Target Audience** | Farmers, custom-hire operators, institutional buyers in Bihar |

---

*Analysis generated for Shyamali Krishna Automobile Next.js Project*
