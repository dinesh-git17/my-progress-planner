# Sweethearty 🍽️

A loving, supportive meal tracking PWA that acts like your caring boyfriend, providing encouragement and motivation throughout your wellness journey. Built with modern web technologies to create an intimate, personal experience that celebrates every meal and milestone.

## The Story Behind the App 💕

This isn't just another meal tracking app. Sweethearty was designed with love, specifically to provide the kind of warm, supportive feedback you'd get from someone who genuinely cares about your wellbeing. Every interaction is crafted to feel personal, encouraging, and celebratory—because every healthy choice deserves recognition.

## How It Works 🌟

### Authentication & Onboarding
- **Welcome Experience**: Beautiful onboarding flow that introduces users to their supportive companion
- **Google OAuth**: Seamless sign-in with Google or email/password
- **Profile Setup**: Users can set their name for personalized interactions
- **Data Recovery**: Legacy users can recover their meal history using their old user ID

### Main Dashboard (`/`)
The heart of the app where users see their daily progress:
- **Meal Status Cards**: Visual indicators for breakfast, lunch, and dinner (logged/not logged)
- **Supportive Messaging**: Encouraging text that changes based on progress
- **Streak Counter**: Displays current logging streak with celebratory animations
- **Daily Summary**: AI-generated summary of the day's meals and achievements
- **Quick Actions**: Easy access to log meals or view calendar

### Meal Logging (`/breakfast`, `/lunch`, `/dinner`)
Each meal gets its own dedicated, beautiful interface:
- **Conversational Input**: Natural text area where users describe what they ate
- **AI-Powered Responses**: GPT generates loving, boyfriend-like responses to each meal
- **Contextual Encouragement**: Responses vary based on meal content, time of day, and user history
- **Visual Feedback**: Smooth animations and transitions that celebrate the logging action
- **Smart Suggestions**: Gentle nudges for balanced nutrition without being preachy

### Calendar View (`/calendar`)
A comprehensive view of the user's journey:
- **Monthly Grid**: Clean calendar layout showing meal logging patterns
- **Streak Visualization**: Visual representation of consistent logging streaks
- **Day Details**: Click any day to see what meals were logged
- **Progress Patterns**: Helps users identify their most successful periods
- **Motivational Insights**: Celebrates milestones and long streaks

### Daily Summaries (`/summaries`)
Where the magic of AI encouragement lives:
- **Personalized Summaries**: Daily AI-generated summaries that feel like loving check-ins
- **Scroll Through History**: Browse past summaries to see progress over time
- **Emotional Support**: Each summary focuses on positive reinforcement and gentle guidance
- **Achievement Recognition**: Highlights particularly good days or positive patterns
- **Future Encouragement**: Motivational messages for upcoming days

### Profile & Settings (`/profile`)
Personal space for account management:
- **Profile Information**: Update name and personal details
- **Notification Settings**: Control push notification preferences
- **Data Management**: View account statistics and logging history
- **Authentication Options**: Sign out or manage account security
- **App Information**: Version details and helpful links

### Data Recovery (`/recover`)
Thoughtful migration tool for returning users:
- **Legacy Data Import**: Users can recover meal logs from before authentication was added
- **Seamless Transition**: Merges old data with new authenticated account
- **Progress Preservation**: Maintains streaks and historical summaries
- **One-Time Process**: Simple, guided recovery that works reliably

## The AI Personality 🤖💝

The app's AI responds like a loving, supportive boyfriend who:
- **Celebrates every win**, no matter how small
- **Provides gentle encouragement** without judgment
- **Remembers your journey** and references past successes
- **Offers practical support** while staying emotionally warm
- **Adapts to your patterns** and provides personalized motivation

Example responses:
- *"I'm so proud of you for that nutritious breakfast! Starting the day with oatmeal and berries shows how much you care about yourself. You've got this, beautiful! 💕"*
- *"Three meals logged today - you're absolutely crushing it! I love seeing you take care of yourself like this. Your consistency this week has been incredible! 🌟"*

## Technical Architecture 🛠️

### Frontend Stack
- **Next.js 14**: App Router with React Server Components
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first styling with custom animations
- **Framer Motion**: Smooth, delightful animations and transitions
- **PWA Features**: Service worker, offline support, installable

### Backend & Database
- **Supabase**: PostgreSQL database with real-time subscriptions
- **Row Level Security**: User data is completely isolated and secure
- **Authentication**: Google OAuth and email/password via Supabase Auth
- **API Routes**: Custom Next.js API endpoints for business logic

### AI Integration
- **OpenAI GPT**: Powers all conversational responses and summaries
- **Context-Aware**: AI considers meal content, timing, streaks, and user history
- **Personality Consistency**: Carefully crafted prompts maintain the loving boyfriend persona
- **Smart Caching**: Efficient API usage with response caching

### Progressive Web App
- **Offline First**: Core functionality works without internet
- **Background Sync**: Meal logs sync when connectivity returns
- **Push Notifications**: Optional reminders and encouragement
- **App-Like Experience**: Installs on home screen, full-screen mode

## Database Schema 📊

### Core Tables
- **`users`**: Profile information and settings
- **`meals`**: Individual meal entries with timestamps
- **`summaries`**: Daily AI-generated summaries and insights
- **`push_subscriptions`**: Web push notification endpoints

### Key Features
- **Automatic Streaks**: Calculated in real-time based on meal logging patterns
- **Daily Rollover**: Smart handling of timezone and date boundaries
- **Data Integrity**: Constraints ensure consistent meal logging rules

## Setup & Development 🚀

### Environment Variables
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
```

### Development Commands
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check
```

## Design Philosophy 💭

This app is built on the principle that **positive reinforcement works better than criticism**. Every interaction is designed to:

1. **Celebrate Progress**: Even logging one meal is worth celebrating
2. **Build Habits**: Consistent encouragement creates lasting change
3. **Personal Connection**: Feel like talking to someone who truly cares
4. **Remove Shame**: No guilt, no judgment, only support
5. **Focus on Feelings**: How you feel matters more than perfect nutrition

## Future Enhancements 🌈

- **Photo Uploads**: Visual meal logging with AI recognition
- **Nutrition Insights**: Gentle guidance without calorie counting obsession
- **Social Features**: Share achievements with trusted friends
- **Mood Tracking**: Connect emotional wellbeing with eating patterns
- **Recipe Suggestions**: Personalized meal ideas based on preferences
- **Voice Logging**: Speak your meals instead of typing

---

*Built with love for someone special. Every meal matters, every day counts, and every user deserves encouragement on their wellness journey.* 💕