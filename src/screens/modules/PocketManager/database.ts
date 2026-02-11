import * as SQLite from "expo-sqlite";

// ── Types ──────────────────────────────────────────────────────

export type GlobalCategory = {
	id: number;
	name: string;
	icon: string;
	color: string;
	sort_order: number;
};

export type GlobalCategoryWithTotal = GlobalCategory & {
	total_amount: number;
	expense_count: number;
};

export type Project = {
	id: number;
	name: string;
	budget: number | null;
	start_date: string | null;
	end_date: string | null;
	is_archived: number;
	created_at: string;
};

export type ProjectWithStats = Project & {
	total_spent: number;
	expense_count: number;
	category_count: number;
};

export type ProjectCategory = {
	id: number;
	project_id: number;
	name: string;
	icon: string;
	color: string;
	sort_order: number;
};

export type ProjectCategoryWithTotal = ProjectCategory & {
	total_amount: number;
	expense_count: number;
};

export type Expense = {
	id: number;
	amount: number;
	date: string;
	notes: string | null;
	project_id: number | null;
	global_category_id: number | null;
	project_category_id: number | null;
	created_at: string;
};

export type ExpenseWithDetails = Expense & {
	category_name: string | null;
	category_icon: string | null;
	category_color: string | null;
	project_name: string | null;
};

export type CreateExpenseData = {
	amount: number;
	date: string;
	notes?: string | null;
	project_id?: number | null;
	global_category_id?: number | null;
	project_category_id?: number | null;
};

export type UpdateExpenseData = CreateExpenseData;

export type CategoryBreakdownItem = {
	category_name: string;
	category_icon: string;
	category_color: string;
	total: number;
};

// ── Database ───────────────────────────────────────────────────

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
	if (db) return db;
	db = await SQLite.openDatabaseAsync("pocket.db");
	await db.execAsync("PRAGMA journal_mode = WAL;");
	await db.execAsync("PRAGMA foreign_keys = ON;");
	return db;
}

const DEFAULT_GLOBAL_CATEGORIES = [
	{ name: "Food", icon: "\u{1F355}", color: "#FF9800" },
	{ name: "Transport", icon: "\u{1F697}", color: "#2196F3" },
	{ name: "Groceries", icon: "\u{1F6D2}", color: "#4CAF50" },
	{ name: "Clothes", icon: "\u{1F455}", color: "#9C27B0" },
	{ name: "Entertainment", icon: "\u{1F3AC}", color: "#F44336" },
	{ name: "Housing", icon: "\u{1F3E0}", color: "#795548" },
	{ name: "Health", icon: "\u{1F48A}", color: "#E91E63" },
	{ name: "Subscriptions", icon: "\u{1F4F1}", color: "#3F51B5" },
	{ name: "Gifts", icon: "\u{1F381}", color: "#FF5722" },
	{ name: "Other", icon: "\u{1F4E6}", color: "#607D8B" },
];

export async function initDatabase(): Promise<void> {
	const database = await getDatabase();

	await database.execAsync(`
		CREATE TABLE IF NOT EXISTS pm_global_categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			icon TEXT NOT NULL DEFAULT '${"\u{1F4E6}"}',
			color TEXT NOT NULL DEFAULT '#2E7D32',
			sort_order INTEGER NOT NULL DEFAULT 0
		);
	`);

	await database.execAsync(`
		CREATE TABLE IF NOT EXISTS pm_projects (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			budget REAL,
			start_date TEXT,
			end_date TEXT,
			is_archived INTEGER NOT NULL DEFAULT 0,
			created_at TEXT DEFAULT (datetime('now'))
		);
	`);

	await database.execAsync(`
		CREATE TABLE IF NOT EXISTS pm_project_categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			project_id INTEGER NOT NULL REFERENCES pm_projects(id) ON DELETE CASCADE,
			name TEXT NOT NULL,
			icon TEXT NOT NULL DEFAULT '${"\u{1F527}"}',
			color TEXT NOT NULL DEFAULT '#2E7D32',
			sort_order INTEGER NOT NULL DEFAULT 0
		);
	`);

	await database.execAsync(`
		CREATE TABLE IF NOT EXISTS pm_expenses (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			amount REAL NOT NULL,
			date TEXT NOT NULL,
			notes TEXT,
			project_id INTEGER REFERENCES pm_projects(id) ON DELETE SET NULL,
			global_category_id INTEGER REFERENCES pm_global_categories(id) ON DELETE SET NULL,
			project_category_id INTEGER REFERENCES pm_project_categories(id) ON DELETE SET NULL,
			created_at TEXT DEFAULT (datetime('now'))
		);
	`);

	await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_pm_expenses_date ON pm_expenses(date);`);
	await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_pm_expenses_project ON pm_expenses(project_id);`);
	await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_pm_expenses_global_cat ON pm_expenses(global_category_id);`);
	await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_pm_expenses_project_cat ON pm_expenses(project_category_id);`);
	await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_pm_project_categories_project ON pm_project_categories(project_id);`);

	// Seed default global categories if empty
	const count = await database.getFirstAsync<{ cnt: number }>(
		"SELECT COUNT(*) as cnt FROM pm_global_categories"
	);
	if (count && count.cnt === 0) {
		for (let i = 0; i < DEFAULT_GLOBAL_CATEGORIES.length; i++) {
			const cat = DEFAULT_GLOBAL_CATEGORIES[i];
			await database.runAsync(
				"INSERT INTO pm_global_categories (name, icon, color, sort_order) VALUES (?, ?, ?, ?)",
				cat.name, cat.icon, cat.color, i
			);
		}
	}
}

// ── Global Category CRUD ──────────────────────────────────────

export async function getGlobalCategories(): Promise<GlobalCategory[]> {
	const database = await getDatabase();
	return database.getAllAsync<GlobalCategory>(
		"SELECT * FROM pm_global_categories ORDER BY sort_order ASC, id ASC"
	);
}

export async function getGlobalCategoriesWithTotals(year: number, month: number): Promise<GlobalCategoryWithTotal[]> {
	const database = await getDatabase();
	const monthStr = `${year}-${String(month).padStart(2, "0")}`;
	return database.getAllAsync<GlobalCategoryWithTotal>(`
		SELECT gc.*,
			COALESCE(SUM(e.amount), 0) as total_amount,
			COALESCE(COUNT(e.id), 0) as expense_count
		FROM pm_global_categories gc
		LEFT JOIN pm_expenses e ON e.global_category_id = gc.id
			AND substr(e.date, 1, 7) = '${monthStr}'
		GROUP BY gc.id
		ORDER BY total_amount DESC, gc.sort_order ASC
	`);
}

export async function createGlobalCategory(name: string, icon: string, color: string): Promise<number> {
	const database = await getDatabase();
	const result = await database.runAsync(
		"INSERT INTO pm_global_categories (name, icon, color) VALUES (?, ?, ?)",
		name, icon, color
	);
	return result.lastInsertRowId;
}

export async function updateGlobalCategory(id: number, name: string, icon: string, color: string): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		"UPDATE pm_global_categories SET name = ?, icon = ?, color = ? WHERE id = ?",
		name, icon, color, id
	);
}

export async function deleteGlobalCategory(id: number): Promise<void> {
	const database = await getDatabase();
	await database.runAsync("DELETE FROM pm_global_categories WHERE id = ?", id);
}

// ── Project CRUD ──────────────────────────────────────────────

export async function getAllProjects(includeArchived = false): Promise<ProjectWithStats[]> {
	const database = await getDatabase();
	const where = includeArchived ? "" : "WHERE p.is_archived = 0";
	return database.getAllAsync<ProjectWithStats>(`
		SELECT p.*,
			COALESCE((SELECT SUM(e.amount) FROM pm_expenses e WHERE e.project_id = p.id), 0) as total_spent,
			COALESCE((SELECT COUNT(e.id) FROM pm_expenses e WHERE e.project_id = p.id), 0) as expense_count,
			COALESCE((SELECT COUNT(pc.id) FROM pm_project_categories pc WHERE pc.project_id = p.id), 0) as category_count
		FROM pm_projects p
		${where}
		ORDER BY p.is_archived ASC, p.created_at DESC
	`);
}

export async function getActiveProjects(): Promise<ProjectWithStats[]> {
	return getAllProjects(false);
}

export async function getProject(id: number): Promise<ProjectWithStats | null> {
	const database = await getDatabase();
	return database.getFirstAsync<ProjectWithStats>(`
		SELECT p.*,
			COALESCE((SELECT SUM(e.amount) FROM pm_expenses e WHERE e.project_id = p.id), 0) as total_spent,
			COALESCE((SELECT COUNT(e.id) FROM pm_expenses e WHERE e.project_id = p.id), 0) as expense_count,
			COALESCE((SELECT COUNT(pc.id) FROM pm_project_categories pc WHERE pc.project_id = p.id), 0) as category_count
		FROM pm_projects p
		WHERE p.id = ?
	`, id);
}

export async function createProject(
	name: string,
	budget?: number | null,
	startDate?: string | null,
	endDate?: string | null
): Promise<number> {
	const database = await getDatabase();
	const result = await database.runAsync(
		"INSERT INTO pm_projects (name, budget, start_date, end_date) VALUES (?, ?, ?, ?)",
		name, budget ?? null, startDate ?? null, endDate ?? null
	);
	return result.lastInsertRowId;
}

export async function updateProject(
	id: number,
	data: { name: string; budget?: number | null; start_date?: string | null; end_date?: string | null }
): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		"UPDATE pm_projects SET name = ?, budget = ?, start_date = ?, end_date = ? WHERE id = ?",
		data.name, data.budget ?? null, data.start_date ?? null, data.end_date ?? null, id
	);
}

export async function archiveProject(id: number): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		"UPDATE pm_projects SET is_archived = 1 WHERE id = ?", id
	);
}

export async function unarchiveProject(id: number): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		"UPDATE pm_projects SET is_archived = 0 WHERE id = ?", id
	);
}

export async function deleteProject(id: number): Promise<void> {
	const database = await getDatabase();
	await database.runAsync("DELETE FROM pm_projects WHERE id = ?", id);
}

// ── Project Category CRUD ─────────────────────────────────────

export async function getProjectCategories(projectId: number): Promise<ProjectCategory[]> {
	const database = await getDatabase();
	return database.getAllAsync<ProjectCategory>(
		"SELECT * FROM pm_project_categories WHERE project_id = ? ORDER BY sort_order ASC, id ASC",
		projectId
	);
}

export async function getProjectCategoriesWithTotals(projectId: number): Promise<ProjectCategoryWithTotal[]> {
	const database = await getDatabase();
	return database.getAllAsync<ProjectCategoryWithTotal>(`
		SELECT pc.*,
			COALESCE(SUM(e.amount), 0) as total_amount,
			COALESCE(COUNT(e.id), 0) as expense_count
		FROM pm_project_categories pc
		LEFT JOIN pm_expenses e ON e.project_category_id = pc.id
		WHERE pc.project_id = ?
		GROUP BY pc.id
		ORDER BY total_amount DESC, pc.sort_order ASC
	`, projectId);
}

export async function createProjectCategory(
	projectId: number, name: string, icon: string, color: string
): Promise<number> {
	const database = await getDatabase();
	const result = await database.runAsync(
		"INSERT INTO pm_project_categories (project_id, name, icon, color) VALUES (?, ?, ?, ?)",
		projectId, name, icon, color
	);
	return result.lastInsertRowId;
}

export async function updateProjectCategory(
	id: number, name: string, icon: string, color: string
): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		"UPDATE pm_project_categories SET name = ?, icon = ?, color = ? WHERE id = ?",
		name, icon, color, id
	);
}

export async function deleteProjectCategory(id: number): Promise<void> {
	const database = await getDatabase();
	await database.runAsync("DELETE FROM pm_project_categories WHERE id = ?", id);
}

// ── Expense CRUD ──────────────────────────────────────────────

const EXPENSE_WITH_DETAILS_QUERY = `
	SELECT e.*,
		COALESCE(gc.name, pc.name) as category_name,
		COALESCE(gc.icon, pc.icon) as category_icon,
		COALESCE(gc.color, pc.color) as category_color,
		p.name as project_name
	FROM pm_expenses e
	LEFT JOIN pm_global_categories gc ON e.global_category_id = gc.id
	LEFT JOIN pm_project_categories pc ON e.project_category_id = pc.id
	LEFT JOIN pm_projects p ON e.project_id = p.id
`;

export async function createExpense(data: CreateExpenseData): Promise<number> {
	const database = await getDatabase();
	const result = await database.runAsync(
		`INSERT INTO pm_expenses (amount, date, notes, project_id, global_category_id, project_category_id)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		data.amount,
		data.date,
		data.notes ?? null,
		data.project_id ?? null,
		data.global_category_id ?? null,
		data.project_category_id ?? null
	);
	return result.lastInsertRowId;
}

export async function updateExpense(id: number, data: UpdateExpenseData): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		`UPDATE pm_expenses SET amount = ?, date = ?, notes = ?, project_id = ?, global_category_id = ?, project_category_id = ? WHERE id = ?`,
		data.amount,
		data.date,
		data.notes ?? null,
		data.project_id ?? null,
		data.global_category_id ?? null,
		data.project_category_id ?? null,
		id
	);
}

export async function deleteExpense(id: number): Promise<void> {
	const database = await getDatabase();
	await database.runAsync("DELETE FROM pm_expenses WHERE id = ?", id);
}

export async function deleteMultipleExpenses(ids: number[]): Promise<void> {
	if (ids.length === 0) return;
	const database = await getDatabase();
	const placeholders = ids.map(() => "?").join(",");
	await database.runAsync(`DELETE FROM pm_expenses WHERE id IN (${placeholders})`, ...ids);
}

export async function getExpense(id: number): Promise<ExpenseWithDetails | null> {
	const database = await getDatabase();
	return database.getFirstAsync<ExpenseWithDetails>(
		`${EXPENSE_WITH_DETAILS_QUERY} WHERE e.id = ?`, id
	);
}

export async function getExpensesForMonth(year: number, month: number): Promise<ExpenseWithDetails[]> {
	const database = await getDatabase();
	const monthStr = `${year}-${String(month).padStart(2, "0")}`;
	return database.getAllAsync<ExpenseWithDetails>(
		`${EXPENSE_WITH_DETAILS_QUERY} WHERE substr(e.date, 1, 7) = ? ORDER BY e.date DESC, e.created_at DESC`,
		monthStr
	);
}

export async function getExpensesForProject(projectId: number): Promise<ExpenseWithDetails[]> {
	const database = await getDatabase();
	return database.getAllAsync<ExpenseWithDetails>(
		`${EXPENSE_WITH_DETAILS_QUERY} WHERE e.project_id = ? ORDER BY e.date DESC, e.created_at DESC`,
		projectId
	);
}

export async function getMonthlyTotal(year: number, month: number): Promise<number> {
	const database = await getDatabase();
	const monthStr = `${year}-${String(month).padStart(2, "0")}`;
	const result = await database.getFirstAsync<{ total: number }>(
		"SELECT COALESCE(SUM(amount), 0) as total FROM pm_expenses WHERE substr(date, 1, 7) = ?",
		monthStr
	);
	return result?.total ?? 0;
}

export async function getMonthlyTotalByCategory(year: number, month: number): Promise<CategoryBreakdownItem[]> {
	const database = await getDatabase();
	const monthStr = `${year}-${String(month).padStart(2, "0")}`;
	return database.getAllAsync<CategoryBreakdownItem>(`
		SELECT
			COALESCE(gc.name, pc.name, 'Uncategorized') as category_name,
			COALESCE(gc.icon, pc.icon, '${"\u{1F4E6}"}') as category_icon,
			COALESCE(gc.color, pc.color, '#607D8B') as category_color,
			SUM(e.amount) as total
		FROM pm_expenses e
		LEFT JOIN pm_global_categories gc ON e.global_category_id = gc.id
		LEFT JOIN pm_project_categories pc ON e.project_category_id = pc.id
		WHERE substr(e.date, 1, 7) = '${monthStr}'
		GROUP BY COALESCE(gc.id, 'p' || pc.id)
		ORDER BY total DESC
	`);
}

export async function getProjectTotal(projectId: number): Promise<number> {
	const database = await getDatabase();
	const result = await database.getFirstAsync<{ total: number }>(
		"SELECT COALESCE(SUM(amount), 0) as total FROM pm_expenses WHERE project_id = ?",
		projectId
	);
	return result?.total ?? 0;
}

export async function getRecentExpenses(limit: number = 5): Promise<ExpenseWithDetails[]> {
	const database = await getDatabase();
	return database.getAllAsync<ExpenseWithDetails>(
		`${EXPENSE_WITH_DETAILS_QUERY} ORDER BY e.date DESC, e.created_at DESC LIMIT ?`,
		limit
	);
}
