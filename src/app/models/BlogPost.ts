import { Schema, model, type Document, type Types } from "mongoose";

export interface IBlogPost extends Document {
	_id: Types.ObjectId;
	title: string;
	body: string;
	published: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const blogPostSchema = new Schema<IBlogPost>({
	title: { type: String, required: true, trim: true, maxLength: 200 },
	body: { type: String, default: "" },
	published: { type: Boolean, default: true },
}, { timestamps: true });

export const BlogPostModel = model<IBlogPost>("BlogPost", blogPostSchema);

export function transformBlogPost(doc: IBlogPost | Record<string, unknown>): Record<string, unknown> {
	const p = doc as IBlogPost & { __v?: unknown };
	return {
		id: String(p._id),
		title: p.title,
		body: p.body,
		published: p.published,
	};
}
