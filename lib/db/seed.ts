// Load environment variables first (before any other imports)
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { db } from './index';
import { memories } from './schema';

const mockMemories = [
  // Page/Article memories
  {
    url: 'https://medium.com/@techblog/building-second-brain-ai',
    title: 'Building Modern Second Brain Apps with AI',
    contentType: 'page',
    content: 'This comprehensive guide explores how to design and build second-brain applications that leverage artificial intelligence. We cover semantic search, vector embeddings, and intelligent content organization to help users manage their digital knowledge effectively.',
    selectedText: '',
    tags: 'AI,PKM,Second Brain,Knowledge Management',
    notes: 'Great resource for understanding modern PKM systems',
  },
  {
    url: 'https://nextjs.org/blog/next-14',
    title: 'The Complete Guide to Next.js 14 App Router',
    contentType: 'page',
    content: 'Deep dive into Next.js 14\'s revolutionary App Router. Learn about Server Components, streaming, parallel routes, intercepting routes, and how to build performant applications with the latest features.',
    selectedText: '',
    tags: 'Next.js,React,Web Development',
    notes: 'Must read for Next.js developers',
  },
  {
    url: 'https://blog.ai/vector-databases-guide',
    title: 'Understanding Vector Databases for RAG Applications',
    contentType: 'page',
    content: 'Vector databases are becoming essential for modern AI applications. This article explains how they work, when to use them, and compares popular options like Pinecone, Weaviate, and pgvector.',
    selectedText: '',
    tags: 'Vector DB,RAG,AI',
    notes: 'Great technical overview',
  },

  // Videos
  {
    type: 'video' as const,
    title: 'Andrej Karpathy - Tokenization in LLMs',
    content: 'A comprehensive deep dive into how tokenization works in large language models, why it matters for model performance, and common pitfalls to avoid. Covers BPE, WordPiece, and SentencePiece algorithms.',
    url: 'https://youtube.com/watch?v=zduSFxRajkE',
    metadata: {
      thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=450&fit=crop',
      duration: '1:23:45',
      source: 'YouTube',
      tags: ['AI', 'ML', 'NLP'],
    },
  },
  {
    type: 'video' as const,
    title: 'Building Full-Stack Apps with Drizzle ORM',
    content: 'Learn how to build type-safe database applications using Drizzle ORM. Covers schema definition, migrations, queries, and integration with Next.js applications.',
    url: 'https://youtube.com/watch?v=example123',
    metadata: {
      thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=450&fit=crop',
      duration: '45:20',
      source: 'YouTube',
      tags: ['Drizzle', 'TypeScript', 'Database'],
    },
  },
  {
    type: 'video' as const,
    title: 'State Management in React 2024',
    content: 'Comprehensive overview of state management solutions in React including Context API, Zustand, Jotai, and when to use each approach. Includes performance optimization tips.',
    url: 'https://youtube.com/watch?v=state2024',
    metadata: {
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop',
      duration: '32:15',
      source: 'YouTube',
      tags: ['React', 'State Management', 'Frontend'],
    },
  },

  // Products
  {
    type: 'product' as const,
    title: 'Logitech MX Keys - Wireless Keyboard',
    content: 'Premium wireless keyboard designed for programmers and writers. Features perfect-stroke keys, smart illumination, and multi-device connectivity. Ergonomic design reduces typing fatigue.',
    url: 'https://amazon.com/logitech-mx-keys',
    metadata: {
      thumbnail: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&h=450&fit=crop',
      price: '$99.99',
      source: 'Amazon',
      tags: ['Hardware', 'Keyboard', 'Productivity'],
    },
  },
  {
    type: 'product' as const,
    title: 'Herman Miller Aeron Chair',
    content: 'The gold standard in ergonomic office chairs. Features PostureFit SL support, breathable mesh, and fully adjustable arms. Perfect for long coding sessions.',
    url: 'https://hermanmiller.com/aeron',
    metadata: {
      thumbnail: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&h=450&fit=crop',
      price: '$1,395.00',
      source: 'Herman Miller',
      tags: ['Furniture', 'Ergonomics', 'Office'],
    },
  },
  {
    type: 'product' as const,
    title: 'LG UltraWide 34" Monitor',
    content: '34-inch curved ultrawide monitor with QHD resolution. Perfect for multitasking with split-screen capabilities. USB-C connectivity and HDR10 support.',
    url: 'https://lg.com/ultrawide-34',
    metadata: {
      thumbnail: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&h=450&fit=crop',
      price: '$449.99',
      source: 'LG',
      tags: ['Monitor', 'Display', 'Productivity'],
    },
  },

  // Todos
  {
    type: 'todo' as const,
    title: 'Q4 Project Milestones',
    content: `✓ Complete user authentication flow
✓ Implement semantic search
⏳ Add browser extension sync
⏳ Set up automated testing
⏳ Deploy to production
⏳ Write API documentation
⏳ Create user onboarding flow`,
    metadata: {
      source: 'extension',
      tags: ['Work', 'Project Management'],
    },
  },
  {
    type: 'todo' as const,
    title: 'Learning Goals - December',
    content: `⏳ Complete TypeScript advanced course
⏳ Build RAG application from scratch
⏳ Study vector database architectures
⏳ Read 3 AI research papers
⏳ Contribute to open source project`,
    metadata: {
      source: 'extension',
      tags: ['Learning', 'Personal Development'],
    },
  },
  {
    type: 'todo' as const,
    title: 'Weekend Side Project Ideas',
    content: `💡 AI-powered code review tool
💡 Personal finance dashboard
💡 Habit tracking app with analytics
💡 Recipe organizer with meal planning
💡 Portfolio website redesign`,
    metadata: {
      source: 'extension',
      tags: ['Projects', 'Ideas'],
    },
  },

  // Notes
  {
    type: 'note' as const,
    title: 'Meeting Notes - Product Roadmap Q4 2024',
    content: `Key Decisions:
• Focus on user engagement metrics for next quarter
• Launch dashboard redesign by end of November
• Improve mobile app onboarding experience
• Schedule bi-weekly user feedback sessions

Action Items:
- Sarah: Design mockups for new dashboard
- Mike: Implement analytics tracking
- Team: Review competitor features

Next Meeting: Nov 22, 2024`,
    metadata: {
      source: 'extension',
      tags: ['Meetings', 'Product', 'Planning'],
    },
  },
  {
    type: 'note' as const,
    title: 'Database Architecture Decisions',
    content: `Decided to use PostgreSQL with pgvector extension for our vector database needs.

Reasons:
- Single database for relational + vector data
- No additional infrastructure needed
- Better for small to medium datasets
- Easier to maintain and backup

Implementation:
- Use Drizzle ORM for type safety
- Neon for serverless PostgreSQL
- Store embeddings as arrays in dedicated column

Performance Notes:
- Index vector columns properly
- Consider partitioning for large datasets`,
    metadata: {
      source: 'extension',
      tags: ['Architecture', 'Database', 'Technical'],
    },
  },
  {
    type: 'note' as const,
    title: 'RAG System Implementation Notes',
    content: `Vector Search Pipeline:
1. Text chunking (500 tokens with 50 overlap)
2. Generate embeddings (OpenAI text-embedding-3-small)
3. Store in pgvector
4. Query with cosine similarity

Retrieval Strategy:
- Top 5 most relevant chunks
- Rerank results using cross-encoder
- Add metadata filtering for better context

Lessons Learned:
- Chunk size matters for quality
- Metadata filtering improves relevance
- Consider hybrid search (keyword + semantic)`,
    metadata: {
      source: 'extension',
      tags: ['AI', 'RAG', 'Implementation'],
    },
  },
  {
    type: 'note' as const,
    title: 'TypeScript Tips & Tricks',
    content: `Useful TypeScript Patterns:

1. Discriminated Unions for type-safe state:
type State = { status: 'loading' } | { status: 'success', data: T } | { status: 'error', error: Error }

2. Template Literal Types for API routes:
type Route = \`/api/\${string}\`

3. Satisfies operator for better inference:
const config = { ... } satisfies Config

4. Const assertions for immutability:
const colors = ['red', 'blue'] as const

Remember: Use unknown instead of any for better type safety!`,
    contentType: 'page',
    url: 'https://example.com/typescript-tips',
    selectedText: '',
    tags: 'TypeScript,Programming,Tips,Best Practices',
    notes: 'Quick reference for TS patterns',
  },
];

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data
    console.log('🗑️  Clearing existing memories...');
    await db.delete(memories);
    
    // Insert mock data
    console.log(`📝 Inserting ${mockMemories.length} memories...`);
    await db.insert(memories).values(mockMemories);
    
    console.log('✅ Database seeded successfully!');
    console.log(`   - ${mockMemories.length} memories created`);
    console.log('   - Mix of pages, videos, and text selections');
    console.log('   - Ready for testing in the frontend');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log('🎉 Seed completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed failed:', error);
    process.exit(1);
  });
