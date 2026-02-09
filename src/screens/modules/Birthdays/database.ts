import * as SQLite from "expo-sqlite";

export type EventType = "birthday" | "anniversary" | "reminder" | "other";
export type NotificationType = "none" | "on_day" | "day_before" | "both";

export type BirthdayEvent = {
	id: number;
	name: string;
	event_month: number;
	event_day: number;
	event_year: number | null;
	event_type: EventType;
	notes: string | null;
	notification_type: NotificationType;
	notification_id_on_day: string | null;
	notification_id_day_before: string | null;
	created_at: string;
};

export type CreateEventData = {
	name: string;
	event_month: number;
	event_day: number;
	event_year: number | null;
	event_type: EventType;
	notes: string | null;
	notification_type: NotificationType;
};

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
	if (db) return db;

	db = await SQLite.openDatabaseAsync("birthdays.db");

	await db.execAsync(`
		PRAGMA journal_mode = WAL;

		CREATE TABLE IF NOT EXISTS bd_events (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			event_month INTEGER NOT NULL,
			event_day INTEGER NOT NULL,
			event_year INTEGER,
			event_type TEXT NOT NULL DEFAULT 'birthday',
			notes TEXT,
			notification_type TEXT NOT NULL DEFAULT 'none',
			notification_id_on_day TEXT,
			notification_id_day_before TEXT,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
		);
	`);

	return db;
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
	if (!db) {
		return initDatabase();
	}
	return db;
}

export async function getAllEvents(): Promise<BirthdayEvent[]> {
	const database = await getDatabase();
	return database.getAllAsync<BirthdayEvent>(
		"SELECT * FROM bd_events ORDER BY event_month, event_day"
	);
}

export async function getEventsForMonth(month: number): Promise<BirthdayEvent[]> {
	const database = await getDatabase();
	return database.getAllAsync<BirthdayEvent>(
		"SELECT * FROM bd_events WHERE event_month = ? ORDER BY event_day",
		[month]
	);
}

export async function getEvent(id: number): Promise<BirthdayEvent | null> {
	const database = await getDatabase();
	const event = await database.getFirstAsync<BirthdayEvent>(
		"SELECT * FROM bd_events WHERE id = ?",
		[id]
	);
	return event || null;
}

export async function createEvent(data: CreateEventData): Promise<number> {
	const database = await getDatabase();
	const result = await database.runAsync(
		`INSERT INTO bd_events (name, event_month, event_day, event_year, event_type, notes, notification_type)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		[
			data.name,
			data.event_month,
			data.event_day,
			data.event_year,
			data.event_type,
			data.notes,
			data.notification_type,
		]
	);
	return result.lastInsertRowId;
}

export async function updateEvent(id: number, data: CreateEventData): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		`UPDATE bd_events SET name = ?, event_month = ?, event_day = ?, event_year = ?,
		 event_type = ?, notes = ?, notification_type = ? WHERE id = ?`,
		[
			data.name,
			data.event_month,
			data.event_day,
			data.event_year,
			data.event_type,
			data.notes,
			data.notification_type,
			id,
		]
	);
}

export async function deleteEvent(id: number): Promise<void> {
	const database = await getDatabase();
	await database.runAsync("DELETE FROM bd_events WHERE id = ?", [id]);
}

export async function updateNotificationIds(
	id: number,
	onDayId: string | null,
	dayBeforeId: string | null
): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		"UPDATE bd_events SET notification_id_on_day = ?, notification_id_day_before = ? WHERE id = ?",
		[onDayId, dayBeforeId, id]
	);
}
