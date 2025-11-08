import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the client across hot reloads
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, create a new client
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
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
