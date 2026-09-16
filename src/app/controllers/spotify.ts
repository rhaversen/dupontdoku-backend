import { type Request, type Response } from "express";

import { getArtistTopTracks } from "../utils/spotify.js";

let cache: { at: number; payload: unknown } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

export const spotifyController = {
	async tracks(_req: Request, res: Response): Promise<void> {
		if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
			res.json(cache.payload);
			return;
		}
		try {
			const payload = await getArtistTopTracks();
			cache = { at: Date.now(), payload };
			res.json(payload);
		} catch (err) {
			const status = (err as { status?: number }).status ?? 500;
			res.status(status).json({ error: (err as Error).message });
		}
	},
};
