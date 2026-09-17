import { Schema, model, type Document, type Types } from "mongoose";
import bcrypt from "bcrypt";

const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

export interface IUser extends Document {
	_id: Types.ObjectId;
	name: string;
	password: string;
	createdAt: Date;
	updatedAt: Date;
	comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
	name: { type: Schema.Types.String, required: true, trim: true, unique: true, maxLength: [50, "Name can be at most 50 characters"], minLength: [2, "Name must be at least 2 characters"] },
	password: { type: Schema.Types.String, required: true, trim: true, minLength: [6, "Password must be at least 6 characters"], maxLength: [100, "Password can be at most 100 characters"] },
}, { timestamps: true });

userSchema.path("name").validate(async function (value: string) {
	const found = await UserModel.findOne({ name: value, _id: { $ne: this._id } }).lean();
	return !found;
}, "Name is already in use");

userSchema.pre("save", async function () {
	if (!this.isModified("password")) return;
	this.password = await bcrypt.hash(this.password, saltRounds);
});

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
	return bcrypt.compare(candidate, this.password);
};

export const UserModel = model<IUser>("User", userSchema);

export function transformUser(user: IUser | Record<string, unknown>): Record<string, unknown> {
	const { name, _id, createdAt, updatedAt } = user as IUser & { __v?: unknown; password?: unknown };
	return { id: String(_id), name, createdAt, updatedAt };
}
