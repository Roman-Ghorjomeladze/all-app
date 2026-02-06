import * as SQLite from "expo-sqlite";

export type Cycle = {
	id: number;
	start_date: string;
	end_date: string | null;
	cycle_length: number | null;
	period_length: number | null;
	created_at: string;
};

export type DailyLog = {
	id: number;
	date: string;
	cycle_id: number | null;
	flow_intensity: "light" | "medium" | "heavy" | null;
	symptoms: string[];
	mood: "happy" | "neutral" | "sad" | "irritated" | "tired" | null;
	notes: string | null;
	created_at: string;
};

export type Settings = {
	average_cycle_length: number;
	average_period_length: number;
	last_period_start: string | null;
};

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
	if (db) return db;

	db = await SQLite.openDatabaseAsync("circleflow.db");

	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS cycles (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			start_date TEXT NOT NULL,
			end_date TEXT,
			cycle_length INTEGER,
			period_length INTEGER,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS daily_logs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			date TEXT NOT NULL UNIQUE,
			cycle_id INTEGER,
			flow_intensity TEXT,
			symptoms TEXT,
			mood TEXT,
			notes TEXT,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (cycle_id) REFERENCES cycles(id)
		);

		CREATE TABLE IF NOT EXISTS settings (
			key TEXT PRIMARY KEY,
			value TEXT
		);
	`);

	// Initialize default settings if not exists
	const existingSettings = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM settings");
	if (existingSettings?.count === 0) {
		await db.runAsync("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", ["average_cycle_length", "28"]);
		await db.runAsync("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", ["average_period_length", "5"]);
	}

	return db;
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
	if (!db) {
		return initDatabase();
	}
	return db;
}

// Cycle operations
export async function startNewCycle(startDate: string): Promise<number> {
	const database = await getDatabase();

	// End any existing cycle
	const currentCycle = await getCurrentCycle();
	if (currentCycle && !currentCycle.end_date) {
		const previousStart = new Date(currentCycle.start_date);
		const newStart = new Date(startDate);
		const cycleLength = Math.floor((newStart.getTime() - previousStart.getTime()) / (1000 * 60 * 60 * 24));

		await database.runAsync("UPDATE cycles SET cycle_length = ? WHERE id = ?", [cycleLength, currentCycle.id]);
	}

	const result = await database.runAsync("INSERT INTO cycles (start_date) VALUES (?)", [startDate]);
	await updateSetting("last_period_start", startDate);

	return result.lastInsertRowId;
}

export async function endCurrentPeriod(endDate: string): Promise<void> {
	const database = await getDatabase();
	const currentCycle = await getCurrentCycle();

	if (currentCycle) {
		const startDate = new Date(currentCycle.start_date);
		const end = new Date(endDate);
		const periodLength = Math.floor((end.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

		await database.runAsync("UPDATE cycles SET end_date = ?, period_length = ? WHERE id = ?", [
			endDate,
			periodLength,
			currentCycle.id,
		]);

		// Update average period length
		await recalculateAverages();
	}
}

export async function getCurrentCycle(): Promise<Cycle | null> {
	const database = await getDatabase();
	const cycle = await database.getFirstAsync<Cycle>("SELECT * FROM cycles ORDER BY start_date DESC LIMIT 1");
	return cycle || null;
}

export async function getAllCycles(): Promise<Cycle[]> {
	const database = await getDatabase();
	const cycles = await database.getAllAsync<Cycle>("SELECT * FROM cycles ORDER BY start_date DESC");
	return cycles;
}

// Daily log operations
export async function saveDailyLog(
	date: string,
	flowIntensity: DailyLog["flow_intensity"],
	symptoms: string[],
	mood: DailyLog["mood"],
	notes: string | null
): Promise<void> {
	const database = await getDatabase();
	const currentCycle = await getCurrentCycle();

	const symptomsJson = JSON.stringify(symptoms);

	await database.runAsync(
		`INSERT INTO daily_logs (date, cycle_id, flow_intensity, symptoms, mood, notes)
		 VALUES (?, ?, ?, ?, ?, ?)
		 ON CONFLICT(date) DO UPDATE SET
		 flow_intensity = excluded.flow_intensity,
		 symptoms = excluded.symptoms,
		 mood = excluded.mood,
		 notes = excluded.notes`,
		[date, currentCycle?.id || null, flowIntensity, symptomsJson, mood, notes]
	);
}

export async function getDailyLog(date: string): Promise<DailyLog | null> {
	const database = await getDatabase();
	const log = await database.getFirstAsync<{
		id: number;
		date: string;
		cycle_id: number | null;
		flow_intensity: string | null;
		symptoms: string | null;
		mood: string | null;
		notes: string | null;
		created_at: string;
	}>("SELECT * FROM daily_logs WHERE date = ?", [date]);

	if (!log) return null;

	return {
		...log,
		flow_intensity: log.flow_intensity as DailyLog["flow_intensity"],
		symptoms: log.symptoms ? JSON.parse(log.symptoms) : [],
		mood: log.mood as DailyLog["mood"],
	};
}

export async function getLogsForMonth(year: number, month: number): Promise<DailyLog[]> {
	const database = await getDatabase();
	const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
	const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

	const logs = await database.getAllAsync<{
		id: number;
		date: string;
		cycle_id: number | null;
		flow_intensity: string | null;
		symptoms: string | null;
		mood: string | null;
		notes: string | null;
		created_at: string;
	}>("SELECT * FROM daily_logs WHERE date >= ? AND date <= ?", [startDate, endDate]);

	return logs.map((log) => ({
		...log,
		flow_intensity: log.flow_intensity as DailyLog["flow_intensity"],
		symptoms: log.symptoms ? JSON.parse(log.symptoms) : [],
		mood: log.mood as DailyLog["mood"],
	}));
}

// Settings operations
export async function getSetting(key: string): Promise<string | null> {
	const database = await getDatabase();
	const result = await database.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = ?", [key]);
	return result?.value || null;
}

export async function updateSetting(key: string, value: string): Promise<void> {
	const database = await getDatabase();
	await database.runAsync("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value]);
}

export async function getSettings(): Promise<Settings> {
	const avgCycleLength = await getSetting("average_cycle_length");
	const avgPeriodLength = await getSetting("average_period_length");
	const lastPeriodStart = await getSetting("last_period_start");

	return {
		average_cycle_length: avgCycleLength ? parseInt(avgCycleLength, 10) : 28,
		average_period_length: avgPeriodLength ? parseInt(avgPeriodLength, 10) : 5,
		last_period_start: lastPeriodStart,
	};
}

async function recalculateAverages(): Promise<void> {
	const database = await getDatabase();

	// Calculate average cycle length from completed cycles
	const cycleAvg = await database.getFirstAsync<{ avg: number }>(
		"SELECT AVG(cycle_length) as avg FROM cycles WHERE cycle_length IS NOT NULL"
	);
	if (cycleAvg?.avg) {
		await updateSetting("average_cycle_length", Math.round(cycleAvg.avg).toString());
	}

	// Calculate average period length
	const periodAvg = await database.getFirstAsync<{ avg: number }>(
		"SELECT AVG(period_length) as avg FROM cycles WHERE period_length IS NOT NULL"
	);
	if (periodAvg?.avg) {
		await updateSetting("average_period_length", Math.round(periodAvg.avg).toString());
	}
}

// Delete a single cycle and its associated daily logs
export async function deleteCycle(id: number): Promise<void> {
	const database = await getDatabase();

	// Delete associated daily logs first
	await database.runAsync("DELETE FROM daily_logs WHERE cycle_id = ?", [id]);

	// Delete the cycle
	await database.runAsync("DELETE FROM cycles WHERE id = ?", [id]);

	// Recalculate averages after deletion
	await recalculateAverages();

	// Update last_period_start to the most recent cycle's start date
	const mostRecentCycle = await getCurrentCycle();
	if (mostRecentCycle) {
		await updateSetting("last_period_start", mostRecentCycle.start_date);
	} else {
		// No cycles left, clear last_period_start
		await database.runAsync("DELETE FROM settings WHERE key = ?", ["last_period_start"]);
	}
}

// Update cycle dates
export async function updateCycle(
	id: number,
	startDate: string,
	endDate: string | null
): Promise<void> {
	const database = await getDatabase();

	let periodLength: number | null = null;
	if (endDate) {
		const start = new Date(startDate);
		const end = new Date(endDate);
		periodLength = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
	}

	await database.runAsync(
		"UPDATE cycles SET start_date = ?, end_date = ?, period_length = ? WHERE id = ?",
		[startDate, endDate, periodLength, id]
	);

	// Recalculate cycle lengths for this and adjacent cycles
	const allCycles = await getAllCycles();
	const sortedCycles = allCycles.sort(
		(a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
	);

	for (let i = 0; i < sortedCycles.length - 1; i++) {
		const currentCycle = sortedCycles[i];
		const nextCycle = sortedCycles[i + 1];
		const cycleLength = Math.floor(
			(new Date(nextCycle.start_date).getTime() - new Date(currentCycle.start_date).getTime()) /
				(1000 * 60 * 60 * 24)
		);
		await database.runAsync("UPDATE cycles SET cycle_length = ? WHERE id = ?", [
			cycleLength,
			currentCycle.id,
		]);
	}

	// Last cycle has no cycle_length yet (it's the current one)
	if (sortedCycles.length > 0) {
		const lastCycle = sortedCycles[sortedCycles.length - 1];
		await database.runAsync("UPDATE cycles SET cycle_length = NULL WHERE id = ?", [lastCycle.id]);
	}

	// Recalculate averages
	await recalculateAverages();

	// Update last_period_start if needed
	const mostRecentCycle = await getCurrentCycle();
	if (mostRecentCycle) {
		await updateSetting("last_period_start", mostRecentCycle.start_date);
	}
}

// Clear all data (cycles, logs, and reset settings)
export async function clearAllData(): Promise<void> {
	const database = await getDatabase();

	// Delete all daily logs
	await database.runAsync("DELETE FROM daily_logs");

	// Delete all cycles
	await database.runAsync("DELETE FROM cycles");

	// Reset settings to defaults
	await database.runAsync("DELETE FROM settings");
	await database.runAsync("INSERT INTO settings (key, value) VALUES (?, ?)", [
		"average_cycle_length",
		"28",
	]);
	await database.runAsync("INSERT INTO settings (key, value) VALUES (?, ?)", [
		"average_period_length",
		"5",
	]);
}
