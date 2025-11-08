# 🧠 BrowseBaba - Your Second Brain

<div align="center">

![BrowseBaba Banner](https://img.shields.io/badge/Your%20Second%20Brain-Powered%20by%20AI-blue?style=for-the-badge)

**A powerful, AI-powered knowledge management system that helps you capture, organize, and retrieve information effortlessly using semantic search and intelligent embeddings.**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Vector_Search-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-316192?style=flat-square&logo=postgresql)](https://neon.tech/)
[![Better Auth](https://img.shields.io/badge/Auth-Better_Auth-orange?style=flat-square)](https://www.better-auth.com/)

[Features](#-features) • [Architecture](#-architecture) • [Authentication](#-authentication-system) • [Vector Search](#-mongodb-vector-search) • [Getting Started](#-getting-started)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-features)
- [System Architecture](#-architecture)
- [Authentication System](#-authentication-system)
- [MongoDB Vector Search](#-mongodb-vector-search)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Browser Extension](#-browser-extension)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🌟 Overview

**BrowseBaba** is an intelligent "second brain" application that revolutionizes how you capture, organize, and retrieve information from the web. Built with cutting-edge AI technology and powered by MongoDB vector search, it provides:

- **� Secure Authentication**: Multi-provider auth with Better Auth (Email, Google, GitHub)
- **🔍 Semantic Search**: AI-powered contextual search using MongoDB Atlas Vector Search
- **📝 Effortless Capture**: Browser extension for one-click content saving with context preservation
- **🤖 AI-Powered Embeddings**: Google Gemini text-embedding-004 model (768 dimensions)
- **🎨 Beautiful UI**: Modern, responsive interface with Framer Motion animations
- **⚡ Hybrid Search**: Combined semantic + keyword search for best results
- **🔗 User Isolation**: Secure multi-tenant architecture with user-specific data
- **🚀 Real-time Sync**: Instant updates across all devices

---

## ✨ Features

### 🎯 Core Capabilities

#### **1. Multi-Type Content Capture**
Save diverse content types with specialized handling:
- 📰 **Articles**: Web pages, blog posts, documentation with full context
- 🎥 **Videos**: YouTube, Vimeo with precise timestamp support
- 📝 **Notes**: Personal thoughts and ideas with rich formatting
- 🔖 **Bookmarks**: Quick saves with metadata extraction
- 📄 **Pages**: Full webpage capture with selected text and context

#### **2. Advanced Search System**

```mermaid
graph TB
    A[User Search Query] --> B{Search Strategy}
    B -->|Semantic| C[Generate Query Embedding]
    B -->|Keyword| D[Text-based Search]
    B -->|Hybrid| E[Combined Approach]
    
    C --> F[MongoDB Vector Search]
    D --> G[PostgreSQL Full-Text]
    E --> F
    E --> G
    
    F --> H[Cosine Similarity]
    G --> I[ILIKE Matching]
    
    H --> J[Merge & Rank Results]
    I --> J
    
    J --> K[Filter by User]
    K --> L[Sorted by Relevance]
    L --> M[Return Results]
    
    style C fill:#4CAF50
    style F fill:#FF9800
    style H fill:#2196F3
    style K fill:#9C27B0
```

**Search Features:**
- 🧠 **Semantic Understanding**: Find content by meaning, not just keywords
- 🔤 **Keyword Matching**: Fast traditional text-based search
- 🎯 **Hybrid Mode**: Best of both worlds with intelligent ranking
- 👤 **User Isolation**: See only your own memories
- 📊 **Relevance Scoring**: Results ranked by similarity score (0-1)
- 🏷️ **Tag Filtering**: Filter by custom tags
- 📅 **Date Filtering**: Time-based content retrieval

#### **3. Browser Extension Features**

```mermaid
sequenceDiagram
    participant U as User
    participant E as Extension
    participant C as Content Script
    participant B as Background Worker
    participant API as Backend API
    participant PG as PostgreSQL
    participant MG as MongoDB
    
    U->>E: Select Text & Click Save
    E->>C: Extract Page Context
    C->>C: Get Selection + Surrounding Text
    C->>B: Send Capture Request
    
    B->>API: POST /api/capture
    Note over API: Authenticate Session
    
    API->>API: Generate Embedding
    Note over API: Google Gemini<br/>text-embedding-004<br/>(768 dimensions)
    
    par Store in PostgreSQL
        API->>PG: Save Memory Metadata
        PG-->>API: Memory ID
    and Store in MongoDB
        API->>MG: Save Embedding Vector
        MG-->>API: Indexed
    end
    
    API-->>B: Success Response
    B-->>E: Show Confirmation
    E-->>U: ✓ Saved Successfully
```

**Extension Capabilities:**
- **Context-Aware Capture**: Saves selection with before/after context
- **Video Timestamp Support**: Bookmark exact moments in videos
- **XPath Tracking**: Preserves element location for future reference
- **Offline Queue**: Saves locally when offline, syncs when online
- **Keyboard Shortcuts**: `Ctrl+Shift+S` (Windows) / `Cmd+Shift+S` (Mac)
- **Right-Click Menu**: Context menu integration
- **Platform Detection**: Auto-detects YouTube, Vimeo, and other video platforms

#### **4. AI-Powered Intelligence**
- **🎯 768-Dimensional Embeddings**: Using Google's text-embedding-004 model
- **🔍 Vector Similarity**: Cosine similarity for semantic matching
- **🏷️ Smart Tagging**: Manual and auto-suggested tags
- **📊 Context Preservation**: Saves surrounding text for better understanding
- **🔗 Content Linking**: Discover related saved items
- **⚡ Real-time Indexing**: Immediate search availability after saving

---

## 🏗️ Architecture

### System Overview

```mermaid
graph TB
    subgraph "Client Layer"
        A[Next.js Web App<br/>React 19 + TypeScript]
        B[Browser Extension<br/>Manifest V3]
    end
    
    subgraph "API Layer"
        C[Next.js API Routes<br/>App Router]
        D[Authentication Middleware<br/>Better Auth]
    end
    
    subgraph "AI/ML Layer"
        E[Google Gemini API<br/>text-embedding-004]
        F[Embedding Service<br/>768 dimensions]
    end
    
    subgraph "Data Layer"
        G[(PostgreSQL - Neon<br/>Metadata Storage)]
        H[(MongoDB Atlas<br/>Vector Storage)]
        I[Drizzle ORM]
    end
    
    subgraph "Search Infrastructure"
        J[MongoDB Vector Index<br/>Cosine Similarity]
        K[Hybrid Search Engine<br/>Semantic + Keyword]
    end
    
    A --> C
    B --> C
    C --> D
    D --> C
    
    C --> E
    E --> F
    F --> H
    
    C --> I
    I --> G
    
    H --> J
    J --> K
    G --> K
    K --> C
    
    style A fill:#2196F3
    style C fill:#4CAF50
    style E fill:#FF9800
    style G fill:#9C27B0
    style H fill:#00BCD4
    style K fill:#F44336
```

### Data Flow Architecture

```mermaid
flowchart TD
    Start([User Creates Memory]) --> Auth{Authenticated?}
    
    Auth -->|No| Login[Redirect to Login]
    Auth -->|Yes| Capture[Capture Content]
    
    Capture --> Extract[Extract Metadata]
    Extract --> Process{Processing Pipeline}
    
    Process --> Embed[Generate Embedding]
    Process --> Clean[Clean & Validate]
    Process --> Parse[Parse Tags & URLs]
    
    Embed --> Gemini[Google Gemini API]
    Gemini --> Vector[768-D Vector]
    
    Vector --> StoreMongo[(MongoDB)]
    Clean --> StorePost[(PostgreSQL)]
    Parse --> StorePost
    
    StoreMongo --> Index[Vector Index]
    StorePost --> Complete[Save Complete]
    Index --> Complete
    
    Complete --> Search{User Searches}
    
    Search -->|Semantic| VectorSearch[MongoDB Vector Search]
    Search -->|Keyword| TextSearch[PostgreSQL ILIKE]
    Search -->|Hybrid| Both[Combined Search]
    
    VectorSearch --> Cosine[Cosine Similarity]
    Cosine --> Merge[Merge Results]
    TextSearch --> Merge
    Both --> Merge
    
    Merge --> Filter[Filter by userId]
    Filter --> Rank[Rank by Relevance]
    Rank --> Display[Display Results]
    
    style Auth fill:#FF9800
    style Gemini fill:#4CAF50
    style StoreMongo fill:#00BCD4
    style StorePost fill:#9C27B0
    style Filter fill:#F44336
```

---

## 🔐 Authentication System

### Better Auth Implementation

BrowseBaba uses **[Better Auth](https://www.better-auth.com/)** for a robust, secure authentication system with multiple providers and session management.

```mermaid
graph TB
    subgraph "Authentication Flow"
        A[User Access] --> B{Route Type}
        
        B -->|Protected| C[Middleware Check]
        B -->|Public| D[Allow Access]
        B -->|Auth Page| E[Check Session]
        
        C --> F{Has Session?}
        F -->|Yes| G[Server Component Verify]
        F -->|No| H[Redirect to Login]
        
        E --> I{Already Logged In?}
        I -->|Yes| J[Redirect to Dashboard]
        I -->|No| K[Show Login Page]
        
        G --> L{Session Valid?}
        L -->|Yes| M[Render Protected Page]
        L -->|No| H
        
        K --> N{Login Method}
        N -->|Email/Password| O[Credential Auth]
        N -->|Google| P[OAuth Flow]
        N -->|GitHub| Q[OAuth Flow]
        
        O --> R[Create Session]
        P --> R
        Q --> R
        
        R --> S[Set Secure Cookie]
        S --> T[Store in DB]
        T --> J
    end
    
    style C fill:#FF9800
    style F fill:#F44336
    style R fill:#4CAF50
    style S fill:#2196F3
    style T fill:#9C27B0
```

### Authentication Features

#### **1. Multi-Provider Support**
- 📧 **Email/Password**: Traditional authentication with secure password hashing
- 🔵 **Google OAuth**: Sign in with Google account
- ⚫ **GitHub OAuth**: Sign in with GitHub account
- 👤 **Guest Access**: Optional guest mode for testing

#### **2. Protected Routes**
Routes requiring authentication:
- `/dashboard` - Main dashboard
- `/collections` - Collection views
- `/tags` - Tag management
- `/settings` - User settings
- `/search` - Search interface

#### **3. Session Management**
```typescript
// Session Configuration
{
  expiresIn: 60 * 60 * 24 * 7,  // 7 days
  updateAge: 60 * 60 * 24,       // Update every 24 hours
  useSecureCookies: true,         // Production only
  cookiePrefix: "synapse"
}
```

#### **4. Middleware Protection**

```mermaid
sequenceDiagram
    participant User
    participant Middleware
    participant Auth
    participant Database
    participant Page
    
    User->>Middleware: Request Protected Route
    Middleware->>Auth: Check Session
    Auth->>Database: Verify Token
    
    alt Valid Session
        Database-->>Auth: Session Found
        Auth-->>Middleware: User Data
        Middleware->>Page: Server Component Check
        Page->>Auth: Verify Again
        Auth-->>Page: Confirmed
        Page-->>User: Render Page
    else Invalid/Expired
        Database-->>Auth: No Session
        Auth-->>Middleware: Unauthorized
        Middleware-->>User: Redirect to /login?from=...
    end
    
    alt Login Page Access
        User->>Middleware: Access /login
        Middleware->>Auth: Check Session
        
        alt Already Logged In
            Auth-->>Middleware: Valid Session
            Middleware-->>User: Redirect to /dashboard
        else Not Logged In
            Auth-->>Middleware: No Session
            Middleware->>User: Show Login Page
        end
    end
```

#### **5. Double Protection Strategy**

```mermaid
graph LR
    A[User Request] --> B[Layer 1: Middleware]
    B --> C{Session Valid?}
    C -->|No| D[Redirect to Login]
    C -->|Yes| E[Layer 2: Server Component]
    E --> F{Re-verify Session}
    F -->|No| D
    F -->|Yes| G[Render Protected Content]
    
    style B fill:#FF9800
    style E fill:#F44336
    style G fill:#4CAF50
```

**Security Layers:**
1. **Middleware**: Route-level protection, blocks unauthorized access
2. **Server Components**: Page-level verification, ensures valid session before rendering

### Authentication API Usage

#### Client-Side Hook
```typescript
'use client';
import { useSession, signOut } from '@/lib/auth-client';

export function MyComponent() {
  const { data: session, isPending } = useSession();
  
  if (isPending) return <div>Loading...</div>;
  if (!session) return <div>Not authenticated</div>;
  
  return (
    <div>
      <p>Welcome, {session.user.name}!</p>
      <button onClick={() => signOut()}>
        Sign Out
      </button>
    </div>
  );
}
```

#### Server-Side Verification
```typescript
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login?from=/protected-page');
  }

  return <div>Protected Content for {session.user.name}</div>;
}
```

### Environment Variables for Auth

```env
# Better Auth Configuration
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

---

## 🔍 MongoDB Vector Search

### Vector Search Architecture

BrowseBaba uses **MongoDB Atlas Vector Search** for semantic search capabilities, enabling users to find content based on meaning rather than exact keyword matches.

```mermaid
graph TB
    subgraph "Content Ingestion Pipeline"
        A[New Memory Created] --> B[Extract Text Content]
        B --> C[Clean & Prepare Text]
        C --> D[Google Gemini API]
        D --> E[Generate 768-D Embedding]
        
        E --> F{Dual Storage}
        F -->|Metadata| G[(PostgreSQL)]
        F -->|Vector| H[(MongoDB Atlas)]
        
        G --> I[Memory Details<br/>Title, URL, Tags, etc.]
        H --> J[Embedding Vector<br/>userId + memoryId]
    end
    
    subgraph "Vector Search Pipeline"
        K[User Query] --> L[Generate Query Embedding]
        L --> M[MongoDB Vector Search]
        M --> N[$vectorSearch Aggregation]
        
        N --> O[Cosine Similarity Calculation]
        O --> P[Filter by userId]
        P --> Q[Sort by Score DESC]
        Q --> R[Return Top Results]
        
        R --> S[Fetch Full Details]
        S --> G
        G --> T[Enriched Results]
    end
    
    style D fill:#4CAF50
    style H fill:#00BCD4
    style M fill:#FF9800
    style O fill:#2196F3
    style P fill:#F44336
```

### Vector Search Implementation Details

#### **1. Embedding Generation**

```mermaid
flowchart LR
    A[Text Input] --> B[Truncate to 10k chars]
    B --> C[Clean Whitespace]
    C --> D[Google Gemini<br/>text-embedding-004]
    D --> E[768-D Vector Output]
    E --> F[Normalize if needed]
    F --> G[Store in MongoDB]
    
    style D fill:#4CAF50
    style E fill:#FF9800
```

**Model Specifications:**
- **Model**: `text-embedding-004`
- **Dimensions**: 768
- **Max Input**: ~10,000 characters
- **Similarity**: Cosine similarity
- **Use Case**: Optimized for retrieval and semantic search

#### **2. MongoDB Vector Index Configuration**

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "userId"
    }
  ]
}
```

**Index Properties:**
- **Index Name**: `vector_index`
- **Database**: `semanticbrowser`
- **Collection**: `browserbaba`
- **Similarity Metric**: Cosine (optimal for normalized embeddings)
- **User Filtering**: Ensures data isolation per user

#### **3. Vector Search Query Flow**

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Gemini
    participant MongoDB
    participant PostgreSQL
    
    Client->>API: Search Query + userId
    Note over API: /api/search/semantic?q=...
    
    API->>API: Validate Session
    API->>Gemini: Generate Query Embedding
    Gemini-->>API: 768-D Vector
    
    API->>MongoDB: $vectorSearch Aggregation
    Note over MongoDB: {<br/>  index: "vector_index",<br/>  path: "embedding",<br/>  queryVector: [...],<br/>  numCandidates: 100,<br/>  limit: 20,<br/>  filter: { userId: "..." }<br/>}
    
    MongoDB-->>API: Sorted Results with Scores
    Note over API: [<br/>  { memoryId, score: 0.95 },<br/>  { memoryId, score: 0.87 },<br/>  ...<br/>]
    
    API->>PostgreSQL: Fetch Memory Details
    Note over PostgreSQL: WHERE id IN (memoryIds)<br/>AND userId = ...
    
    PostgreSQL-->>API: Full Memory Objects
    API->>API: Merge Scores with Data
    API-->>Client: Ranked Search Results
```

#### **4. Hybrid Search Strategy**

```mermaid
graph TB
    A[User Query] --> B{Hybrid Search}
    
    B --> C[Semantic Branch]
    B --> D[Keyword Branch]
    
    C --> E[Generate Embedding]
    E --> F[MongoDB Vector Search]
    F --> G[Get Top 20 Results]
    G --> H[Score: 0.0 - 1.0]
    
    D --> I[PostgreSQL Full-Text]
    I --> J[ILIKE on Title/Content]
    J --> K[Match Results]
    
    H --> L{Merge Strategy}
    K --> L
    
    L --> M[Deduplicate by ID]
    M --> N[Combine Scores]
    N --> O[Sort by Final Score]
    O --> P[Filter by userId]
    P --> Q[Return Top 20]
    
    style F fill:#00BCD4
    style I fill:#9C27B0
    style L fill:#FF9800
    style P fill:#F44336
```

**Hybrid Search Benefits:**
- ✅ Catches exact keyword matches (keyword search)
- ✅ Finds semantically similar content (vector search)
- ✅ Handles typos and synonyms (vector search)
- ✅ Fast performance for common terms (keyword search)
- ✅ Intelligent ranking based on combined scores

### Vector Search Data Model

#### MongoDB Document Structure
```typescript
interface MemoryVector {
  _id: ObjectId;
  memoryId: string;      // References PostgreSQL memory.id
  userId: string;        // For multi-tenant filtering
  title: string;         // For display in results
  content: string;       // Searchable text content
  url?: string;          // Source URL
  tags: string[];        // Array of tags
  embedding: number[];   // 768-D vector from Gemini
  createdAt: Date;
  updatedAt: Date;
}
```

#### PostgreSQL Memory Schema
```typescript
{
  id: uuid,              // Primary key
  userId: uuid,          // Foreign key to users
  url: string,
  title: string,
  contentType: string,   // 'page', 'video', 'note', etc.
  content: text,
  selectedText: text,
  contextBefore: text,   // Text before selection
  contextAfter: text,    // Text after selection
  tags: string,          // Comma-separated
  notes: text,
  createdAt: timestamp,
  updatedAt: timestamp,
  // Video-specific fields
  videoPlatform: string,
  videoTimestamp: bigint,
  thumbnailUrl: string,
  // ... more fields
}
```

### Vector Search Performance

```mermaid
graph LR
    A[Query Performance] --> B[Embedding Generation<br/>~100-200ms]
    A --> C[Vector Search<br/>~50-100ms]
    A --> D[PostgreSQL Fetch<br/>~20-50ms]
    A --> E[Total Response<br/>~200-400ms]
    
    style B fill:#4CAF50
    style C fill:#00BCD4
    style D fill:#9C27B0
    style E fill:#FF9800
```

**Optimization Strategies:**
- ⚡ **Cached Embeddings**: Reuse embeddings for repeated queries
- 🎯 **Smart Limits**: `numCandidates: 100, limit: 20` for optimal speed/accuracy
- 📊 **User Filtering**: Index on userId for fast multi-tenant filtering
- 🔄 **Connection Pooling**: Reuse MongoDB connections
- 💾 **Batch Processing**: Generate embeddings for multiple memories in parallel

### Setting Up Vector Search

#### Step 1: MongoDB Atlas Setup
1. Create MongoDB Atlas account (free tier supported)
2. Create cluster and database `semanticbrowser`
3. Create collection `browserbaba`

#### Step 2: Create Vector Search Index
In MongoDB Atlas Search UI:
```json
{
  "name": "vector_index",
  "type": "vectorSearch",
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "userId"
    }
  ]
}
```

#### Step 3: Environment Variables
```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/

# Google Gemini for Embeddings
GEMINI_API_KEY=your-gemini-api-key
```

#### Step 4: Generate Embeddings for Existing Data
```bash
pnpm generate-embeddings
```

This script will:
- Fetch all memories from PostgreSQL
- Generate embeddings for each memory
- Store vectors in MongoDB
- Create vector search index entries

---
    
    Index --> Rank[Ranking Algorithm]
    Rank --> Results[Display Results]
    
    style Process fill:#2b8cee
    style AI fill:#f56c6c
    style Store fill:#67c23a
    style Results fill:#e6a23c
```

### Component Architecture

```mermaid
graph TB
    subgraph "Frontend - Next.js 15"
        A1[App Router]
        A2[Server Components]
        A3[Client Components]
        A4[API Routes]
        
        A1 --> A2
        A1 --> A3
        A1 --> A4
    end
    
    subgraph "State Management"
        B1[React Hooks]
        B2[Server Actions]
        B3[Client State]
    end
    
    subgraph "UI Layer"
        C1[Tailwind CSS]
        C2[Framer Motion]
        C3[Lucide Icons]
        C4[Masonry Grid]
    end
    
    subgraph "Data Layer"
        D1[Drizzle ORM]
        D2[PostgreSQL Schema]
        D3[Migrations]
    end
    
    subgraph "AI Integration"
        E1[Google Gemini API]
        E2[LangChain]
        E3[Vector Store]
        E4[Embeddings Generator]
    end
    
    A3 --> B1
    A2 --> B2
    B1 --> C1
    B2 --> D1
    D1 --> D2
    E1 --> E2
    E2 --> E3
    E2 --> E4
    
    style A1 fill:#2b8cee
    style E1 fill:#f56c6c
    style D1 fill:#67c23a
```

---

## 🛠️ Technology Stack

### Frontend Stack

```mermaid
mindmap
  root((Frontend))
    Framework
      Next.js 15.5
      React 19.1
      TypeScript 5
      App Router
    Styling
      Tailwind CSS 4
      Framer Motion 12
      Custom CSS
      Responsive Design
    UI Components
      Lucide React Icons
      Masonry Grid Layout
      Modal System
      Search Components
    State Management
      React Hooks
      Server Actions
      Client State
      Session Context
```

### Backend Stack

```mermaid
mindmap
  root((Backend))
    API Layer
      Next.js API Routes
      RESTful Endpoints
      CORS Support
    Databases
      PostgreSQL Neon
      MongoDB Atlas
      Drizzle ORM
      Vector Storage
    AI/ML
      Google Gemini
      text-embedding-004
      768-D Embeddings
      LangChain
    Authentication
      Better Auth
      Multi-Provider
      Session Management
      Secure Cookies
    Search
      MongoDB Vector Search
      PostgreSQL Full-Text
      Hybrid Search
      Cosine Similarity
```

### Complete Technology Matrix

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Frontend Framework** | Next.js | 15.5.6 | React framework with App Router & Turbopack |
| **UI Library** | React | 19.1.0 | Component-based UI |
| **Language** | TypeScript | 5.x | Type-safe development |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS framework |
| **Animation** | Framer Motion | 12.23.24 | Smooth UI animations & transitions |
| **Icons** | Lucide React | 0.553.0 | Beautiful icon system |
| **Primary Database** | PostgreSQL (Neon) | - | Serverless Postgres for metadata |
| **Vector Database** | MongoDB Atlas | 7.0.0 | Vector storage & semantic search |
| **ORM** | Drizzle | 0.44.7 | Type-safe SQL toolkit |
| **Authentication** | Better Auth | 1.3.34 | Multi-provider auth solution |
| **AI Model** | Google Gemini | - | Embedding generation & AI features |
| **Embedding Model** | text-embedding-004 | - | 768-dimensional text embeddings |
| **AI Framework** | LangChain | 1.0.3 | AI application framework |
| **Package Manager** | pnpm | - | Fast, disk space efficient |
| **Build Tool** | Turbopack | - | Next.js bundler for fast builds |
| **Development** | Concurrently | 9.2.1 | Run multiple dev servers |
| **Runtime** | Node.js | 20+ | JavaScript runtime |

### Architecture Layers

```mermaid
graph TB
    subgraph "Presentation Layer"
        A1[Next.js Pages]
        A2[React Components]
        A3[Tailwind Styles]
    end
    
    subgraph "Application Layer"
        B1[API Routes]
        B2[Server Actions]
        B3[Middleware]
        B4[Auth Logic]
    end
    
    subgraph "Business Logic Layer"
        C1[Memory Actions]
        C2[Search Service]
        C3[Embedding Service]
        C4[Auth Service]
    end
    
    subgraph "Data Access Layer"
        D1[Drizzle ORM]
        D2[MongoDB Client]
        D3[Schema Definitions]
    end
    
    subgraph "External Services"
        E1[Google Gemini API]
        E2[OAuth Providers]
    end
    
    subgraph "Data Storage"
        F1[(PostgreSQL)]
        F2[(MongoDB Atlas)]
    end
    
    A1 --> B1
    A2 --> B2
    B1 --> C1
    B2 --> C1
    B3 --> B4
    
    C1 --> D1
    C2 --> D2
    C3 --> E1
    C4 --> E2
    
    D1 --> F1
    D2 --> F2
    
    style A1 fill:#2196F3
    style B1 fill:#4CAF50
    style C1 fill:#FF9800
    style D1 fill:#9C27B0
    style E1 fill:#F44336
    style F1 fill:#00BCD4
```

### Key Dependencies

#### Production Dependencies
```json
{
  "@google/generative-ai": "^0.24.1",      // Google Gemini API client
  "@langchain/google-genai": "^1.0.0",     // LangChain Gemini integration
  "@neondatabase/serverless": "^1.0.2",    // Neon serverless driver
  "better-auth": "^1.3.34",                 // Authentication solution
  "drizzle-orm": "^0.44.7",                 // TypeScript ORM
  "framer-motion": "^12.23.24",             // Animation library
  "langchain": "^1.0.3",                    // AI framework
  "lodash.debounce": "^4.0.8",              // Debounce utility
  "lucide-react": "^0.553.0",               // Icon library
  "mongodb": "^7.0.0",                      // MongoDB driver
  "next": "15.5.6",                         // React framework
  "react": "19.1.0",                        // UI library
  "react-dom": "19.1.0",                    // React DOM renderer
  "tsx": "^4.20.6",                         // TypeScript executor
  "uuid": "^13.0.0"                         // UUID generator
}
```

#### Development Dependencies
```json
{
  "@tailwindcss/postcss": "^4",             // Tailwind PostCSS
  "@types/node": "^20",                     // Node.js types
  "@types/react": "^19",                    // React types
  "concurrently": "^9.2.1",                 // Run parallel commands
  "dotenv": "^17.2.3",                      // Environment variables
  "drizzle-kit": "^0.31.6",                 // Drizzle CLI tools
  "eslint": "^9",                           // Code linting
  "tailwindcss": "^4",                      // CSS framework
  "typescript": "^5"                        // TypeScript compiler
}
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed and configured:

- **Node.js** v20 or higher ([Download](https://nodejs.org/))
- **pnpm** v8 or higher (`npm install -g pnpm`)
- **PostgreSQL** database (Neon recommended) ([Sign up](https://neon.tech/))
- **MongoDB Atlas** account for vector search ([Sign up](https://www.mongodb.com/cloud/atlas/register))
- **Google Gemini API** key ([Get one](https://ai.google.dev/))

### Installation Steps

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/AyushPandey003/browserbaba.git
cd browserbaba/browserbaba
```

#### 2️⃣ Install Dependencies

```bash
pnpm install
```

#### 3️⃣ Environment Configuration

Create a `.env` file in the root directory:

```env
# ==========================================
# DATABASE CONFIGURATION
# ==========================================

# PostgreSQL (Neon) - Primary database for metadata
DATABASE_URL="postgresql://username:password@host.neon.tech/database?sslmode=require"

# MongoDB Atlas - Vector storage for semantic search
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/"

# ==========================================
# AUTHENTICATION (Better Auth)
# ==========================================

# Better Auth Secret (minimum 32 characters)
BETTER_AUTH_SECRET="your-super-secret-key-min-32-characters-long"

# Better Auth URL (change in production)
BETTER_AUTH_URL="http://localhost:3000"

# ==========================================
# OAUTH PROVIDERS (Optional)
# ==========================================

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# ==========================================
# AI & EMBEDDINGS
# ==========================================

# Google Gemini API for embeddings and AI features
GEMINI_API_KEY="your-gemini-api-key"
GOOGLE_AI_API_KEY="your-gemini-api-key"  # Alternative key name

# ==========================================
# API CONFIGURATION
# ==========================================

# Public API URL (for client-side requests)
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

#### 4️⃣ Database Setup

**PostgreSQL (Neon) Setup:**

```bash
# Generate Drizzle migrations
pnpm db:generate

# Push schema to database
pnpm db:push

# (Optional) Open Drizzle Studio to inspect database
pnpm db:studio
```

**MongoDB Atlas Setup:**

1. Create a MongoDB Atlas cluster (free tier works!)
2. Create database: `semanticbrowser`
3. Create collection: `browserbaba`
4. Create vector search index (see [Vector Search Setup](#setting-up-vector-search))

#### 5️⃣ Create MongoDB Vector Index

In MongoDB Atlas Dashboard:
1. Go to your cluster → **Search** tab
2. Click **Create Search Index**
3. Select **JSON Editor**
4. Use index name: `vector_index`
5. Paste this configuration:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "userId"
    }
  ]
}
```

#### 6️⃣ Generate Embeddings (For Existing Data)

If you have existing memories in PostgreSQL:

```bash
pnpm generate-embeddings
```

This will:
- Read all memories from PostgreSQL
- Generate 768-D embeddings using Gemini
- Store vectors in MongoDB
- Enable semantic search

#### 7️⃣ Start Development Server

```bash
# Start Next.js development server with Turbopack
pnpm dev

# The app will be available at:
# http://localhost:3000
```

#### 8️⃣ Install Browser Extension (Optional)

1. Open Chrome/Edge and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `extensionNewgo` folder
5. The extension icon will appear in your toolbar

**Configure Extension:**
1. Click the extension icon
2. Set API URL to `http://localhost:3000`
3. Sign in with your account
4. Start capturing content!

### Development Workflow

```mermaid
graph LR
    A[1. Start Dev Server] --> B[2. Create Account]
    B --> C[3. Install Extension]
    C --> D[4. Capture Content]
    D --> E[5. Search Memories]
    E --> F[6. Enjoy! 🎉]
    
    style A fill:#4CAF50
    style F fill:#FF9800
```

### Quick Start Scripts

```bash
# Development
pnpm dev              # Start dev server with Turbopack
pnpm dev:web          # Start only Next.js (without Turbopack flag)

# Database
pnpm db:generate      # Generate migrations from schema
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio UI

# Embeddings
pnpm generate-embeddings  # Generate embeddings for existing data

# Production
pnpm build            # Build for production
pnpm start            # Start production server

# Linting
pnpm lint             # Run ESLint
```

### Troubleshooting

#### Database Connection Issues
```bash
# Test PostgreSQL connection
pnpm db:studio

# Check MongoDB connection
# Should see "Connected to MongoDB for vector search" in logs
```

#### Embedding Generation Fails
- Verify `GEMINI_API_KEY` is set correctly
- Check API quota at [Google AI Studio](https://makersuite.google.com/)
- Ensure text content is not empty

#### Extension Not Working
- Check that API URL is set to `http://localhost:3000`
- Verify you're logged in
- Check browser console for errors (F12)

#### Search Returns No Results
- Ensure MongoDB vector index is created
- Run `pnpm generate-embeddings` if you have existing data
- Check MongoDB Atlas for index status (should be "Active")

---

## 📁 Project Structure

```
browserbaba/
├── 📱 app/                              # Next.js 15 App Router
│   ├── globals.css                     # Global styles
│   ├── layout.tsx                      # Root layout with providers
│   ├── page.tsx                        # Landing page
│   │
│   ├── api/                            # API Routes (Backend)
│   │   ├── auth/                       # Better Auth endpoints
│   │   │   ├── [...all]/              # Catch-all auth routes
│   │   │   │   └── route.ts           # Auth handler
│   │   │   └── session/               # Session management
│   │   │       └── route.ts           # Session endpoint
│   │   │
│   │   ├── capture/                    # Content capture API
│   │   │   └── route.ts               # POST endpoint for extension
│   │   │
│   │   ├── memories/                   # Memory CRUD operations
│   │   │   └── route.ts               # GET/POST memories
│   │   │
│   │   └── search/                     # Search endpoints
│   │       ├── route.ts               # Keyword search
│   │       └── semantic/              # Vector search
│   │           └── route.ts           # MongoDB vector search
│   │
│   ├── dashboard/                      # Main dashboard
│   │   ├── layout.tsx                 # Dashboard layout with sidebar
│   │   └── page.tsx                   # Dashboard home (masonry grid)
│   │
│   ├── login/                          # Authentication
│   │   └── page.tsx                   # Login/signup page
│   │
│   ├── search/                         # Search interface
│   │   ├── layout.tsx                 # Search layout
│   │   └── page.tsx                   # Search results page
│   │
│   ├── read/                           # Reader view
│   │   └── [id]/                      # Dynamic route for memory detail
│   │       └── page.tsx               # Full memory view
│   │
│   ├── collections/                    # Collections view
│   │   └── page.tsx                   # Organized collections
│   │
│   ├── tags/                           # Tags management
│   │   └── page.tsx                   # Tag browser
│   │
│   └── settings/                       # User settings
│       └── page.tsx                   # Settings page
│
├── 🎨 components/                       # React Components
│   ├── ConditionalNavbar.tsx           # Smart navbar (shows/hides)
│   ├── Navbar.tsx                      # Top navigation bar
│   ├── Sidebar.tsx                     # Left sidebar navigation
│   ├── DashboardClient.tsx             # Dashboard wrapper
│   ├── DashboardMasonryClient.tsx      # Masonry grid layout
│   ├── MasonryMemoryCard.tsx           # Individual memory card
│   ├── MemoryCard.tsx                  # Basic memory card
│   ├── MemoryModal.tsx                 # Memory detail modal
│   ├── ReaderViewClient.tsx            # Reader view component
│   ├── SearchBar.tsx                   # Search input with debounce
│   ├── SearchResultsClient.tsx         # Search results display
│   └── FilterDropdown.tsx              # Filter controls
│
├── 🗄️ lib/                              # Core Libraries & Utilities
│   ├── auth.ts                         # Better Auth configuration
│   ├── auth-client.ts                  # Client-side auth utilities
│   ├── auth-utils.ts                   # Auth helper functions
│   ├── types.ts                        # TypeScript type definitions
│   ├── semantic-search.ts              # Vector search logic
│   ├── vector-search.ts                # MongoDB vector operations
│   │
│   ├── db/                             # Database layer
│   │   ├── index.ts                   # PostgreSQL connection (Neon)
│   │   ├── mongodb.ts                 # MongoDB connection & interface
│   │   ├── schema.ts                  # Drizzle schema definitions
│   │   └── seed.ts                    # Database seeding script
│   │
│   ├── actions/                        # Server Actions
│   │   └── memory-actions.ts          # Memory CRUD operations
│   │
│   ├── embeddings/                     # Embedding services
│   │   ├── service.ts                 # Embedding generation
│   │   └── vector-search.ts           # Vector search utilities
│   │
│   └── scripts/                        # Utility scripts
│       └── generate-embeddings.ts     # Batch embedding generation
│
├── 🤖 backend/                          # AI/ML Backend
│   ├── embeddings.ts                   # Google Gemini embeddings
│   └── rag.ts                          # RAG implementation (future)
│
├── 🔌 extensionNewgo/                   # Browser Extension (Manifest V3)
│   ├── manifest.json                   # Extension manifest
│   ├── background.js                   # Service worker
│   ├── content.js                      # Content script injection
│   ├── content.css                     # Extension styles
│   ├── popup.html                      # Extension popup UI
│   ├── popup.js                        # Popup logic
│   ├── popup.css                       # Popup styles
│   ├── api.js                          # API communication
│   ├── auth.js                         # Extension auth logic
│   ├── README.md                       # Extension documentation
│   ├── IMPLEMENTATION_SUMMARY.md       # Implementation details
│   └── icons/                          # Extension icons
│       └── README.md                   # Icon guidelines
│
├── 📄 Configuration Files
│   ├── package.json                    # Dependencies & scripts
│   ├── pnpm-lock.yaml                  # Lock file
│   ├── tsconfig.json                   # TypeScript configuration
│   ├── next.config.ts                  # Next.js configuration
│   ├── tailwind.config.ts              # Tailwind CSS config
│   ├── postcss.config.mjs              # PostCSS config
│   ├── drizzle.config.ts               # Drizzle ORM config
│   ├── eslint.config.mjs               # ESLint configuration
│   ├── middleware.ts                   # Route protection middleware
│   ├── next-env.d.ts                   # Next.js types
│   └── .env                            # Environment variables
│
├── 📚 Documentation
│   ├── README.md                       # This file
│   ├── AUTHENTICATION.md               # Auth setup guide
│   ├── VECTOR_SEARCH_SETUP.md          # Vector search guide
│   └── coontext.txt                    # Context file
│
├── 🎨 UI Reference (Static)
│   └── uirefrence/                     # HTML mockups
│       ├── index.html
│       ├── landing.html
│       ├── login.html
│       ├── readmorepage.html
│       └── searchResults.html
│
└── 📦 Build Artifacts
    └── migrations/                     # Drizzle migrations
        └── 0000_*.sql                 # Migration files
```

### Key Directory Explanations

#### `app/` - Next.js App Router
- **Layout-based routing**: Each folder with `layout.tsx` defines a route segment
- **Server Components by default**: Use `'use client'` for client components
- **API Routes**: Colocated with page routes in `api/` folder
- **Middleware integration**: Route protection via `middleware.ts`

#### `lib/` - Core Business Logic
- **Separation of concerns**: Database, auth, AI services separated
- **Reusable utilities**: Shared across server and client
- **Type safety**: All TypeScript types in `types.ts`
- **Server actions**: In `actions/` for form submissions and mutations

#### `components/` - React Components
- **Client components**: Interactive UI elements
- **Composition**: Small, reusable components
- **Type-safe props**: Using TypeScript interfaces
- **Framer Motion**: Animation support

#### `extensionNewgo/` - Browser Extension
- **Manifest V3**: Modern extension architecture
- **Service worker**: Background processing
- **Content scripts**: Page interaction
- **Isolated storage**: Extension-specific data

---

## 🔌 API Documentation

### Authentication Flow

All protected API endpoints require authentication via Better Auth session cookies.

```mermaid
sequenceDiagram
    participant C as Client
    participant MW as Middleware
    participant API as API Route
    participant Auth as Better Auth
    participant DB as Database
    
    C->>MW: Request with Cookie
    MW->>Auth: Validate Session
    Auth->>DB: Check Token
    
    alt Valid Session
        DB-->>Auth: User Found
        Auth-->>MW: Session Data
        MW->>API: Forward Request + Session
        API->>API: Process Request
        API-->>C: Response with Data
    else Invalid/Expired
        DB-->>Auth: No Session
        Auth-->>MW: Unauthorized
        MW-->>C: 401 Unauthorized
    end
```

### API Endpoints Reference

#### **Authentication Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/sign-in` | Sign in with credentials | ❌ |
| `POST` | `/api/auth/sign-up` | Create new account | ❌ |
| `POST` | `/api/auth/sign-out` | Sign out current user | ✅ |
| `GET` | `/api/auth/session` | Get current session | ✅ |
| `GET` | `/api/auth/google` | OAuth with Google | ❌ |
| `GET` | `/api/auth/github` | OAuth with GitHub | ❌ |

#### **Memory Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/memories` | Get all user memories | ✅ |
| `POST` | `/api/memories` | Create new memory | ✅ |
| `GET` | `/api/memories/:id` | Get specific memory | ✅ |
| `PUT` | `/api/memories/:id` | Update memory | ✅ |
| `DELETE` | `/api/memories/:id` | Delete memory | ✅ |

#### **Search Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/search` | Keyword search | ✅ |
| `GET` | `/api/search/semantic` | Vector semantic search | ✅ |

#### **Capture Endpoint**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/capture` | Capture content from extension | ✅ |

---

### API Usage Examples

#### **1. Create Memory (with Embedding)**

```typescript
// Request
POST /api/memories
Content-Type: application/json
Cookie: synapse_session=...

{
  "url": "https://example.com/article",
  "title": "Understanding Vector Embeddings",
  "contentType": "page",
  "content": "Vector embeddings are numerical representations of text...",
  "selectedText": "Key concept about vectors",
  "contextBefore": "In the previous section we discussed...",
  "contextAfter": "Next, we'll explore...",
  "tags": "AI, ML, Embeddings",
  "notes": "Important for semantic search"
}

// Response
{
  "success": true,
  "memory": {
    "id": "uuid-here",
    "userId": "user-uuid",
    "title": "Understanding Vector Embeddings",
    "contentType": "page",
    "createdAt": "2025-11-09T10:00:00Z",
    "embedding": "Stored in MongoDB"
  }
}
```

**Behind the scenes:**
1. Validates user session
2. Generates 768-D embedding using Gemini
3. Stores metadata in PostgreSQL
4. Stores embedding vector in MongoDB
5. Creates vector search index entry

#### **2. Semantic Search**

```typescript
// Request
GET /api/search/semantic?q=articles%20about%20AI%20embeddings&limit=10
Cookie: synapse_session=...

// Response
{
  "success": true,
  "results": [
    {
      "id": "uuid-1",
      "title": "Understanding Vector Embeddings",
      "content": "Vector embeddings are numerical...",
      "url": "https://example.com/article",
      "score": 0.95,              // Cosine similarity score
      "tags": ["AI", "ML", "Embeddings"],
      "createdAt": "2025-11-09T10:00:00Z"
    },
    {
      "id": "uuid-2",
      "title": "Machine Learning Basics",
      "score": 0.87,
      "createdAt": "2025-11-08T15:30:00Z"
    }
  ],
  "count": 2,
  "searchType": "semantic"
}
```

**Search Process:**
1. Generate embedding for query text
2. MongoDB vector search with cosine similarity
3. Filter results by `userId`
4. Fetch full memory details from PostgreSQL
5. Merge and return ranked results

#### **3. Hybrid Search**

```typescript
// Request
GET /api/search/semantic?q=Next.js tutorial&type=hybrid&limit=20
Cookie: synapse_session=...

// Response
{
  "success": true,
  "results": [
    {
      "id": "uuid-1",
      "title": "Next.js 15 Tutorial",
      "score": 0.98,              // High score from keyword match
      "matchType": "keyword+semantic"
    },
    {
      "id": "uuid-2",
      "title": "Building React Applications",
      "score": 0.82,              // Semantic similarity
      "matchType": "semantic"
    }
  ],
  "searchType": "hybrid"
}
```

#### **4. Get User Memories with Filters**

```typescript
// Request
GET /api/memories?type=page&search=vector
Cookie: synapse_session=...

// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "userId": "user-uuid",
      "title": "Vector Database Tutorial",
      "contentType": "page",
      "url": "https://example.com",
      "tags": "database, vectors",
      "createdAt": "2025-11-09T10:00:00Z"
    }
  ],
  "count": 1
}
```

#### **5. Capture from Extension**

```typescript
// Request
POST /api/capture
Content-Type: application/json
Cookie: synapse_session=...

{
  "url": "https://youtube.com/watch?v=xyz",
  "title": "Machine Learning Explained",
  "contentType": "video",
  "videoPlatform": "youtube",
  "videoTimestamp": 125,           // 2:05
  "formattedTimestamp": "2:05",
  "thumbnailUrl": "https://...",
  "selectedText": "Key insight at this moment",
  "notes": "Important concept"
}

// Response
{
  "success": true,
  "memory": {
    "id": "uuid-here",
    "title": "Machine Learning Explained",
    "contentType": "video",
    "videoTimestamp": 125
  }
}
```

### Error Responses

```typescript
// Unauthorized (401)
{
  "error": "Unauthorized"
}

// Bad Request (400)
{
  "error": "Query parameter 'q' is required"
}

// Internal Server Error (500)
{
  "error": "Internal server error"
}
```

### CORS Configuration

All API routes include CORS headers for cross-origin requests (needed for browser extension):

```typescript
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

---

## 🧩 Browser Extension

### Extension Architecture

```mermaid
graph TB
    subgraph "Extension Components"
        A[Background Service Worker]
        B[Content Script]
        C[Popup UI]
    end
    
    subgraph "Content Extraction"
        D[Text Selection Handler]
        E[Video Platform Detection]
        F[Metadata Scraper]
        G[Context Extractor]
        H[XPath Generator]
    end
    
    subgraph "Processing Pipeline"
        I[Context Builder]
        J[Timestamp Handler]
        K[Tag Parser]
        L[URL Validator]
    end
    
    subgraph "Storage & Sync"
        M[Local Storage]
        N[Session Manager]
        O[API Client]
    end
    
    subgraph "Backend Integration"
        P[BrowseBaba API]
        Q[Authentication]
        R[Data Storage]
    end
    
    C --> A
    A --> B
    B --> D
    B --> E
    B --> F
    
    D --> G
    E --> J
    F --> G
    G --> H
    
    H --> I
    J --> I
    
    I --> K
    K --> L
    L --> M
    
    M --> N
    N --> O
    O --> Q
    Q --> P
    P --> R
    
    style A fill:#FF9800
    style B fill:#4CAF50
    style P fill:#2196F3
    style Q fill:#F44336
```

### Extension Features

#### **1. Manifest V3 Architecture**
- **Service Worker**: Background processing without blocking
- **Content Scripts**: Injected into every webpage
- **Isolated Context**: Secure data handling
- **Dynamic Permissions**: Request permissions as needed

#### **2. Content Capture Methods**

```mermaid
flowchart TD
    A[User Action] --> B{Capture Type}
    
    B -->|Text Selection| C[Get Selected Text]
    B -->|Video Bookmark| D[Extract Video Info]
    B -->|Full Page| E[Scrape Entire Page]
    B -->|Quick Save| F[Save Current URL]
    
    C --> G[Get Context Before/After]
    D --> H[Get Timestamp]
    E --> I[Extract All Content]
    F --> J[Get Page Metadata]
    
    G --> K[Build Context Object]
    H --> K
    I --> K
    J --> K
    
    K --> L[Generate XPath]
    L --> M[Add Tags/Notes]
    M --> N[Send to API]
    
    N --> O{Online?}
    O -->|Yes| P[Save to Server]
    O -->|No| Q[Queue Locally]
    
    P --> R[Success Notification]
    Q --> S[Sync When Online]
    
    style B fill:#FF9800
    style K fill:#4CAF50
    style N fill:#2196F3
    style O fill:#F44336
```

#### **3. Video Platform Support**

Supported video platforms with timestamp capture:

```mermaid
mindmap
  root((Video Support))
    YouTube
      Standard Player
      Embedded Videos
      Live Streams
      Shorts
    Vimeo
      Standard Player
      Private Videos
      Embedded
    Generic HTML5
      Video Tag
      Custom Players
      Media Fragments
    Other Platforms
      Twitch Preparation
      Netflix Preparation
      Custom Detection
```

**Video Capture Features:**
- ⏱️ **Precise Timestamps**: Capture exact second
- 🖼️ **Thumbnail Extraction**: Auto-grab video thumbnail
- 📝 **Context Preservation**: Save what was said/shown
- 🔗 **Deep Linking**: Jump back to exact moment

#### **4. Context-Aware Capture**

```mermaid
sequenceDiagram
    participant U as User
    participant CS as Content Script
    participant BG as Background Worker
    participant API as Backend API
    
    U->>CS: Selects Text
    CS->>CS: Get Selection Range
    CS->>CS: Extract 200 chars before
    CS->>CS: Extract 200 chars after
    CS->>CS: Identify Element Type
    CS->>CS: Generate XPath
    CS->>CS: Get Page Section
    
    CS->>BG: Send Complete Context
    Note over BG: {<br/>  selectedText,<br/>  contextBefore,<br/>  contextAfter,<br/>  xpath,<br/>  elementType,<br/>  pageSection<br/>}
    
    BG->>API: POST /api/capture
    API->>API: Generate Embedding
    API->>API: Store in Dual DB
    API-->>BG: Success
    BG-->>U: Show Toast Notification
```

**Context Information Captured:**
- ✅ **Selected Text**: Exact user selection
- ⬅️ **Context Before**: 200 chars before selection
- ➡️ **Context After**: 200 chars after selection
- 🎯 **XPath**: DOM element location
- 📄 **Element Type**: (p, div, article, etc.)
- 📍 **Page Section**: (header, main, aside, etc.)
- 🏷️ **Metadata**: Title, URL, timestamp, tags

#### **5. Keyboard Shortcuts**

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Shift+S` (Win) | Quick Save | Save current page/selection |
| `Cmd+Shift+S` (Mac) | Quick Save | Save current page/selection |
| Right-click → Save | Context Menu | Save via right-click menu |

### Extension Workflow

```mermaid
graph TB
    A[Browse Web] --> B{User Action}
    
    B -->|Selects Text| C[Highlight Selection]
    B -->|Watches Video| D[Video Playing]
    B -->|Clicks Icon| E[Open Popup]
    
    C --> F{Save Method}
    D --> F
    E --> G[Show Quick Save Options]
    
    F -->|Keyboard| H[Ctrl+Shift+S]
    F -->|Right-Click| I[Context Menu]
    F -->|Popup| G
    
    H --> J[Extract Context]
    I --> J
    G --> J
    
    J --> K[Enrich Metadata]
    K --> L[Video Info?]
    
    L -->|Yes| M[Get Timestamp + Thumbnail]
    L -->|No| N[Standard Metadata]
    
    M --> O[Build Capture Object]
    N --> O
    
    O --> P{User Logged In?}
    
    P -->|Yes| Q[Send to API]
    P -->|No| R[Show Login Prompt]
    
    Q --> S{Online?}
    S -->|Yes| T[Save Immediately]
    S -->|No| U[Queue for Later]
    
    T --> V[Show Success Toast]
    U --> W[Save to Local Storage]
    W --> X[Sync When Online]
    
    R --> Y[Redirect to Login]
    
    style J fill:#4CAF50
    style O fill:#FF9800
    style Q fill:#2196F3
    style S fill:#F44336
```

### Installation & Setup

#### **Step 1: Load Extension**

1. Open browser and navigate to:
   - **Chrome/Edge**: `chrome://extensions/`
   - **Brave**: `brave://extensions/`

2. Enable **Developer mode** (toggle in top-right corner)

3. Click **Load unpacked**

4. Navigate to and select the `extensionNewgo` folder

5. Extension icon will appear in toolbar

#### **Step 2: Configure API Endpoint**

1. Click extension icon in toolbar
2. In popup, set:
   - **API URL**: `http://localhost:3000` (development)
   - **API URL**: `https://yourdomain.com` (production)
3. Click **Save Settings**

#### **Step 3: Authenticate**

1. Click **Sign In** in extension popup
2. You'll be redirected to the web app
3. Sign in with your account
4. Return to the webpage - you're now authenticated!

### Extension Code Structure

```
extensionNewgo/
├── manifest.json          # Extension configuration (Manifest V3)
│   ├── permissions        # tabs, activeTab, storage, scripting
│   ├── host_permissions   # <all_urls>
│   ├── background         # Service worker
│   └── content_scripts    # Injection config
│
├── background.js          # Service Worker (Background Logic)
│   ├── Context Menu Setup
│   ├── Message Handling
│   ├── API Communication
│   ├── Storage Management
│   └── Auth State Tracking
│
├── content.js             # Content Script (Page Injection)
│   ├── Selection Detection
│   ├── Video Detection
│   ├── Context Extraction
│   ├── XPath Generation
│   ├── Metadata Scraping
│   └── Message Passing
│
├── popup.html/js/css      # Extension Popup UI
│   ├── Quick Save Button
│   ├── Settings Panel
│   ├── Recent Saves
│   ├── Auth Status
│   └── Stats Display
│
├── api.js                 # API Client
│   ├── HTTP Methods
│   ├── Error Handling
│   ├── Retry Logic
│   └── Response Parsing
│
└── auth.js                # Authentication Logic
    ├── Session Management
    ├── Token Handling
    ├── Login/Logout
    └── Auth State Sync
```

### Extension Permissions

```json
{
  "permissions": [
    "tabs",           // Access tab information
    "activeTab",      // Access currently active tab
    "contextMenus",   // Add right-click menu items
    "storage",        // Store settings and offline queue
    "scripting",      // Inject content scripts
    "cookies"         // Manage auth cookies
  ],
  "host_permissions": [
    "<all_urls>"      // Access all websites
  ]
}
```

### Security Considerations

```mermaid
graph TB
    A[Security Measures] --> B[Content Security Policy]
    A --> C[Isolated Context]
    A --> D[Secure Communication]
    A --> E[Data Encryption]
    
    B --> B1[No inline scripts]
    B --> B2[No eval]
    B --> B3[HTTPS only API]
    
    C --> C1[Separate execution context]
    C --> C2[No direct DOM access from BG]
    C --> C3[Message passing only]
    
    D --> D1[Session-based auth]
    D --> D2[Secure cookies]
    D --> D3[CORS validation]
    
    E --> E1[Local storage encryption]
    E --> E2[Secure token storage]
    E --> E3[Auto-purge sensitive data]
    
    style A fill:#F44336
    style B fill:#FF9800
    style C fill:#4CAF50
    style D fill:#2196F3
    style E fill:#9C27B0
```

**Security Features:**
- ✅ **CSP Compliant**: No inline scripts or eval
- ✅ **Isolated Context**: Content scripts can't access extension internals
- ✅ **Secure Auth**: Session cookies with httpOnly flag
- ✅ **HTTPS Only**: Production API must use HTTPS
- ✅ **Data Encryption**: Sensitive data encrypted in storage
- ✅ **Auto-logout**: Expired sessions automatically cleared

### Troubleshooting Extension

| Issue | Solution |
|-------|----------|
| **Extension not showing** | Check if Developer mode is enabled |
| **Can't save content** | Verify API URL is set correctly in settings |
| **Authentication fails** | Clear browser cookies and re-login |
| **Video timestamp wrong** | Refresh page and try again |
| **Offline saves not syncing** | Check internet connection and re-open popup |
| **Context menu missing** | Reload extension in `chrome://extensions/` |

---

## 🗄️ Database Schema

### Dual Database Architecture

BrowseBaba uses a **dual-database architecture** for optimal performance and specialized functionality:

```mermaid
graph LR
    A[Application] --> B{Data Type}
    
    B -->|Metadata| C[(PostgreSQL/Neon)]
    B -->|Vectors| D[(MongoDB Atlas)]
    
    C --> E[Structured Data]
    E --> F[User Info]
    E --> G[Memory Metadata]
    E --> H[Auth Sessions]
    E --> I[Links/Tags]
    
    D --> J[Unstructured Data]
    J --> K[768-D Embeddings]
    J --> L[Vector Index]
    J --> M[Semantic Search]
    
    style C fill:#9C27B0
    style D fill:#00BCD4
    style E fill:#4CAF50
    style J fill:#FF9800
```

### PostgreSQL Schema (Neon)

#### **Entity Relationship Diagram**

```mermaid
erDiagram
    USER ||--o{ MEMORY : creates
    USER ||--o{ SESSION : has
    USER ||--o{ ACCOUNT : links
    
    MEMORY ||--o{ LINK : contains
    
    USER {
        uuid id PK
        string name
        string email UK
        boolean emailVerified
        string image
        timestamp createdAt
        timestamp updatedAt
    }
    
    MEMORY {
        uuid id PK
        uuid userId FK
        string url
        string title
        string contentType
        text content
        text selectedText
        text contextBefore
        text contextAfter
        text fullContext
        string elementType
        string pageSection
        text xpath
        string tags
        text notes
        timestamp createdAt
        timestamp updatedAt
        timestamp scrapedAt
        string videoPlatform
        bigint videoTimestamp
        bigint videoDuration
        string videoTitle
        string videoUrl
        string thumbnailUrl
        string formattedTimestamp
    }
    
    LINK {
        uuid id PK
        uuid memoryId FK
        text text
        text href
        text linkTitle
        timestamp createdAt
    }
    
    SESSION {
        uuid id PK
        uuid userId FK
        string token UK
        timestamp expiresAt
        string ipAddress
        string userAgent
        timestamp createdAt
        timestamp updatedAt
    }
    
    ACCOUNT {
        uuid id PK
        uuid userId FK
        string accountId
        string providerId
        text accessToken
        text refreshToken
        text idToken
        timestamp accessTokenExpiresAt
        timestamp refreshTokenExpiresAt
        text scope
        text password
        timestamp createdAt
        timestamp updatedAt
    }
    
    VERIFICATION {
        uuid id PK
        string identifier
        string value
        timestamp expiresAt
        timestamp createdAt
        timestamp updatedAt
    }
```

#### **Table Descriptions**

##### `user` - User Accounts
```sql
CREATE TABLE "user" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified BOOLEAN NOT NULL DEFAULT false,
  image TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores user account information for Better Auth
- ✅ Compatible with Better Auth schema
- ✅ Supports email/password and OAuth providers
- ✅ Email verification tracking

##### `memories` - Main Content Storage
```sql
CREATE TABLE memories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  userId TEXT REFERENCES "user"(id) ON DELETE CASCADE,
  url TEXT,
  title TEXT NOT NULL,
  contentType VARCHAR(50) NOT NULL DEFAULT 'page',
  content TEXT,
  selectedText TEXT,
  contextBefore TEXT,
  contextAfter TEXT,
  fullContext TEXT,
  elementType VARCHAR(50),
  pageSection VARCHAR(50),
  xpath TEXT,
  tags TEXT,  -- Comma-separated
  notes TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  scrapedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Video-specific fields
  videoPlatform VARCHAR(50),
  videoTimestamp BIGINT,
  videoDuration BIGINT,
  videoTitle TEXT,
  videoUrl TEXT,
  thumbnailUrl TEXT,
  formattedTimestamp VARCHAR(20)
);

-- Indexes for performance
CREATE INDEX idx_memories_userId ON memories(userId);
CREATE INDEX idx_memories_contentType ON memories(contentType);
CREATE INDEX idx_memories_createdAt ON memories(createdAt DESC);
CREATE INDEX idx_memories_title_search ON memories USING GIN(to_tsvector('english', title));
CREATE INDEX idx_memories_content_search ON memories USING GIN(to_tsvector('english', content));
```

**Purpose**: Stores all captured content and metadata
- ✅ Full-text search support on title and content
- ✅ Video-specific fields for timestamps
- ✅ Context preservation (before/after text)
- ✅ XPath for element location tracking

**Content Types:**
- `page` - Web pages and articles
- `video` - Video bookmarks
- `note` - Personal notes
- `bookmark` - Quick saves

##### `links` - Extracted Links
```sql
CREATE TABLE links (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  memoryId TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  text TEXT,
  href TEXT NOT NULL,
  linkTitle TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_links_memoryId ON links(memoryId);
```

**Purpose**: Stores links extracted from saved pages
- ✅ Associated with parent memory
- ✅ Preserves link text and attributes
- ✅ Cascade delete with memory

##### `session` - Auth Sessions
```sql
CREATE TABLE session (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  expiresAt TIMESTAMP NOT NULL,
  token TEXT NOT NULL UNIQUE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL REFERENCES "user"(id)
);

CREATE INDEX idx_session_userId ON session(userId);
CREATE INDEX idx_session_token ON session(token);
```

**Purpose**: Manages user sessions for Better Auth
- ✅ 7-day expiration
- ✅ Secure token storage
- ✅ IP and user agent tracking

##### `account` - OAuth Accounts
```sql
CREATE TABLE account (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,  -- 'google', 'github', 'email'
  userId TEXT NOT NULL REFERENCES "user"(id),
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt TIMESTAMP,
  refreshTokenExpiresAt TIMESTAMP,
  scope TEXT,
  password TEXT,  -- For email/password auth
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_account_userId ON account(userId);
CREATE INDEX idx_account_provider ON account(providerId);
```

**Purpose**: Links user accounts with OAuth providers
- ✅ Multi-provider support
- ✅ Token management
- ✅ Password hashing for email auth

### MongoDB Schema (Atlas)

#### **Vector Document Structure**

```typescript
interface MemoryVector {
  _id: ObjectId;
  memoryId: string;      // References PostgreSQL memories.id
  userId: string;        // Multi-tenant isolation
  title: string;         // Quick display in results
  content: string;       // Searchable text content
  url?: string;          // Source URL
  tags: string[];        // Array of tags for filtering
  embedding: number[];   // 768-dimensional vector from Gemini
  createdAt: Date;       // Creation timestamp
  updatedAt: Date;       // Last update timestamp
}
```

#### **MongoDB Collections**

```javascript
// Database: semanticbrowser
{
  collections: {
    browserbaba: {
      // Vector documents with embeddings
      documents: [
        {
          _id: ObjectId("..."),
          memoryId: "uuid-from-postgresql",
          userId: "user-uuid",
          title: "Understanding Vector Embeddings",
          content: "Vector embeddings are...",
          url: "https://example.com",
          tags: ["AI", "ML", "Embeddings"],
          embedding: [0.123, -0.456, 0.789, ...], // 768 dimensions
          createdAt: ISODate("2025-11-09T10:00:00Z"),
          updatedAt: ISODate("2025-11-09T10:00:00Z")
        }
      ],
      
      // Indexes
      indexes: [
        {
          name: "vector_index",
          type: "vectorSearch",
          definition: {
            fields: [
              {
                type: "vector",
                path: "embedding",
                numDimensions: 768,
                similarity: "cosine"
              },
              {
                type: "filter",
                path: "userId"
              }
            ]
          }
        },
        {
          name: "userId_1",
          key: { userId: 1 }
        },
        {
          name: "memoryId_1",
          key: { memoryId: 1 },
          unique: true
        }
      ]
    }
  }
}
```

### Data Synchronization

```mermaid
sequenceDiagram
    participant API as API Route
    participant PG as PostgreSQL
    participant Gemini as Google Gemini
    participant Mongo as MongoDB
    
    API->>API: Receive Memory Data
    
    par Store Metadata
        API->>PG: INSERT into memories
        PG-->>API: Memory ID
    and Generate Embedding
        API->>Gemini: Generate embedding
        Gemini-->>API: 768-D vector
    end
    
    API->>Mongo: INSERT vector document
    Note over Mongo: {<br/>  memoryId,<br/>  userId,<br/>  embedding: [...]<br/>}
    
    Mongo-->>API: Indexed
    API-->>API: Complete
```

**Synchronization Strategy:**
1. **Insert**: Write to both databases simultaneously
2. **Update**: Update metadata in PostgreSQL, regenerate embedding if content changed
3. **Delete**: Remove from both databases
4. **Consistency**: memoryId links the two records

### Database Performance Optimizations

```mermaid
graph TB
    A[Performance Optimizations] --> B[PostgreSQL]
    A --> C[MongoDB]
    
    B --> B1[Indexes on userId, contentType]
    B --> B2[Full-text search indexes]
    B --> B3[Timestamp indexes DESC]
    B --> B4[Connection pooling]
    
    C --> C1[Vector index optimized]
    C --> C2[userId filter index]
    C --> C3[Cosine similarity]
    C --> C4[numCandidates tuning]
    
    style A fill:#FF9800
    style B fill:#9C27B0
    style C fill:#00BCD4
```

**PostgreSQL Optimizations:**
- ✅ Composite indexes on frequently filtered columns
- ✅ GIN indexes for full-text search
- ✅ Cascade deletes for referential integrity
- ✅ Connection pooling via Neon serverless

**MongoDB Optimizations:**
- ✅ Vector index with cosine similarity
- ✅ Filtered queries (userId) for multi-tenant isolation
- ✅ Optimal `numCandidates` (100) for speed/accuracy balance
- ✅ Connection reuse and pooling

---

## 🚀 Deployment

### Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        A[Vercel Edge Network]
        B[Next.js App + API Routes]
    end
    
    subgraph "Databases"
        C[(Neon PostgreSQL<br/>Serverless)]
        D[(MongoDB Atlas<br/>Serverless)]
    end
    
    subgraph "External Services"
        E[Google Gemini API<br/>Embeddings]
        F[OAuth Providers<br/>Google, GitHub]
    end
    
    subgraph "CDN & Assets"
        G[Vercel CDN]
        H[Static Assets]
    end
    
    A --> B
    B --> C
    B --> D
    B --> E
    B --> F
    B --> H
    H --> G
    
    style A fill:#2196F3
    style C fill:#9C27B0
    style D fill:#00BCD4
    style E fill:#4CAF50
```

### Deploy to Vercel

#### **Prerequisites**
- GitHub account
- Vercel account ([Sign up](https://vercel.com/signup))
- Neon database ([Get one](https://neon.tech/))
- MongoDB Atlas cluster ([Create one](https://www.mongodb.com/cloud/atlas/register))

#### **Deployment Steps**

1. **Push to GitHub**
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

2. **Import to Vercel**
- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Click **Add New** → **Project**
- Import your GitHub repository
- Select `browserbaba` as the root directory

3. **Configure Environment Variables**

In Vercel project settings, add these environment variables:

```env
# Database
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/

# Better Auth
BETTER_AUTH_SECRET=your-production-secret-min-32-chars
BETTER_AUTH_URL=https://your-domain.vercel.app

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_AI_API_KEY=your-gemini-api-key

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Public
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app
```

4. **Deploy**
- Click **Deploy**
- Wait for build to complete
- Your app will be live at `https://your-project.vercel.app`

5. **Setup Custom Domain (Optional)**
- Go to project settings → Domains
- Add your custom domain
- Update DNS records as instructed
- Update `BETTER_AUTH_URL` to your custom domain

### Post-Deployment Setup

#### **1. Initialize Database**
```bash
# Run migrations
pnpm db:push

# Generate embeddings for existing data
pnpm generate-embeddings
```

#### **2. Configure OAuth Redirect URLs**

**Google OAuth Console:**
- Authorized redirect URIs: `https://your-domain.vercel.app/api/auth/google/callback`

**GitHub OAuth App:**
- Authorization callback URL: `https://your-domain.vercel.app/api/auth/github/callback`

#### **3. Update Extension**

Update `extensionNewgo/popup.js` with production URL:
```javascript
const API_URL = 'https://your-domain.vercel.app';
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB vector index created
- [ ] Database schema pushed
- [ ] OAuth redirect URLs updated
- [ ] Custom domain configured (if applicable)
- [ ] HTTPS enforced
- [ ] Error tracking setup (optional: Sentry)
- [ ] Analytics setup (optional: Vercel Analytics)

### Monitoring & Observability

```mermaid
graph LR
    A[Production App] --> B[Vercel Analytics]
    A --> C[Error Logs]
    A --> D[Performance Metrics]
    
    B --> E[Traffic Insights]
    C --> F[Debug Issues]
    D --> G[Optimize Performance]
    
    style A fill:#2196F3
    style B fill:#4CAF50
    style C fill:#F44336
    style D fill:#FF9800
```

**Recommended Tools:**
- **Vercel Analytics**: Built-in traffic and performance analytics
- **Vercel Logs**: Real-time function logs
- **Sentry** (optional): Error tracking and monitoring
- **MongoDB Atlas Monitoring**: Database performance metrics
- **Neon Dashboard**: PostgreSQL query analytics

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help make BrowseBaba better:

### Ways to Contribute

```mermaid
mindmap
  root((Contribute))
    Code
      New Features
      Bug Fixes
      Performance Improvements
      Refactoring
    Documentation
      README Updates
      API Docs
      Tutorials
      Code Comments
    Testing
      Unit Tests
      Integration Tests
      Bug Reports
      Feature Testing
    Design
      UI/UX Improvements
      Component Design
      Accessibility
      Mobile Responsive
    Community
      Answer Questions
      Write Blog Posts
      Create Videos
      Share Feedback
```

### Development Workflow

```mermaid
gitGraph
    commit id: "main branch"
    branch develop
    checkout develop
    commit id: "dev setup"
    branch feature/semantic-search
    checkout feature/semantic-search
    commit id: "implement search"
    commit id: "add tests"
    commit id: "update docs"
    checkout develop
    merge feature/semantic-search
    checkout main
    merge develop tag: "v1.0.0"
```

### Contribution Steps

1. **Fork the Repository**
```bash
# Fork on GitHub, then clone
git clone https://github.com/ayushpandey003/browserbaba.git
cd browserbaba/browserbaba
```

2. **Create a Feature Branch**
```bash
git checkout -b feature/amazing-feature
# or
git checkout -b fix/bug-description
```

3. **Make Your Changes**
- Write clean, documented code
- Follow existing code style
- Add tests if applicable
- Update documentation

4. **Test Your Changes**
```bash
# Run linter
pnpm lint

# Test locally
pnpm dev

# Build for production
pnpm build
```

5. **Commit Your Changes**
```bash
git add .
git commit -m "feat: add amazing feature"
```

**Commit Message Convention:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Build process or tooling changes

6. **Push to Your Fork**
```bash
git push origin feature/amazing-feature
```

7. **Open a Pull Request**
- Go to the original repository
- Click **New Pull Request**
- Select your branch
- Fill in the PR template:
  - Description of changes
  - Related issues
  - Screenshots (if UI changes)
  - Testing done

### Code Style Guidelines

```typescript
// ✅ Good: Clear naming, proper types, documented
interface MemorySearchParams {
  query: string;
  userId: string;
  limit?: number;
}

/**
 * Performs semantic search on user memories
 * @param params Search parameters
 * @returns Ranked search results
 */
export async function semanticSearch(
  params: MemorySearchParams
): Promise<SearchResult[]> {
  // Implementation
}

// ❌ Bad: Unclear naming, missing types, no docs
async function search(q, u, l) {
  // Implementation
}
```

**Style Rules:**
- ✅ Use TypeScript strict mode
- ✅ Use functional components (React)
- ✅ Use async/await instead of promises
- ✅ Use Tailwind utility classes
- ✅ Add JSDoc comments for functions
- ✅ Use descriptive variable names
- ❌ No `any` types (use `unknown` if needed)
- ❌ No console.log in production code

### Areas Needing Help

**High Priority:**
- 🔴 Test coverage improvement
- 🔴 Mobile responsiveness
- 🔴 Accessibility (WCAG compliance)
- 🔴 Performance optimization

**Medium Priority:**
- 🟡 Additional OAuth providers
- 🟡 Export/import functionality
- 🟡 Bulk operations
- 🟡 Advanced filtering

**Low Priority:**
- 🟢 UI themes (light mode)
- 🟢 Keyboard shortcuts
- 🟢 Browser extension for Firefox/Safari
- 🟢 Mobile app

### Community Guidelines

- Be respectful and constructive
- Help others in discussions
- Report bugs with clear reproduction steps
- Suggest features with use cases
- Review PRs thoughtfully
- Celebrate contributions

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Ayush Pandey

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Acknowledgments

Built with amazing open-source technologies:

```mermaid
mindmap
  root((BrowseBaba<br/>Built With))
    Frontend
      Next.js
      React
      TypeScript
      Tailwind CSS
      Framer Motion
    Backend
      Node.js
      Drizzle ORM
      Better Auth
    Databases
      Neon PostgreSQL
      MongoDB Atlas
    AI/ML
      Google Gemini
      LangChain
    Deployment
      Vercel
    Tools
      pnpm
      Turbopack
      ESLint
```

**Special Thanks To:**
- [Next.js](https://nextjs.org/) - The React framework for production
- [Vercel](https://vercel.com/) - Deployment platform
- [Better Auth](https://www.better-auth.com/) - Authentication solution
- [Drizzle](https://orm.drizzle.team/) - TypeScript ORM
- [Google Gemini](https://ai.google.dev/) - AI model and embeddings
- [MongoDB Atlas](https://www.mongodb.com/) - Vector search database
- [Neon](https://neon.tech/) - Serverless PostgreSQL
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Lucide](https://lucide.dev/) - Beautiful icon system

---

## 📞 Support & Contact

### Get Help

```mermaid
graph LR
    A[Need Help?] --> B{Issue Type}
    
    B -->|Bug| C[GitHub Issues]
    B -->|Feature Request| D[GitHub Discussions]
    B -->|Question| E[GitHub Discussions]
    B -->|Security| F[Email Maintainer]
    
    C --> G[Create Issue]
    D --> H[Start Discussion]
    E --> H
    F --> I[Private Report]
    
    style A fill:#2196F3
    style G fill:#F44336
    style H fill:#4CAF50
    style I fill:#FF9800
```

### Contact Information

- **GitHub**: [@AyushPandey003](https://github.com/AyushPandey003)
- **Repository**: [browserbaba](https://github.com/AyushPandey003/browserbaba)
- **Issues**: [Report a bug](https://github.com/AyushPandey003/browserbaba/issues)
- **Discussions**: [Ask questions](https://github.com/AyushPandey003/browserbaba/discussions)

### Useful Links

- 📚 [Documentation](./AUTHENTICATION.md)
- 🔍 [Vector Search Setup](./VECTOR_SEARCH_SETUP.md)
- 🎯 [Project Roadmap](https://github.com/AyushPandey003/browserbaba/projects)
- 💬 [Community Chat](https://github.com/AyushPandey003/browserbaba/discussions)

---

<div align="center">

**Made with ❤️ and lots of ☕ by [Ayush Pandey](https://github.com/AyushPandey003)**

### ⭐ Star us on GitHub — it motivates us a lot!

[![GitHub stars](https://img.shields.io/github/stars/AyushPandey003/browserbaba?style=social)](https://github.com/AyushPandey003/browserbaba)
[![GitHub forks](https://img.shields.io/github/forks/AyushPandey003/browserbaba?style=social)](https://github.com/AyushPandey003/browserbaba/fork)
[![GitHub watchers](https://img.shields.io/github/watchers/AyushPandey003/browserbaba?style=social)](https://github.com/AyushPandey003/browserbaba)

[⬆ Back to Top](#-browsebaba---your-second-brain)

</div>
