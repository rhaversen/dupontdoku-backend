import { Schema, model, type Document, type Types } from "mongoose";

export interface IVideo extends Document {
	_id: Types.ObjectId;
	youtubeId: string;
	title: string;
	subtitle: string;
	sortOrder: number;
	createdAt: Date;
	updatedAt: Date;
}

const videoSchema = new Schema<IVideo>({
	youtubeId: { type: String, required: true, trim: true },
	title: { type: String, required: true, trim: true, maxLength: 200 },
	subtitle: { type: String, default: "", trim: true },
	sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

export const VideoModel = model<IVideo>("Video", videoSchema);

export function transformVideo(doc: IVideo | Record<string, unknown>): Record<string, unknown> {
	const v = doc as IVideo & { __v?: unknown };
	return {
		id: String(v._id),
		youtubeId: v.youtubeId,
		title: v.title,
		subtitle: v.subtitle,
		sortOrder: v.sortOrder,
		createdAt: v.createdAt,
		updatedAt: v.updatedAt,
	};
}
