import type { Request, Response, NextFunction } from "express";
import { getOrCreateConfig, transformConfig } from "../models/Config.js";

const CONFIG_FIELDS = ["welcomeMessage", "contactEmail", "heroText", "footerNote", "generalTicketUrl"] as const;

export async function getConfig(_req: Request, res: Response, next: NextFunction) {
	try {
		const config = await getOrCreateConfig();
		res.json(transformConfig(config));
	} catch (err) {
		next(err);
	}
}

export async function patchConfig(req: Request, res: Response, next: NextFunction) {
	try {
		const config = await getOrCreateConfig();
		for (const field of CONFIG_FIELDS) {
			if (req.body?.[field] !== undefined) {
				config[field] = req.body[field];
			}
		}
		await config.save();
		res.json(transformConfig(config));
	} catch (err) {
		next(err);
	}
}
