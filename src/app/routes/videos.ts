import { Router } from "express";
import { VideoModel, transformVideo } from "../models/Video.js";
import { createCrudRouter } from "../utils/crudFactory.js";

const router = Router();

createCrudRouter(router, VideoModel, transformVideo, (body) => ({
	youtubeId: body.youtubeId,
	title: body.title,
	subtitle: body.subtitle,
	sortOrder: body.sortOrder,
}));

export default router;
