import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hybridSearch } from '@/lib/embeddings/vector-search';
import { getMemories } from '@/lib/actions/memory-actions';
import { parseNaturalLanguageQuery, parsedQueryToSearchText } from '@/lib/search/nlp-parser';

// Helper function to add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const body = await request.json();
    const { query, searchType = 'hybrid', limit = 20 } = body;

    if (!query || typeof query !== 'string') {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Query parameter is required' },
          { status: 400 }
        )
      );
    }

    // Parse natural language query
    const parsedQuery = parseNaturalLanguageQuery(query);
    const searchText = parsedQueryToSearchText(parsedQuery);

    // Get all user's memories from PostgreSQL with filters
    const allMemories = await getMemories({ 
      userId: session.user.id,
      type: parsedQuery.contentType === 'all' ? undefined : parsedQuery.contentType,
      search: parsedQuery.keywords.length > 0 ? parsedQuery.keywords.join(' ') : undefined,
    });

    // Apply time filter if specified
    let filteredMemories = allMemories;
    if (parsedQuery.dateRange) {
      filteredMemories = allMemories.filter(memory => {
        const memoryDate = new Date(memory.createdAt);
        if (parsedQuery.dateRange?.start && memoryDate < parsedQuery.dateRange.start) {
          return false;
        }
        if (parsedQuery.dateRange?.end && memoryDate > parsedQuery.dateRange.end) {
          return false;
        }
        return true;
      });
    }

    // Apply tag filter if specified
    if (parsedQuery.tags && parsedQuery.tags.length > 0) {
      filteredMemories = filteredMemories.filter(memory => {
        const memoryTags = memory.metadata?.tags || [];
        return parsedQuery.tags!.some(tag => 
          memoryTags.some(mt => mt.toLowerCase().includes(tag.toLowerCase()))
        );
      });
    }

    let results;
    if (searchType === 'hybrid' || searchType === 'semantic') {
      // Perform hybrid search (vector + lexical) with parsed query
      results = await hybridSearch(searchText, session.user.id, filteredMemories, limit);
    } else {
      // Fallback to simple lexical search
      const queryLower = searchText.toLowerCase();
      results = filteredMemories
        .filter(memory =>
          memory.title.toLowerCase().includes(queryLower) ||
          memory.content?.toLowerCase().includes(queryLower) ||
          memory.url?.toLowerCase().includes(queryLower)
        )
        .slice(0, limit);
    }

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        query,
        parsedQuery,
        results,
        count: results.length,
        searchType,
      })
    );
  } catch (error) {
    console.error('Error in semantic search:', error);
    return addCorsHeaders(
      NextResponse.json(
        { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    );
  }
}
