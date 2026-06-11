-- Schema Vinly — applicare con:
--   locale:  npx wrangler d1 execute vinly-db --local --file=./schema.sql
--   remoto:  npx wrangler d1 execute vinly-db --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY, -- spotify user id
	display_name TEXT NOT NULL,
	avatar_url TEXT,
	product TEXT, -- premium | free
	access_token TEXT NOT NULL,
	refresh_token TEXT NOT NULL,
	token_expires_at INTEGER NOT NULL, -- epoch ms
	session_token TEXT UNIQUE NOT NULL,
	created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
	id TEXT PRIMARY KEY, -- slug random, fa anche da codice invito
	name TEXT NOT NULL,
	created_by TEXT NOT NULL REFERENCES users(id),
	created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS room_members (
	room_id TEXT NOT NULL REFERENCES rooms(id),
	user_id TEXT NOT NULL REFERENCES users(id),
	joined_at INTEGER NOT NULL,
	PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS saved_discs (
	user_id TEXT NOT NULL REFERENCES users(id),
	track_uri TEXT NOT NULL,
	track_name TEXT NOT NULL,
	artists TEXT NOT NULL,
	album TEXT,
	cover_url TEXT,
	saved_from_name TEXT, -- provenienza: da chi l'ho "preso"
	saved_at INTEGER NOT NULL,
	PRIMARY KEY (user_id, track_uri)
);
