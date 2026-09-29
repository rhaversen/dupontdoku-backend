import { Router } from "express";
import { BlogPostModel, transformBlogPost } from "../models/BlogPost.js";
import { createCrudRouter } from "../utils/crudFactory.js";

const router = Router();

createCrudRouter(router, BlogPostModel, transformBlogPost, (body) => ({
	title: body.title,
	body: body.body,
	published: body.published,
}));

export default router;
