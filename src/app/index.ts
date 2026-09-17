import express from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import cookieParser from "cookie-parser";

import mongoose from "mongoose";

import databaseConnector from "./utils/databaseConnector.js";
import serviceRouter from "./routes/service.js";
import { spotifyRouter } from "./routes/spotify.js";
import { spotifyAuthRouter } from "./routes/spotifyAuth.js";
import authRouter from "./routes/auth.js";
import configRouter from "./routes/config.js";
import tourDatesRouter from "./routes/tourDates.js";
import blogPostsRouter from "./routes/blogPosts.js";
import videosRouter from "./routes/videos.js";
import linksRouter from "./routes/links.js";
import gameRouter from "./routes/game.js";
import { setupPassport } from "./utils/passportConfig.js";
import { globalErrorHandler } from "./middleware/globalErrorHandler.js";
import { startChallengeScheduler } from "./utils/challengeScheduler.js";
import { seedIfEmpty } from "./utils/seed.js";

const app = express();
const port = Number(process.env.PORT ?? 5175);

const origins = process.env.CORS_ORIGIN?.split(",").map((o) => o.trim());
app.use(cors({
	origin: origins?.length ? origins : true,
	credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// production/staging connect to Atlas here; development already connected to
// the in-memory MongoDB in startServer.ts before the app is imported
if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging") {
	await databaseConnector.connectToMongoDB();
}

const sessionSecret = process.env.SESSION_SECRET ?? "dev-session-secret";
const sessionCookieMaxAgeMs = Number(process.env.SESSION_MAX_AGE_MS ?? 1000 * 60 * 60 * 24 * 30);

app.use(session({
	secret: sessionSecret,
	resave: false,
	saveUninitialized: false,
	store: MongoStore.create({
		client: mongoose.connection.getClient(),
		collectionName: "sessions",
	}),
	cookie: {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: sessionCookieMaxAgeMs,
	},
}));

setupPassport(app);

app.use("/service", serviceRouter);
app.use("/api/auth", authRouter);
app.use("/api/config", configRouter);
app.use("/api/tour-dates", tourDatesRouter);
app.use("/api/blog-posts", blogPostsRouter);
app.use("/api/videos", videosRouter);
app.use("/api/links", linksRouter);
app.use("/api/game", gameRouter);
app.use("/api/spotify", spotifyRouter);
app.use("/api/spotify-auth", spotifyAuthRouter);

app.use(globalErrorHandler);

await seedIfEmpty();

const server = app.listen(port, () => {
	// eslint-disable-next-line no-console
	console.log(`dupontdoku-backend listening on http://localhost:${port}`);
	startChallengeScheduler();
});

export async function shutDown(): Promise<void> {
	// eslint-disable-next-line no-console
	console.log("Shutting down the server...");
	server.close();
	await mongoose.disconnect();
	// eslint-disable-next-line no-console
	console.log("Server shut down complete");
}
