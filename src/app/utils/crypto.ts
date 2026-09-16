import Cryptr from "cryptr";

let cryptrInstance: Cryptr | undefined;

function getCryptr(): Cryptr {
	if (cryptrInstance === undefined) {
		cryptrInstance = new Cryptr(process.env.SPOTIFY_TOKEN_ENCRYPTION_KEY as string);
	}
	return cryptrInstance;
}

export function encryptToken(token: string): string {
	return getCryptr().encrypt(token);
}

export function decryptToken(encrypted: string): string {
	return getCryptr().decrypt(encrypted);
}
