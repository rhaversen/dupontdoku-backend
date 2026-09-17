import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { GameChallengeModel } from "../models/GameChallenge.js";
import { GameRunModel, type IGameRun } from "../models/GameRun.js";
import { InviteCodeModel } from "../models/InviteCode.js";
import { GameNonceModel } from "../models/GameNonce.js";
import { GuestModel, transformGuest } from "../models/Guest.js";
import {
	REQUIRED_RESPONSES,
	LATENESS_MS,
	TOLERANCE,
	MIN_REACTION_MS,
	NONCE_TTL_MS,
	fingerprintPublicKey,
	verifySignature,
	chainTranscript,
	mintCode,
	newNonce,
} from "../utils/gameCrypto.js";

type RunRequest = Request & { gameRun?: IGameRun };

async function loadRun(req: RunRequest, res: Response): Promise<IGameRun | null> {
	const fingerprint = String(req.body?.fingerprint ?? "");
	const run = await GameRunModel.findOne({ fingerprint });
	if (!run) {
		res.status(404).send("Run not found");
		return null;
	}
	req.gameRun = run;
	return run;
}

export async function startRun(req: Request, res: Response, next: NextFunction) {
	try {
		const { publicKeyJwk } = req.body ?? {};
		if (!publicKeyJwk || typeof publicKeyJwk !== "object" || !publicKeyJwk.kty) {
			res.status(400).send("publicKeyJwk is required");
			return;
		}
		const fingerprint = fingerprintPublicKey(publicKeyJwk);
		const existingGuest = await GuestModel.findOne({ fingerprint }).lean();
		if (existingGuest) {
			res.status(409).json({ error: "already-guest" });
			return;
		}
		// one active run per browser fingerprint
		const run = await GameRunModel.findOneAndUpdate(
			{ fingerprint },
			{ $setOnInsert: { publicKeyJwk, fingerprint, startedAt: new Date() } },
			{ upsert: true, new: true },
		);
		res.json({
			runId: String(run._id),
			fingerprint: run.fingerprint,
			completed: run.completed,
			code: run.code,
			required: REQUIRED_RESPONSES,
			respondedSeqs: run.respondedSeqs,
		});
	} catch (err) {
		next(err);
	}
}

export async function getState(req: Request, res: Response, next: NextFunction) {
	try {
		const fingerprint = String(req.query.fingerprint ?? "");
		const run = fingerprint ? await GameRunModel.findOne({ fingerprint }) : null;
		const challenge = await GameChallengeModel.findOne().sort({ seq: -1 }).lean();
		if (!challenge) {
			res.json({ challenge: null, nextRevealAt: null, run: null });
			return;
		}
		const createdAt = challenge.createdAt!.getTime();
		const revealed = Date.now() - createdAt <= LATENESS_MS;
		const nextRevealAt = createdAt + LATENESS_MS;
		const responded = run ? run.respondedSeqs.includes(challenge.seq) : false;
		res.json({
			challenge:
				revealed && !responded
					? { seq: challenge.seq, targetX: challenge.targetX, targetY: challenge.targetY }
					: null,
			nextRevealAt,
			run: run
				? {
						completed: run.completed,
						required: REQUIRED_RESPONSES,
						code: run.code,
						respondedSeqs: run.respondedSeqs,
					}
				: null,
		});
	} catch (err) {
		next(err);
	}
}

export async function respond(req: RunRequest, res: Response, next: NextFunction) {
	try {
		const run = await loadRun(req, res);
		if (!run) return;
		if (run.code) {
			res.status(409).send("Run already completed");
			return;
		}
		const { seq, x, y, signature } = req.body ?? {};
		if (
			!Number.isInteger(seq) ||
			typeof x !== "number" ||
			typeof y !== "number" ||
			x < 0 ||
			x > 1 ||
			y < 0 ||
			y > 1 ||
			typeof signature !== "string"
		) {
			res.status(400).send("Invalid response");
			return;
		}
		if (run.respondedSeqs.includes(seq)) {
			res.status(409).send("Already responded");
			return;
		}
		const challenge = await GameChallengeModel.findOne({ seq }).lean();
		if (!challenge) {
			res.status(404).send("Unknown challenge");
			return;
		}
		const createdAt = challenge.createdAt!.getTime();
		const receivedAt = new Date();
		if (receivedAt.getTime() - createdAt > LATENESS_MS) {
			res.status(410).json({ error: "too-late", nextRevealAt: createdAt + LATENESS_MS });
			return;
		}
		if (receivedAt.getTime() - createdAt < MIN_REACTION_MS) {
			res.status(400).send("Too fast");
			return;
		}
		const dx = x - challenge.targetX;
		const dy = y - challenge.targetY;
		if (Math.hypot(dx, dy) > TOLERANCE) {
			res.status(400).send("Missed target");
			return;
		}
		const message = `dupontdoku-game:${run._id}:${seq}:${x}:${y}`;
		if (!(await verifySignature(run.publicKeyJwk, message, signature))) {
			res.status(403).send("Bad signature");
			return;
		}
		run.respondedSeqs.push(seq);
		run.completed += 1;
		run.transcript = chainTranscript(run.transcript, seq, x, y, receivedAt);
		if (run.completed >= REQUIRED_RESPONSES) {
			const code = mintCode(run.transcript);
			run.code = code;
			run.completedAt = receivedAt;
			await run.save();
			await InviteCodeModel.create({
				code,
				fingerprint: run.fingerprint,
				runId: run._id,
			});
			res.json({ ok: true, completed: run.completed, code });
			return;
		}
		await run.save();
		res.json({ ok: true, completed: run.completed });
	} catch (err) {
		next(err);
	}
}

export async function redeem(req: Request, res: Response, next: NextFunction) {
	try {
		const { code } = req.body ?? {};
		const invite = typeof code === "string"
			? await InviteCodeModel.findOne({ code: code.toUpperCase().replace(/\s/g, "") })
			: null;
		if (!invite) {
			res.status(404).send("Unknown code");
			return;
		}
		if (invite.used) {
			res.status(409).send("Code already used");
			return;
		}
		const nonce = newNonce();
		await GameNonceModel.create({
			nonce,
			codeId: invite._id,
			expiresAt: new Date(Date.now() + NONCE_TTL_MS),
		});
		res.json({ nonce });
	} catch (err) {
		next(err);
	}
}

export async function confirm(req: Request, res: Response, next: NextFunction) {
	try {
		const { code, nonce, name, email, signature } = req.body ?? {};
		if (typeof code !== "string" || typeof nonce !== "string" || typeof name !== "string" || typeof email !== "string" || typeof signature !== "string") {
			res.status(400).send("Missing fields");
			return;
		}
		const invite = await InviteCodeModel.findOne({ code: code.toUpperCase().replace(/\s/g, "") });
		if (!invite || invite.used) {
			res.status(403).send("Invalid code");
			return;
		}
		// check the nonce without consuming it — it must survive a failed
		// attempt (e.g. bad signature) so the user can retry
		const stored = await GameNonceModel.findOne({ nonce, codeId: invite._id }).lean();
		if (!stored || (stored.expiresAt as Date).getTime() < Date.now()) {
			res.status(403).send("Nonce expired — claim the code again");
			return;
		}
		const run = await GameRunModel.findById(invite.runId);
		if (!run) {
			res.status(403).send("Invalid code");
			return;
		}
		if (!(await verifySignature(run.publicKeyJwk, `dupontdoku-redeem:${nonce}`, signature))) {
			res.status(403).send("Bad signature");
			return;
		}
		if (await GuestModel.findOne({ fingerprint: invite.fingerprint }).lean()) {
			res.status(409).send("Already on the guest list");
			return;
		}
		// all checks passed — only now consume the nonce and create the guest
		await GameNonceModel.deleteOne({ _id: stored._id });
		const guest = await GuestModel.create({
			name,
			email,
			fingerprint: invite.fingerprint,
			runId: run._id,
			durationMs: (run.completedAt?.getTime() ?? Date.now()) - (run.startedAt?.getTime() ?? Date.now()),
		});
		invite.used = true;
		await invite.save();
		setGuestCookie(res, invite.fingerprint);
		res.json(transformGuest(guest));
	} catch (err) {
		next(err);
	}
}

export async function listGuests(_req: Request, res: Response, next: NextFunction) {
	try {
		const guests = await GuestModel.find({}).sort({ createdAt: 1 }).lean();
		res.json(
			guests.map((g) => ({
				id: String(g._id),
				name: g.name,
				durationMs: g.durationMs,
				createdAt: g.createdAt,
			})),
		);
	} catch (err) {
		next(err);
	}
}

// signed cookie: the winner's browser keeps returning to the guestlist
// desktop on refresh, without any login step
const GUEST_COOKIE = "dupontdoku_guest";
const GUEST_MAX_AGE_S = 60 * 60 * 24 * 365;

function guestToken(fingerprint: string): string {
	const mac = crypto.createHmac("sha256", process.env.GAME_SERVER_SECRET ?? "dev-game-secret").update(fingerprint).digest("hex");
	return `${fingerprint}.${mac}`;
}

function setGuestCookie(res: Response, fingerprint: string): void {
	res.cookie(GUEST_COOKIE, guestToken(fingerprint), {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: GUEST_MAX_AGE_S * 1000,
	});
}

function guestFromCookie(req: Request): string | null {
	const raw = req.cookies?.[GUEST_COOKIE] as string | undefined;
	if (!raw) return null;
	const idx = raw.lastIndexOf(".");
	if (idx <= 0) return null;
	const fingerprint = raw.slice(0, idx);
	const expected = guestToken(fingerprint);
	if (raw.length !== expected.length) return null;
	return crypto.timingSafeEqual(Buffer.from(raw), Buffer.from(expected)) ? fingerprint : null;
}

export async function me(req: Request, res: Response, next: NextFunction) {
	try {
		const fingerprint = guestFromCookie(req);
		if (!fingerprint) {
			res.json({ guest: null });
			return;
		}
		const guest = await GuestModel.findOne({ fingerprint }).lean();
		if (!guest) {
			res.json({ guest: null });
			return;
		}
		res.json({ guest: { name: guest.name, durationMs: guest.durationMs } });
	} catch (err) {
		next(err);
	}
}

export function randomToken(): string {
	return crypto.randomBytes(16).toString("hex");
}
