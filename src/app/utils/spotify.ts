// Spotify Client Credentials flow — server-to-server, no user context.
// Token is cached until 1 minute before expiry.
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";

export interface SpotifyTrackInfo {
	id: string;
	name: string;
	artists: string[];
	albumImage: string | null;
	durationMs: number;
	spotifyUrl: string;
	previewUrl: string | null;
}

type SpotifyTokenResponse = {
	access_token: string;
	expires_in: number;
	token_type: string;
};

let cachedToken: string | null = null;
let cachedTokenExpiry = 0;

export async function getClientCredentialsToken(): Promise<string> {
	const now = Date.now();
	if (cachedToken !== null && now < cachedTokenExpiry - 60_000) {
		return cachedToken;
	}

	const clientId = process.env.SPOTIFY_CLIENT_ID;
	const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		throw Object.assign(new Error("SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET is not set"), {
			status: 501,
		});
	}

	const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
	const res = await fetch(SPOTIFY_TOKEN_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: authHeader,
		},
		body: new URLSearchParams({ grant_type: "client_credentials" }),
	});

	if (!res.ok) {
		throw Object.assign(new Error(`Spotify token request failed (${res.status})`), {
			status: 502,
		});
	}

	const json = (await res.json()) as SpotifyTokenResponse;
	cachedToken = json.access_token;
	cachedTokenExpiry = now + json.expires_in * 1000;
	return json.access_token;
}

export async function getArtistTopTracks(): Promise<{
	tracks: SpotifyTrackInfo[];
	artistName: string;
}> {
	const token = await getClientCredentialsToken();
	const headers = { Authorization: `Bearer ${token}` };
	const artistId = process.env.SPOTIFY_ARTIST_ID;
	const fallbackName = process.env.SPOTIFY_ARTIST_NAME ?? "Dupont";

	if (!artistId) {
		throw Object.assign(new Error("SPOTIFY_ARTIST_ID is not set"), { status: 501 });
	}

	const artistRes = await fetch(`${SPOTIFY_API_BASE_URL}/artists/${artistId}`, { headers });
	if (!artistRes.ok) {
		throw Object.assign(new Error(`Spotify artist fetch failed (${artistRes.status})`), {
			status: 502,
		});
	}
	const artist = (await artistRes.json()) as { id: string; name: string };

	// Resolve the catalog entirely by ID — no name search involved, so other
	// artists sharing the name can never leak in. /artists/{id}/top-tracks is
	// 403 for Client Credentials apps created after mid-2025, and search wastes
	// its 10-result budget on same-named artists, so we walk the discography
	// via /artists/{id}/albums + /albums/{id} instead. This app's tier rejects
	// limits above 10 on both endpoints.
	const albumsRes = await fetch(
		`${SPOTIFY_API_BASE_URL}/artists/${artistId}/albums?include_groups=album,single&limit=10&market=DK`,
		{ headers },
	);
	if (!albumsRes.ok) {
		throw Object.assign(new Error(`Spotify albums fetch failed (${albumsRes.status})`), {
			status: 502,
		});
	}
	const albums = (await albumsRes.json()) as {
		items: Array<{ id: string }>;
	};

	const seen = new Set<string>();
	const tracks: SpotifyTrackInfo[] = [];
	for (const album of albums.items) {
		const albumRes = await fetch(
			`${SPOTIFY_API_BASE_URL}/albums/${album.id}?market=DK`,
			{ headers },
		);
		if (!albumRes.ok) continue;
		const albumData = (await albumRes.json()) as {
			images: Array<{ url: string }>;
			tracks: {
				items: Array<{
					id: string;
					name: string;
					artists: Array<{ id: string; name: string }>;
					duration_ms: number;
					external_urls: { spotify: string };
					preview_url: string | null;
				}>;
			};
		};
		const albumImage = albumData.images[0]?.url ?? null;
		for (const t of albumData.tracks.items) {
			if (seen.has(t.id)) continue;
			seen.add(t.id);
			tracks.push({
				id: t.id,
				name: t.name,
				artists: t.artists.map((a) => a.name),
				albumImage,
				durationMs: t.duration_ms,
				spotifyUrl: t.external_urls.spotify,
				previewUrl: t.preview_url,
			});
		}
	}

	return { tracks, artistName: artist.name };
}
