/**
 * Natural Language Search Parser
 * Parses queries like "articles about AI last month" into structured search parameters
 */

export interface ParsedQuery {
  keywords: string[];
  contentType?: 'article' | 'video' | 'product' | 'note' | 'todo' | 'all';
  timeFilter?: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'all';
  tags?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  originalQuery: string;
}

// Content type keywords
const CONTENT_TYPE_PATTERNS: Record<string, string[]> = {
  article: ['article', 'articles', 'blog', 'post', 'posting', 'essay', 'piece', 'writing', 'text', 'recipe', 'recipes', 'tutorial', 'guide'],
  video: ['video', 'videos', 'youtube', 'watch', 'stream', 'clip', 'movie', 'film'],
  product: ['product', 'products', 'item', 'items', 'buy', 'purchase', 'shop', 'shopping'],
  note: ['note', 'notes', 'memo', 'memos', 'jot', 'jotting'],
  todo: ['todo', 'todos', 'task', 'tasks', 'reminder', 'reminders'],
};

// Time filter patterns
const TIME_PATTERNS: Record<string, string[]> = {
  today: ['today', 'this day'],
  yesterday: ['yesterday'],
  week: ['week', 'this week', 'last week', 'past week', '7 days', 'seven days'],
  month: ['month', 'this month', 'last month', 'past month', '30 days', 'thirty days'],
  year: ['year', 'this year', 'last year', 'past year', '365 days'],
};

// Tag extraction patterns
const TAG_PATTERNS = [
  /(?:about|on|regarding|concerning)\s+([a-z]+(?:\s+[a-z]+)*)/gi,
  /(?:tagged|tag|tags)\s+(?:as|with)?\s+([a-z]+(?:\s+[a-z]+)*)/gi,
  /#(\w+)/g,
];

export function parseNaturalLanguageQuery(query: string): ParsedQuery {
  const lowerQuery = query.toLowerCase().trim();
  const originalQuery = query;
  
  const result: ParsedQuery = {
    keywords: [],
    originalQuery,
  };

  // Extract content type
  for (const [type, patterns] of Object.entries(CONTENT_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      const regex = new RegExp(`\\b${pattern}\\b`, 'i');
      if (regex.test(lowerQuery)) {
        result.contentType = type as ParsedQuery['contentType'];
        // Remove the content type word from keywords
        query = query.replace(regex, '').trim();
        break;
      }
    }
    if (result.contentType) break;
  }

  // Extract time filter
  for (const [timeFilter, patterns] of Object.entries(TIME_PATTERNS)) {
    for (const pattern of patterns) {
      const regex = new RegExp(`\\b${pattern}\\b`, 'i');
      if (regex.test(lowerQuery)) {
        result.timeFilter = timeFilter as ParsedQuery['timeFilter'];
        // Remove time words from keywords
        query = query.replace(regex, '').trim();
        break;
      }
    }
    if (result.timeFilter) break;
  }

  // Extract tags
  const foundTags: string[] = [];
  for (const pattern of TAG_PATTERNS) {
    const matches = query.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        foundTags.push(match[1].trim());
        query = query.replace(match[0], '').trim();
      }
    }
  }
  if (foundTags.length > 0) {
    result.tags = foundTags;
  }

  // Extract remaining keywords (remove common stop words)
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'him', 'us', 'them',
    'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't',
    'can', 'will', 'just', 'don', 'should', 'now', 'about', 'on', 'regarding', 'concerning',
  ]);

  const words = query
    .split(/\s+/)
    .map(w => w.toLowerCase().replace(/[^\w]/g, ''))
    .filter(w => w.length > 2 && !stopWords.has(w));

  result.keywords = [...new Set(words)]; // Remove duplicates

  // If no keywords found but query exists, use the whole query
  if (result.keywords.length === 0 && query.trim().length > 0) {
    result.keywords = [query.trim()];
  }

  // Calculate date range if time filter is specified
  if (result.timeFilter && result.timeFilter !== 'all') {
    const now = new Date();
    const end = new Date(now);
    let start: Date;

    switch (result.timeFilter) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'yesterday':
        start = new Date(now);
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start = new Date(now);
        start.setMonth(start.getMonth() - 1);
        break;
      case 'year':
        start = new Date(now);
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start = new Date(0);
    }

    result.dateRange = { start, end };
  }

  return result;
}

/**
 * Convert parsed query back to searchable text for semantic search
 */
export function parsedQueryToSearchText(parsed: ParsedQuery): string {
  const parts: string[] = [];
  
  if (parsed.keywords.length > 0) {
    parts.push(parsed.keywords.join(' '));
  }
  
  if (parsed.contentType && parsed.contentType !== 'all') {
    parts.push(parsed.contentType);
  }
  
  if (parsed.tags && parsed.tags.length > 0) {
    parts.push(parsed.tags.join(' '));
  }

  return parts.join(' ').trim() || parsed.originalQuery;
}

