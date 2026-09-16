import crypto from "node:crypto";

import cookieParser from "cookie-parser";
import { type Request, type Response } from "express";

import SpotifyAccountModel from "../models/SpotifyAccount.js";
import SpotifyOAuthStateModel from "../models/SpotifyOAuthState.js";
import { decryptToken, encryptToken } from "../utils/crypto.js";

// Spotify OAuth (Authorization Code flow) with per-user token storage so every
// visitor plays with their own Premium account. Users are anonymous — identified
// by an httpOnly cookie set on first visit.
const SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SCOPES = ["streaming", "user-read-email", "user-read-private", "user-modify-playback-state"];
const USER_COOKIE = "dupontdoku_uid";
const USER_COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year

interface SpotifyTokens {
	access_token: string;
	refresh_token?: string;
	expires_in: number;
	scope?: string;
}

interface SpotifyProfile {
	id: string;
	display_name: string | null;
}

function config() {
	const clientId = process.env.SPOTIFY_CLIENT_ID;
	const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
	const redirectUri = process.env.SPOTIFY_PLAYBACK_REDIRECT_URI;
	if (!clientId || !clientSecret || !redirectUri) {
		throw Object.assign(
			new Error(
				"SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET / SPOTIFY_PLAYBACK_REDIRECT_URI is not set",
			),
			{ status: 501 },
		);
	}
	return { clientId, clientSecret, redirectUri };
}

async function tokenRequest(params: URLSearchParams): Promise<SpotifyTokens> {
	const { clientId, clientSecret } = config();
	const res = await fetch(SPOTIFY_TOKEN_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
		},
		body: params,
	});
	if (!res.ok) {
		throw Object.assign(new Error(`Spotify token request failed (${res.status})`), {
			status: 502,
		});
	}
	return (await res.json()) as SpotifyTokens;
}

async function getSpotifyProfile(accessToken: string): Promise<SpotifyProfile> {
	const res = await fetch("https://api.spotify.com/v1/me", {
		headers: { Authorization: `Bearer ${accessToken}` },
	});
	if (!res.ok) {
		throw Object.assign(new Error(`Spotify profile fetch failed (${res.status})`), {
			status: 502,
		});
	}
	return (await res.json()) as SpotifyProfile;
}

/**
 * Resolves the anonymous user id for this browser: reads the cookie, or sets a
 * fresh one. The cookie is httpOnly so it cannot be read by scripts.
 */
function resolveAnonUser(req: Request, res: Response): string {
	const existing = req.cookies[USER_COOKIE];
	if (typeof existing === "string" && existing.length >= 16) {
		return existing;
	}
	const fresh = crypto.randomBytes(24).toString("hex");
	res.cookie(USER_COOKIE, fresh, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: USER_COOKIE_MAX_AGE,
	});
	return fresh;
}

/**
 * Returns the decrypted access token for this user, refreshing it if it is
 * about to expire. Returns null when the user has not connected Spotify.
 */
async function getFreshAccessToken(anonymousUserId: string): Promise<string | null> {
	const account = await SpotifyAccountModel.findOne({ anonymousUserId }).exec();
	if (account === null) return null;

	if (Date.now() > account.expiresAt.getTime() - 60_000) {
		const tokens = await tokenRequest(
			new URLSearchParams({
				grant_type: "refresh_token",
				refresh_token: decryptToken(account.refreshToken),
			}),
		);
		account.accessToken = encryptToken(tokens.access_token);
		if (tokens.refresh_token) account.refreshToken = encryptToken(tokens.refresh_token);
		account.expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
		await account.save();
		return tokens.access_token;
	}
	return decryptToken(account.accessToken);
}

// cookie-parser must be installed before these routes run
export const spotifyAuthCookies = cookieParser();

// Small page that reports the OAuth result to the parent window (silent
// iframe flow) and/or the opener (popup flow) via postMessage.
function callbackResultPage(type: "dupontdoku:spotify-connected" | "dupontdoku:spotify-auth-failed", message = ""): string {
	return `<!doctype html><title>Dupontdoku</title>
<body style="margin:0;background:#ffffff">
<script>
  const payload = JSON.stringify({ type: ${JSON.stringify(type)}, message: ${JSON.stringify(message)} });
  if (window.parent !== window) {
    window.parent.postMessage(payload, "*");
  }
  if (window.opener) {
    window.opener.postMessage(payload, "*");
  }
</script>
</body>`;
}

export const spotifyAuthController = {
	// Step 0: frontend asks whether this browser is connected
	async status(req: Request, res: Response): Promise<void> {
		
		const userId = resolveAnonUser(req, res);
		const account = await SpotifyAccountModel.findOne({ anonymousUserId: userId }).exec();
		res.json({
			connected: account !== null,
			displayName: account?.spotifyDisplayName ?? null,
		});
	},

	// Step 1: redirect the browser to the Spotify login page.
	async startAuth(req: Request, res: Response): Promise<void> {
		
		const { clientId, redirectUri } = config();
		const userId = resolveAnonUser(req, res);
		const state = crypto.randomBytes(16).toString("hex");
		await SpotifyOAuthStateModel.create({ state, anonymousUserId: userId });
		const params = new URLSearchParams({
			client_id: clientId,
			response_type: "code",
			redirect_uri: redirectUri,
			scope: SCOPES.join(" "),
			state,
		});
		res.redirect(`${SPOTIFY_AUTHORIZE_URL}?${params.toString()}`);
	},

	// Step 2: Spotify redirects back here with ?code=...&state=...
	async handleCallback(req: Request, res: Response): Promise<void> {
		
		const { code, state } = req.query;
		if (typeof code !== "string" || typeof state !== "string") {
			res.status(400).type("text/html").send(callbackResultPage("dupontdoku:spotify-auth-failed", "Invalid OAuth callback"));
			return;
		}
		const stateDoc = await SpotifyOAuthStateModel.findOneAndDelete({ state }).exec();
		if (stateDoc === null) {
			res.status(400).type("text/html").send(callbackResultPage("dupontdoku:spotify-auth-failed", "State mismatch or expired"));
			return;
		}
		const anonymousUserId = stateDoc.anonymousUserId;

		try {
			const { redirectUri } = config();
			const tokens = await tokenRequest(
				new URLSearchParams({
					grant_type: "authorization_code",
					code,
					redirect_uri: redirectUri,
				}),
			);
			const profile = await getSpotifyProfile(tokens.access_token);

			await SpotifyAccountModel.findOneAndUpdate(
				{ anonymousUserId },
				{
					anonymousUserId,
					spotifyUserId: profile.id,
					spotifyDisplayName: profile.display_name,
					accessToken: encryptToken(tokens.access_token),
					refreshToken: encryptToken(tokens.refresh_token ?? ""),
					expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
					scopes: tokens.scope ?? SCOPES.join(" "),
					connectedAt: new Date(),
				},
				{ upsert: true },
			);

			// the flow ran inside an iframe on the frontend — the callback page
			// itself stays invisible: it only posts the result to the parent,
			// which shows its own confirmation and closes the window
			res.type("text/html").send(callbackResultPage("dupontdoku:spotify-connected"));
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown error";
			res.status(500).type("text/html").send(callbackResultPage("dupontdoku:spotify-auth-failed", message));
		}
	},

	// Step 3: the frontend's Web Playback SDK asks for this user's token.
	// Returns 204 when this browser has not connected its own Spotify account.
	async playbackToken(req: Request, res: Response): Promise<void> {
		
		const userId = resolveAnonUser(req, res);
		const token = await getFreshAccessToken(userId);
		if (token === null) {
			res.status(204).end();
			return;
		}
		res.json({ token });
	},

	// Disconnect removes this user's stored tokens. Spotify has no documented
	// token-revocation endpoint, so deleting the record is the effective opt-out.
	async disconnect(req: Request, res: Response): Promise<void> {
		
		const userId = resolveAnonUser(req, res);
		await SpotifyAccountModel.findOneAndDelete({ anonymousUserId: userId }).exec();
		res.json({ connected: false });
	},
};
