import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

// For quick local runs you asked to "hardcode"—provide safe development
// defaults here. Replace these with real credentials or create a
// `.env.local` file before running in a real environment.
if (!process.env.DATABASE_URL) {
  // Development placeholder. DO NOT commit real credentials.
  process.env.DATABASE_URL = 'postgresql://postgres:password@127.0.0.1:5432/browserbaba';
  console.warn('⚠️  Using development DATABASE_URL placeholder. Replace with your real value in .env.local');
}

if (!process.env.MONGODB_URI) {
  // Use your Atlas URI; keep the password placeholder here
  process.env.MONGODB_URI = 'mongodb+srv://ayush:<db_password>@cluster0.phrz27b.mongodb.net/semanticbrowser';
  console.warn('⚠️  Using development MONGODB_URI placeholder. Replace with your real value in .env.local');
}

if (!process.env.GOOGLE_GEMINI_API_KEY) {
  process.env.GOOGLE_GEMINI_API_KEY = 'REPLACE_WITH_GEMINI_KEY';
  console.warn('⚠️  Using placeholder GOOGLE_GEMINI_API_KEY. Replace with your real API key in .env.local');
}

// Delay importing DB-related modules until after we've ensured
// environment variables are set. Static imports would be hoisted
// and evaluated before this module's top-level code runs which
// causes `neon()` to execute too early.

async function generateEmbeddingsForAllMemories() {
  console.log('🚀 Starting embedding generation for all memories...\n');

  try {
    // Dynamically import DB and helper modules now that env is configured
    const [{ db }, { memories }, { getVectorCollection }, { generateMemoryEmbedding }, drizzleOrm] = await Promise.all([
      import('@/lib/db'),
      import('@/lib/db/schema'),
      import('@/lib/db/mongodb'),
      import('@/lib/embeddings/service'),
      import('drizzle-orm')
    ]);

    // Use drizzle-orm's helpers from the imported module
    const { desc } = drizzleOrm;

    // Get all memories from PostgreSQL
    const allMemories = await db
      .select()
      .from(memories)
      .orderBy(desc(memories.createdAt));

    console.log(`📊 Found ${allMemories.length} memories to process\n`);

    if (allMemories.length === 0) {
      console.log('✅ No memories to process!');
      return;
    }

    const vectorCollection = await getVectorCollection();
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < allMemories.length; i++) {
      const memory = allMemories[i];
      const progress = `[${i + 1}/${allMemories.length}]`;

      try {
        // Check if embedding already exists
        const existing = await vectorCollection.findOne({ memoryId: memory.id });
        
        if (existing && existing.embedding && existing.embedding.length > 0) {
          console.log(`${progress} ⏭️  Skipping "${memory.title}" - embedding already exists`);
          skippedCount++;
          continue;
        }

        console.log(`${progress} 🔄 Processing: "${memory.title}"`);

        // Generate embedding
        const embedding = await generateMemoryEmbedding({
          title: memory.title,
          content: memory.content || memory.selectedText,
          url: memory.url
        });

        // Store in MongoDB
        await vectorCollection.updateOne(
          { memoryId: memory.id, userId: memory.userId || '' },
          {
            $set: {
              memoryId: memory.id,
              userId: memory.userId || '',
              title: memory.title,
              content: memory.content || memory.selectedText || '',
              url: memory.url || '',
              tags: memory.tags ? memory.tags.split(',').map(t => t.trim()) : [],
              embedding: embedding,
              updatedAt: new Date()
            },
            $setOnInsert: {
              createdAt: new Date()
            }
          },
          { upsert: true }
        );

        console.log(`${progress} ✅ Successfully generated embedding (${embedding.length} dimensions)`);
        successCount++;

        // Rate limiting - wait 100ms between requests to avoid API limits
        if (i < allMemories.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`${progress} ❌ Error processing "${memory.title}":`, error);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 Generation Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully generated: ${successCount}`);
    console.log(`⏭️  Skipped (already exist): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total processed: ${allMemories.length}`);
    console.log('='.repeat(60));

    if (successCount > 0) {
      console.log('\n🎉 Embeddings generated successfully!');
      console.log('💡 Next steps:');
      console.log('   1. Verify vector_index is Active in MongoDB Atlas');
      console.log('   2. Try semantic search in your dashboard');
      console.log('   3. Click the ✨ sparkle icon to enable AI search\n');
    }

  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
generateEmbeddingsForAllMemories();
