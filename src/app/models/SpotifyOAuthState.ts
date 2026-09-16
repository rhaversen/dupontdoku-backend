import { type Document, model, Schema } from "mongoose";

export interface ISpotifyOAuthState extends Document {
	state: string;
	anonymousUserId: string;
	createdAt: Date;
}

const spotifyOAuthStateSchema = new Schema<ISpotifyOAuthState>({
	state: {
		type: Schema.Types.String,
		required: true,
		unique: true,
		index: true,
	},
	anonymousUserId: {
		type: Schema.Types.String,
		required: true,
	},
	createdAt: {
		type: Schema.Types.Date,
		default: Date.now,
	},
});

// OAuth states are single-use and short-lived
spotifyOAuthStateSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

const SpotifyOAuthStateModel = model<ISpotifyOAuthState>("SpotifyOAuthState", spotifyOAuthStateSchema);

export default SpotifyOAuthStateModel;
