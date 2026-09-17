import { Schema, model, type Document } from "mongoose";

export interface IConfig extends Document {
	welcomeMessage: string;
	contactEmail: string;
	heroText: string;
	footerNote: string;
	// main "Get Tickets" button — the one ticket shop covering the tour
	generalTicketUrl: string;
	createdAt: Date;
	updatedAt: Date;
}

const configSchema = new Schema<IConfig>({
	welcomeMessage: { type: String, default: "Welcome to dupontdoku." },
	contactEmail: { type: String, default: "" },
	heroText: { type: String, default: "" },
	footerNote: { type: String, default: "" },
	generalTicketUrl: { type: String, default: "" },
}, { timestamps: true });

export const ConfigModel = model<IConfig>("Config", configSchema);

export function transformConfig(config: IConfig | Record<string, unknown>): Record<string, unknown> {
	const { welcomeMessage, heroText, contactEmail, footerNote, generalTicketUrl, createdAt, updatedAt } = config as IConfig;
	return { welcomeMessage, heroText, contactEmail, footerNote, generalTicketUrl, createdAt, updatedAt };
}

export async function getOrCreateConfig(): Promise<IConfig> {
	let config = await ConfigModel.findOne();
	if (!config) {
		config = await ConfigModel.create({});
	}
	return config;
}
