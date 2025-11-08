import { pgTable, text, timestamp, boolean, bigint, varchar } from "drizzle-orm/pg-core";

// Extension memories table - compatible with existing UUID-based schema
export const memories = pgTable('memories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }), // Add user reference
  url: text('url'),
  title: text('title').notNull(),
  contentType: varchar('content_type', { length: 50 }).notNull().default('page'),
  content: text('content'),
  selectedText: text('selected_text'),
  contextBefore: text('context_before'),
  contextAfter: text('context_after'),
  fullContext: text('full_context'),
  elementType: varchar('element_type', { length: 50 }),
  pageSection: varchar('page_section', { length: 50 }),
  xpath: text('xpath'),
  tags: text('tags'), // Comma-separated string
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  scrapedAt: timestamp('scraped_at').notNull().defaultNow(),
  
  // Video-specific fields
  videoPlatform: varchar('video_platform', { length: 50 }),
  videoTimestamp: bigint('video_timestamp', { mode: 'number' }),
  videoDuration: bigint('video_duration', { mode: 'number' }),
  videoTitle: text('video_title'),
  videoUrl: text('video_url'),
  thumbnailUrl: text('thumbnail_url'),
  formattedTimestamp: varchar('formatted_timestamp', { length: 20 }),
  
  // Enhanced metadata fields for better scraping
  domain: varchar('domain', { length: 255 }),
  favicon: text('favicon'),
  author: text('author'),
  publishedDate: timestamp('published_date'),
  
  // Rich content fields
  mainImage: text('main_image'), // Primary image URL
  images: text('images'), // JSON array of image objects [{src, alt, title}]
  description: text('description'), // Meta description or excerpt
  headings: text('headings'), // JSON array of main headings
  keywords: text('keywords'), // Comma-separated keywords
  
  // Product-specific fields
  price: varchar('price', { length: 100 }),
  currency: varchar('currency', { length: 10 }),
  availability: varchar('availability', { length: 50 }),
  rating: varchar('rating', { length: 20 }),
  brand: varchar('brand', { length: 255 }),
  
  // Article/Reading specific
  readingTime: varchar('reading_time', { length: 50 }),
  wordCount: bigint('word_count', { mode: 'number' }),
  language: varchar('language', { length: 20 }),
  
  // Collection organization
  collection: varchar('collection', { length: 255 }), // e.g., "Research", "Shopping", "Recipes"
  priority: varchar('priority', { length: 20 }), // "high", "medium", "low"
  status: varchar('status', { length: 50 }), // "to_read", "reading", "completed", "archived"
  
  // Smart categorization hints
  category: varchar('category', { length: 100 }), // Auto-detected: "shopping", "recipe", "tutorial", etc.
  subcategory: varchar('subcategory', { length: 100 }),
});

// Links table for extracted links from pages
export const links = pgTable('links', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  memoryId: text('memory_id').notNull().references(() => memories.id, { onDelete: 'cascade' }),
  text: text('text'),
  href: text('href').notNull(),
  linkTitle: text('link_title'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Better-auth compatible user table
export const user = pgTable('user', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id),
});

export const account = pgTable('account', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});



export type Memory = typeof memories.$inferSelect;
export type NewMemory = typeof memories.$inferInsert;
export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;

export const schema = { 
  memories,
  links,
  user, 
  session, 
  account, 
  verification 
};
