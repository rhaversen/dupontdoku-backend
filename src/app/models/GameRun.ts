import { Schema, model, type Document, type Types } from "mongoose";
export interface IGameRun extends Document {
	_id: Types.ObjectId;
	publicKeyJwk: Record<string, unknown>;
	fingerprint: string;
	respondedSeqs: number[];
	completed: number;
	transcript: string;
	code: string | null;
	startedAt: Date;
	completedAt: Date | null;
}
const runSchema = new Schema<IGameRun>({
	publicKeyJwk: { type: Schema.Types.Mixed, required: true },
	fingerprint: { type: String, required: true, unique: true },
	respondedSeqs: { type: [Number], default: [] },
	completed: { type: Number, default: 0 },
	transcript: { type: String, default: "" },
	code: { type: String, default: null },
	startedAt: { type: Schema.Types.Date, default: () => new Date() },
	completedAt: { type: Schema.Types.Date, default: null },
}, { timestamps: true });

export const GameRunModel = model<IGameRun>("GameRun", runSchema);
