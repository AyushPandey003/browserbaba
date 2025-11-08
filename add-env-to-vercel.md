# Add Environment Variables to Vercel

## Option 1: Using Vercel Dashboard (Recommended)
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable from your .env.local file
5. Redeploy your application

## Option 2: Using Vercel CLI
```bash
vercel env add GOOGLE_GEMINI_API_KEY
# Paste your API key when prompted
# Select all environments (production, preview, development)

# Repeat for other variables:
vercel env add DATABASE_URL
vercel env add MONGODB_URI
vercel env add BETTER_AUTH_SECRET
vercel env add BETTER_AUTH_URL
vercel env add NEXT_PUBLIC_APP_URL
vercel env add JWT_SECRET
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
```

## After adding environment variables:
Trigger a new deployment by pushing a commit or manually redeploy from Vercel dashboard.

## ⚠️ Security Note:
- Never commit .env.local to git
- Use different API keys for production and development
- Rotate keys regularly
