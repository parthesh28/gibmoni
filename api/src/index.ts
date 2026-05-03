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
	GITHUB_CLIENT_ID: string;
	GITHUB_CLIENT_SECRET: string;
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

/**
 * Resolve the oracle secret key from the env. Supports both base58 strings
 * and JSON-encoded byte arrays (e.g. "[42,104,...]").
 */
function getOracleSecretKey(raw: string): Uint8Array {
	const trimmed = raw.trim();
	if (trimmed.startsWith('[')) {
		const arr: number[] = JSON.parse(trimmed);
		return new Uint8Array(arr);
	}
	return bs58.decode(trimmed);
}

function signScoreAttestation(
	walletAddress: string,
	walletScore: number,
	githubScore: number,
	timestamp: number,
	privateKeyRaw: string
): string {
	// IMPORTANT: timestamp must be in seconds to match the smart contract's
	// format!("gibmoni-scores:{}:{}:{}:{}", wallet_key, wallet_score, github_score, score_timestamp)
	// where score_timestamp is i64 unix seconds.
	const messageString = `gibmoni-scores:${walletAddress}:${walletScore}:${githubScore}:${timestamp}`;
	const messageBytes = new TextEncoder().encode(messageString);
	const secretKey = getOracleSecretKey(privateKeyRaw);
	const signatureBytes = nacl.sign.detached(messageBytes, secretKey);
	return bs58.encode(signatureBytes);
}

/**
 * Sign a GitHub-verify token that proves a wallet completed OAuth with a
 * specific GitHub username. This is a stateless alternative to a DB session.
 */
function signGithubVerifyToken(
	walletAddress: string,
	githubUsername: string,
	timestamp: number,
	privateKeyRaw: string
): string {
	const messageString = `github-verified:${walletAddress}:${githubUsername}:${timestamp}`;
	const messageBytes = new TextEncoder().encode(messageString);
	const secretKey = getOracleSecretKey(privateKeyRaw);
	const signatureBytes = nacl.sign.detached(messageBytes, secretKey);
	// Encode the full payload as: base58(signature)|timestamp|githubUsername
	return `${bs58.encode(signatureBytes)}|${timestamp}|${githubUsername}`;
}

/**
 * Verify a GitHub-verify token. Returns the GitHub username if valid,
 * or null if expired / tampered.
 */
function verifyGithubVerifyToken(
	token: string,
	walletAddress: string,
	privateKeyRaw: string
): { githubUsername: string; timestamp: number } | null {
	try {
		const parts = token.split('|');
		if (parts.length !== 3) return null;

		const [sigBase58, tsStr, githubUsername] = parts;
		const timestamp = parseInt(tsStr, 10);
		if (isNaN(timestamp)) return null;

		// 5-minute expiry
		const fiveMinutes = 5 * 60 * 1000;
		if (Math.abs(Date.now() - timestamp) > fiveMinutes) return null;

		// Reconstruct and verify
		const messageString = `github-verified:${walletAddress}:${githubUsername}:${timestamp}`;
		const messageBytes = new TextEncoder().encode(messageString);
		const signatureBytes = bs58.decode(sigBase58);
		const secretKey = getOracleSecretKey(privateKeyRaw);
		// Derive public key from secret key (last 32 bytes are public in nacl)
		const publicKey = secretKey.slice(32);
		const valid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey);
		if (!valid) return null;

		return { githubUsername, timestamp };
	} catch {
		return null;
	}
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

		// FIX: Use full date arithmetic instead of year-only comparison so accounts
		// created in January vs December of the same year score correctly.
		const ageMs = Date.now() - new Date(data.created_at).getTime();
		const ageYears = Math.max(ageMs / (1000 * 60 * 60 * 24 * 365), 0);
		score += Math.min(Math.floor(ageYears * 100), 400);

		score += Math.min((data.public_repos || 0) * 20, 400);
		score += Math.min((data.followers || 0) * 4, 200);

		return Math.min(score, 1000);
	} catch (e) {
		console.error("GitHub scoring failed:", e);
		return 0;
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
	projectIds: z.array(z.string().min(32).max(44)).max(100),
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
		// FIX: Don't leak internal error details in production responses.
		return c.json({ error: 'FETCH_PROJECTS_FAILED' }, 500);
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

// ─── GitHub OAuth Callback ────────────────────────────────────────────────
// Exchanges the temporary OAuth code for an access token (requires client
// secret → must be server-side), fetches the GitHub profile, and returns a
// signed verify token as stateless proof of GitHub ownership.

const githubCallbackSchema = z.object({
	code: z.string().min(1),
	walletAddress: z.string().min(32).max(44),
});

app.post('/api/auth/github/callback', zValidator('json', githubCallbackSchema, (result, c) => {
	if (!result.success) {
		return c.json({ error: 'VALIDATION_FAILED', details: result.error.issues }, 400);
	}
}), async (c) => {
	const { code, walletAddress } = c.req.valid('json');

	const clientId = c.env.GITHUB_CLIENT_ID;
	const clientSecret = c.env.GITHUB_CLIENT_SECRET;
	const privateKey = c.env.ORACLE_PRIVATE_KEY;

	if (!clientId || !clientSecret || !privateKey) {
		console.error('CRITICAL: Missing GitHub OAuth or Oracle env vars.');
		return c.json({ error: 'INTERNAL_SERVER_ERROR' }, 500);
	}

	try {
		// Exchange code for access token
		const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: JSON.stringify({
				client_id: clientId,
				client_secret: clientSecret,
				code,
			}),
		});

		const tokenData: any = await tokenRes.json();

		if (tokenData.error || !tokenData.access_token) {
			console.error('GitHub token exchange failed:', tokenData);
			return c.json({ error: 'GITHUB_AUTH_FAILED', detail: tokenData.error_description || 'Code exchange failed' }, 400);
		}

		// Fetch GitHub user profile
		const userRes = await fetch('https://api.github.com/user', {
			headers: {
				'Authorization': `Bearer ${tokenData.access_token}`,
				'User-Agent': 'Gibmoni-Oracle-Server',
				'Accept': 'application/vnd.github+json',
			},
		});

		if (!userRes.ok) {
			console.error('GitHub user fetch failed:', userRes.status);
			return c.json({ error: 'GITHUB_PROFILE_FETCH_FAILED' }, 502);
		}

		const githubUser: any = await userRes.json();
		const githubUsername = githubUser.login as string;
		const githubAvatarUrl = githubUser.avatar_url as string;

		// Sign a verify token (stateless proof of OAuth)
		const timestamp = Date.now();
		const verifyToken = signGithubVerifyToken(walletAddress, githubUsername, timestamp, privateKey);

		return c.json({
			githubUsername,
			githubAvatarUrl,
			verifyToken,
		}, 200);

	} catch (error) {
		console.error('GitHub callback error:', error);
		return c.json({ error: 'GITHUB_AUTH_FAILED' }, 500);
	}
});

// ─── Onboarding Scores ───────────────────────────────────────────────────
// Verifies wallet ownership (via signature) and GitHub ownership (via
// oracle-signed verifyToken), then computes and attests both scores.

const onboardingScoresSchema = z.object({
	walletAddress: z.string().min(32).max(44),
	signature: z.string().min(1),
	message: z.string().min(1),
	verifyToken: z.string().min(1),
});

app.post('/api/auth/onboarding-scores', zValidator('json', onboardingScoresSchema, (result, c) => {
	if (!result.success) {
		return c.json({ error: 'VALIDATION_FAILED', details: result.error.issues }, 400);
	}
}), async (c) => {
	const { walletAddress, signature, message, verifyToken } = c.req.valid('json');

	const privateKey = c.env.ORACLE_PRIVATE_KEY;
	if (!privateKey) {
		console.error('CRITICAL ERROR: ORACLE_PRIVATE_KEY is missing from environment variables.');
		return c.json({ error: 'INTERNAL_SERVER_ERROR' }, 500);
	}

	// Step 1: Verify wallet ownership
	const auth = authenticateRequest(walletAddress, signature, message);
	if (!auth.ok) return c.json({ error: auth.error }, 401);

	// Step 2: Verify GitHub ownership via oracle-signed token
	const githubVerify = verifyGithubVerifyToken(verifyToken, walletAddress, privateKey);
	if (!githubVerify) {
		return c.json({ error: 'GITHUB_VERIFY_TOKEN_INVALID' }, 401);
	}

	const githubUrl = `https://github.com/${githubVerify.githubUsername}`;

	try {
		const [walletScore, githubScore] = await Promise.all([
			calculateWalletScore(walletAddress),
			calculateGithubScore(githubUrl),
		]);

		// Use unix seconds — the smart contract uses Clock::get().unix_timestamp (i64 seconds)
		const timestamp = Math.floor(Date.now() / 1000);
		const oracleSignature = signScoreAttestation(
			walletAddress,
			walletScore,
			githubScore,
			timestamp,
			privateKey
		);

		// Persist scores if the user already exists in DB
		const db = drizzle(c.env.DB);
		const existingUser = await db
			.select({ walletAddress: users.walletAddress })
			.from(users)
			.where(eq(users.walletAddress, walletAddress))
			.get();

		if (existingUser) {
			await db
				.update(users)
				.set({ walletScore, githubScore })
				.where(eq(users.walletAddress, walletAddress));
		}

		return c.json({ walletScore, githubScore, timestamp, oracleSignature }, 200);

	} catch (error) {
		console.error('Scoring/Signing Error:', error);
		return c.json({ error: 'FAILED_TO_GENERATE_SCORES' }, 500);
	}
});

app.post('/api/users', zValidator('json', userSchema, (result, c) => {
	if (!result.success) {
		// FIX: Use flatten() for actionable field-level errors instead of leaking
		// the internal Zod error type string.
		return c.json({ error: 'VALIDATION_FAILED', details: result.error.issues }, 400);
	}
}), async (c) => {
	const body = c.req.valid('json');

	const auth = authenticateRequest(body.walletAddress, body.signature, body.message);
	if (!auth.ok) return c.json({ error: auth.error }, 401);

	const db = drizzle(c.env.DB);

	try {
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
	} catch (error: any) {
		// FIX: Handle the unique constraint violation that fires when two concurrent
		// registrations race past the old select-then-insert check. D1 surfaces this
		// as a SQLITE_CONSTRAINT error. The previous select was a TOCTOU race and is
		// removed entirely — the DB constraint is the authoritative guard.
		if (error?.message?.includes('UNIQUE constraint failed')) {
			return c.json({ error: 'USER_ALREADY_EXISTS' }, 409);
		}
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
		return c.json({ error: 'VALIDATION_FAILED', details: result.error.issues }, 400);
	}
}), async (c) => {
	const body = c.req.valid('json');

	const auth = authenticateRequest(body.creatorWallet, body.signature, body.message);
	if (!auth.ok) return c.json({ error: auth.error }, 401);

	const db = drizzle(c.env.DB);

	try {
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
	} catch (error: any) {
		if (error?.message?.includes('UNIQUE constraint failed')) {
			return c.json({ error: 'PROJECT_ALREADY_EXISTS' }, 409);
		}
		console.error('Create project error:', error);
		return c.json({ error: 'CREATE_PROJECT_FAILED' }, 500);
	}
});

// FIX: batch route is registered BEFORE the :id route so Hono doesn't swallow
// POST /api/projects/batch by treating "batch" as a project ID.
app.post('/api/projects/batch', zValidator('json', batchProjectSchema, (result, c) => {
	if (!result.success) {
		return c.json({ error: 'VALIDATION_FAILED', details: result.error.issues }, 400);
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

app.post('/api/milestones', zValidator('json', milestoneSchema, (result, c) => {
	if (!result.success) {
		return c.json({ error: 'VALIDATION_FAILED', details: result.error.issues }, 400);
	}
}), async (c) => {
	const body = c.req.valid('json');

	const auth = authenticateRequest(body.creatorWallet, body.signature, body.message);
	if (!auth.ok) return c.json({ error: auth.error }, 401);

	const db = drizzle(c.env.DB);

	try {
		const parentProject = await db
			.select({ creatorWallet: projects.creatorWallet })
			.from(projects)
			.where(eq(projects.id, body.projectId))
			.get();

		if (!parentProject) {
			return c.json({ error: 'PARENT_PROJECT_NOT_FOUND' }, 404);
		}

		// FIX: Verify the caller owns the project before attaching a milestone.
		if (parentProject.creatorWallet !== body.creatorWallet) {
			return c.json({ error: 'UNAUTHORIZED' }, 403);
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
	} catch (error: any) {
		if (error?.message?.includes('UNIQUE constraint failed')) {
			return c.json({ error: 'MILESTONE_ALREADY_EXISTS' }, 409);
		}
		console.error('Create milestone error:', error);
		return c.json({ error: 'CREATE_MILESTONE_FAILED' }, 500);
	}
});

export default app;