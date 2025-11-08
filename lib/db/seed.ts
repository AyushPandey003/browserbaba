import { db } from './index';
import { memories } from './schema';

const mockMemories = [
  {
    type: 'article' as const,
    title: 'Building AI Systems Like Synapse',
    content: 'This post explores the design of second-brain apps and how they can leverage AI to help users organize and retrieve information more effectively.',
    url: 'https://medium.com/example-article',
    metadata: {
      source: 'Medium',
      thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop',
    },
  },
  {
    type: 'video' as const,
    title: 'Andrej Karpathy on Tokenization',
    content: 'A deep dive into how tokenization works in large language models and why it matters.',
    url: 'https://youtube.com/watch?v=example',
    metadata: {
      thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=250&fit=crop',
      duration: '45:30',
    },
  },
  {
    type: 'product' as const,
    title: 'Ergonomic Keyboard - MX Keys',
    content: 'Premium wireless keyboard with perfect key travel and multi-device support.',
    url: 'https://example.com/product',
    metadata: {
      thumbnail: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=250&fit=crop',
      price: '$99.99',
    },
  },
  {
    type: 'todo' as const,
    title: 'Project Tasks for Next Week',
    content: '- Set up CI/CD pipeline\n- Implement authentication\n- Add user preferences\n- Write documentation\n- Deploy to production',
    metadata: {
      source: 'extension',
    },
  },
  {
    type: 'note' as const,
    title: 'Meeting Notes - Q4 Planning',
    content: 'Key takeaways:\n- Focus on user engagement metrics\n- Launch new dashboard features\n- Improve onboarding flow\n- Schedule team retrospective',
    metadata: {
      source: 'extension',
    },
  },
  {
    type: 'article' as const,
    title: 'The Future of Web Development',
    content: 'An exploration of emerging trends in web development, including server components, edge computing, and the evolution of frameworks.',
    url: 'https://dev.to/example',
    metadata: {
      source: 'Dev.to',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop',
    },
  },
];

export async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');
    
    for (const memory of mockMemories) {
      await db.insert(memories).values({
        ...memory,
        source: 'seed',
      });
    }
    
    console.log('✅ Database seeded successfully!');
    console.log(`📊 Inserted ${mockMemories.length} mock memories`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
