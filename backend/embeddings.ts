import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Supported task types for Gemini embeddings
 * - RETRIEVAL_DOCUMENT: For indexing documents in a search system
 * - RETRIEVAL_QUERY: For search queries to find relevant documents
 * - SEMANTIC_SIMILARITY: For comparing text similarity
 * - CLASSIFICATION: For text classification tasks
 * - CLUSTERING: For grouping similar texts
 */
export type EmbeddingTaskType = 
  | 'RETRIEVAL_DOCUMENT'
  | 'RETRIEVAL_QUERY' 
  | 'SEMANTIC_SIMILARITY'
  | 'CLASSIFICATION'
  | 'CLUSTERING';

/**
 * Generate embeddings for text using Gemini embedding-001 model
 * Returns 768-dimensional normalized vector
 * 
 * @param text - Text to embed (max 2048 tokens)
 * @param taskType - Task type to optimize embeddings (default: RETRIEVAL_DOCUMENT)
 * @param outputDimensionality - Output dimension (128-3072, recommended: 768, 1536, or 3072)
 */
export async function generateEmbedding(
  text: string, 
  taskType: EmbeddingTaskType = 'RETRIEVAL_DOCUMENT',
  outputDimensionality: number = 768
): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'models/embedding-001',
    });
    
    const result = await model.embedContent(text);
    
    let embedding = result.embedding.values;
    
    // Truncate to desired dimensionality if needed
    if (embedding.length > outputDimensionality) {
      embedding = embedding.slice(0, outputDimensionality);
    }
    
    // Normalize embeddings for dimensions < 3072 (as per Gemini docs)
    if (outputDimensionality < 3072) {
      return normalizeEmbedding(embedding);
    }
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * More efficient for processing multiple documents at once
 * 
 * @param texts - Array of texts to embed
 * @param taskType - Task type to optimize embeddings
 * @param outputDimensionality - Output dimension (default: 768)
 */
export async function generateEmbeddings(
  texts: string[], 
  taskType: EmbeddingTaskType = 'RETRIEVAL_DOCUMENT',
  outputDimensionality: number = 768
): Promise<number[][]> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'models/embedding-001',
    });
    
    // Process in parallel for better performance
    const results = await Promise.all(
      texts.map(text => model.embedContent(text))
    );
    
    let embeddings = results.map(result => result.embedding.values);
    
    // Truncate to desired dimensionality if needed
    embeddings = embeddings.map(emb => 
      emb.length > outputDimensionality ? emb.slice(0, outputDimensionality) : emb
    );
    
    // Normalize if needed
    if (outputDimensionality < 3072) {
      return embeddings.map(normalizeEmbedding);
    }
    
    return embeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error('Failed to generate embeddings');
  }
}

/**
 * Normalize embedding vector to unit length
 * Required for dimensions < 3072 to ensure accurate similarity comparisons
 */
export function normalizeEmbedding(embedding: number[]): number[] {
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / norm);
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Prepare text for embedding (combine title, content, metadata)
 */
export function prepareTextForEmbedding(memory: {
  title: string;
  content?: string | null;
  metadata?: any;
  type: string;
}): string {
  const parts = [
    `Type: ${memory.type}`,
    `Title: ${memory.title}`,
  ];

  if (memory.content) {
    parts.push(`Content: ${memory.content.substring(0, 5000)}`); // Limit content length
  }

  if (memory.metadata) {
    if (memory.metadata.tags) {
      parts.push(`Tags: ${memory.metadata.tags.join(', ')}`);
    }
    if (memory.metadata.author) {
      parts.push(`Author: ${memory.metadata.author}`);
    }
    if (memory.metadata.source) {
      parts.push(`Source: ${memory.metadata.source}`);
    }
  }

  return parts.join('\n');
}
