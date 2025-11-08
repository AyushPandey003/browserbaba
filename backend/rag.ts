import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db';
import { memories, type Memory } from '@/lib/db/schema';
import { and, gte, lte, eq, like, or } from 'drizzle-orm';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface SearchQuery {
  query: string;
  filters?: {
    type?: string;
    dateFrom?: Date;
    dateTo?: Date;
    tags?: string[];
  };
  limit?: number;
}

interface SearchResult {
  memory: Memory;
  score: number;
  reason: string;
}

/**
 * Parse natural language query to extract filters and intent
 */
export function parseQuery(query: string): {
  cleanQuery: string;
  type?: string;
  dateFilter?: { from?: Date; to?: Date };
  tags?: string[];
} {
  let cleanQuery = query.toLowerCase();
  let type: string | undefined;
  let dateFilter: { from?: Date; to?: Date } | undefined;
  const tags: string[] = [];

  // Extract content type
  const typePatterns = [
    { pattern: /\b(articles?|posts?|blogs?)\b/i, type: 'article' },
    { pattern: /\b(videos?|clips?|recordings?)\b/i, type: 'video' },
    { pattern: /\b(products?|items?|purchases?)\b/i, type: 'product' },
    { pattern: /\b(notes?|memos?)\b/i, type: 'note' },
    { pattern: /\b(todos?|tasks?)\b/i, type: 'todo' },
  ];

  for (const { pattern, type: contentType } of typePatterns) {
    if (pattern.test(cleanQuery)) {
      type = contentType;
      cleanQuery = cleanQuery.replace(pattern, '').trim();
      break;
    }
  }

  // Extract time filters
  const now = new Date();
  const timePatterns = [
    {
      pattern: /\b(today|this day)\b/i,
      from: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    },
    {
      pattern: /\byesterday\b/i,
      from: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
      to: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    },
    {
      pattern: /\b(this week|last 7 days?)\b/i,
      from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      pattern: /\b(this month|last month|last 30 days?)\b/i,
      from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      pattern: /\b(this year|last year)\b/i,
      from: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const { pattern, from, to } of timePatterns) {
    if (pattern.test(cleanQuery)) {
      dateFilter = { from, to };
      cleanQuery = cleanQuery.replace(pattern, '').trim();
      break;
    }
  }

  // Extract hashtags as tags
  const hashtagMatches = cleanQuery.match(/#\w+/g);
  if (hashtagMatches) {
    tags.push(...hashtagMatches.map(tag => tag.substring(1)));
    cleanQuery = cleanQuery.replace(/#\w+/g, '').trim();
  }

  // Clean up extra spaces
  cleanQuery = cleanQuery.replace(/\s+/g, ' ').trim();

  return {
    cleanQuery,
    type,
    dateFilter,
    tags: tags.length > 0 ? tags : undefined,
  };
}

/**
 * Semantic search using text matching
 * Note: Vector similarity search disabled until embedding column is added to schema
 */
export async function semanticSearch({
  query,
  filters,
  limit = 10,
}: SearchQuery): Promise<SearchResult[]> {
  try {
    // Parse natural language query
    const parsed = parseQuery(query);
    const searchQuery = parsed.cleanQuery || query;

    // Build SQL conditions
    const conditions = [];

    // Apply type filter (using contentType from schema)
    const typeValue = filters?.type || parsed.type;
    if (typeValue) {
      conditions.push(eq(memories.contentType, typeValue));
    }

    // Apply date filters
    if (filters?.dateFrom || (parsed.dateFilter && parsed.dateFilter.from)) {
      const fromDate = filters?.dateFrom || parsed.dateFilter?.from;
      if (fromDate) {
        conditions.push(gte(memories.createdAt, fromDate));
      }
    }
    if (filters?.dateTo || (parsed.dateFilter && parsed.dateFilter.to)) {
      const toDate = filters?.dateTo || parsed.dateFilter?.to;
      if (toDate) {
        conditions.push(lte(memories.createdAt, toDate));
      }
    }

    // Add text search conditions
    if (searchQuery) {
      const textConditions = or(
        like(memories.title, `%${searchQuery}%`),
        like(memories.content, `%${searchQuery}%`),
        like(memories.selectedText, `%${searchQuery}%`)
      );
      if (textConditions) {
        conditions.push(textConditions);
      }
    }

    // Execute query
    const results = await db
      .select()
      .from(memories)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit);

    // Calculate similarity scores and generate reasons
    return results.map((memory: Memory) => {
      const score = calculateRelevanceScore(memory, searchQuery, parsed);
      const reason = generateMatchReason(memory, searchQuery);

      return {
        memory,
        score,
        reason,
      };
    });
  } catch (error) {
    console.error('Semantic search error:', error);
    throw new Error('Failed to perform semantic search');
  }
}

/**
 * Calculate relevance score based on multiple factors
 */
function calculateRelevanceScore(
  memory: Memory,
  query: string,
  parsed: ReturnType<typeof parseQuery>
): number {
  let score = 0;

  const lowerQuery = query.toLowerCase();

  // Title match (highest weight)
  if (memory.title.toLowerCase().includes(lowerQuery)) {
    score += 0.4;
  }

  // Content match
  if (memory.content?.toLowerCase().includes(lowerQuery)) {
    score += 0.3;
  }

  // Selected text match
  if (memory.selectedText?.toLowerCase().includes(lowerQuery)) {
    score += 0.2;
  }

  // Type match
  if (parsed.type && memory.contentType === parsed.type) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}

/**
 * Generate human-readable match reason
 */
function generateMatchReason(
  memory: Memory,
  query: string
): string {
  const reasons: string[] = [];
  const lowerQuery = query.toLowerCase();

  if (memory.title.toLowerCase().includes(lowerQuery)) {
    reasons.push('title');
  }

  if (memory.content?.toLowerCase().includes(lowerQuery)) {
    reasons.push('content');
  }

  if (memory.selectedText?.toLowerCase().includes(lowerQuery)) {
    reasons.push('selected text');
  }

  if (reasons.length === 0) {
    reasons.push('filters');
  }

  return `Matched in ${reasons.join(', ')}`;
}

/**
 * Generate AI response using Gemini for conversational queries
 */
export async function generateAIResponse(
  query: string,
  context: Memory[]
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const contextText = context
      .map(
        (mem, i) =>
          `[${i + 1}] ${mem.title}\n${mem.content?.substring(0, 500) || 'No content'}\n`
      )
      .join('\n');

    const prompt = `You are a helpful AI assistant for a "second brain" app called Synapse. 
The user has asked: "${query}"

Here are the most relevant memories from their collection:
${contextText}

Based on these memories, provide a helpful, concise answer to their query. If you reference specific memories, mention them by number. If the memories don't contain relevant information, say so.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate AI response');
  }
}
