import { Schema, model, type Document, type Types } from "mongoose";

export interface IInviteCode extends Document {
	_id: Types.ObjectId;
	code: string;
	fingerprint: string;
	runId: Types.ObjectId;
	used: boolean;
}

const inviteCodeSchema = new Schema<IInviteCode>({
	code: { type: String, required: true, unique: true },
	fingerprint: { type: String, required: true, index: true },
	runId: { type: Schema.Types.ObjectId, ref: "GameRun", required: true },
	used: { type: Boolean, default: false },
}, { timestamps: true });

export const InviteCodeModel = model<IInviteCode>("InviteCode", inviteCodeSchema);
