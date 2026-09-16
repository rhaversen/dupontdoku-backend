import mongoose from "mongoose";

import { shutDown } from "../index.js";

const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, NODE_ENV } = process.env as Record<string, string>;

const mongooseOpts = {
	dbName: DB_NAME,
	retryWrites: true,
	w: "majority" as const,
	appName: "DupontdokuBackend",
};

const maxRetryAttempts = 5;
const retryInterval = 5000;

const mongoUri = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/?retryWrites=true&w=majority&appName=DupontdokuBackend`;

function isMemoryDatabase(): boolean {
	return mongoose.connection.host.toString() === "127.0.0.1";
}

async function connectToMongoDB(): Promise<void> {
	if (NODE_ENV !== "production" && NODE_ENV !== "staging") {
		return;
	}

	for (let currentRetryAttempt = 0; currentRetryAttempt < maxRetryAttempts; currentRetryAttempt++) {
		// eslint-disable-next-line no-console
		console.log("Attempting connection to MongoDB");

		try {
			await mongoose.connect(mongoUri, mongooseOpts);
			// eslint-disable-next-line no-console
			console.log("Connected to MongoDB");
			return;
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error("Error connecting to MongoDB", error);
			await new Promise((resolve) => setTimeout(resolve, retryInterval));
		}
	}

	// eslint-disable-next-line no-console
	console.error(`Failed to connect to MongoDB after ${maxRetryAttempts} attempts. Shutting down.`);
	await shutDown();
}

const databaseConnector = {
	isMemoryDatabase,
	connectToMongoDB,
};

export default databaseConnector;
