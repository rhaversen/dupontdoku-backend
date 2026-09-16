import connectToInMemoryMongoDB, {
	disconnectFromInMemoryMongoDB,
} from "./test/mongoMemoryReplSetConnector.js";
import { startDevTunnel, stopDevTunnel } from "./app/utils/ngrokDev.js";

const SPOTIFY_CALLBACK_PATH = "/api/spotify-auth/callback";

export async function startServer(): Promise<void> {
	try {
		// start the tunnel first so SPOTIFY_PLAYBACK_REDIRECT_URI is set
		// before the express app (and its config reads) initialize
		if (process.env.NGROK_AUTHTOKEN !== undefined && process.env.NGROK_AUTHTOKEN !== "") {
			const port = Number(process.env.PORT ?? 5175);
			const tunnelUrl = await startDevTunnel(port);
			const redirectUri = `${tunnelUrl}${SPOTIFY_CALLBACK_PATH}`;
			process.env.SPOTIFY_PLAYBACK_REDIRECT_URI = redirectUri;
		}

		// development always uses the in-memory MongoDB — production/staging
		// connect to Atlas inside app/index.ts instead
		await connectToInMemoryMongoDB();

		await import("./app/index.js");

		const gracefulShutdown = async (): Promise<void> => {
			await stopDevTunnel();
			await disconnectFromInMemoryMongoDB();
			process.exit(0);
		};
		process.on("SIGINT", () => void gracefulShutdown());
		process.on("SIGTERM", () => void gracefulShutdown());
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Failed to start the server:", error);
	}
}
