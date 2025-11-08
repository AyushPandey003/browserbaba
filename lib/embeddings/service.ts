import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy initialization to avoid build-time errors
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    throw new Error('Please add your GOOGLE_GEMINI_API_KEY to .env.local');
  }
  
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
  }
  
  return genAI;
}

/**
 * Generate embeddings for text using Google's Gemini embedding model
 * @param text - The text to generate embeddings for
 * @returns An array of numbers representing the embedding vector (768 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: 'text-embedding-004' });
    
    // Clean and prepare text
    const cleanText = text.trim().slice(0, 10000); // Limit to 10k chars
    
    if (!cleanText) {
      throw new Error('Text is empty after cleaning');
    }

    const result = await model.embedContent(cleanText);
    const embedding = result.embedding;
    
    if (!embedding.values || embedding.values.length === 0) {
      throw new Error('No embedding values returned');
    }

    return embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate embeddings for a memory item
 * Combines title, content, and URL for better semantic representation
 */
export async function generateMemoryEmbedding(memory: {
  title: string;
  content?: string | null;
  url?: string | null;
}): Promise<number[]> {
  // Combine relevant fields for embedding
  const textParts = [
    memory.title,
    memory.content || '',
    memory.url || ''
  ].filter(Boolean);
  
  const combinedText = textParts.join('\n\n');
  
  return generateEmbedding(combinedText);
}
