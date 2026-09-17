import { Schema, model, type Document, type Types } from "mongoose";

export interface ITourDate extends Document {
	_id: Types.ObjectId;
	// human-readable date, e.g. "Fri Nov 06 2026" or "Spring 2027"
	eventDate: string;
	city: string;
	venue: string;
	// per-show ticket shop (empty if tickets go through the general URL)
	ticketUrl: string;
	notes: string;
	sortOrder: number;
	createdAt: Date;
	updatedAt: Date;
}

const tourDateSchema = new Schema<ITourDate>({
	eventDate: { type: String, required: true, trim: true },
	city: { type: String, required: true, trim: true },
	venue: { type: String, required: true, trim: true },
	ticketUrl: { type: String, default: "", trim: true },
	notes: { type: String, default: "", trim: true },
	sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

export const TourDateModel = model<ITourDate>("TourDate", tourDateSchema);

export function transformTourDate(doc: ITourDate | Record<string, unknown>): Record<string, unknown> {
	const d = doc as ITourDate & { __v?: unknown };
	return {
		id: String(d._id),
		eventDate: d.eventDate,
		city: d.city,
		venue: d.venue,
		ticketUrl: d.ticketUrl,
		notes: d.notes,
		sortOrder: d.sortOrder,
		createdAt: d.createdAt,
		updatedAt: d.updatedAt,
	};
}
