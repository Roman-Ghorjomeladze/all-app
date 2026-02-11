import * as SQLite from "expo-sqlite";

// ── Types ──────────────────────────────────────────────

export type Workout = {
	id: number;
	name: string;
	icon: string;
	is_template: number;
	created_at: string;
	updated_at: string;
};

export type WorkoutWithDetails = Workout & {
	exercise_count: number;
	total_duration: number;
};

export type Exercise = {
	id: number;
	name: string;
	icon: string;
	youtube_url: string | null;
	created_at: string;
};

export type WorkoutItem = {
	id: number;
	workout_id: number;
	exercise_id: number | null;
	item_type: "exercise" | "rest";
	duration_seconds: number;
	sort_order: number;
};

export type WorkoutItemWithExercise = WorkoutItem & {
	exercise_name: string | null;
	exercise_icon: string | null;
	exercise_youtube_url: string | null;
};

export type SoundSetting = {
	id: number;
	event_type: string;
	sound_index: number;
};

export type HistoryEntry = {
	id: number;
	workout_id: number | null;
	workout_name: string;
	total_duration_seconds: number;
	exercises_completed: number;
	completed_at: string;
};

export type CreateWorkoutData = {
	name: string;
	icon: string;
	is_template?: number;
	items: {
		exercise_id?: number | null;
		item_type: "exercise" | "rest";
		duration_seconds: number;
	}[];
};

export type CreateExerciseData = {
	name: string;
	icon: string;
	youtube_url?: string | null;
};

// ── Database ───────────────────────────────────────────

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
	if (db) return db;
	db = await SQLite.openDatabaseAsync("fitlog.db");
	await db.execAsync("PRAGMA journal_mode = WAL;");
	await db.execAsync("PRAGMA foreign_keys = ON;");
	return db;
}

export async function initDatabase(): Promise<void> {
	const database = await getDatabase();

	await database.execAsync(`
		CREATE TABLE IF NOT EXISTS fl_exercises (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			icon TEXT NOT NULL DEFAULT '🏋️',
			youtube_url TEXT,
			created_at TEXT DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS fl_workouts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			icon TEXT NOT NULL DEFAULT '💪',
			is_template INTEGER NOT NULL DEFAULT 0,
			created_at TEXT DEFAULT (datetime('now')),
			updated_at TEXT DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS fl_workout_items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			workout_id INTEGER NOT NULL REFERENCES fl_workouts(id) ON DELETE CASCADE,
			exercise_id INTEGER REFERENCES fl_exercises(id) ON DELETE SET NULL,
			item_type TEXT NOT NULL CHECK(item_type IN ('exercise', 'rest')),
			duration_seconds INTEGER NOT NULL DEFAULT 30,
			sort_order INTEGER NOT NULL DEFAULT 0
		);

		CREATE TABLE IF NOT EXISTS fl_sound_settings (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			event_type TEXT NOT NULL UNIQUE,
			sound_index INTEGER NOT NULL DEFAULT 0
		);

		CREATE TABLE IF NOT EXISTS fl_history (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			workout_id INTEGER REFERENCES fl_workouts(id) ON DELETE SET NULL,
			workout_name TEXT NOT NULL,
			total_duration_seconds INTEGER NOT NULL DEFAULT 0,
			exercises_completed INTEGER NOT NULL DEFAULT 0,
			completed_at TEXT DEFAULT (datetime('now'))
		);

		CREATE INDEX IF NOT EXISTS idx_fl_workout_items_workout ON fl_workout_items(workout_id);
		CREATE INDEX IF NOT EXISTS idx_fl_history_date ON fl_history(completed_at);
	`);

	await seedDefaults(database);
}

// ── Seed defaults ──────────────────────────────────────

async function seedDefaults(database: SQLite.SQLiteDatabase): Promise<void> {
	// Seed sound settings if empty
	const soundCount = await database.getFirstAsync<{ cnt: number }>(
		"SELECT COUNT(*) as cnt FROM fl_sound_settings"
	);
	if (soundCount && soundCount.cnt === 0) {
		await database.execAsync(`
			INSERT INTO fl_sound_settings (event_type, sound_index) VALUES
				('workout_start', 0),
				('ten_sec_warning', 3),
				('exercise_end', 1),
				('rest_end', 5),
				('workout_complete', 7);
		`);
	}

	// Seed template exercises if empty
	const exerciseCount = await database.getFirstAsync<{ cnt: number }>(
		"SELECT COUNT(*) as cnt FROM fl_exercises"
	);
	if (exerciseCount && exerciseCount.cnt === 0) {
		await database.execAsync(`
			INSERT INTO fl_exercises (name, icon, youtube_url) VALUES
				('Push-ups', '💪', NULL),
				('Squats', '🦵', NULL),
				('Burpees', '🤸', NULL),
				('Jumping Jacks', '⭐', NULL),
				('Mountain Climbers', '🧗', NULL),
				('Plank', '🧘', NULL),
				('Lunges', '🏃', NULL),
				('High Knees', '🔥', NULL),
				('Hamstring Stretch', '🧘', NULL),
				('Quad Stretch', '🦵', NULL),
				('Shoulder Stretch', '💪', NULL),
				('Hip Opener', '🤸', NULL),
				('Cat-Cow', '🧘', NULL),
				('Child Pose', '🧘', NULL);
		`);
	}

	// Seed template workouts if empty
	const workoutCount = await database.getFirstAsync<{ cnt: number }>(
		"SELECT COUNT(*) as cnt FROM fl_workouts WHERE is_template = 1"
	);
	if (workoutCount && workoutCount.cnt === 0) {
		// Template 1: Tabata Classic (4 min)
		const tabataResult = await database.runAsync(
			"INSERT INTO fl_workouts (name, icon, is_template) VALUES (?, ?, 1)",
			"Tabata Classic", "⚡"
		);
		const tabataId = tabataResult.lastInsertRowId;
		const tabataExercises = [1, 2, 3, 4]; // Push-ups, Squats, Burpees, Jumping Jacks
		let order = 0;
		for (let round = 0; round < 2; round++) {
			for (const exId of tabataExercises) {
				await database.runAsync(
					"INSERT INTO fl_workout_items (workout_id, exercise_id, item_type, duration_seconds, sort_order) VALUES (?, ?, 'exercise', 20, ?)",
					tabataId, exId, order++
				);
				await database.runAsync(
					"INSERT INTO fl_workout_items (workout_id, exercise_id, item_type, duration_seconds, sort_order) VALUES (?, NULL, 'rest', 10, ?)",
					tabataId, order++
				);
			}
		}

		// Template 2: Morning Stretch (5 min)
		const stretchResult = await database.runAsync(
			"INSERT INTO fl_workouts (name, icon, is_template) VALUES (?, ?, 1)",
			"Morning Stretch", "🧘"
		);
		const stretchId = stretchResult.lastInsertRowId;
		const stretchExercises = [9, 10, 11, 12, 13, 14]; // Hamstring, Quad, Shoulder, Hip, Cat-Cow, Child
		order = 0;
		for (const exId of stretchExercises) {
			await database.runAsync(
				"INSERT INTO fl_workout_items (workout_id, exercise_id, item_type, duration_seconds, sort_order) VALUES (?, ?, 'exercise', 30, ?)",
				stretchId, exId, order++
			);
			if (order < stretchExercises.length * 2 - 1) {
				await database.runAsync(
					"INSERT INTO fl_workout_items (workout_id, exercise_id, item_type, duration_seconds, sort_order) VALUES (?, NULL, 'rest', 15, ?)",
					stretchId, order++
				);
			}
		}

		// Template 3: HIIT Blast (6 min)
		const hiitResult = await database.runAsync(
			"INSERT INTO fl_workouts (name, icon, is_template) VALUES (?, ?, 1)",
			"HIIT Blast", "🔥"
		);
		const hiitId = hiitResult.lastInsertRowId;
		const hiitExercises = [3, 5, 8, 1, 2]; // Burpees, Mountain Climbers, High Knees, Push-ups, Squats
		order = 0;
		for (const exId of hiitExercises) {
			await database.runAsync(
				"INSERT INTO fl_workout_items (workout_id, exercise_id, item_type, duration_seconds, sort_order) VALUES (?, ?, 'exercise', 40, ?)",
				hiitId, exId, order++
			);
			if (order < hiitExercises.length * 2 - 1) {
				await database.runAsync(
					"INSERT INTO fl_workout_items (workout_id, exercise_id, item_type, duration_seconds, sort_order) VALUES (?, NULL, 'rest', 20, ?)",
					hiitId, order++
				);
			}
		}
	}
}

// ── Exercise CRUD ──────────────────────────────────────

export async function getAllExercises(): Promise<Exercise[]> {
	const database = await getDatabase();
	return database.getAllAsync<Exercise>("SELECT * FROM fl_exercises ORDER BY name ASC");
}

export async function getExercise(id: number): Promise<Exercise | null> {
	const database = await getDatabase();
	return database.getFirstAsync<Exercise>("SELECT * FROM fl_exercises WHERE id = ?", id);
}

export async function createExercise(data: CreateExerciseData): Promise<number> {
	const database = await getDatabase();
	const result = await database.runAsync(
		"INSERT INTO fl_exercises (name, icon, youtube_url) VALUES (?, ?, ?)",
		data.name, data.icon, data.youtube_url ?? null
	);
	return result.lastInsertRowId;
}

export async function updateExercise(id: number, data: CreateExerciseData): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		"UPDATE fl_exercises SET name = ?, icon = ?, youtube_url = ? WHERE id = ?",
		data.name, data.icon, data.youtube_url ?? null, id
	);
}

export async function deleteExercise(id: number): Promise<void> {
	const database = await getDatabase();
	await database.runAsync("DELETE FROM fl_exercises WHERE id = ?", id);
}

// ── Workout CRUD ───────────────────────────────────────

export async function getAllWorkouts(includeTemplates: boolean = false): Promise<WorkoutWithDetails[]> {
	const database = await getDatabase();
	const templateFilter = includeTemplates ? "" : "WHERE w.is_template = 0";
	return database.getAllAsync<WorkoutWithDetails>(`
		SELECT w.*,
			COALESCE((SELECT COUNT(*) FROM fl_workout_items wi WHERE wi.workout_id = w.id AND wi.item_type = 'exercise'), 0) as exercise_count,
			COALESCE((SELECT SUM(wi.duration_seconds) FROM fl_workout_items wi WHERE wi.workout_id = w.id), 0) as total_duration
		FROM fl_workouts w
		${templateFilter}
		ORDER BY w.updated_at DESC
	`);
}

export async function getTemplateWorkouts(): Promise<WorkoutWithDetails[]> {
	const database = await getDatabase();
	return database.getAllAsync<WorkoutWithDetails>(`
		SELECT w.*,
			COALESCE((SELECT COUNT(*) FROM fl_workout_items wi WHERE wi.workout_id = w.id AND wi.item_type = 'exercise'), 0) as exercise_count,
			COALESCE((SELECT SUM(wi.duration_seconds) FROM fl_workout_items wi WHERE wi.workout_id = w.id), 0) as total_duration
		FROM fl_workouts w
		WHERE w.is_template = 1
		ORDER BY w.name ASC
	`);
}

export async function getWorkout(id: number): Promise<Workout | null> {
	const database = await getDatabase();
	return database.getFirstAsync<Workout>("SELECT * FROM fl_workouts WHERE id = ?", id);
}

export async function getWorkoutItems(workoutId: number): Promise<WorkoutItemWithExercise[]> {
	const database = await getDatabase();
	return database.getAllAsync<WorkoutItemWithExercise>(`
		SELECT wi.*, e.name as exercise_name, e.icon as exercise_icon, e.youtube_url as exercise_youtube_url
		FROM fl_workout_items wi
		LEFT JOIN fl_exercises e ON wi.exercise_id = e.id
		WHERE wi.workout_id = ?
		ORDER BY wi.sort_order ASC
	`, workoutId);
}

export async function createWorkout(data: CreateWorkoutData): Promise<number> {
	const database = await getDatabase();
	const result = await database.runAsync(
		"INSERT INTO fl_workouts (name, icon, is_template) VALUES (?, ?, ?)",
		data.name, data.icon, data.is_template ?? 0
	);
	const workoutId = result.lastInsertRowId;

	for (let i = 0; i < data.items.length; i++) {
		const item = data.items[i];
		await database.runAsync(
			"INSERT INTO fl_workout_items (workout_id, exercise_id, item_type, duration_seconds, sort_order) VALUES (?, ?, ?, ?, ?)",
			workoutId, item.exercise_id ?? null, item.item_type, item.duration_seconds, i
		);
	}

	return workoutId;
}

export async function updateWorkout(id: number, data: CreateWorkoutData): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		"UPDATE fl_workouts SET name = ?, icon = ?, updated_at = datetime('now') WHERE id = ?",
		data.name, data.icon, id
	);

	// Replace all items
	await database.runAsync("DELETE FROM fl_workout_items WHERE workout_id = ?", id);
	for (let i = 0; i < data.items.length; i++) {
		const item = data.items[i];
		await database.runAsync(
			"INSERT INTO fl_workout_items (workout_id, exercise_id, item_type, duration_seconds, sort_order) VALUES (?, ?, ?, ?, ?)",
			id, item.exercise_id ?? null, item.item_type, item.duration_seconds, i
		);
	}
}

export async function deleteWorkout(id: number): Promise<void> {
	const database = await getDatabase();
	await database.runAsync("DELETE FROM fl_workouts WHERE id = ?", id);
}

export async function cloneWorkout(id: number, newName: string): Promise<number> {
	const database = await getDatabase();
	const original = await getWorkout(id);
	if (!original) throw new Error("Workout not found");

	const result = await database.runAsync(
		"INSERT INTO fl_workouts (name, icon, is_template) VALUES (?, ?, 0)",
		newName, original.icon
	);
	const newId = result.lastInsertRowId;

	const items = await getWorkoutItems(id);
	for (const item of items) {
		await database.runAsync(
			"INSERT INTO fl_workout_items (workout_id, exercise_id, item_type, duration_seconds, sort_order) VALUES (?, ?, ?, ?, ?)",
			newId, item.exercise_id, item.item_type, item.duration_seconds, item.sort_order
		);
	}

	return newId;
}

// ── Sound Settings ─────────────────────────────────────

export async function getSoundSettings(): Promise<SoundSetting[]> {
	const database = await getDatabase();
	return database.getAllAsync<SoundSetting>("SELECT * FROM fl_sound_settings ORDER BY id ASC");
}

export async function updateSoundSetting(eventType: string, soundIndex: number): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		"UPDATE fl_sound_settings SET sound_index = ? WHERE event_type = ?",
		soundIndex, eventType
	);
}

export async function getSoundForEvent(eventType: string): Promise<number> {
	const database = await getDatabase();
	const result = await database.getFirstAsync<{ sound_index: number }>(
		"SELECT sound_index FROM fl_sound_settings WHERE event_type = ?",
		eventType
	);
	return result?.sound_index ?? 0;
}

// ── History ────────────────────────────────────────────

export async function addToHistory(
	workoutId: number | null,
	workoutName: string,
	totalDuration: number,
	exercisesCompleted: number,
): Promise<number> {
	const database = await getDatabase();
	const result = await database.runAsync(
		"INSERT INTO fl_history (workout_id, workout_name, total_duration_seconds, exercises_completed) VALUES (?, ?, ?, ?)",
		workoutId, workoutName, totalDuration, exercisesCompleted
	);
	return result.lastInsertRowId;
}

export async function getHistoryForDate(date: string): Promise<HistoryEntry[]> {
	const database = await getDatabase();
	return database.getAllAsync<HistoryEntry>(
		"SELECT * FROM fl_history WHERE DATE(completed_at) = ? ORDER BY completed_at DESC",
		date
	);
}

export async function getAllHistory(): Promise<HistoryEntry[]> {
	const database = await getDatabase();
	return database.getAllAsync<HistoryEntry>(
		"SELECT * FROM fl_history ORDER BY completed_at DESC LIMIT 100"
	);
}

export async function getHistoryDates(): Promise<string[]> {
	const database = await getDatabase();
	const rows = await database.getAllAsync<{ d: string }>(
		"SELECT DISTINCT DATE(completed_at) as d FROM fl_history ORDER BY d DESC"
	);
	return rows.map((r) => r.d);
}

export async function deleteHistoryEntry(id: number): Promise<void> {
	const database = await getDatabase();
	await database.runAsync("DELETE FROM fl_history WHERE id = ?", id);
}

// ── Stats ──────────────────────────────────────────────

export async function getCurrentStreak(): Promise<number> {
	const database = await getDatabase();
	const dates = await database.getAllAsync<{ d: string }>(
		"SELECT DISTINCT DATE(completed_at) as d FROM fl_history ORDER BY d DESC"
	);
	if (dates.length === 0) return 0;

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	let streak = 0;
	const checkDate = new Date(today);

	// Check if today or yesterday has a workout (start point)
	const todayStr = checkDate.toISOString().split("T")[0];
	const yesterdayDate = new Date(checkDate);
	yesterdayDate.setDate(yesterdayDate.getDate() - 1);
	const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

	const dateSet = new Set(dates.map((d) => d.d));

	if (!dateSet.has(todayStr) && !dateSet.has(yesterdayStr)) {
		return 0;
	}

	// If today doesn't have a workout, start from yesterday
	if (!dateSet.has(todayStr)) {
		checkDate.setDate(checkDate.getDate() - 1);
	}

	while (true) {
		const dateStr = checkDate.toISOString().split("T")[0];
		if (dateSet.has(dateStr)) {
			streak++;
			checkDate.setDate(checkDate.getDate() - 1);
		} else {
			break;
		}
	}

	return streak;
}

export async function getWeekStats(): Promise<{ count: number; totalSeconds: number }> {
	const database = await getDatabase();
	const result = await database.getFirstAsync<{ cnt: number; total: number }>(`
		SELECT COUNT(*) as cnt, COALESCE(SUM(total_duration_seconds), 0) as total
		FROM fl_history
		WHERE completed_at >= datetime('now', '-7 days')
	`);
	return { count: result?.cnt ?? 0, totalSeconds: result?.total ?? 0 };
}

export async function getMonthStats(): Promise<{ count: number; totalSeconds: number }> {
	const database = await getDatabase();
	const result = await database.getFirstAsync<{ cnt: number; total: number }>(`
		SELECT COUNT(*) as cnt, COALESCE(SUM(total_duration_seconds), 0) as total
		FROM fl_history
		WHERE completed_at >= datetime('now', '-30 days')
	`);
	return { count: result?.cnt ?? 0, totalSeconds: result?.total ?? 0 };
}

export async function getMostUsedWorkout(): Promise<string | null> {
	const database = await getDatabase();
	const result = await database.getFirstAsync<{ workout_name: string }>(`
		SELECT workout_name, COUNT(*) as cnt
		FROM fl_history
		GROUP BY workout_name
		ORDER BY cnt DESC
		LIMIT 1
	`);
	return result?.workout_name ?? null;
}
