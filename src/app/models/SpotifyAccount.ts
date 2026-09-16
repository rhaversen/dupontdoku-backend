import { type Document, model, Schema } from "mongoose";

export interface ISpotifyAccount extends Document {
	anonymousUserId: string;
	spotifyUserId: string;
	spotifyDisplayName: string | null;
	accessToken: string;
	refreshToken: string;
	expiresAt: Date;
	scopes: string;
	connectedAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

const spotifyAccountSchema = new Schema<ISpotifyAccount>({
	anonymousUserId: {
		type: Schema.Types.String,
		required: true,
		unique: true,
		index: true,
	},
	spotifyUserId: {
		type: Schema.Types.String,
		required: true,
	},
	spotifyDisplayName: {
		type: Schema.Types.String,
		default: null,
	},
	accessToken: {
		type: Schema.Types.String,
		required: true,
	},
	refreshToken: {
		type: Schema.Types.String,
		required: true,
	},
	expiresAt: {
		type: Schema.Types.Date,
		required: true,
	},
	scopes: {
		type: Schema.Types.String,
		required: true,
	},
	connectedAt: {
		type: Schema.Types.Date,
		default: Date.now,
	},
}, {
	timestamps: true,
});

const SpotifyAccountModel = model<ISpotifyAccount>("SpotifyAccount", spotifyAccountSchema);

export default SpotifyAccountModel;

export type SpotifyAccountDoc = Document & ISpotifyAccount;
