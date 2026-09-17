import config from "config";
import { type ConnectOptions } from "mongoose";

const AppConfig = {
	mongooseOpts: { ...config.get("mongoose.options") } as ConnectOptions,
	maxRetryAttempts: config.get("mongoose.retrySettings.maxAttempts") as number,
	retryInterval: config.get("mongoose.retrySettings.interval") as number, // in milliseconds
	retryWrites: config.get("mongoose.options.retryWrites") as string,
	w: config.get("mongoose.options.w") as string,
	appName: config.get("mongoose.options.appName") as string,
};

export default AppConfig;
