import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { users, projects, milestones } from './schema';

export type Env = {
	DB: D1Database;
	ORACLE_PRIVATE_KEY: string;
};

const app = new Hono<{ Bindings: Env }>();

function authenticateRequest(walletAddress: string, signatureBase58: string, messageString: string) {
	try {
		const publicKey = bs58.decode(walletAddress);
		const signature = bs58.decode(signatureBase58);
		const message = new TextEncoder().encode(messageString);

		const isValid = nacl.sign.detached.verify(message, signature, publicKey);
		if (!isValid) return { ok: false, error: 'INVALID_SIGNATURE' };

		const parts = messageString.split(':');
		const timestampStr = parts[parts.length - 1];
		const timestamp = parseInt(timestampStr, 10);

		if (isNaN(timestamp)) return { ok: false, error: 'INVALID_MESSAGE_FORMAT' };

		const now = Date.now();
		const twoMinutes = 2 * 60 * 1000;
		if (Math.abs(now - timestamp) > twoMinutes) {
			return { ok: false, error: 'SIGNATURE_EXPIRED' };
		}

		return { ok: true };
	} catch (e) {
		return { ok: false, error: 'MALFORMED_AUTH_PAYLOAD' };
	}
}

function signScoreAttestation(
	walletAddress: string,
	walletScore: number,
	githubScore: number,
	timestamp: number,
	privateKeyBase58: string
): string {
	const messageString = `gibmoni-scores:${walletAddress}:${walletScore}:${githubScore}:${timestamp}`;
	const messageBytes = new TextEncoder().encode(messageString);
	const secretKey = bs58.decode(privateKeyBase58);
	const signatureBytes = nacl.sign.detached(messageBytes, secretKey);

	return bs58.encode(signatureBytes);
}

async function calculateWalletScore(walletAddress: string): Promise<number> {
	try {
		const rpcUrl = 'https://api.mainnet-beta.solana.com';
		const response = await fetch(rpcUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: "2.0", id: 1,
				method: "getBalance",
				params: [walletAddress]
			})
		});

		const data: any = await response.json();
		const lamports = data?.result?.value || 0;
		const sol = lamports / 1_000_000_000;

		const score = Math.min(Math.floor((sol / 5) * 1000), 1000);
		return score;
	} catch (e) {
		console.error("Wallet scoring failed:", e);
		return 0; 
	}
}

async function calculateGithubScore(githubUrl: string | undefined): Promise<number> {
	if (!githubUrl) return 0;

	try {
		const match = githubUrl.match(/github\.com\/([^/]+)/);
		if (!match) return 0;
		const username = match[1];

		const res = await fetch(`https://api.github.com/users/${username}`, {
			headers: { 'User-Agent': 'Gibmoni-Oracle-Server' }
		});

		if (!res.ok) return 0;
		const data: any = await res.json();

		let score = 0;

		const createdYear = new Date(data.created_at).getFullYear();
		const currentYear = new Date().getFullYear();
		const ageYears = Math.max(currentYear - createdYear, 0);
		score += Math.min(ageYears * 100, 400);

		score += Math.min((data.public_repos || 0) * 20, 400);

		score += Math.min((data.followers || 0) * 4, 200);

		return Math.min(score, 1000);
	} catch (e) {
		console.error("GitHub scoring failed:", e);
		return 0; // Graceful fallback
	}
}

app.use('/api/*', cors({
	origin: '*',
	allowMethods: ['GET', 'POST', 'OPTIONS'],
}));

const userSchema = z.object({
	walletAddress: z.string().min(32).max(44),
	alias: z.string().min(2).max(50),	
	avatarUrl: z.string().url().optional().or(z.literal('')),
	githubUrl: z.string().url().optional().or(z.literal('')),
	twitterHandle: z.string().max(15).optional().or(z.literal('')),
	bio: z.string().max(500).optional().or(z.literal('')),
	signature: z.string().min(1),
	message: z.string().min(1),
});

const projectSchema = z.object({
	id: z.string().min(32).max(44),
	creatorWallet: z.string().min(32).max(44),
	title: z.string().min(1).max(100),
	tagline: z.string().min(1).max(200),
	description: z.string().min(1).max(5000),
	category: z.string().max(50).optional().or(z.literal('')),
	coverImageUrl: z.string().url().optional().or(z.literal('')),
	signature: z.string().min(1), 
	message: z.string().min(1),
});

const milestoneSchema = z.object({
	id: z.string().min(1).max(100),
	projectId: z.string().min(32).max(44),
	creatorWallet: z.string().min(32).max(44), 
	milestoneIndex: z.number().int().min(0).max(3),
	title: z.string().min(1).max(100),
	description: z.string().min(1).max(2000),
	signature: z.string().min(1), 
	message: z.string().min(1), 
});

const batchProjectSchema = z.object({
	projectIds: z.array(z.string().min(32).max(44)).max(100), // Max 100 at a time for safety
});

app.get('/', (c) => c.text('GIBMONI API // SYSTEM ONLINE'));

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

app.get('/api/auth/onboarding-scores', async (c) => {
	const wallet = c.req.query('wallet');
	const githubUrl = c.req.query('githubUrl'); 

	if (!wallet || wallet.length < 32 || wallet.length > 44) {
		return c.json({ error: 'INVALID_WALLET_FORMAT' }, 400);
	}

	const privateKey = c.env.ORACLE_PRIVATE_KEY;
	if (!privateKey) {
		console.error("CRITICAL ERROR: ORACLE_PRIVATE_KEY is missing from environment variables.");
		return c.json({ error: 'INTERNAL_SERVER_ERROR' }, 500);
	}

	try {
		const [walletScore, githubScore] = await Promise.all([
			calculateWalletScore(wallet),
			calculateGithubScore(githubUrl)
		]);

		const timestamp = Date.now();
		const oracleSignature = signScoreAttestation(
			wallet,
			walletScore,
			githubScore,
			timestamp,
			privateKey
		);

		return c.json({
			walletScore,
			githubScore,
			timestamp,
			oracleSignature
		}, 200);

	} catch (error) {
		console.error('Scoring/Signing Error:', error);
		return c.json({ error: 'FAILED_TO_GENERATE_SCORES' }, 500);
	}
});

app.post('/api/users', zValidator('json', userSchema, (result, c) => {
	if (!result.success) {
		return c.json({ error: 'VALIDATION_FAILED', details: result.error.type }, 400);
	}
}), async (c) => {
	const body = c.req.valid('json');

	const auth = authenticateRequest(body.walletAddress, body.signature, body.message);
	if (!auth.ok) return c.json({ error: auth.error }, 401);

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

app.post('/api/projects', zValidator('json', projectSchema, (result, c) => {
	if (!result.success) {
		return c.json({ error: 'VALIDATION_FAILED', details: result.error.type }, 400);
	}
}), async (c) => {
	const body = c.req.valid('json');

	const auth = authenticateRequest(body.creatorWallet, body.signature, body.message);
	if (!auth.ok) return c.json({ error: auth.error }, 401);

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

app.post('/api/milestones', zValidator('json', milestoneSchema, (result, c) => {
	if (!result.success) {
		return c.json({ error: 'VALIDATION_FAILED', details: result.error.type }, 400);
	}
}), async (c) => {
	const body = c.req.valid('json');

	const auth = authenticateRequest(body.creatorWallet, body.signature, body.message);
	if (!auth.ok) return c.json({ error: auth.error }, 401);

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

app.post('/api/projects/batch', zValidator('json', batchProjectSchema, (result, c) => {
	if (!result.success) {
		return c.json({ error: 'VALIDATION_FAILED', details: result.error.type }, 400);
	}
}), async (c) => {
	const { projectIds } = c.req.valid('json');

	if (projectIds.length === 0) {
		return c.json([], 200);
	}

	try {
		const db = drizzle(c.env.DB);
		const activeProjects = await db
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
			.where(inArray(projects.id, projectIds)) 
			.all();

		return c.json(activeProjects, 200);
	} catch (error) {
		console.error('Batch fetch error:', error);
		return c.json({ error: 'INTERNAL_SERVER_ERROR' }, 500);
	}
});

export default app;