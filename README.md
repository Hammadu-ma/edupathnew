# Bloom Learning — University Learning Platform

A premium, editorial-style digital learning platform built for university students. Features course management, resource libraries, past examination archives, interactive quizzes, bookmarking, and a full administration console.

## Features

### Student Experience
- **Editorial Home Feed** — Personalized learning dashboard with continue-learning actions, course overview, and activity tracking
- **My Studies** — Searchable course catalogue with grid/list views and filtering
- **Course Detail** — Rich course pages with overview, resources, exams, and practice quizzes
- **Resource Library** — Browse PDFs, videos, notes, textbooks, guides, and external links
- **Past Examinations** — Searchable exam archive with filters for course, year, and type
- **Interactive Quiz Engine** — Multiple-choice questions with scoring, flagging, review, and explanations
- **Bookmarks** — Save and organize courses, resources, and exams
- **Profile & Settings** — Manage personal info, academic details, theme preferences, and security

### Administration Console
- **Dashboard** — Content overview with statistics and recent activity
- **Course Management** — Create, edit, publish courses with full metadata
- **Resource Management** — Upload and organize learning resources
- **Examination Management** — Manage exams and digitized question banks
- **Platform Settings** — Configure universities, programs, and system settings

### Design System
- **Editorial typography** — DM Serif Display for headings, Inter for body text
- **Sophisticated palette** — Deep midnight blue, electric lilac accent, cool neutrals
- **Light & Dark themes** — Carefully designed with CSS custom properties
- **Responsive** — Mobile-first with dedicated navigation patterns
- **Accessible** — Keyboard navigation, focus states, semantic HTML, ARIA attributes

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS v4** for styling
- **React Router v6** for navigation
- **Lucide React** for icons
- **Framer Motion** for animations (available)
- **Supabase** client configured (ready for backend integration)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck
```

### Environment Variables

For Supabase integration, create a `.env` file:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Project Structure

```
src/
├── App.tsx                    # Main app with routing
├── main.tsx                   # Entry point
├── index.css                  # Design tokens & global styles
├── types/
│   └── index.ts              # TypeScript type definitions
├── data/
│   └── mockData.ts           # Demo data (replace with Supabase queries)
├── contexts/
│   └── AppContext.tsx         # Global state (auth, theme, bookmarks)
├── components/
│   ├── ui/
│   │   └── Primitives.tsx    # Reusable UI components
│   └── layout/
│       └── Navigation.tsx    # Student & Admin navigation
└── pages/
    ├── Auth.tsx              # Sign in, sign up, onboarding
    ├── Home.tsx              # Student home feed
    ├── Studies.tsx           # My Studies + Course Detail
    ├── Resources.tsx         # Resource library
    ├── Exams.tsx             # Past exams + Quiz engine
    ├── Bookmarks.tsx         # Saved items
    ├── Profile.tsx           # Profile & settings
    └── Admin.tsx             # Admin console pages
```

## Design Decisions

### Editorial Learning Studio
The design uses an editorial, magazine-inspired approach that puts learning content at the center:
- Large, expressive typography for page titles
- Asymmetric compositions where appropriate
- Course covers with distinctive color identities
- Clear separation between navigation, content, and metadata
- Different layouts for different tasks (not one-size-fits-all)

### Color Palette
- **Midnight Blue** (#0f1729) — Anchoring color for depth and authority
- **Electric Lilac** (#8b5cf6) — Primary accent for interactive elements
- **Cool Neutrals** — Backgrounds and surfaces that don't compete with content
- **Status Colors** — Emerald for success, amber for warnings, coral for alerts

### Navigation Architecture
- **Student**: Slim sidebar (desktop) / Drawer (mobile) with clear section hierarchy
- **Admin**: Denser sidebar with operational focus and management tools
- **Quiz**: Distraction-free, focused interface for concentration

## Database Schema (for Supabase integration)

When connecting to Supabase, the following tables are expected:
- `profiles` — User profiles with academic details
- `universities` — Institution records
- `programs` — Academic programs/departments
- `study_years` — Year levels within programs
- `semesters` — Optional semester divisions
- `courses` — Course catalogue with metadata
- `learning_resources` — Uploadable resources
- `past_exams` — Examination records
- `quiz_questions` — Digitized questions with options
- `user_bookmarks` — Saved items
- `learning_progress` — Activity tracking

## Security Notes

- Role-based access control (student vs admin)
- Protected routes with authentication checks
- No client-side privilege escalation
- Bookmarks and progress persisted per user
- Admin-only routes restricted to admin role

## Demo Access

The application includes demo login buttons:
- **Student Demo** — Access the full student experience
- **Admin Demo** — Access the administration console

## Deployment

```bash
npm run build
# Serve the dist/ directory with any static file host
```

## License

Built for educational purposes.
