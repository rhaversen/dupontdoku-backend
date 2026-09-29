import { Schema, model, type Document } from "mongoose";

export interface IConfig extends Document {
	bio: string;
	contactEmail: string;
	footerNote: string;
	// main "Tickets" fallback — the one ticket shop covering the tour
	generalTicketUrl: string;
}

const configSchema = new Schema<IConfig>({
	bio: { type: String, default: "" },
	contactEmail: { type: String, default: "" },
	footerNote: { type: String, default: "" },
	generalTicketUrl: { type: String, default: "" },
}, { timestamps: true });

export const ConfigModel = model<IConfig>("Config", configSchema);

export function transformConfig(config: IConfig | Record<string, unknown>): Record<string, unknown> {
	const { bio, contactEmail, footerNote, generalTicketUrl } = config as IConfig;
	return { bio, contactEmail, footerNote, generalTicketUrl };
}

export async function getOrCreateConfig(): Promise<IConfig> {
	let config = await ConfigModel.findOne();
	if (!config) {
		config = await ConfigModel.create({});
	}
	return config;
}
