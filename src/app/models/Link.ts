import { Schema, model, type Document, type Types } from "mongoose";

export interface ILink extends Document {
	_id: Types.ObjectId;
	label: string;
	url: string;
	icon: string;
	location: "start" | "desktop" | "window";
	// grouping inside a location, e.g. "music" | "social" | "press" | "other"
	category: string;
	sortOrder: number;
	createdAt: Date;
	updatedAt: Date;
}

const linkSchema = new Schema<ILink>({
	label: { type: String, required: true, trim: true, maxLength: 100 },
	url: { type: String, required: true, trim: true },
	icon: { type: String, default: "", trim: true },
	location: { type: String, enum: ["start", "desktop", "window"], default: "start" },
	category: { type: String, default: "other", trim: true },
	sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

export const LinkModel = model<ILink>("Link", linkSchema);

export function transformLink(doc: ILink | Record<string, unknown>): Record<string, unknown> {
	const l = doc as ILink & { __v?: unknown };
	return {
		id: String(l._id),
		label: l.label,
		url: l.url,
		icon: l.icon,
		location: l.location,
		category: l.category,
		sortOrder: l.sortOrder,
		createdAt: l.createdAt,
		updatedAt: l.updatedAt,
	};
}
