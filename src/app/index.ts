import express from "express";
import cors from "cors";

import mongoose from "mongoose";

import databaseConnector from "./utils/databaseConnector.js";
import serviceRouter from "./routes/service.js";
import { spotifyRouter } from "./routes/spotify.js";
import { spotifyAuthRouter } from "./routes/spotifyAuth.js";

const app = express();
const port = Number(process.env.PORT ?? 5175);

const origins = process.env.CORS_ORIGIN?.split(",").map((o) => o.trim());
app.use(cors(origins?.length ? { origin: origins } : {}));

app.use("/service", serviceRouter);
app.use("/api/spotify", spotifyRouter);
app.use("/api/spotify-auth", spotifyAuthRouter);

// production/staging connect to Atlas here; development already connected to
// the in-memory MongoDB in development/index.ts
if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging") {
	await databaseConnector.connectToMongoDB();
}

const server = app.listen(port, () => {
	// eslint-disable-next-line no-console
	console.log(`dupontdoku-backend listening on http://localhost:${port}`);
});

export async function shutDown(): Promise<void> {
	// eslint-disable-next-line no-console
	console.log("Shutting down the server...");
	server.close();
	await mongoose.disconnect();
	// eslint-disable-next-line no-console
	console.log("Server shut down complete");
}
