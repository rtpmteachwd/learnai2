# LearnAI - AI-Powered LMS for SPED Students

An inclusive Learning Management System designed for Special Education (SPED) students of **Dumaguete City National High School**, featuring AI-powered assistive technologies.

## Features

### 🎓 Core LMS Features
- **Course Management** - Create and manage courses with lessons, quizzes, and assignments
- **Student Progress Tracking** - Monitor learning progress with detailed analytics
- **Quiz System** - Multiple choice, true/false, and essay questions
- **Assignment Submission** - Submit work with text and file uploads

### ♿ Accessibility Features
- **Text-to-Speech (TTS)** - Browser-based, no API needed
- **Speech-to-Text (ASR)** - Voice input for answers (Chrome/Edge)
- **Sign Language Recognition** - Filipino Sign Language (FSL) support via MediaPipe
- **Adjustable Font Sizes** - Small to Extra Large
- **High Contrast Mode** - Enhanced visibility
- **Keyboard Navigation** - Full keyboard support
- **Screen Reader Support** - Optimized for screen readers

### 🤖 AI Features (for Learning Disability Students)
- **AI Tutor Chatbot** - Patient, encouraging AI learning buddy
- **Content Simplifier** - Three levels of simplification
- **Social Story Generator** - Create personalized social stories
- **Encouragement System** - Personalized motivational messages
- **AI Insights (Teachers)** - Student performance analysis

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS |
| **UI Components** | shadcn/ui, Lucide Icons |
| **State Management** | Zustand, TanStack Query |
| **Database** | Prisma ORM with SQLite/PostgreSQL |
| **AI** | Groq API (LLM), Browser APIs (TTS/ASR), MediaPipe (Sign Language) |

## Quick Start

### Prerequisites
- Node.js 18+ or Bun
- npm or bun package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/learnai.git
cd learnai

# Install dependencies
npm install

# Setup database
npx prisma db push

# (Optional) Seed test data
npx prisma db seed

# Create .env file
cp .env.example .env
# Add your AI API keys to .env

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with:

```env
# Database (SQLite for development)
DATABASE_URL=file:./db/development.db

# AI Configuration (for AI features)
AI_BASE_URL=https://api.groq.com/openai/v1
AI_API_KEY=gsk_your_groq_api_key
AI_MODEL=llama-3.3-70b-versatile
```

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for free hosting options.

### Quick Deploy Options

| Platform | Free Tier | Setup Time |
|----------|-----------|------------|
| Render | 750 hrs/month | ~10 min |
| Railway | $5 credits/month | ~15 min |
| Vercel + Neon | Generous | ~20 min |

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Student | student@test.com | password123 |
| Teacher | teacher@test.com | password123 |
| Admin | admin@test.com | password123 |

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API Routes
│   ├── page.tsx        # Main page
│   └── layout.tsx      # Root layout
├── components/
│   ├── ui/             # shadcn/ui components
│   ├── assistance/     # Accessibility & AI components
│   ├── dashboard/      # Dashboard components
│   └── auth/           # Authentication components
├── lib/
│   ├── store.ts        # Zustand store
│   ├── db.ts           # Prisma client
│   └── utils.ts        # Utilities
└── hooks/              # Custom React hooks
```

## User Roles

| Role | Access |
|------|--------|
| **Student** | View courses, take quizzes, submit assignments, use AI assistance |
| **Teacher** | Create courses, lessons, quizzes, grade assignments, view analytics |
| **Admin** | Manage users, system settings, view reports |

## Disability Types Supported

- Visual Impairment
- Hearing Impairment
- Speech Impairment
- Learning Disability (AI features enabled)
- Physical Disability
- Multiple Disabilities

## Contributing

This is a thesis project. For questions or collaboration, please contact the author.

## License

MIT License - See LICENSE file for details.

---

Built with ❤️ for SPED students of Dumaguete City National High School
