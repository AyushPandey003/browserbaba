# Authentication Implementation

## Overview
This application uses [Better Auth](https://www.better-auth.com/) for authentication with both email/password and social authentication (Google, GitHub).

## Protected Routes
The following routes are protected and require authentication:
- `/dashboard`
- `/collections`
- `/tags`
- `/settings`
- `/search`

## Middleware Protection
The `middleware.ts` file at the root level implements route protection:
- Checks for valid sessions before allowing access to protected routes
- Redirects unauthenticated users to `/login` with a `from` query parameter
- Redirects authenticated users away from `/login` to `/dashboard`

## Sign Out Functionality
Sign out buttons are implemented in two locations:
1. **Sidebar** - For dashboard navigation (left sidebar)
2. **Navbar** - For pages using the top navigation

Both components:
- Use the `signOut()` function from `@/lib/auth-client`
- Show loading state during sign out
- Redirect to `/login` after successful sign out
- Handle errors gracefully

## Login Page Features
- Toggle between Sign In and Sign Up modes
- Email/password authentication
- Social authentication (Google, GitHub)
- Password visibility toggle
- Remember me checkbox (Sign In only)
- Guest access option
- Proper redirect handling (respects `from` query parameter)

## Server-Side Authentication
Each protected page includes server-side authentication checks:
```typescript
const session = await auth.api.getSession({
  headers: await headers(),
});

if (!session) {
  redirect('/login?from=/current-route');
}
```

This provides double protection:
1. Middleware blocks at the route level
2. Server components verify authentication before rendering

## Environment Variables Required
```env
# Better Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Database
DATABASE_URL=your-database-url
```

## Session Management
- Sessions expire after 7 days
- Session updates occur every 24 hours
- Secure cookies in production
- Cookie prefix: `synapse`

## Usage Example

### Client Component
```typescript
'use client';

import { useSession, signOut } from '@/lib/auth-client';

export function MyComponent() {
  const { data: session } = useSession();
  
  if (!session) return <div>Not authenticated</div>;
  
  return (
    <div>
      <p>Welcome, {session.user.name}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

### Server Component
```typescript
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function MyPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login?from=/my-page');
  }

  return <div>Welcome, {session.user.name}</div>;
}
```

## Testing Authentication
1. Start the development server: `pnpm dev`
2. Navigate to `/dashboard` - should redirect to `/login`
3. Sign up or sign in with credentials or social auth
4. After authentication, should redirect back to `/dashboard`
5. Click "Sign Out" to end the session
6. Should redirect to `/login` page
