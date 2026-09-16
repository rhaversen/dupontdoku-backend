import type { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

let replSet: MongoMemoryReplSet;

export default async function connectToInMemoryMongoDB(): Promise<void> {
	// lazy import: the memory server is only needed in development
	const { MongoMemoryReplSet } = await import("mongodb-memory-server");
	replSet = new MongoMemoryReplSet();

	// eslint-disable-next-line no-console
	console.log("Attempting connection to in-memory MongoDB");

	try {
		await replSet.start();
		await replSet.waitUntilRunning();
		const mongoUri = replSet.getUri();
		await mongoose.connect(mongoUri);
		// eslint-disable-next-line no-console
		console.log("Connected to in-memory MongoDB");
	} catch (error) {
		if (error instanceof Error) {
			// eslint-disable-next-line no-console
			console.error(`Error connecting to in-memory MongoDB: ${error.message}`);
		} else {
			// eslint-disable-next-line no-console
			console.error(`Error connecting to in-memory MongoDB: ${String(error)}`);
		}
		throw error;
	}
}

export async function disconnectFromInMemoryMongoDB(): Promise<void> {
	// eslint-disable-next-line no-console
	console.log("Closing connection to in-memory MongoDB...");
	await mongoose.disconnect();
	// eslint-disable-next-line no-console
	console.log("Mongoose disconnected");

	// eslint-disable-next-line no-console
	console.log("Stopping memory database replica set...");
	await replSet.stop({ doCleanup: true, force: true });
	// eslint-disable-next-line no-console
	console.log("Memory database replica set stopped");
}
