import { pgTable, serial, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';

// Users table linked to Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Figma-like Projects table
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // References Firebase UID
  title: text('title').notNull(),
  description: text('description'),
  rawTranscript: text('raw_transcript').notNull(),
  parsedFiles: jsonb('parsed_files').notNull(), // Stores Record<string, ProjectFile>
  stats: jsonb('stats').notNull(), // { fileCount, totalBytes, totalBlocks, lineCount }
  thumbnailGradient: text('thumbnail_gradient'), // Visual styling for Figma-like cards
  isStarred: integer('is_starred').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
