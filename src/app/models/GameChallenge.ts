import { Schema, model, type Document } from "mongoose";

export interface IGameChallenge extends Document {
	seq: number;
	targetX: number;
	targetY: number;
	createdAt: Date;
}

const challengeSchema = new Schema<IGameChallenge>({
	seq: { type: Number, required: true, unique: true },
	targetX: { type: Number, required: true, min: 0, max: 1 },
	targetY: { type: Number, required: true, min: 0, max: 1 },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const GameChallengeModel = model<IGameChallenge>("GameChallenge", challengeSchema);
