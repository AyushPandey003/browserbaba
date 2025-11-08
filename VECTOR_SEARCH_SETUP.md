# Vector Search Setup Guide

This guide will help you set up MongoDB Atlas Vector Search for semantic search functionality.

## Prerequisites

1. MongoDB Atlas account (Free tier works!)
2. Google Gemini API Key
3. Database: `semanticbrowser`
4. Collection: `browserbaba`

## Step 1: Add Environment Variables

Add these to your `.env.local` file:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://ayush:<db_password>@cluster0.phrz27b.mongodb.net/

# Google Gemini API Key (for embeddings)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Step 2: Create Vector Search Index in MongoDB Atlas

### Option A: Using Atlas UI (Recommended)

1. **Go to MongoDB Atlas Dashboard**
   - Navigate to: https://cloud.mongodb.com/

2. **Select Your Cluster**
   - Click on your cluster (Cluster0)

3. **Go to Search**
   - Click on the "Search" tab
   - Click "Create Search Index"

4. **Choose JSON Editor**
   - Select "JSON Editor" option
   - Click "Next"

5. **Paste This Configuration**

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

**Important:** 
- Index Name: `vector_index` (enter this in the "Index Name" field above the JSON)
- Database: `semanticbrowser`
- Collection: `browserbaba`

6. **Select Database and Collection**
   - Database: `semanticbrowser`
   - Collection: `browserbaba`

7. **Create Index**
   - Click "Create Search Index"
   - Wait for index to build (usually 1-2 minutes)

### Option B: Using MongoDB CLI

```javascript
db.browserbaba.createSearchIndex(
  "vector_index",
  "vectorSearch",
  {
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
)
```

## Step 3: Generate Embeddings for Existing Memories

Run the migration script to generate embeddings for all existing memories:

```bash
pnpm run generate-embeddings
```

Or run it manually:

```bash
tsx lib/scripts/generate-embeddings.ts
```

## Step 4: Verify Setup

1. **Check Index Status**
   - In Atlas UI, go to Search tab
   - Verify "vector_index" shows as "Active"

2. **Test Search**
   - Go to your dashboard
   - Click the sparkle icon (✨) to enable AI search
   - Try searching: "videos about cooking" or "articles on technology"

## Understanding the Vector Search

### How It Works

1. **When Capturing Content:**
   - User saves a webpage/video/article
   - System extracts title, content, URL
   - Gemini generates 768-dimensional embedding vector
   - Vector stored in MongoDB with memory metadata

2. **When Searching:**
   - User enters search query: "cooking recipes"
   - Gemini generates embedding for the query
   - MongoDB finds similar vectors using cosine similarity
   - Results ranked by semantic similarity + keyword matching

### Hybrid Search

The system uses **hybrid search** combining:
- 70% Vector similarity (semantic understanding)
- 30% Lexical matching (keyword matching)

This provides the best of both worlds!

## Troubleshooting

### Index Not Working?

1. **Check Index Status**
   ```
   Status should be "Active" in Atlas UI
   ```

2. **Verify Collection Name**
   ```
   Database: semanticbrowser
   Collection: browserbaba
   ```

3. **Check Embedding Dimensions**
   ```
   text-embedding-004 produces 768 dimensions
   Make sure numDimensions: 768 in index config
   ```

### No Search Results?

1. **Check if embeddings exist**
   - In Atlas, browse the `browserbaba` collection
   - Documents should have an `embedding` field with array of numbers

2. **Run embedding generation script**
   ```bash
   pnpm run generate-embeddings
   ```

3. **Check API Key**
   - Verify GOOGLE_GEMINI_API_KEY is set correctly
   - Test at: https://aistudio.google.com/app/apikey

### Performance Tips

1. **numCandidates**: Set to 10x your limit for better accuracy
2. **Similarity Function**: "cosine" works best for text embeddings
3. **Filter on userId**: Ensures users only see their own memories

## Vector Search Index Configuration Explained

```json
{
  "fields": [
    {
      "type": "vector",              // Vector field type
      "path": "embedding",           // Field name containing vectors
      "numDimensions": 768,          // Gemini embedding size (text-embedding-004)
      "similarity": "cosine"         // Similarity metric (cosine/euclidean/dotProduct)
    },
    {
      "type": "filter",              // Filter field (for user-specific search)
      "path": "userId"               // Enable filtering by user ID
    }
  ]
}
```

**Field Descriptions:**
- **type: "vector"**: Specifies this field contains embedding vectors
- **path: "embedding"**: The MongoDB field name storing the vector array
- **numDimensions: 768**: Google's text-embedding-004 produces 768-dimensional vectors
- **similarity: "cosine"**: Cosine similarity works best for text embeddings (measures angle)
- **filter on userId**: Ensures users only search within their own memories

## Cost Considerations

### Google Gemini API
- Free tier: 1,500 requests/day
- text-embedding-004: Very cost-effective
- Estimate: ~0.1¢ per 1000 embeddings

### MongoDB Atlas
- Free tier (M0): Includes vector search!
- 512MB storage (enough for ~50k memories with embeddings)
- No additional cost for vector search

## Next Steps

After setup:
1. ✅ Vector index created in Atlas
2. ✅ Environment variables configured
3. ✅ Embeddings generated for existing data
4. 🎉 Try semantic search in your dashboard!

## Need Help?

- MongoDB Atlas Vector Search Docs: https://www.mongodb.com/docs/atlas/atlas-vector-search/
- Gemini Embeddings: https://ai.google.dev/gemini-api/docs/embeddings
- Issues? Check the console logs for detailed error messages
