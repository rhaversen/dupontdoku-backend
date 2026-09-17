import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

export function globalErrorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
	if (err instanceof mongoose.Error.ValidationError || err instanceof mongoose.Error.CastError) {
		res.status(400).send(err.message);
		return;
	}
	// eslint-disable-next-line no-console
	console.error(err);
	res.status(500).send("Internal server error");
}
