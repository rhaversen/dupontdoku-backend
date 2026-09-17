import { Router } from "express";
import { LinkModel, transformLink } from "../models/Link.js";
import { createCrudRouter } from "../utils/crudFactory.js";

const router = Router();

createCrudRouter(router, LinkModel, transformLink, (body) => ({
	label: body.label,
	url: body.url,
	icon: body.icon,
	location: body.location,
	category: body.category,
	sortOrder: body.sortOrder,
}));

export default router;
