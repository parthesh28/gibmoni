import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { users } from './schema';

export type Env = {
	DB: D1Database;
};

const app = new Hono<{ Bindings: Env }>();

// 1. CORS Configuration (Lock this down to your frontend domain in production)
app.use('/api/*', cors({
	origin: '*', // Change to your Vercel URL later
	allowMethods: ['GET', 'POST', 'OPTIONS'],
}));

// 2. Input Validation Schema
const userSchema = z.object({
	// Solana base58 pubkeys are typically 32-44 characters long
	walletAddress: z.string().min(32).max(44),
	alias: z.string().min(2).max(50),
	avatarUrl: z.string().url().optional().or(z.literal('')),
	githubUrl: z.string().url().optional().or(z.literal('')),
	twitterHandle: z.string().max(15).optional().or(z.literal('')),
	bio: z.string().max(500).optional().or(z.literal('')),
});

// 3. SYSTEM CHECK ROUTE
app.get('/', (c) => c.text('GIBMONI API // SYSTEM ONLINE'));

// ==========================================
// [ROUTE]: GET /api/users/:wallet
// Fetch a user profile. Used to check if onboarding is required.
// ==========================================
app.get('/api/users/:wallet', async (c) => {
	const wallet = c.req.param('wallet');

	// Basic sanity check on the URL parameter
	if (wallet.length < 32 || wallet.length > 44) {
		return c.json({ error: 'INVALID_WALLET_FORMAT' }, 400);
	}

	try {
		const db = drizzle(c.env.DB);
		const user = await db.select().from(users).where(eq(users.walletAddress, wallet)).get();

		// 404 is the expected response when a new wallet connects
		if (!user) return c.json({ error: 'USER_NOT_FOUND', requiresOnboarding: true }, 404);

		return c.json(user, 200);
	} catch (error) {
		console.error('DB Error:', error);
		return c.json({ error: 'INTERNAL_SERVER_ERROR' }, 500);
	}
});

// ==========================================
// [ROUTE]: POST /api/users
// Register a new user. Protected by Zod.
// ==========================================
app.post('/api/users', zValidator('json', userSchema, (result, c) => {
	// If the frontend sends bad data, return a 400 instantly with the exact errors
	if (!result.success) {
		return c.json({ error: 'VALIDATION_FAILED', details: result.error.type }, 400);
	}
}), async (c) => {
	const body = c.req.valid('json'); // This data is now 100% type-safe and validated
	const db = drizzle(c.env.DB);

	try {
		// Edge Case: Check if user already exists to prevent duplicate PK errors
		const existingUser = await db.select().from(users).where(eq(users.walletAddress, body.walletAddress)).get();
		if (existingUser) {
			return c.json({ error: 'USER_ALREADY_EXISTS', user: existingUser }, 409);
		}

		// Insert the new builder
		const newUser = await db.insert(users).values({
			walletAddress: body.walletAddress,
			alias: body.alias,
			avatarUrl: body.avatarUrl || null,
			githubUrl: body.githubUrl || null,
			twitterHandle: body.twitterHandle || null,
			bio: body.bio || null,
			createdAt: new Date(),
		}).returning().get();

		return c.json(newUser, 201);
	} catch (error) {
		console.error('Registration Error:', error);
		return c.json({ error: 'REGISTRATION_FAILED' }, 500);
	}
});

export default app;