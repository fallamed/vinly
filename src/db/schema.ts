import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
	id: text("id").primaryKey(), // spotify user id
	displayName: text("display_name").notNull(),
	avatarUrl: text("avatar_url"),
	product: text("product"), // premium | free
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token").notNull(),
	tokenExpiresAt: integer("token_expires_at").notNull(), // epoch ms
	sessionToken: text("session_token").notNull().unique(),
	createdAt: integer("created_at").notNull(),
	// ultimo disco visto sul piatto (resta fermo quando non suona nulla)
	lastTrackUri: text("last_track_uri"),
	lastTrackName: text("last_track_name"),
	lastArtists: text("last_artists"),
	lastAlbum: text("last_album"),
	lastCoverUrl: text("last_cover_url"),
});

export const rooms = sqliteTable("rooms", {
	id: text("id").primaryKey(), // slug random pubblico (URL della stanza)
	name: text("name").notNull(),
	inviteCode: text("invite_code"), // segreto: chi ce l'ha entra come membro
	createdBy: text("created_by")
		.notNull()
		.references(() => users.id),
	createdAt: integer("created_at").notNull(),
});

export const roomMembers = sqliteTable(
	"room_members",
	{
		roomId: text("room_id")
			.notNull()
			.references(() => rooms.id),
		userId: text("user_id")
			.notNull()
			.references(() => users.id),
		joinedAt: integer("joined_at").notNull(),
	},
	(t) => [primaryKey({ columns: [t.roomId, t.userId] })],
);

export const savedDiscs = sqliteTable(
	"saved_discs",
	{
		userId: text("user_id")
			.notNull()
			.references(() => users.id),
		trackUri: text("track_uri").notNull(),
		trackName: text("track_name").notNull(),
		artists: text("artists").notNull(),
		album: text("album"),
		coverUrl: text("cover_url"),
		savedFromName: text("saved_from_name"), // provenienza: da chi l'ho "preso"
		savedAt: integer("saved_at").notNull(),
	},
	(t) => [primaryKey({ columns: [t.userId, t.trackUri] })],
);
