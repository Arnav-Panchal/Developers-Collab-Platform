# DevConnect 🚀

**AI-Powered Developer Collaboration Platform**

DevConnect helps developers find the right collaborators, analyze skills with AI, and build amazing projects together. Powered by Groq AI for intelligent matching and insights.

## 🌟 Features

- 🔐 GitHub OAuth Login & Profile Sync
- 🧠 Groq AI skill analysis, developer summaries, and teammate suggestions
- 🤝 Project collaboration & team management
- 📊 GitHub project analysis and tech stack extraction
- 💬 Real-time chat for project groups (Socket.IO)
- 🔎 AI-powered project & collaborator recommendations
- 🔔 In-app notification system

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** MongoDB Atlas + Mongoose
- **Auth:** Auth.js (NextAuth v5) — GitHub OAuth
- **AI:** Groq SDK (LLaMA 3.3)
- **State:** Zustand
- **Validation:** Zod
- **Real-time:** Socket.IO
- **Hosting:** Vercel

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- GitHub OAuth App
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Setup

```bash
# Clone the repo
git clone https://github.com/Arnav-Panchal/Developers-Collab-Platform.git
cd Developers-Collab-Platform

# Install dependencies
npm install

# Copy environment template and fill in values
cp .env.example .env.local

# Run database migration (creates collections & indexes)
npm run db:migrate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/               # API route handlers
│   ├── dashboard/         # User dashboard
│   ├── discover/          # Project discovery
│   ├── notifications/     # Notifications
│   ├── projects/          # Project pages
│   └── sign-in/           # Authentication
├── components/            # React components
│   └── layout/            # Layout components (header, footer)
├── lib/                   # Core libraries
│   ├── db/                # Database connection & models
│   │   ├── models/        # Mongoose models
│   │   └── migrate.ts     # Migration script
│   ├── auth.ts            # Auth.js configuration
│   ├── groq.ts            # Groq AI client
│   ├── stores.ts          # Zustand state stores
│   ├── utils.ts           # Shared utilities
│   └── validations.ts     # Zod schemas
└── types/                 # TypeScript declarations
```

## 📄 License

ISC
