import type { Router, Request, Response, NextFunction } from "express";
import type { Model, Document, Types } from "mongoose";
import { isAuth } from "../middleware/authorization.js";

type AnyDoc = Document<unknown, Record<string, never>, Record<string, unknown>> & { _id: Types.ObjectId };

export function createCrudRouter<T extends AnyDoc>(
	router: Router,
	model: Model<T>,
	transform: (doc: T | Record<string, unknown>) => Record<string, unknown>,
	pickFields: (body: Record<string, unknown>) => Record<string, unknown>,
) {
	router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
		try {
			const docs = await model.find({}).lean<T>();
			res.json((docs as unknown as T[]).map(transform));
		} catch (err) {
			next(err);
		}
	});

	router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
		try {
			const doc = await model.findById(req.params.id).lean<T>();
			if (!doc) {
				res.status(404).send("Not found");
				return;
			}
			res.json(transform(doc as unknown as T));
		} catch (err) {
			next(err);
		}
	});

	router.post("/", isAuth, async (req: Request, res: Response, next: NextFunction) => {
		try {
			const doc = await model.create(pickFields(req.body ?? {}) as never);
			res.status(201).json(transform(doc));
		} catch (err) {
			next(err);
		}
	});

	router.patch("/:id", isAuth, async (req: Request, res: Response, next: NextFunction) => {
		try {
			const doc = await model.findById(req.params.id);
			if (!doc) {
				res.status(404).send("Not found");
				return;
			}
			const fields = pickFields(req.body ?? {});
			doc.set(fields as never);
			await doc.save();
			res.json(transform(doc));
		} catch (err) {
			next(err);
		}
	});

	router.delete("/:id", isAuth, async (req: Request, res: Response, next: NextFunction) => {
		try {
			const doc = await model.findByIdAndDelete(req.params.id);
			if (!doc) {
				res.status(404).send("Not found");
				return;
			}
			res.json({ ok: true });
		} catch (err) {
			next(err);
		}
	});

	return router;
}
