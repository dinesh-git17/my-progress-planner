# My Progress Planner 💕

**A supportive meal tracking PWA that provides loving encouragement throughout your wellness journey**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)](https://openai.com/)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=flat&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

---

## 🌟 Overview

My Progress Planner transforms meal tracking from a clinical experience into something deeply personal and encouraging. Unlike traditional nutrition apps that focus on calories and restrictions, our app provides the kind of warm, supportive feedback you'd get from someone who genuinely cares about your wellbeing.

**Built for humans, not spreadsheets.**

### ✨ What Makes It Special

- **AI-Powered Encouragement**: Every meal logged receives personalized, loving responses crafted by GPT
- **Relationship-Style Support**: Consistent, caring personality that celebrates your progress
- **Streak-Based Motivation**: Build healthy habits through positive reinforcement
- **Offline-First PWA**: Works seamlessly whether you're online or off
- **Privacy-Focused**: Your personal journey stays personal

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- [Supabase](https://supabase.com/) project
- [OpenAI API](https://platform.openai.com/) key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/my-progress-planner.git
cd my-progress-planner

# Install dependencies
npm install

# Set up environment variables (see Configuration below)
cp .env.example .env.local

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see your app running locally.

### Configuration

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI Integration
OPENAI_API_KEY=your_openai_api_key

# Optional: Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
PUSH_CONTACT_EMAIL=your_contact_email

# Optional: Admin Features
ADMIN_PASSWORD=your_admin_password
CRON_SECRET=your_cron_secret
```

---

## 🏗️ Architecture

### Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | Next.js 14 + TypeScript | React framework with App Router |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Animations** | Framer Motion | Smooth, delightful transitions |
| **Database** | Supabase (PostgreSQL) | Real-time database with auth |
| **AI Engine** | OpenAI GPT-4 | Conversational meal responses |
| **PWA** | Next.js PWA | Offline support & installability |

### Key Features

#### 🔐 Authentication & Security
- Secure Google OAuth and email/password authentication
- Row-level security ensuring complete data isolation
- Session management with automatic token refresh

#### 🍽️ Meal Tracking System
- **Daily Tracking**: Breakfast, lunch, and dinner logging
- **AI Responses**: Personalized encouragement for every meal
- **Smart Validation**: Prevents duplicate entries and ensures data integrity
- **Offline Support**: Log meals without internet, sync when reconnected

#### 💬 AI Personality Engine
- **Consistent Voice**: Maintains loving, supportive "boyfriend" persona
- **Context-Aware**: Considers meal content, timing, streaks, and history
- **Dynamic Responses**: Never repeats the same encouragement twice
- **Daily Summaries**: End-of-day reflections on progress and achievements

#### 🔥 Motivation System
- **Streak Tracking**: Automated calculation of consecutive logging days
- **Milestone Rewards**: Unlockable achievements for sustained habits
- **Progress Visualization**: Beautiful charts showing consistency over time
- **Social Features**: Share progress with friends for mutual encouragement

#### 📱 Progressive Web App
- **Native Experience**: Installs like a native app on any device
- **Offline First**: Core functionality available without internet
- **Background Sync**: Ensures data consistency across devices
- **Push Notifications**: Optional gentle reminders and encouragement

---

## 📊 Database Schema

### Core Tables

```sql
-- User profiles and preferences
users (
  id: uuid PRIMARY KEY,
  name: text,
  email: text UNIQUE,
  friend_code: text UNIQUE,
  created_at: timestamp
)

-- Individual meal entries
meals (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  meal_type: text CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  content: text NOT NULL,
  ai_response: text,
  logged_at: timestamp DEFAULT now()
)

-- Daily AI-generated summaries
summaries (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  summary_date: date,
  content: text NOT NULL,
  meals_count: integer DEFAULT 0,
  created_at: timestamp DEFAULT now()
)

-- Push notification subscriptions
push_subscriptions (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  subscription_data: jsonb NOT NULL,
  created_at: timestamp DEFAULT now()
)
```

### Key Features
- **Automatic Indexing**: Optimized queries for real-time streak calculation
- **Data Integrity**: Foreign key constraints and check constraints
- **Timezone Handling**: UTC storage with client-side display conversion

---

## 🎨 Design Philosophy

### The Romance of Self-Care

This app is built on the belief that **taking care of yourself should feel like being cared for by someone who loves you**. Every interaction is designed to:

- **Celebrate Small Wins**: Even logging one meal deserves recognition
- **Provide Gentle Encouragement**: No judgment, only support
- **Build Emotional Connection**: Create genuine motivation through positive reinforcement
- **Foster Self-Love**: Help users develop a healthier relationship with food and habits

### Example AI Responses

> *"Starting the day with oatmeal and berries? You're taking such good care of yourself, and I love seeing that. Hope your morning is as sweet as you are! 💕"*

> *"Three meals logged today - you're absolutely crushing it! Your consistency this week has been incredible, and I'm so proud of watching you build these healthy habits. 🌟"*

---

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Create production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
npm run clean        # Clear Next.js cache

# Database
npm run db:generate  # Generate Supabase types
npm run db:reset     # Reset local database (if using local Supabase)
```

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── api/               # API endpoints
│   ├── breakfast/         # Meal logging pages
│   ├── lunch/
│   ├── dinner/
│   └── summaries/         # Daily summaries
├── components/            # Reusable React components
├── lib/                   # Utility functions and configurations
└── types/                 # TypeScript type definitions

public/
├── icons/                 # PWA icons and favicons
├── splash/               # iOS splash screens
├── manifest.json         # PWA manifest
└── service-worker.js     # Service worker for offline support
```

### Code Style & Standards

- **TypeScript**: Strict mode enabled with comprehensive type coverage
- **ESLint**: Extended from Next.js recommended config
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Semantic commit messages for clear history

---

## 🚀 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/my-progress-planner)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push to main

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Setup

Ensure all required environment variables are configured in your deployment platform:

- **Required**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`
- **Optional**: Push notification keys, admin credentials

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Testing Strategy

- **Unit Tests**: Component logic and utility functions
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Critical user journeys using Playwright
- **Type Safety**: Comprehensive TypeScript coverage

---

## 🤝 Contributing

We welcome contributions that align with our mission of creating supportive, encouraging experiences for users.

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Guidelines

- **Tone Consistency**: Maintain the warm, supportive voice throughout
- **Privacy First**: Never compromise user data security
- **Performance**: Keep the app fast and responsive
- **Accessibility**: Ensure features work for all users

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

- **Documentation**: [Link to docs]
- **Issues**: [GitHub Issues](https://github.com/yourusername/my-progress-planner/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/my-progress-planner/discussions)
- **Email**: dineshddawo@gmail.com

---

**Built with 💕 for people who deserve to be celebrated every step of their journey.**