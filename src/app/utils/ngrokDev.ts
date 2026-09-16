let ngrokUrl: string | undefined;

export function getNgrokUrl(): string | undefined {
	return ngrokUrl;
}

const SPOTIFY_CALLBACK_PATH = "/api/spotify-auth/callback";
const DEFAULT_INTERNAL_DOMAIN = "default.internal";

/**
 * Starts an internal ngrok Agent Endpoint that forwards to the local dev server.
 *
 * This assumes a persistent Cloud Endpoint (created in the ngrok dashboard) is
 * already configured with a Traffic Policy that uses `forward-internal` to route
 * public traffic to this internal domain. The dev server only starts the agent —
 * it never claims the public domain, so there are no "already online" conflicts.
 *
 * The returned URL is the public Cloud Endpoint domain (stable across restarts),
 * suitable for registering once with Spotify.
 */
export async function startDevTunnel(port: number): Promise<string> {
	const ngrok = await import("@ngrok/ngrok");

	const internalDomain = process.env.NGROK_INTERNAL_DOMAIN ?? DEFAULT_INTERNAL_DOMAIN;

	const listener = await ngrok.forward({
		addr: port,
		authtoken_from_env: true,
		binding: "internal",
		domain: internalDomain,
	});

	const listenerUrl = listener.url();
	if (listenerUrl === null) {
		throw new Error("ngrok listener returned no URL");
	}
	ngrokUrl = listenerUrl;

	const publicDomain = process.env.NGROK_DOMAIN;
	if (publicDomain === undefined || publicDomain === "") {
		throw new Error("NGROK_DOMAIN is required — set it to your Cloud Endpoint URL");
	}

	// normalize to a full https:// URL — NGROK_DOMAIN may be a bare hostname
	const publicUrl = publicDomain.startsWith("https://") ? publicDomain : `https://${publicDomain}`;

	// the OAuth redirect must go through the tunnel; expose it for server.ts
	process.env.SPOTIFY_PLAYBACK_REDIRECT_URI = `${publicUrl}${SPOTIFY_CALLBACK_PATH}`;

	// eslint-disable-next-line no-console
	console.log(`ngrok internal agent endpoint established at ${listenerUrl}`);
	// eslint-disable-next-line no-console
	console.log(`Cloud Endpoint (public): ${publicUrl}`);
	// eslint-disable-next-line no-console
	console.log(`Spotify redirect URI: ${process.env.SPOTIFY_PLAYBACK_REDIRECT_URI}`);

	return publicUrl;
}

export async function stopDevTunnel(): Promise<void> {
	if (ngrokUrl === undefined) {
		return;
	}
	const ngrok = await import("@ngrok/ngrok");
	try {
		await ngrok.disconnect(ngrokUrl);
	} catch {
		await ngrok.kill();
	}
	ngrokUrl = undefined;
	// eslint-disable-next-line no-console
	console.log("ngrok internal agent endpoint closed");
}
