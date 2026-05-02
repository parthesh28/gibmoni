import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    walletAddress: text('wallet_address').primaryKey(), 
    alias: text('alias').notNull(),
    avatarUrl: text('avatar_url'),
    githubUrl: text('github_url'),
    twitterHandle: text('twitter_handle'),
    bio: text('bio'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    githubScore: integer('github_score').default(0).notNull(),
    walletScore: integer('wallet_score').default(0).notNull(),
});

export const projects = sqliteTable('projects', {
    id: text('id').primaryKey(), 
    creatorWallet: text('creator_wallet').references(() => users.walletAddress).notNull(),
    title: text('title').notNull(),
    tagline: text('tagline').notNull(),
    description: text('description').notNull(), // Markdown/HTML content
    coverImageUrl: text('cover_image_url'),
    category: text('category'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const milestones = sqliteTable('milestones', {
    id: text('id').primaryKey(),
    projectId: text('project_id').references(() => projects.id).notNull(),
    milestoneIndex: integer('milestone_index').notNull(), 
    title: text('title').notNull(),
    description: text('description').notNull(),
    proofUrl: text('proof_url'), 
    proofNotes: text('proof_notes'),
    updatedAt: integer('updated_at', { mode: 'timestamp' }),
});