import type { Request, Response, NextFunction, RequestHandler } from "express";
import { UserModel } from "../models/User.js";

export function isAuth(req: Request, res: Response, next: NextFunction): void {
	if (!req.isAuthenticated() || !req.user) {
		res.status(403).send("Forbidden");
		return;
	}
	next();
}

export function requireInviteCode(req: Request, res: Response, next: NextFunction): void {
	const expected = process.env.INVITE_CODE;
	if (!expected) {
		res.status(500).send("Invite code not configured");
		return;
	}
	if (req.body?.inviteCode !== expected) {
		res.status(403).send("Invalid invite code");
		return;
	}
	next();
}

export function login(req: Request, res: Response, next: NextFunction): void {
	req.login(req.user ?? { id: "", name: "" }, (err) => {
		if (err) return next(err);
		res.json({ id: (req.user as { id?: string })?.id ?? "", name: (req.user as { name?: string })?.name ?? "" });
	});
}

export async function ensureUser(req: Request, res: Response, next: NextFunction): Promise<void> {
	const user = await UserModel.findById((req.user as { id?: string })?.id).lean();
	if (!user) {
		res.status(403).send("Forbidden");
		return;
	}
	next();
}

export const authHandler: RequestHandler = (req, res, next) => {
	isAuth(req, res, next);
};
