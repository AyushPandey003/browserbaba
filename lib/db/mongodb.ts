import { MongoClient, MongoClientOptions } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

const uri = process.env.MONGODB_URI;

// Enhanced MongoDB connection options with SSL/TLS handling
const options: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  // SSL/TLS options
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  // Retry options
  retryWrites: true,
  retryReads: true,
};

let clientPromise: Promise<MongoClient>;

// Connection retry helper
async function connectWithRetry(uri: string, options: MongoClientOptions, retries = 3): Promise<MongoClient> {
  for (let i = 0; i < retries; i++) {
    try {
      const client = new MongoClient(uri, options);
      await client.connect();
      // Test connection
      await client.db('admin').command({ ping: 1 });
      return client;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`MongoDB connection attempt ${i + 1} failed:`, errorMessage);
      if (i === retries - 1) {
        // Last attempt failed, throw error
        throw new Error(`Failed to connect to MongoDB after ${retries} attempts: ${errorMessage}`);
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('MongoDB connection failed');
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the client across hot reloads
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = connectWithRetry(uri, options);
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, create a new client
  clientPromise = connectWithRetry(uri, options);
}

export default clientPromise;

// Memory Vector Document Interface
export interface MemoryVector {
  _id?: string;
  memoryId: string; // References PostgreSQL memory ID
  userId: string;
  title: string;
  content: string;
  url?: string;
  tags: string[];
  embedding: number[]; // 768 dimensions for text-embedding-004
  createdAt: Date;
  updatedAt: Date;
}

// Get the vector collection
export async function getVectorCollection() {
  const client = await clientPromise;
  const db = client.db('semanticbrowser'); // Database name
  return db.collection<MemoryVector>('browserbaba'); // Collection name
}
