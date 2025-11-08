import { GoogleGenerativeAI } from '@google/generative-ai';
import { MongoClient, Collection } from 'mongodb';
import { db } from './db';
import { memories, type Memory as DbMemory } from './db/schema';
import { eq, and, like, or, inArray } from 'drizzle-orm';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// MongoDB client for vector storage
let mongoClient: MongoClient | null = null;
let isConnecting = false;

interface EmbeddingDocument {
  memoryId: string;
  userId: string;
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
}

interface VectorSearchResult {
  memoryId: string;
  score: number;
}

async function getMongoClient(): Promise<MongoClient | null> {
  if (mongoClient) {
    try {
      await mongoClient.db().admin().ping();
      return mongoClient;
    } catch {
      mongoClient = null;
    }
  }
  
  if (isConnecting) {
    // Wait for existing connection attempt
    await new Promise(resolve => setTimeout(resolve, 1000));
    return getMongoClient();
  }
  
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI not set, semantic search will be disabled');
    return null;
  }
  
  try {
    isConnecting = true;
    mongoClient = new MongoClient(process.env.MONGODB_URI);
    await mongoClient.connect();
    console.log('Connected to MongoDB for vector search');
    isConnecting = false;
    return mongoClient;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    isConnecting = false;
    return null;
  }
}

/**
 * Generate embeddings using Google's text-embedding-004 model
 * This model produces 768-dimensional embeddings optimized for semantic search
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    // Clean and prepare text
    const cleanText = text.replace(/\s+/g, ' ').trim().substring(0, 10000); // Limit to 10k chars
    
    const result = await model.embedContent(cleanText);
    const embedding = result.embedding;
    
    return embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Store embedding in MongoDB for a memory
 */
export async function storeEmbedding(memoryId: string, userId: string, text: string): Promise<void> {
  try {
    const client = await getMongoClient();
    if (!client) return;
    
    const embedding = await generateEmbedding(text);
    
    const database = client.db('browserbaba');
    const collection: Collection<EmbeddingDocument> = database.collection('embeddings');
    
    await collection.updateOne(
      { memoryId },
      {
        $set: {
          memoryId,
          userId,
          embedding,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error storing embedding:', error);
  }
}

/**
 * Semantic search using MongoDB Atlas Vector Search
 * Uses cosine similarity to find the most semantically similar memories
 */
export async function semanticSearch(query: string, userId: string, limit: number = 20) {
  try {
    const client = await getMongoClient();
    if (!client) {
      console.warn('MongoDB not available, falling back to keyword search');
      return keywordSearch(query, userId, limit);
    }
    
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);
    
    const database = client.db('browserbaba');
    const collection = database.collection('embeddings');
    
    // Perform vector search using aggregation pipeline
    const results = await collection.aggregate<VectorSearchResult>([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: limit * 10,
          limit: limit,
          filter: { userId: userId }
        }
      },
      {
        $project: {
          memoryId: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ]).toArray();
    
    // Get memory details from PostgreSQL
    const memoryIds = results.map(r => r.memoryId);
    if (memoryIds.length === 0) return [];
    
    const memoryResults = await db
      .select()
      .from(memories)
      .where(
        and(
          eq(memories.userId, userId),
          inArray(memories.id, memoryIds)
        )
      );
    
    // Map and sort by vector search score
    const scoreMap = new Map(results.map(r => [r.memoryId, r.score]));
    return memoryResults
      .map((m: DbMemory) => ({
        ...m,
        similarity: scoreMap.get(m.id) || 0
      }))
      .sort((a: DbMemory & { similarity: number }, b: DbMemory & { similarity: number }) => b.similarity - a.similarity);
      
  } catch (error) {
    console.error('Error in semantic search:', error);
    // Fallback to keyword search
    return keywordSearch(query, userId, limit);
  }
}

/**
 * Keyword-based search fallback
 */
async function keywordSearch(query: string, userId: string, limit: number) {
  const results = await db
    .select()
    .from(memories)
    .where(
      and(
        eq(memories.userId, userId),
        or(
          like(memories.title, `%${query}%`),
          like(memories.content, `%${query}%`),
          like(memories.tags, `%${query}%`)
        )
      )
    )
    .limit(limit);
    
  return results.map((r: DbMemory) => ({ ...r, similarity: 0.5 }));
}

/**
 * Hybrid search combining semantic search with keyword search
 * Provides best of both worlds: semantic understanding + exact matches
 */
export async function hybridSearch(
  query: string,
  userId: string,
  limit: number = 20
) {
  try {
    // Get semantic search results
    const semanticResults = await semanticSearch(query, userId, Math.ceil(limit * 0.7));
    
    // Get keyword search results  
    const keywordResults = await keywordSearch(query, userId, Math.ceil(limit * 0.5));
    
    // Merge and deduplicate results
    const seen = new Set<string>();
    type SearchResult = DbMemory & { similarity: number; matchType?: 'semantic' | 'keyword' };
    const combined: SearchResult[] = [];
    
    // Add semantic results first (they're ranked by similarity)
    for (const result of semanticResults) {
      if (!seen.has(result.id)) {
        seen.add(result.id);
        combined.push({
          ...result,
          matchType: 'semantic',
        });
      }
    }
    
    // Add keyword results
    for (const result of keywordResults) {
      if (!seen.has(result.id)) {
        seen.add(result.id);
        combined.push({
          ...result,
          matchType: 'keyword',
          similarity: 0.7, // Give keyword matches a default similarity score
        });
      }
    }
    
    // Sort by similarity score
    return combined
      .sort((a: SearchResult, b: SearchResult) => b.similarity - a.similarity)
      .slice(0, limit);
      
  } catch (error) {
    console.error('Error in hybrid search:', error);
    // Fallback to keyword search only
    return keywordSearch(query, userId, limit);
  }
}

/**
 * Batch process memories to generate and store embeddings
 * This should be called when new memories are created
 */
export async function batchGenerateEmbeddings(userId: string, memoryIds?: string[]) {
  try {
    const client = await getMongoClient();
    if (!client) return;
    
    // Get memories that don't have embeddings yet
    let memoriesToProcess;
    if (memoryIds && memoryIds.length > 0) {
      memoriesToProcess = await db
        .select()
        .from(memories)
        .where(
          and(
            eq(memories.userId, userId),
            inArray(memories.id, memoryIds)
          )
        );
    } else {
      memoriesToProcess = await db
        .select()
        .from(memories)
        .where(eq(memories.userId, userId));
    }
    
    // Process each memory
    for (const memory of memoriesToProcess) {
      const text = [
        memory.title,
        memory.content,
        memory.selectedText,
        memory.tags,
      ]
        .filter(Boolean)
        .join(' ');
      
      if (text.trim()) {
        await storeEmbedding(memory.id, userId, text);
      }
    }
    
    console.log(`Generated embeddings for ${memoriesToProcess.length} memories`);
  } catch (error) {
    console.error('Error in batch embedding generation:', error);
  }
}

/**
 * Delete embedding when a memory is deleted
 */
export async function deleteEmbedding(memoryId: string): Promise<void> {
  try {
    const client = await getMongoClient();
    if (!client) return;
    
    const database = client.db('browserbaba');
    const collection = database.collection('embeddings');
    
    await collection.deleteOne({ memoryId });
  } catch (error) {
    console.error('Error deleting embedding:', error);
  }
}
