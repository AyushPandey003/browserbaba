import { NextRequest, NextResponse } from 'next/server';
import { getMemories } from '@/lib/actions/memory-actions';
import {
  generateEmbedding,
  generateEmbeddings,
  cosineSimilarity,
} from '@/backend/embeddings';

export const runtime = 'edge'; // Enable Vercel Edge Runtime for fast responses

/**
 * POST /api/search - Search memories with filters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, filters, limit = 10 } = body;
    // Support either simple text query or semantic label-based search
    const labels = body.labels || filters?.labels;
    const useSemanticLabels = !!body.semanticLabels || !!filters?.semanticLabels;

    if (!query && !labels) {
      return NextResponse.json(
        { error: 'Either "query" or "labels" must be provided' },
        { status: 400 }
      );
    }

    // If labels + semanticLabels requested, perform semantic ranking by labels
    if (labels && useSemanticLabels) {
      const labelsText = Array.isArray(labels) ? labels.join(' ') : String(labels);

      // Fetch candidate memories (optionally filter by type)
      // We avoid setting a strict limit here because we need enough candidates to rank;
      // downstream we will slice to `limit`.
      const candidates = await getMemories({ type: filters?.type });

      // If no candidates, return empty
      if (!Array.isArray(candidates) || candidates.length === 0) {
        return NextResponse.json({ mode: 'semantic-labels', query: labelsText, results: [], count: 0 });
      }

      // Build texts to embed for each memory. Focus on labels/tags and title/content snippets.
      const memoryTexts = candidates.map((m) => {
        const tags = m.metadata?.tags && Array.isArray(m.metadata.tags)
          ? (m.metadata.tags as string[]).join(' ')
          : '';
        // Keep it short to reduce token usage
        const contentSnippet = m.content ? String(m.content).slice(0, 1000) : '';
        return [tags, m.title || '', contentSnippet].filter(Boolean).join('\n');
      });

      // Generate embeddings for candidates in batch
      const candidateEmbeddings = await generateEmbeddings(memoryTexts, 'RETRIEVAL_DOCUMENT', 768);

      // Generate embedding for label query
      const queryEmbedding = await generateEmbedding(labelsText, 'RETRIEVAL_QUERY', 768);

      // Score candidates by cosine similarity
      const scored = candidates.map((memory, idx) => ({
        memory,
        score: cosineSimilarity(queryEmbedding, candidateEmbeddings[idx]),
      }));

      // Sort descending by score
      scored.sort((a, b) => b.score - a.score);

      const top = scored.slice(0, limit).map((s) => ({ memory: s.memory, score: s.score, reason: 'Semantic label match' }));

      return NextResponse.json({ mode: 'semantic-labels', query: labelsText, results: top, count: scored.length });
    }

    // Fallback: simple text search (existing behavior)
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Perform simple text search
    const results = await getMemories({
      search: query,
      type: filters?.type,
      limit,
    });

    return NextResponse.json({
      mode: 'search',
      query,
      results: results.map((memory) => ({ memory, score: 1.0, reason: 'Text match' })),
      count: results.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { 
        error: 'Search failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/search - Quick search (query params)
 * 
 * Example: /api/search?q=AI+agents&type=article&limit=5
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const results = await getMemories({
      search: query,
      type: type || undefined,
      limit,
    });

    return NextResponse.json({
      mode: 'search',
      query,
      results: results.map((memory) => ({
        memory,
        score: 1.0,
        reason: 'Text match'
      })),
      count: results.length,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
