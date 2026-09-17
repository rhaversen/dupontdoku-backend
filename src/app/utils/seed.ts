import { ConfigModel } from "../models/Config.js";
import { TourDateModel } from "../models/TourDate.js";
import { BlogPostModel } from "../models/BlogPost.js";
import { VideoModel } from "../models/Video.js";
import { LinkModel } from "../models/Link.js";

// fills an empty database with real dupont content; never overwrites existing docs
export async function seedIfEmpty(): Promise<void> {
	if ((await ConfigModel.countDocuments()) === 0) {
		await ConfigModel.create({
			welcomeMessage:
				"Dupont feels both timeless and urgent. With a vocal range that melts hearts and lyrics that cut deep, his sound moves effortlessly between intimate acoustic moments and electrifying rock.",
			heroText:
				"Blending the spirit of classic songwriting with a modern edge, his sound moves naturally between acoustic warmth and full-bodied rock. At the core is a storyteller unafraid to confront love, loss, and the complexity of being Human — with a voice that lingers long after the song ends.",
			contactEmail: "booking@dupontdoku.dk",
			footerNote: "Dupont · Denmark · © 2026 all rights reserved · built like it's 2001",
			// one ticket shop covering the whole tour — rendered as the main
			// "Get Tickets" button in the Tour Dates window
			generalTicketUrl: "https://tix.to/dupont2026",
		});
	}

	// each row is a real show with its own ticket page; the general tix.to
	// link lives on Config.generalTicketUrl, NOT here
	if ((await TourDateModel.countDocuments()) === 0) {
		await TourDateModel.create([
			{
				eventDate: "2026",
				city: "Skive, DK",
				venue: "Paletten",
				ticketUrl: "https://paletten.dk/event/dupond/",
				notes: "",
				sortOrder: 1,
			},
			{
				eventDate: "2026",
				city: "Fredericia, DK",
				venue: "Train",
				ticketUrl: "https://train.dk/kalender/dupont-2026",
				notes: "",
				sortOrder: 2,
			},
			{
				eventDate: "2026",
				city: "Vejle, DK",
				venue: "Bygningen",
				ticketUrl: "https://www.bygningen-vejle.dk/program/dupont/",
				notes: "",
				sortOrder: 3,
			},
		]);
	}

	if ((await BlogPostModel.countDocuments()) === 0) {
		await BlogPostModel.create([
			{
				title: "Rising Stars: Meet Dupont Mikkel Harding",
				slug: "voyagekc-interview",
				body: "Voyage KC sat down with Dupont for their Rising Stars series — about growing up in Denmark, the road from bedroom demos to full-band rock, and why every song starts as a story worth telling.\n\nRead the full interview at voyagekc.com/interview/rising-stars-meet-dupont-mikkel-harding",
				published: true,
			},
			{
				title: "New album out now",
				slug: "new-album-out-now",
				body: "The new Dupont album is streaming everywhere.\n\nFrom hushed acoustic ballads to full-bodied rock, it is a record about love, loss, and the complexity of being human — sung with a voice that lingers long after the song ends.\n\nOpen it on Spotify: open.spotify.com/album/0pH3pGsPDunLxzYxxRiq7X",
				published: true,
			},
			{
				title: "Follow Dupont",
				slug: "follow-dupont",
				body: "Everything new lands here first:\n\nInstagram — instagram.com/dupont0k\nTikTok — tiktok.com/@its_me_dupont\nFacebook — facebook.com/profile.php?id=100093390395389\n\nSessions and live takes on YouTube.",
				published: true,
			},
		]);
	}

	if ((await VideoModel.countDocuments()) === 0) {
		await VideoModel.create([
			{
				youtubeId: "OK3GRe_lx0w",
				title: "DUPONT - Lake Highland Sessions",
				subtitle: "Lake Highland Sessions",
				sortOrder: 1,
			},
			{
				youtubeId: "g5xP14Fdg_E",
				title: "Dupont : Sofasessions i 18b - 2025",
				subtitle: "18b Nørregade",
				sortOrder: 2,
			},
			{
				youtubeId: "NWflq55NZf8",
				title: "Dupont - Night terrors | KarriereKanonen 2024",
				subtitle: "DR P3",
				sortOrder: 3,
			},
		]);
	}

	// categories: "music" | "social" | "press" | "other" — the frontend groups
	// by this inside each location
	if ((await LinkModel.countDocuments()) === 0) {
		await LinkModel.create([
			// Start menu
			{ label: "Spotify — Dupont", url: "https://open.spotify.com/artist/0hFtMoaSeAgCISzAlrWYxh", icon: "/icons/48/music.png", location: "start", category: "music", sortOrder: 1 },
			{ label: "New album on Spotify", url: "https://open.spotify.com/album/0pH3pGsPDunLxzYxxRiq7X", icon: "/icons/48/music.png", location: "start", category: "music", sortOrder: 2 },
			{ label: "Tour tickets (tix.to)", url: "https://tix.to/dupont2026", icon: "/icons/48/tickets.png", location: "start", category: "other", sortOrder: 3 },
			{ label: "Instagram — @dupont0k", url: "https://www.instagram.com/dupont0k/", icon: "/icons/48/readme.png", location: "start", category: "social", sortOrder: 4 },
			{ label: "TikTok — @its_me_dupont", url: "https://www.tiktok.com/@its_me_dupont", icon: "/icons/48/videos.png", location: "start", category: "social", sortOrder: 5 },
			{ label: "Facebook — Dupont Skive", url: "https://www.facebook.com/profile.php?id=100093390395389", icon: "/icons/48/guestlist.png", location: "start", category: "social", sortOrder: 6 },
			{ label: "Voyage KC interview", url: "https://voyagekc.com/interview/rising-stars-meet-dupont-mikkel-harding", icon: "/icons/48/readme.png", location: "start", category: "press", sortOrder: 7 },
			// Desktop icons
			{ label: "Mikkel Harding", url: "https://www.instagram.com/mikkel_harding/", icon: "/icons/48/readme.png", location: "desktop", category: "social", sortOrder: 1 },
			{ label: "Facebook", url: "https://www.facebook.com/profile.php?id=100093390395389&locale=da_DK", icon: "/icons/48/guestlist.png", location: "desktop", category: "social", sortOrder: 2 },
			// Shown as buttons inside windows (README etc.)
			{ label: "Spotify", url: "https://open.spotify.com/artist/0hFtMoaSeAgCISzAlrWYxh", icon: "/icons/48/music.png", location: "window", category: "music", sortOrder: 1 },
			{ label: "Instagram", url: "https://www.instagram.com/dupont0k/", icon: "/icons/48/readme.png", location: "window", category: "social", sortOrder: 2 },
			{ label: "TikTok", url: "https://www.tiktok.com/@its_me_dupont", icon: "/icons/48/videos.png", location: "window", category: "social", sortOrder: 3 },
		]);
	}
}
