import mongoose from "mongoose";
import { GameChallengeModel } from "../models/GameChallenge.js";
import { CHALLENGE_INTERVAL_MS } from "../utils/gameCrypto.js";

// targets stay in the middle band so the spawned dialog's OK button can
// never be clamped out of tolerance distance from the target
const TARGET_MIN = 0.12;
const TARGET_MAX = 0.88;

function randomTarget(): number {
	return TARGET_MIN + Math.random() * (TARGET_MAX - TARGET_MIN);
}

let timer: NodeJS.Timeout | null = null;

// the challenge stream runs on a global clock, connected players or not —
// this is what makes the run duration impossible to compress
export async function ensureChallenges(): Promise<void> {
	const last = await GameChallengeModel.findOne().sort({ seq: -1 }).lean();
	if (!last) {
		// fresh database — seed a single challenge now; the scheduler keeps
		// emitting one per interval from here on
		await GameChallengeModel.create({
			seq: 1,
			targetX: randomTarget(),
			targetY: randomTarget(),
		});
		return;
	}
	const lastSeq = last.seq;
	const lastCreated = last.createdAt!.getTime();
	const dueCount = Math.min(
		Math.floor((Date.now() - lastCreated) / CHALLENGE_INTERVAL_MS),
		5,
	);
	if (dueCount > 0) {
		const docs = Array.from({ length: dueCount }, (_, i) => ({
			seq: lastSeq + 1 + i,
			targetX: randomTarget(),
			targetY: randomTarget(),
		}));
		await GameChallengeModel.insertMany(docs, { ordered: false }).catch(() => {});
	}
}

export function startChallengeScheduler(): void {
	if (timer) return;
	void ensureChallenges();
	timer = setInterval(() => {
		void ensureChallenges().catch(() => {});
	}, CHALLENGE_INTERVAL_MS);
	// don't hold the process open in dev watch mode
	timer.unref();
}

export async function stopChallengeScheduler(): Promise<void> {
	if (timer) {
		clearInterval(timer);
		timer = null;
	}
	await mongoose.connection.close().catch(() => {});
}
