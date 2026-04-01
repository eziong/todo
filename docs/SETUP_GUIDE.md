# Setup Guide

External service configuration that cannot be automated. Follow these steps after deploying the code.

---

## 1. Supabase Project

### 1.1 Environment Variables

Create `web/.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000

SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Get values from: **Supabase Dashboard > Settings > API**

### 1.2 Run Database Migration

Go to **Supabase Dashboard > SQL Editor** and run:

```
docs/migrations/001_missing_tables_and_storage.sql
```

This creates:
- `notifications` table (4 indexes + RLS)
- `sns_accounts` table (2 indexes + RLS)
- `sns_reminders` table (3 indexes + RLS)
- `assets` storage bucket (public, with upload/read RLS policies)

### 1.3 Verify Migration

Run in SQL Editor:

```sql
-- Should return 24 tables
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Should return 'assets' bucket
SELECT id, name, public FROM storage.buckets WHERE id = 'assets';
```

---

## 2. Google Cloud Console

### 2.1 Create Project & Enable APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the following APIs:
   - **YouTube Data API v3**
   - **YouTube Analytics API**
   - **Google Drive API**

### 2.2 OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Select **External** user type
3. Fill in app info (name, email, etc.)
4. Add scopes:
   - `https://www.googleapis.com/auth/youtube`
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/yt-analytics.readonly`
5. Add test users during development

### 2.3 OAuth Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Application type: **Web application**
4. Authorized redirect URIs:
   - `http://localhost:3000/api/google/callback` (development)
   - `https://YOUR_DOMAIN/api/google/callback` (production)
5. Copy the **Client ID** and **Client Secret**

Add to `web/.env.local`:

```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_client_secret
```

---

## 3. Supabase Auth (Google Provider)

1. Go to **Supabase Dashboard > Authentication > Providers**
2. Enable **Google** provider
3. Paste your Google Client ID and Client Secret
4. Set Redirect URL to: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

---

## 4. Webhooks

### 4.1 Generate Secrets

```bash
# Generate random secrets for each webhook
openssl rand -hex 32  # YOUTUBE_WEBHOOK_SECRET
openssl rand -hex 32  # GITHUB_WEBHOOK_SECRET
openssl rand -hex 32  # BUILD_WEBHOOK_SECRET
```

Add to `web/.env.local`:

```env
YOUTUBE_WEBHOOK_SECRET=your_generated_secret
GITHUB_WEBHOOK_SECRET=your_generated_secret
BUILD_WEBHOOK_SECRET=your_generated_secret
```

### 4.2 GitHub Webhook

1. Go to your GitHub repository > **Settings > Webhooks**
2. Payload URL: `https://YOUR_DOMAIN/api/webhooks/github?user_id=YOUR_USER_UUID`
3. Content type: `application/json`
4. Secret: same as `GITHUB_WEBHOOK_SECRET`
5. Events: Select **Pushes**, **Pull requests**, **Issues**

### 4.3 YouTube Push Notifications

YouTube uses [PubSubHubbub](https://pubsubhubbub.appspot.com/) for push notifications. The webhook endpoint is:

```
POST https://YOUR_DOMAIN/api/webhooks/youtube
```

Configure via YouTube API subscription or a third-party PubSubHubbub hub.

### 4.4 Build Webhooks

Configure your CI/CD platform (Vercel, GitHub Actions, etc.) to POST to:

```
POST https://YOUR_DOMAIN/api/webhooks/builds
Header: x-webhook-secret: YOUR_BUILD_WEBHOOK_SECRET
Body: { "user_id": "...", "type": "...", "title": "...", "body": "..." }
```

---

## 5. Deployment (Vercel)

### 5.1 Environment Variables

Add all env vars from `web/.env.local` to **Vercel > Project > Settings > Environment Variables**.

### 5.2 Domain

1. Add custom domain in **Vercel > Project > Settings > Domains**
2. Update `NEXT_PUBLIC_APP_URL` to production URL
3. Update Google OAuth redirect URIs to production URL

---

## Environment Variables Summary

| Variable | Required | Source |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_APP_URL` | Yes | Your deployment URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase Dashboard > Settings > API |
| `GOOGLE_CLIENT_ID` | Yes | Google Cloud Console > Credentials |
| `GOOGLE_CLIENT_SECRET` | Yes | Google Cloud Console > Credentials |
| `YOUTUBE_WEBHOOK_SECRET` | Optional | Self-generated (`openssl rand -hex 32`) |
| `GITHUB_WEBHOOK_SECRET` | Optional | Self-generated (`openssl rand -hex 32`) |
| `BUILD_WEBHOOK_SECRET` | Optional | Self-generated (`openssl rand -hex 32`) |
