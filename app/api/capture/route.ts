import { createMemory, getMemories } from '@/lib/actions/memory-actions';
import { CreateMemoryInput } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateMemoryEmbedding } from '@/lib/embeddings/service';
import { storeMemoryEmbedding } from '@/lib/embeddings/vector-search';

// Helper function to add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

// Handle OPTIONS requests for CORS preflight
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
      return addCorsHeaders(NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      ));
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.type) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Missing required fields: title and type' },
        { status: 400 }
      ));
    }

    // Validate type
    const validTypes = ['article', 'product', 'video', 'todo', 'note'];
    if (!validTypes.includes(body.type)) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Invalid type. Must be one of: article, product, video, todo, note' },
        { status: 400 }
      ));
    }

    // Extract links from metadata if provided
    const extractedLinks = body.links || body.metadata?.links || [];
    
    // Build comprehensive input with all fields
    const input: CreateMemoryInput = {
      title: body.title,
      type: body.type,
      url: body.url,
      content: body.content,
      selectedText: body.selectedText || body.selected_text,
      contextBefore: body.contextBefore || body.context_before,
      contextAfter: body.contextAfter || body.context_after,
      fullContext: body.fullContext || body.full_context,
      elementType: body.elementType || body.element_type,
      pageSection: body.pageSection || body.page_section,
      xpath: body.xpath,
      notes: body.notes,
      metadata: {
        ...body.metadata,
        // Video-specific fields
        videoPlatform: body.metadata?.videoPlatform || body.video_info?.type || body.video_platform,
        videoTimestamp: body.metadata?.videoTimestamp || body.video_info?.currentTime || body.video_timestamp,
        videoDuration: body.metadata?.videoDuration || body.video_info?.duration || body.video_duration,
        videoTitle: body.metadata?.videoTitle || body.video_info?.title || body.video_title,
        videoUrl: body.metadata?.videoUrl || body.video_info?.url || body.video_url,
        formattedTimestamp: body.metadata?.formattedTimestamp || body.formatted_timestamp,
        thumbnail: body.metadata?.thumbnail || body.thumbnailUrl || body.thumbnail_url,
      },
      links: extractedLinks.map((link: { text?: string; linkText?: string; href?: string; url?: string; linkTitle?: string; title?: string }) => ({
        text: link.text || link.linkText,
        href: link.href || link.url || '',
        linkTitle: link.linkTitle || link.title,
      })),
      source: body.source || 'extension',
      userId: session.user.id,
    };

    // Create memory immediately (fast response)
    const result = await createMemory(input);

    if (!result) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Failed to create memory' },
        { status: 500 }
      ));
    }

    // Process in background (don't block the response)
    (async () => {
      try {
        // 1. Generate and store embedding
        const embedding = await generateMemoryEmbedding({
          title: result.title,
          content: result.content || result.selectedText || '',
          url: result.url
        });
        
        await storeMemoryEmbedding(
          result.id,
          session.user.id,
          result.title,
          result.content || result.selectedText || '',
          result.url,
          result.metadata?.tags || [],
          embedding
        );
        
        console.log(`✅ Embedding stored for memory ${result.id}`);
      } catch (embeddingError) {
        console.error('Error storing embedding:', embeddingError);
        // Don't fail the request if embedding fails
      }

      // 2. If URL provided and no content, try Firecrawl in background
      if (result.url && !result.content && !result.selectedText) {
        try {
          const { scrapeUrl } = await import('@/lib/actions/firecrawl-actions');
          const { updateMemoryContent } = await import('@/lib/actions/memory-actions');
          const scrapeResult = await scrapeUrl(result.url);
          
          if (scrapeResult.success && scrapeResult.data) {
            // Update memory with scraped content and links
            await updateMemoryContent(result.id, {
              content: scrapeResult.data.content || scrapeResult.data.markdown || '',
              links: scrapeResult.data.links?.map(link => ({
                text: link.text,
                href: link.href,
                linkTitle: link.text,
              })) || [],
            });
            console.log(`✅ Firecrawl completed and updated memory ${result.id}`);
          }
        } catch (scrapeError) {
          console.error('Error scraping URL in background:', scrapeError);
          // Silent fail - user already has the memory saved
        }
      }
    })();

    return addCorsHeaders(NextResponse.json(
      {
        success: true,
        id: result.id,
        message: 'Memory captured successfully',
      },
      { status: 201 }
    ));
  } catch (error) {
    console.error('Error in /api/capture:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ));
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ));
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    // Always filter by the authenticated user's ID
    const memories = await getMemories({
      type,
      search,
      limit,
      userId: session.user.id,
    });

    return addCorsHeaders(NextResponse.json(
      {
        success: true,
        memories,
        count: memories.length,
      },
      { status: 200 }
    ));
  } catch (error) {
    console.error('Error in GET /api/capture:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ));
  }
}

