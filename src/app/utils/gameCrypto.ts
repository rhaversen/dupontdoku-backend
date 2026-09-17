import crypto from "crypto";

const SERVER_SECRET = process.env.GAME_SERVER_SECRET ?? "dev-game-secret";
export const REQUIRED_RESPONSES = Number(process.env.GAME_REQUIRED_RESPONSES ?? 10);
export const CHALLENGE_INTERVAL_MS = Number(process.env.GAME_CHALLENGE_INTERVAL_MS ?? 6 * 60 * 1000);
export const LATENESS_MS = Number(process.env.GAME_LATENESS_MS ?? 90 * 1000);
export const TOLERANCE = Number(process.env.GAME_TOLERANCE ?? 0.03);
export const MIN_REACTION_MS = Number(process.env.GAME_MIN_REACTION_MS ?? 400);
export const NONCE_TTL_MS = Number(process.env.GAME_NONCE_TTL_MS ?? 2 * 60 * 1000);

export function fingerprintPublicKey(jwk: Record<string, unknown>): string {
	return crypto.createHash("sha256").update(JSON.stringify(jwk)).digest("hex").slice(0, 32);
}

export async function verifySignature(
	publicKeyJwk: Record<string, unknown>,
	message: string,
	signatureBase64: string,
): Promise<boolean> {
	try {
		const key = crypto.createPublicKey({ key: publicKeyJwk as crypto.JsonWebKey, format: "jwk" });
		// WebCrypto subtle.sign emits raw IEEE P1363 (r||s) signatures, not DER
		return crypto.verify(
			"sha256",
			Buffer.from(message, "utf8"),
			{ key, dsaEncoding: "ieee-p1363" },
			Buffer.from(signatureBase64, "base64"),
		);
	} catch {
		return false;
	}
}

export function chainTranscript(prev: string, seq: number, x: number, y: number, receivedAt: Date): string {
	return crypto
		.createHash("sha256")
		.update(`${prev}|${seq}|${x}|${y}|${receivedAt.toISOString()}`)
		.digest("hex");
}

export function mintCode(transcript: string): string {
	const hmac = crypto.createHmac("sha256", SERVER_SECRET).update(transcript).digest();
	return base32(hmac.subarray(0, 13)).slice(0, 26).match(/.{4}/g)!.join("-");
}

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32(buf: Buffer): string {
	let bits = 0;
	let value = 0;
	let out = "";
	for (const byte of buf) {
		value = (value << 8) | byte;
		bits += 8;
		while (bits >= 5) {
			out += BASE32[(value >>> (bits - 5)) & 31];
			bits -= 5;
		}
	}
	if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
	return out;
}

export function newNonce(): string {
	return crypto.randomBytes(24).toString("hex");
}
