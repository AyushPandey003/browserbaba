import { GoogleGenerativeAI } from '@google/generative-ai';
import { getVectorCollection, MemoryVector } from './db/mongodb';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

/**
 * Generate embeddings using Google's text-embedding-004 model
 * This model produces 768-dimensional embeddings optimized for semantic search
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    const result = await model.embedContent(text);
    const embedding = result.embedding;
    
    return embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Store memory embedding in MongoDB
 */
export async function storeMemoryEmbedding(
  memoryId: string,
  userId: string,
  title: string,
  content: string,
  url?: string,
  tags: string[] = []
): Promise<void> {
  try {
    // Generate embedding from title + content
    const textToEmbed = `${title}\n\n${content}`.substring(0, 5000); // Limit to 5000 chars
    const embedding = await generateEmbedding(textToEmbed);

    const collection = await getVectorCollection();
    
    const vectorDoc: MemoryVector = {
      memoryId,
      userId,
      title,
      content: content.substring(0, 2000), // Store truncated content
      url,
      tags,
      embedding,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Upsert the document (update if exists, insert if not)
    await collection.updateOne(
      { memoryId },
      { $set: vectorDoc },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error storing memory embedding:', error);
    throw error;
  }
}

/**
 * Update memory embedding in MongoDB
 */
export async function updateMemoryEmbedding(
  memoryId: string,
  title: string,
  content: string,
  tags: string[] = []
): Promise<void> {
  try {
    const textToEmbed = `${title}\n\n${content}`.substring(0, 5000);
    const embedding = await generateEmbedding(textToEmbed);

    const collection = await getVectorCollection();
    
    await collection.updateOne(
      { memoryId },
      {
        $set: {
          title,
          content: content.substring(0, 2000),
          tags,
          embedding,
          updatedAt: new Date(),
        },
      }
    );
  } catch (error) {
    console.error('Error updating memory embedding:', error);
    throw error;
  }
}

/**
 * Delete memory embedding from MongoDB
 */
export async function deleteMemoryEmbedding(memoryId: string): Promise<void> {
  try {
    const collection = await getVectorCollection();
    await collection.deleteOne({ memoryId });
  } catch (error) {
    console.error('Error deleting memory embedding:', error);
    throw error;
  }
}

/**
 * Perform semantic search using MongoDB Atlas Vector Search
 * Returns memory IDs ranked by semantic similarity
 */
export async function semanticSearch(
  query: string,
  userId: string,
  limit: number = 10
): Promise<Array<{ memoryId: string; score: number; title: string; content: string }>> {
  try {
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);

    const collection = await getVectorCollection();

    // MongoDB Atlas Vector Search aggregation pipeline
    const results = await collection.aggregate([
      {
        $vectorSearch: {
          index: 'memory_vector_index', // You'll need to create this index in MongoDB Atlas
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: limit * 10, // Number of candidates to consider
          limit: limit,
          filter: {
            userId: userId, // Filter by user
          },
        },
      },
      {
        $project: {
          memoryId: 1,
          title: 1,
          content: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]).toArray();

    return results.map((result) => ({
      memoryId: result.memoryId,
      score: result.score || 0,
      title: result.title,
      content: result.content,
    }));
  } catch (error) {
    console.error('Error performing semantic search:', error);
    throw error;
  }
}

/**
 * Hybrid search: Combines semantic search with keyword matching
 */
export async function hybridSearch(
  query: string,
  userId: string,
  limit: number = 10
): Promise<Array<{ memoryId: string; score: number; title: string; content: string }>> {
  try {
    const queryEmbedding = await generateEmbedding(query);
    const collection = await getVectorCollection();

    // Perform vector search with text search boost
    const results = await collection.aggregate([
      {
        $vectorSearch: {
          index: 'memory_vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: limit * 10,
          limit: limit * 2, // Get more results for filtering
          filter: {
            userId: userId,
          },
        },
      },
      {
        $addFields: {
          vectorScore: { $meta: 'vectorSearchScore' },
          // Boost score if query keywords match title or content
          keywordScore: {
            $cond: {
              if: {
                $or: [
                  { $regexMatch: { input: '$title', regex: query, options: 'i' } },
                  { $regexMatch: { input: '$content', regex: query, options: 'i' } },
                ],
              },
              then: 0.3, // Boost score by 0.3 for keyword matches
              else: 0,
            },
          },
        },
      },
      {
        $addFields: {
          score: { $add: ['$vectorScore', '$keywordScore'] },
        },
      },
      {
        $sort: { score: -1 },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          memoryId: 1,
          title: 1,
          content: 1,
          score: 1,
        },
      },
    ]).toArray();

    return results.map((result) => ({
      memoryId: result.memoryId,
      score: result.score || 0,
      title: result.title,
      content: result.content,
    }));
  } catch (error) {
    console.error('Error performing hybrid search:', error);
    throw error;
  }
}
