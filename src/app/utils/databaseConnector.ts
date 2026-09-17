import mongoose from "mongoose";

import { shutDown } from "../index.js";

import config from "./setupConfig.js";

const { NODE_ENV, DB_NAME, DB_USER, DB_PASSWORD, DB_HOST } = process.env as Record<string, string>;

const { mongooseOpts, maxRetryAttempts, retryInterval, retryWrites, w, appName } = config;

const mongoUri = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}?retryWrites=${retryWrites}&w=${w}&appName=${appName}`;

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
