import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import type { Express } from "express";
import { UserModel, type IUser } from "../models/User.js";

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface User {
			id: string;
			name: string;
		}
	}
}

passport.use("local", new LocalStrategy(async (name, password, done) => {
	const user = await UserModel.findOne({ name }).exec();
	if (!user || !(await user.comparePassword(password))) {
		return done(null, false, { message: "Wrong name or password" });
	}
	return done(null, { id: String(user._id), name: user.name });
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
	const user = await UserModel.findById(id).lean<IUser>().catch(() => null);
	if (!user) return done(null, false);
	done(null, { id: String(user._id), name: user.name });
});

export function setupPassport(app: Express): void {
	app.use(passport.initialize());
	app.use(passport.session());
}

export default passport;
