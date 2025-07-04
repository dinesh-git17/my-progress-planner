# Progress Planner

Progress Planner is a small PWA that helps you log meals and celebrate progress.
It is built with **Next.js** and **TypeScript** and stores data in **Supabase**.
OpenAI is used to generate motivational summaries for each meal and day.
Push notifications remind you when it's time to record your meals.

## Features

- Log breakfast, lunch and dinner with a friendly interface.
- GPT powered summaries and encouraging quotes.
- Calendar view with daily streak tracking.
- Works offline and installs like an app thanks to service worker support.
- Optional push notifications using Web Push and scheduled cron routes.
- Admin portal to review meal logs, summaries and app stats.

## Getting started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Create `.env.local`** with the variables listed below.
3. **Run the dev server**
   ```bash
   npm run dev
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

### Environment variables

At minimum you need your Supabase credentials and an OpenAI key:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
PUSH_CONTACT_EMAIL=you@example.com
ADMIN_PASSWORD=changeme
CRON_SECRET=supersecret
```

These settings enable database access, GPT summaries and push notifications.

## Building for production

Run `npm run build` followed by `npm start` to serve the optimized build.
Scheduled push reminders use the cron configuration in `vercel.json`.

## License

This project is provided as-is without a specific license.
