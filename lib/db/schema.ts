import { pgTable, text, timestamp, jsonb, uuid, boolean } from "drizzle-orm/pg-core";

export const memories = pgTable('memories', {
  id: uuid('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  userId: uuid('user_id'),
  type: text('type', { 
    enum: ['article', 'product', 'video', 'todo', 'note'] 
  }).notNull(),
  title: text('title').notNull(),
  content: text('content'),
  url: text('url'),
  metadata: jsonb('metadata').$type<{
    thumbnail?: string;
    source?: string;
    price?: string;
    duration?: string;
    tags?: string[];
    author?: string;
    publishedDate?: string;
    [key: string]: string | number | boolean | string[] | undefined;
  }>(),
  source: text('source').default('extension'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Better-auth compatible user table
export const user = pgTable('user', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id),
});

export const account = pgTable('account', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
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
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});



export type Memory = typeof memories.$inferSelect;
export type NewMemory = typeof memories.$inferInsert;
export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;

export const schema = { 
  memories, 
  user, 
  session, 
  account, 
  verification 
};
