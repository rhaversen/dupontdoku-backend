import { Router } from "express";

import { spotifyController } from "../controllers/spotify.js";

export const spotifyRouter = Router();

spotifyRouter.get("/", spotifyController.tracks);
