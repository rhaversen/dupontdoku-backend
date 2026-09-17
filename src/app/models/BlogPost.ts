import { Schema, model, type Document, type Types } from "mongoose";

export interface IBlogPost extends Document {
	_id: Types.ObjectId;
	title: string;
	body: string;
	slug: string;
	published: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const blogPostSchema = new Schema<IBlogPost>({
	title: { type: String, required: true, trim: true, maxLength: 200 },
	body: { type: String, default: "" },
	slug: { type: String, required: true, trim: true, unique: true },
	published: { type: Boolean, default: true },
}, { timestamps: true });

blogPostSchema.path("slug").validate(async function (value: string) {
	const found = await BlogPostModel.findOne({ slug: value, _id: { $ne: this._id } }).lean();
	return !found;
}, "Slug is already in use");

export const BlogPostModel = model<IBlogPost>("BlogPost", blogPostSchema);

export function transformBlogPost(doc: IBlogPost | Record<string, unknown>): Record<string, unknown> {
	const p = doc as IBlogPost & { __v?: unknown };
	return {
		id: String(p._id),
		title: p.title,
		body: p.body,
		slug: p.slug,
		published: p.published,
		createdAt: p.createdAt,
		updatedAt: p.updatedAt,
	};
}
