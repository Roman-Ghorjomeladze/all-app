import * as SQLite from "expo-sqlite";

// ── Types ──────────────────────────────────────────────────────

export type Priority = "none" | "low" | "medium" | "high";
export type ReminderType = "none" | "at_time" | "day_before" | "both";
export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly" | "custom";

export type Category = {
	id: number;
	name: string;
	color: string;
	icon: string;
	sort_order: number;
	created_at: string;
};

export type CategoryWithCount = Category & {
	task_count: number;
	completed_count: number;
};

export type Task = {
	id: number;
	category_id: number | null;
	title: string;
	notes: string | null;
	priority: Priority;
	is_completed: number;
	completed_at: string | null;
	due_date: string | null;
	due_time: string | null;
	reminder_type: ReminderType;
	notification_id_at_time: string | null;
	notification_id_day_before: string | null;
	recurrence_type: RecurrenceType;
	recurrence_interval: number;
	recurrence_end_date: string | null;
	sort_order: number;
	created_at: string;
	updated_at: string;
};

export type TaskWithCategory = Task & {
	category_name: string | null;
	category_color: string | null;
	category_icon: string | null;
	subtask_count: number;
	subtask_done: number;
};

export type Subtask = {
	id: number;
	task_id: number;
	title: string;
	is_completed: number;
	sort_order: number;
	created_at: string;
};

export type CreateTaskData = {
	title: string;
	category_id?: number | null;
	notes?: string | null;
	priority?: Priority;
	due_date?: string | null;
	due_time?: string | null;
	reminder_type?: ReminderType;
	recurrence_type?: RecurrenceType;
	recurrence_interval?: number;
	recurrence_end_date?: string | null;
};

export type UpdateTaskData = CreateTaskData;

export type SmartFilter = "all" | "today" | "upcoming" | "overdue" | "completed" | "no_date";
export type SortMode = "due_date" | "priority" | "created" | "alpha";

// ── Database ───────────────────────────────────────────────────

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
	if (db) return db;
	db = await SQLite.openDatabaseAsync("todo.db");
	await db.execAsync("PRAGMA journal_mode = WAL;");
	await db.execAsync("PRAGMA foreign_keys = ON;");
	return db;
}

export async function initDatabase(): Promise<void> {
	const database = await getDatabase();

	await database.execAsync(`
		CREATE TABLE IF NOT EXISTS td_categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			color TEXT NOT NULL DEFAULT '#FF8C00',
			icon TEXT NOT NULL DEFAULT '📁',
			sort_order INTEGER NOT NULL DEFAULT 0,
			created_at TEXT DEFAULT (datetime('now'))
		);
	`);

	await database.execAsync(`
		CREATE TABLE IF NOT EXISTS td_tasks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			category_id INTEGER REFERENCES td_categories(id) ON DELETE SET NULL,
			title TEXT NOT NULL,
			notes TEXT,
			priority TEXT NOT NULL DEFAULT 'none',
			is_completed INTEGER NOT NULL DEFAULT 0,
			completed_at TEXT,
			due_date TEXT,
			due_time TEXT,
			reminder_type TEXT NOT NULL DEFAULT 'none',
			notification_id_at_time TEXT,
			notification_id_day_before TEXT,
			recurrence_type TEXT NOT NULL DEFAULT 'none',
			recurrence_interval INTEGER DEFAULT 1,
			recurrence_end_date TEXT,
			sort_order INTEGER NOT NULL DEFAULT 0,
			created_at TEXT DEFAULT (datetime('now')),
			updated_at TEXT DEFAULT (datetime('now'))
		);
	`);

	await database.execAsync(`
		CREATE TABLE IF NOT EXISTS td_subtasks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			task_id INTEGER NOT NULL REFERENCES td_tasks(id) ON DELETE CASCADE,
			title TEXT NOT NULL,
			is_completed INTEGER NOT NULL DEFAULT 0,
			sort_order INTEGER NOT NULL DEFAULT 0,
			created_at TEXT DEFAULT (datetime('now'))
		);
	`);

	await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_td_tasks_category ON td_tasks(category_id);`);
	await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_td_tasks_due_date ON td_tasks(due_date);`);
	await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_td_tasks_completed ON td_tasks(is_completed);`);
	await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_td_tasks_priority ON td_tasks(priority);`);
	await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_td_subtasks_task ON td_subtasks(task_id);`);
}

// ── Category CRUD ──────────────────────────────────────────────

export async function createCategory(name: string, color: string, icon: string): Promise<number> {
	const database = await getDatabase();
	const result = await database.runAsync(
		"INSERT INTO td_categories (name, color, icon) VALUES (?, ?, ?)",
		name, color, icon
	);
	return result.lastInsertRowId;
}

export async function getAllCategories(): Promise<CategoryWithCount[]> {
	const database = await getDatabase();
	return database.getAllAsync<CategoryWithCount>(`
		SELECT c.*,
			COALESCE(COUNT(t.id), 0) as task_count,
			COALESCE(SUM(CASE WHEN t.is_completed = 1 THEN 1 ELSE 0 END), 0) as completed_count
		FROM td_categories c
		LEFT JOIN td_tasks t ON t.category_id = c.id
		GROUP BY c.id
		ORDER BY c.sort_order ASC, c.created_at ASC
	`);
}

export async function getCategory(id: number): Promise<Category | null> {
	const database = await getDatabase();
	return database.getFirstAsync<Category>("SELECT * FROM td_categories WHERE id = ?", id);
}

export async function updateCategory(id: number, name: string, color: string, icon: string): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		"UPDATE td_categories SET name = ?, color = ?, icon = ? WHERE id = ?",
		name, color, icon, id
	);
}

export async function deleteCategory(id: number): Promise<void> {
	const database = await getDatabase();
	await database.runAsync("DELETE FROM td_categories WHERE id = ?", id);
}

// ── Task CRUD ──────────────────────────────────────────────────

export async function createTask(data: CreateTaskData): Promise<number> {
	const database = await getDatabase();
	const result = await database.runAsync(
		`INSERT INTO td_tasks (title, category_id, notes, priority, due_date, due_time, reminder_type, recurrence_type, recurrence_interval, recurrence_end_date)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		data.title,
		data.category_id ?? null,
		data.notes ?? null,
		data.priority ?? "none",
		data.due_date ?? null,
		data.due_time ?? null,
		data.reminder_type ?? "none",
		data.recurrence_type ?? "none",
		data.recurrence_interval ?? 1,
		data.recurrence_end_date ?? null
	);
	return result.lastInsertRowId;
}

const TASK_WITH_CATEGORY_QUERY = `
	SELECT t.*,
		c.name as category_name,
		c.color as category_color,
		c.icon as category_icon,
		COALESCE((SELECT COUNT(*) FROM td_subtasks s WHERE s.task_id = t.id), 0) as subtask_count,
		COALESCE((SELECT SUM(CASE WHEN s.is_completed = 1 THEN 1 ELSE 0 END) FROM td_subtasks s WHERE s.task_id = t.id), 0) as subtask_done
	FROM td_tasks t
	LEFT JOIN td_categories c ON t.category_id = c.id
`;

export async function getTask(id: number): Promise<TaskWithCategory | null> {
	const database = await getDatabase();
	return database.getFirstAsync<TaskWithCategory>(
		`${TASK_WITH_CATEGORY_QUERY} WHERE t.id = ?`, id
	);
}

export async function updateTask(id: number, data: UpdateTaskData): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		`UPDATE td_tasks SET title = ?, category_id = ?, notes = ?, priority = ?, due_date = ?, due_time = ?, reminder_type = ?, recurrence_type = ?, recurrence_interval = ?, recurrence_end_date = ?, updated_at = datetime('now') WHERE id = ?`,
		data.title,
		data.category_id ?? null,
		data.notes ?? null,
		data.priority ?? "none",
		data.due_date ?? null,
		data.due_time ?? null,
		data.reminder_type ?? "none",
		data.recurrence_type ?? "none",
		data.recurrence_interval ?? 1,
		data.recurrence_end_date ?? null,
		id
	);
}

export async function deleteTask(id: number): Promise<void> {
	const database = await getDatabase();
	await database.runAsync("DELETE FROM td_tasks WHERE id = ?", id);
}

export async function deleteMultipleTasks(ids: number[]): Promise<void> {
	if (ids.length === 0) return;
	const database = await getDatabase();
	const placeholders = ids.map(() => "?").join(",");
	await database.runAsync(`DELETE FROM td_tasks WHERE id IN (${placeholders})`, ...ids);
}

export async function toggleTaskCompleted(id: number, completed: boolean): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		"UPDATE td_tasks SET is_completed = ?, completed_at = ?, updated_at = datetime('now') WHERE id = ?",
		completed ? 1 : 0,
		completed ? new Date().toISOString() : null,
		id
	);
}

export async function updateTaskNotificationIds(
	id: number,
	atTimeId: string | null,
	dayBeforeId: string | null
): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		"UPDATE td_tasks SET notification_id_at_time = ?, notification_id_day_before = ? WHERE id = ?",
		atTimeId, dayBeforeId, id
	);
}

// ── Smart List Queries ─────────────────────────────────────────

function getTodayString(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getFutureDateString(days: number): string {
	const d = new Date();
	d.setDate(d.getDate() + days);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getTasksForSmartList(filter: SmartFilter, sort: SortMode = "due_date"): Promise<TaskWithCategory[]> {
	const database = await getDatabase();
	const today = getTodayString();
	const nextWeek = getFutureDateString(7);

	let where = "";
	switch (filter) {
		case "all":
			where = "WHERE t.is_completed = 0";
			break;
		case "today":
			where = `WHERE t.is_completed = 0 AND t.due_date = '${today}'`;
			break;
		case "upcoming":
			where = `WHERE t.is_completed = 0 AND t.due_date > '${today}' AND t.due_date <= '${nextWeek}'`;
			break;
		case "overdue":
			where = `WHERE t.is_completed = 0 AND t.due_date < '${today}' AND t.due_date IS NOT NULL`;
			break;
		case "completed":
			where = "WHERE t.is_completed = 1";
			break;
		case "no_date":
			where = "WHERE t.is_completed = 0 AND t.due_date IS NULL";
			break;
	}

	let orderBy = "";
	switch (sort) {
		case "due_date":
			if (filter === "completed") {
				orderBy = "ORDER BY t.completed_at DESC";
			} else {
				orderBy = "ORDER BY CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END, t.due_date ASC, t.created_at DESC";
			}
			break;
		case "priority":
			orderBy = "ORDER BY CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 ELSE 3 END, t.due_date ASC";
			break;
		case "created":
			orderBy = "ORDER BY t.created_at DESC";
			break;
		case "alpha":
			orderBy = "ORDER BY t.title COLLATE NOCASE ASC";
			break;
	}

	return database.getAllAsync<TaskWithCategory>(
		`${TASK_WITH_CATEGORY_QUERY} ${where} ${orderBy}`
	);
}

export async function getSmartListCounts(): Promise<Record<SmartFilter, number>> {
	const database = await getDatabase();
	const today = getTodayString();
	const nextWeek = getFutureDateString(7);

	const result = await database.getFirstAsync<{
		all_count: number;
		today_count: number;
		upcoming_count: number;
		overdue_count: number;
		completed_count: number;
		no_date_count: number;
	}>(`
		SELECT
			COALESCE(SUM(CASE WHEN is_completed = 0 THEN 1 ELSE 0 END), 0) as all_count,
			COALESCE(SUM(CASE WHEN is_completed = 0 AND due_date = '${today}' THEN 1 ELSE 0 END), 0) as today_count,
			COALESCE(SUM(CASE WHEN is_completed = 0 AND due_date > '${today}' AND due_date <= '${nextWeek}' THEN 1 ELSE 0 END), 0) as upcoming_count,
			COALESCE(SUM(CASE WHEN is_completed = 0 AND due_date < '${today}' AND due_date IS NOT NULL THEN 1 ELSE 0 END), 0) as overdue_count,
			COALESCE(SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END), 0) as completed_count,
			COALESCE(SUM(CASE WHEN is_completed = 0 AND due_date IS NULL THEN 1 ELSE 0 END), 0) as no_date_count
		FROM td_tasks
	`);

	return {
		all: result?.all_count ?? 0,
		today: result?.today_count ?? 0,
		upcoming: result?.upcoming_count ?? 0,
		overdue: result?.overdue_count ?? 0,
		completed: result?.completed_count ?? 0,
		no_date: result?.no_date_count ?? 0,
	};
}

// ── Search ─────────────────────────────────────────────────────

export async function searchTasks(
	query: string,
	priorities?: Priority[],
	showCompleted?: boolean,
	categoryId?: number | null
): Promise<TaskWithCategory[]> {
	const database = await getDatabase();
	const conditions: string[] = [];
	const params: (string | number)[] = [];

	if (query.trim()) {
		conditions.push("(t.title LIKE ? OR t.notes LIKE ?)");
		const q = `%${query.trim()}%`;
		params.push(q, q);
	}

	if (priorities && priorities.length > 0) {
		const placeholders = priorities.map(() => "?").join(",");
		conditions.push(`t.priority IN (${placeholders})`);
		params.push(...priorities);
	}

	if (showCompleted === false) {
		conditions.push("t.is_completed = 0");
	} else if (showCompleted === true) {
		conditions.push("t.is_completed = 1");
	}

	if (categoryId !== undefined && categoryId !== null) {
		conditions.push("t.category_id = ?");
		params.push(categoryId);
	}

	const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

	return database.getAllAsync<TaskWithCategory>(
		`${TASK_WITH_CATEGORY_QUERY} ${where} ORDER BY t.is_completed ASC, t.title COLLATE NOCASE ASC`,
		...params
	);
}

// ── Subtask CRUD ───────────────────────────────────────────────

export async function getSubtasksByTask(taskId: number): Promise<Subtask[]> {
	const database = await getDatabase();
	return database.getAllAsync<Subtask>(
		"SELECT * FROM td_subtasks WHERE task_id = ? ORDER BY sort_order ASC, created_at ASC",
		taskId
	);
}

export async function createSubtask(taskId: number, title: string): Promise<number> {
	const database = await getDatabase();
	const maxOrder = await database.getFirstAsync<{ max_order: number }>(
		"SELECT COALESCE(MAX(sort_order), -1) as max_order FROM td_subtasks WHERE task_id = ?", taskId
	);
	const result = await database.runAsync(
		"INSERT INTO td_subtasks (task_id, title, sort_order) VALUES (?, ?, ?)",
		taskId, title, (maxOrder?.max_order ?? -1) + 1
	);
	return result.lastInsertRowId;
}

export async function updateSubtask(id: number, title: string): Promise<void> {
	const database = await getDatabase();
	await database.runAsync("UPDATE td_subtasks SET title = ? WHERE id = ?", title, id);
}

export async function deleteSubtask(id: number): Promise<void> {
	const database = await getDatabase();
	await database.runAsync("DELETE FROM td_subtasks WHERE id = ?", id);
}

export async function toggleSubtaskCompleted(id: number, completed: boolean): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		"UPDATE td_subtasks SET is_completed = ? WHERE id = ?",
		completed ? 1 : 0, id
	);
}

// ── Recurrence ─────────────────────────────────────────────────

function computeNextDueDate(dueDate: string, type: RecurrenceType, interval: number): string | null {
	const d = new Date(dueDate + "T00:00:00");
	switch (type) {
		case "daily":
			d.setDate(d.getDate() + interval);
			break;
		case "weekly":
			d.setDate(d.getDate() + 7 * interval);
			break;
		case "monthly":
			d.setMonth(d.getMonth() + interval);
			break;
		case "yearly":
			d.setFullYear(d.getFullYear() + interval);
			break;
		case "custom":
			d.setDate(d.getDate() + interval);
			break;
		default:
			return null;
	}
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function createNextRecurrence(task: Task): Promise<number | null> {
	if (task.recurrence_type === "none" || !task.due_date) return null;

	const nextDate = computeNextDueDate(task.due_date, task.recurrence_type, task.recurrence_interval);
	if (!nextDate) return null;

	// Check if past end date
	if (task.recurrence_end_date && nextDate > task.recurrence_end_date) return null;

	const newId = await createTask({
		title: task.title,
		category_id: task.category_id,
		notes: task.notes,
		priority: task.priority,
		due_date: nextDate,
		due_time: task.due_time,
		reminder_type: task.reminder_type,
		recurrence_type: task.recurrence_type,
		recurrence_interval: task.recurrence_interval,
		recurrence_end_date: task.recurrence_end_date,
	});

	return newId;
}

// ── Tasks by Category ──────────────────────────────────────────

export async function getTasksByCategory(categoryId: number): Promise<TaskWithCategory[]> {
	const database = await getDatabase();
	return database.getAllAsync<TaskWithCategory>(
		`${TASK_WITH_CATEGORY_QUERY} WHERE t.category_id = ? ORDER BY t.is_completed ASC, t.due_date ASC`,
		categoryId
	);
}
