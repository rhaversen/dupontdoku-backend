import type { Request, Response, NextFunction } from "express";
import { UserModel, transformUser } from "../models/User.js";
import { requireInviteCode, login } from "../middleware/authorization.js";

export async function register(req: Request, res: Response, next: NextFunction) {
	try {
		const { name, password } = req.body ?? {};
		if (typeof name !== "string" || typeof password !== "string") {
			res.status(400).send("Name and password are required");
			return;
		}
		const existing = await UserModel.findOne({ name }).lean();
		if (existing) {
			res.status(400).send("Name is already in use");
			return;
		}
		const user = await UserModel.create({ name, password });
		req.user = { id: String(user._id), name: user.name };
		login(req, res, next);
	} catch (err) {
		next(err);
	}
}

export const registerWithInvite = [requireInviteCode, register] as const;

export async function getCurrentUser(req: Request, res: Response) {
	if (!req.isAuthenticated() || !req.user) {
		res.status(401).json({ authenticated: false });
		return;
	}
	res.json({ authenticated: true, user: req.user });
}

export function logout(req: Request, res: Response, next: NextFunction) {
	req.logout((err) => {
		if (err) return next(err);
		req.session.destroy(() => {
			res.clearCookie("dupontdoku.sid");
			res.json({ ok: true });
		});
	});
}

export async function listUsers(_req: Request, res: Response, next: NextFunction) {
	try {
		const users = await UserModel.find({}).lean();
		res.json(users.map(transformUser));
	} catch (err) {
		next(err);
	}
}
