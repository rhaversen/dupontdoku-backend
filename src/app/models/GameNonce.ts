import { Schema, model, type Document, type Types } from "mongoose";

export interface IGameNonce extends Document {
	_id: Types.ObjectId;
	nonce: string;
	codeId: Types.ObjectId;
	expiresAt: Date;
}

const gameNonceSchema = new Schema<IGameNonce>({
	nonce: { type: String, required: true, unique: true },
	codeId: { type: Schema.Types.ObjectId, ref: "InviteCode", required: true, index: true },
	expiresAt: { type: Date, required: true },
}, { timestamps: false });

gameNonceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const GameNonceModel = model<IGameNonce>("GameNonce", gameNonceSchema);
