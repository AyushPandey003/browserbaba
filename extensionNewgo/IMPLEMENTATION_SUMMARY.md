# Extension User Authentication & Database Integration

## Overview
The BrowseBaba extension now includes user authentication and database persistence for memories. Each user's memories are uniquely identified and saved to the database.

## Key Features Implemented

### 1. User Authentication Flow
- **Auth Manager** (`auth.js`): Centralized authentication management
  - Verifies user session with Next.js backend
  - Persists user info in extension storage
  - Provides auth state to popup and background scripts

### 2. Session Verification API
- **Endpoint**: `GET /api/auth/session`
- Returns current user information if authenticated
- Used by extension to verify and retrieve user ID

### 3. Memory Persistence
- **Database**: PostgreSQL with Drizzle ORM
- **Schema**: Added `user_id` column to `memories` table
- **User-specific storage**: Memories are filtered by `user_id`

### 4. Extension Context Handling
- Handles "Extension context invalidated" errors gracefully
- Uses message passing to background script for storage operations
- Prevents crashes when extension is reloaded

### 5. URL Validation
- Blocks saving of browser internal pages (chrome://, edge://, about:)
- Provides clear error messages to users

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Popup     │◄────────┤  Background  │────────►│  Next.js    │
│  (popup.js) │         │(background.js)│         │   API       │
└─────────────┘         └──────────────┘         └─────────────┘
       │                       │                         │
       │                       │                         │
       ▼                       ▼                         ▼
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Auth UI    │         │ Auth Manager │         │  Database   │
│             │         │  (auth.js)   │         │(PostgreSQL) │
└─────────────┘         └──────────────┘         └─────────────┘
       │                                                 │
       │                                                 │
       ▼                                                 ▼
┌─────────────┐                                  ┌─────────────┐
│  Content    │                                  │  User-      │
│ (content.js)│                                  │  specific   │
└─────────────┘                                  │  Memories   │
                                                 └─────────────┘
```

## File Changes

### New Files
1. **`extensionNewgo/auth.js`**: Authentication manager singleton
2. **`browserbaba/app/api/auth/session/route.ts`**: Session verification endpoint
3. **`browserbaba/migrations/0001_add_user_id_to_memories.sql`**: Database migration

### Modified Files
1. **`extensionNewgo/popup.js`**: Added auth UI and user verification
2. **`extensionNewgo/popup.html`**: Added auth UI components
3. **`extensionNewgo/popup.css`**: Styled auth components
4. **`extensionNewgo/background.js`**: Added auth integration and storage message handlers
5. **`extensionNewgo/content.js`**: Updated to use message passing and auth checks
6. **`extensionNewgo/manifest.json`**: Added ES module support
7. **`browserbaba/lib/db/schema.ts`**: Added `userId` field to memories table
8. **`browserbaba/lib/actions/memory-actions.ts`**: Updated to filter by userId
9. **`browserbaba/app/api/capture/route.ts`**: Made user_id required

## Usage Instructions

### For Users
1. **First Time Setup**:
   - Click the extension icon
   - Click "Sign in to BrowseBaba"
   - Sign in on the website
   - Click "Verify Session" in the extension

2. **Saving Memories**:
   - Navigate to any webpage
   - Click the extension icon
   - Click "Save This Page"
   - Memory is saved to your account

3. **Context Menu**:
   - Right-click on selected text → "Save to Memories"
   - Right-click on page → "Save Page to Memories"

### For Developers

#### Database Migration
Run the migration to add user_id column:
```bash
cd browserbaba
pnpm drizzle-kit push
```

#### API Endpoints

**Session Verification**:
```typescript
GET /api/auth/session
Response: {
  authenticated: boolean,
  user: {
    id: string,
    email: string,
    name: string,
    image: string
  }
}
```

**Save Memory**:
```typescript
POST /api/capture
Body: {
  title: string,
  type: 'article' | 'product' | 'video' | 'todo' | 'note',
  url: string,
  content: string,
  user_id: string, // Required
  metadata: object,
  source: 'extension'
}
```

**Get Memories**:
```typescript
GET /api/capture?user_id={userId}
Response: {
  success: true,
  memories: Memory[],
  count: number
}
```

## Error Handling

### Extension Context Invalidation
- **Problem**: Extension reloads invalidate content script context
- **Solution**: Message passing through background script + graceful error handling
- **User Experience**: Shows "Extension was updated. Please refresh the page."

### Authentication Errors
- **Problem**: User not logged in
- **Solution**: Show auth UI in popup, redirect to login page
- **User Experience**: Clear prompts to sign in

### Storage Errors
- **Problem**: Direct chrome.storage calls fail after reload
- **Solution**: All storage operations go through background script
- **User Experience**: No crashes, operations continue working

## Security Considerations

1. **Session Cookies**: Uses httpOnly cookies for auth (set by Next.js)
2. **User ID Verification**: Server validates user_id matches session
3. **CORS**: Properly configured between extension and API
4. **No Tokens in Extension**: Relies on browser's cookie handling

## Known Limitations

1. **Offline Mode**: Local storage only, no offline sync yet
2. **Page Refresh Required**: After extension updates, pages need refresh
3. **Browser Internal Pages**: Cannot capture chrome://, edge://, etc.

## Future Enhancements

1. **Sync Service**: Background sync between local and server storage
2. **Conflict Resolution**: Handle conflicts when saving same memory offline/online
3. **Batch Operations**: Bulk save/delete operations
4. **Memory Sharing**: Share memories between users
5. **Tags & Collections**: Better organization features

## Testing Checklist

- [ ] Sign in flow works
- [ ] Session verification succeeds
- [ ] Save page to database
- [ ] View user-specific memories
- [ ] Context menu saves work
- [ ] Extension reload handling
- [ ] Multiple users have separate memories
- [ ] Sign out clears user data
- [ ] Error messages are user-friendly
