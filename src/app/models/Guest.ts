import { Schema, model, type Document, type Types } from "mongoose";

export interface IGuest extends Document {
	_id: Types.ObjectId;
	name: string;
	email: string;
	fingerprint: string;
	runId: Types.ObjectId;
	durationMs: number;
	createdAt: Date;
}

const guestSchema = new Schema<IGuest>({
	name: { type: String, required: true, trim: true, maxLength: 80 },
	email: { type: String, required: true, trim: true, maxLength: 200 },
	fingerprint: { type: String, required: true, unique: true },
	runId: { type: Schema.Types.ObjectId, ref: "GameRun", required: true },
	durationMs: { type: Number, required: true, min: 0 },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const GuestModel = model<IGuest>("Guest", guestSchema);

export function transformGuest(doc: IGuest): Record<string, unknown> {
	return {
		id: String(doc._id),
		name: doc.name,
		durationMs: doc.durationMs,
		createdAt: doc.createdAt,
	};
}
