import { Router } from "express";

import { spotifyAuthController, spotifyAuthCookies } from "../controllers/spotifyAuth.js";

export const spotifyAuthRouter = Router();

spotifyAuthRouter.use(spotifyAuthCookies);

const handle =
	(fn: (req: import("express").Request, res: import("express").Response) => Promise<void>) =>
	(req: import("express").Request, res: import("express").Response) => {
		fn(req, res).catch((err) => {
			res.status((err as { status?: number }).status ?? 500).json({ error: (err as Error).message });
		});
	};

spotifyAuthRouter.get("/status", handle(spotifyAuthController.status));
spotifyAuthRouter.get("/auth", handle(spotifyAuthController.startAuth));
spotifyAuthRouter.get("/callback", handle(spotifyAuthController.handleCallback));
spotifyAuthRouter.get("/playback-token", handle(spotifyAuthController.playbackToken));
spotifyAuthRouter.post("/disconnect", handle(spotifyAuthController.disconnect));
