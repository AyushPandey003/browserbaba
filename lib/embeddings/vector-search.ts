import { getVectorCollection } from '@/lib/db/mongodb';
import { generateEmbedding } from './service';
import { Memory } from '@/lib/types';

export interface VectorSearchResult {
  memoryId: string;
  score: number;
}

/**
 * Store embedding for a memory in MongoDB
 */
export async function storeMemoryEmbedding(
  memoryId: string,
  userId: string,
  title: string,
  content: string,
  url: string | null,
  tags: string[],
  embedding: number[]
) {
  const collection = await getVectorCollection();
  
  await collection.updateOne(
    { memoryId, userId },
    {
      $set: {
        memoryId,
        userId,
        title,
        content,
        url: url || '',
        tags,
        embedding,
        updatedAt: new Date()
      },
      $setOnInsert: {
        createdAt: new Date()
      }
    },
    { upsert: true }
  );
}

/**
 * Perform vector similarity search using MongoDB Atlas Vector Search
 * Note: This requires a vector search index to be created in MongoDB Atlas
 */
export async function vectorSearch(
  queryEmbedding: number[],
  userId: string,
  limit: number = 20
): Promise<VectorSearchResult[]> {
  try {
    const collection = await getVectorCollection();
    
    // MongoDB Atlas Vector Search aggregation
    const results = await collection.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index', // Name of your Atlas Search index
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: limit * 10,
          limit: limit,
          filter: {
            userId: userId
          }
        }
      },
      {
        $project: {
          memoryId: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ]).toArray();

    interface VectorResult {
      memoryId: string;
      score: number;
    }
    
    return (results as VectorResult[]).map((result) => ({
      memoryId: result.memoryId,
      score: result.score
    }));
  } catch (error: unknown) {
    // Handle MongoDB connection errors gracefully
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as { code?: string }).code;
    
    if (errorCode === 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR' || 
        errorMessage.includes('SSL') ||
        errorMessage.includes('tlsv1')) {
      console.warn('MongoDB SSL error in vector search, falling back to lexical search:', errorMessage);
      return [];
    }
    console.error('Vector search error:', error);
    // If vector search fails (index not ready, connection issues), return empty results
    return [];
  }
}

/**
 * Hybrid search: Combines vector similarity with lexical matching
 */
export async function hybridSearch(
  query: string,
  userId: string,
  memories: Memory[],
  limit: number = 20
): Promise<Memory[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Perform vector search
    const vectorResults = await vectorSearch(queryEmbedding, userId, limit);
    
    // Create a map of memoryId to vector score
    const scoreMap = new Map<string, number>();
    vectorResults.forEach(result => {
      scoreMap.set(result.memoryId, result.score);
    });
    
    // Combine vector scores with lexical matching
    const scoredMemories = memories.map(memory => {
      // Vector score (0-1 range, higher is better)
      const vectorScore = scoreMap.get(memory.id) || 0;
      
      // Lexical score (simple text matching)
      const queryLower = query.toLowerCase();
      const titleMatch = memory.title.toLowerCase().includes(queryLower);
      const contentMatch = memory.content?.toLowerCase().includes(queryLower) || false;
      const urlMatch = memory.url?.toLowerCase().includes(queryLower) || false;
      
      let lexicalScore = 0;
      if (titleMatch) lexicalScore += 0.5;
      if (contentMatch) lexicalScore += 0.3;
      if (urlMatch) lexicalScore += 0.2;
      
      // Combined score: 70% vector, 30% lexical
      const combinedScore = (vectorScore * 0.7) + (lexicalScore * 0.3);
      
      return {
        memory,
        score: combinedScore
      };
    });
    
    // Sort by combined score and return top results
    return scoredMemories
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.memory);
  } catch (error) {
    console.error('Hybrid search error:', error);
    // Fallback to lexical search only
    const queryLower = query.toLowerCase();
    return memories
      .filter(memory =>
        memory.title.toLowerCase().includes(queryLower) ||
        memory.content?.toLowerCase().includes(queryLower) ||
        memory.url?.toLowerCase().includes(queryLower)
      )
      .slice(0, limit);
  }
}
