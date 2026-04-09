import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { users, projects, milestones } from './schema';

export type Env = {
	DB: D1Database;
};

const app = new Hono<{ Bindings: Env }>();

const emptyToUndefined = (value: unknown) => {
	if (typeof value !== 'string') return value;
	const trimmed = value.trim();
	return trimmed === '' ? undefined : trimmed;
};

// ==========================================
// CORS
// ==========================================
app.use('/api/*', cors({
	origin: '*',
	allowMethods: ['GET', 'POST', 'OPTIONS'],
}));

// ==========================================
// VALIDATION SCHEMAS
// ==========================================
const userSchema = z.object({
	walletAddress: z.string().trim().min(32).max(44),
	alias: z.string().trim().min(2).max(50),
	avatarUrl: z.preprocess(emptyToUndefined, z.string().url().optional()),
	githubUrl: z.preprocess(emptyToUndefined, z.string().url().optional()),
	twitterHandle: z.preprocess(emptyToUndefined, z.string().trim().max(50).optional()),
	bio: z.preprocess(emptyToUndefined, z.string().trim().max(500).optional()),
});

const projectSchema = z.object({
	id: z.string().min(32).max(44),            // Stringified PDA pubkey
	creatorWallet: z.string().min(32).max(44),
	title: z.string().min(1).max(100),
	tagline: z.string().min(1).max(200),
	description: z.string().min(1).max(5000),
	category: z.string().max(50).optional().or(z.literal('')),
	coverImageUrl: z.string().url().optional().or(z.literal('')),
});

const milestoneSchema = z.object({
	id: z.string().min(1).max(100),            // Unique identifier
	projectId: z.string().min(32).max(44),      // Project PDA pubkey
	milestoneIndex: z.number().int().min(0).max(3),
	title: z.string().min(1).max(100),
	description: z.string().min(1).max(2000),
});

// ==========================================
// SYSTEM CHECK
// ==========================================
app.get('/', (c) => c.text('GIBMONI API // SYSTEM ONLINE'));

// ==========================================
// USER ROUTES
// ==========================================

// GET /api/users/:wallet/projects — MUST be before /:wallet to avoid route collision
app.get('/api/users/:wallet/projects', async (c) => {
	const wallet = c.req.param('wallet');
	if (wallet.length < 32 || wallet.length > 44) {
		return c.json({ error: 'INVALID_WALLET_FORMAT' }, 400);
	}

	try {
		const db = drizzle(c.env.DB);
		const createdProjects = await db
			.select({
				id: projects.id,
				title: projects.title,
				tagline: projects.tagline,
				category: projects.category,
				createdAt: projects.createdAt,
			})
			.from(projects)
			.where(eq(projects.creatorWallet, wallet))
			.all();

		return c.json({ created: createdProjects }, 200);
	} catch (error) {
		console.error('Fetch user projects error:', error);
		return c.json({ error: 'FETCH_PROJECTS_FAILED', details: String(error) }, 500);
	}
});

// GET /api/users/:wallet
app.get('/api/users/:wallet', async (c) => {
	const wallet = c.req.param('wallet');
	if (wallet.length < 32 || wallet.length > 44) {
		return c.json({ error: 'INVALID_WALLET_FORMAT' }, 400);
	}

	try {
		const db = drizzle(c.env.DB);
		const user = await db.select().from(users).where(eq(users.walletAddress, wallet)).get();
		if (!user) return c.json({ error: 'USER_NOT_FOUND', requiresOnboarding: true }, 404);
		return c.json(user, 200);
	} catch (error) {
		console.error('DB Error:', error);
		return c.json({ error: 'INTERNAL_SERVER_ERROR' }, 500);
	}
});

// POST /api/users
app.post('/api/users', zValidator('json', userSchema, (result, c) => {
	if (!result.success) {
		return c.json({
			error: 'VALIDATION_FAILED',
			details: result.error.flatten(),
		}, 400);
	}
}), async (c) => {
	const body = c.req.valid('json');
	const db = drizzle(c.env.DB);

	try {
		const existingUser = await db.select().from(users).where(eq(users.walletAddress, body.walletAddress)).get();
		if (existingUser) {
			return c.json({ error: 'USER_ALREADY_EXISTS', user: existingUser }, 409);
		}

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

// ==========================================
// PROJECT ROUTES
// ==========================================

// GET /api/projects — List all projects with creator alias
app.get('/api/projects', async (c) => {
	try {
		const db = drizzle(c.env.DB);
		const allProjects = await db
			.select({
				id: projects.id,
				creatorWallet: projects.creatorWallet,
				title: projects.title,
				tagline: projects.tagline,
				description: projects.description,
				coverImageUrl: projects.coverImageUrl,
				category: projects.category,
				createdAt: projects.createdAt,
				creatorAlias: users.alias,
			})
			.from(projects)
			.leftJoin(users, eq(projects.creatorWallet, users.walletAddress))
			.all();

		return c.json(allProjects, 200);
	} catch (error) {
		console.error('Fetch projects error:', error);
		return c.json({ error: 'INTERNAL_SERVER_ERROR' }, 500);
	}
});

// GET /api/projects/:id — Single project with milestones
app.get('/api/projects/:id', async (c) => {
	const id = c.req.param('id');

	try {
		const db = drizzle(c.env.DB);

		const project = await db
			.select({
				id: projects.id,
				creatorWallet: projects.creatorWallet,
				title: projects.title,
				tagline: projects.tagline,
				description: projects.description,
				coverImageUrl: projects.coverImageUrl,
				category: projects.category,
				createdAt: projects.createdAt,
				creatorAlias: users.alias,
			})
			.from(projects)
			.leftJoin(users, eq(projects.creatorWallet, users.walletAddress))
			.where(eq(projects.id, id))
			.get();

		if (!project) return c.json({ error: 'PROJECT_NOT_FOUND' }, 404);

		const projectMilestones = await db
			.select()
			.from(milestones)
			.where(eq(milestones.projectId, id))
			.all();

		return c.json({ ...project, milestones: projectMilestones }, 200);
	} catch (error) {
		console.error('Fetch project error:', error);
		return c.json({ error: 'INTERNAL_SERVER_ERROR' }, 500);
	}
});

// POST /api/projects — Create project record (after on-chain tx)
app.post('/api/projects', zValidator('json', projectSchema, (result, c) => {
	if (!result.success) {
		return c.json({ error: 'VALIDATION_FAILED', details: result.error.type }, 400);
	}
}), async (c) => {
	const body = c.req.valid('json');
	const db = drizzle(c.env.DB);

	try {
		const existing = await db.select().from(projects).where(eq(projects.id, body.id)).get();
		if (existing) {
			return c.json({ error: 'PROJECT_ALREADY_EXISTS' }, 409);
		}

		const newProject = await db.insert(projects).values({
			id: body.id,
			creatorWallet: body.creatorWallet,
			title: body.title,
			tagline: body.tagline,
			description: body.description,
			category: body.category || null,
			coverImageUrl: body.coverImageUrl || null,
			createdAt: new Date(),
		}).returning().get();

		return c.json(newProject, 201);
	} catch (error) {
		console.error('Create project error:', error);
		return c.json({ error: 'CREATE_PROJECT_FAILED' }, 500);
	}
});

// ==========================================
// MILESTONE ROUTES
// ==========================================

// POST /api/milestones — Create milestone record (after on-chain tx)
app.post('/api/milestones', zValidator('json', milestoneSchema, (result, c) => {
	if (!result.success) {
		return c.json({ error: 'VALIDATION_FAILED', details: result.error.type }, 400);
	}
}), async (c) => {
	const body = c.req.valid('json');
	const db = drizzle(c.env.DB);

	try {
		const parentProject = await db.select().from(projects).where(eq(projects.id, body.projectId)).get();
		if (!parentProject) {
			return c.json({ error: 'PARENT_PROJECT_NOT_FOUND' }, 404);
		}

		const existing = await db.select().from(milestones).where(eq(milestones.id, body.id)).get();
		if (existing) {
			return c.json({ error: 'MILESTONE_ALREADY_EXISTS' }, 409);
		}

		const newMilestone = await db.insert(milestones).values({
			id: body.id,
			projectId: body.projectId,
			milestoneIndex: body.milestoneIndex,
			title: body.title,
			description: body.description,
			updatedAt: new Date(),
		}).returning().get();

		return c.json(newMilestone, 201);
	} catch (error) {
		console.error('Create milestone error:', error);
		return c.json({ error: 'CREATE_MILESTONE_FAILED' }, 500);
	}
});

// User projects route moved to top of user routes section (before :wallet catch-all)

export default app;