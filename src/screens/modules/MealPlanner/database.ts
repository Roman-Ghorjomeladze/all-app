import * as SQLite from "expo-sqlite";

// ── Types ──────────────────────────────────────────────

export type MealTag = {
	id: number;
	name: string;
	icon: string;
	color: string;
};

export type Category = {
	id: number;
	name: string;
	icon: string;
	color: string;
	sort_order: number;
};

export type Ingredient = {
	id: number;
	recipe_id: number;
	name: string;
	quantity: string | null;
	unit: string | null;
	calories_per_100g: number | null;
	quantity_grams: number | null;
	sort_order: number;
};

export type Step = {
	id: number;
	recipe_id: number;
	step_number: number;
	instruction: string;
	sort_order: number;
};

export type Recipe = {
	id: number;
	name: string;
	image_url: string | null;
	prep_time: number | null;
	cook_time: number | null;
	servings: number;
	notes: string | null;
	is_favorite: number;
	created_at: string;
	updated_at: string;
};

export type RecipeWithDetails = Recipe & {
	tag_names: string | null;
	tag_icons: string | null;
	tag_colors: string | null;
	tag_ids: string | null;
	category_names: string | null;
	category_icons: string | null;
	category_colors: string | null;
	category_ids: string | null;
	total_calories: number | null;
};

export type CreateRecipeData = {
	name: string;
	image_url?: string | null;
	prep_time?: number | null;
	cook_time?: number | null;
	servings?: number;
	notes?: string | null;
	tag_ids?: number[];
	category_ids?: number[];
	ingredients?: { name: string; quantity?: string | null; unit?: string | null; calories_per_100g?: number | null; quantity_grams?: number | null }[];
	steps?: { instruction: string }[];
};

export type UpdateRecipeData = CreateRecipeData;

export type MealPlanEntry = {
	id: number;
	date: string;
	meal_type: string;
	recipe_id: number;
};

export type MealPlanEntryWithRecipe = MealPlanEntry & {
	recipe_name: string;
	recipe_image_url: string | null;
	recipe_calories: number | null;
};

export type ShoppingItem = {
	id: number;
	name: string;
	quantity: string | null;
	unit: string | null;
	is_checked: number;
	recipe_id: number | null;
	is_manual: number;
	week_start: string | null;
	created_at: string;
	recipe_name: string | null;
};

export type CalorieEntry = {
	id: number;
	food_name: string;
	calories_per_100g: number;
	created_at: string;
};

// ── Database ───────────────────────────────────────────

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
	if (db) return db;
	db = await SQLite.openDatabaseAsync("mealplanner.db");
	await db.execAsync("PRAGMA journal_mode = WAL;");
	await db.execAsync("PRAGMA foreign_keys = ON;");
	return db;
}

const DEFAULT_MEAL_TAGS = [
	{ name: "Breakfast", icon: "\u{1F373}", color: "#FF9800" },
	{ name: "Lunch", icon: "\u{1F96A}", color: "#4CAF50" },
	{ name: "Dinner", icon: "\u{1F35D}", color: "#2196F3" },
	{ name: "Snack", icon: "\u{1F36A}", color: "#9C27B0" },
	{ name: "Dessert", icon: "\u{1F370}", color: "#E91E63" },
];

export async function initDatabase(): Promise<void> {
	const database = await getDatabase();

	await database.execAsync(`
		CREATE TABLE IF NOT EXISTS mp_recipes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			image_url TEXT,
			prep_time INTEGER,
			cook_time INTEGER,
			servings INTEGER DEFAULT 1,
			notes TEXT,
			is_favorite INTEGER NOT NULL DEFAULT 0,
			created_at TEXT DEFAULT (datetime('now')),
			updated_at TEXT DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS mp_ingredients (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			recipe_id INTEGER NOT NULL REFERENCES mp_recipes(id) ON DELETE CASCADE,
			name TEXT NOT NULL,
			quantity TEXT,
			unit TEXT,
			calories_per_100g INTEGER,
			quantity_grams REAL,
			sort_order INTEGER NOT NULL DEFAULT 0
		);

		CREATE TABLE IF NOT EXISTS mp_steps (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			recipe_id INTEGER NOT NULL REFERENCES mp_recipes(id) ON DELETE CASCADE,
			step_number INTEGER NOT NULL,
			instruction TEXT NOT NULL,
			sort_order INTEGER NOT NULL DEFAULT 0
		);

		CREATE TABLE IF NOT EXISTS mp_meal_tags (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE,
			icon TEXT NOT NULL,
			color TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS mp_recipe_tags (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			recipe_id INTEGER NOT NULL REFERENCES mp_recipes(id) ON DELETE CASCADE,
			tag_id INTEGER NOT NULL REFERENCES mp_meal_tags(id) ON DELETE CASCADE,
			UNIQUE(recipe_id, tag_id)
		);

		CREATE TABLE IF NOT EXISTS mp_categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			icon TEXT NOT NULL DEFAULT '🍽️',
			color TEXT NOT NULL DEFAULT '#FF6B35',
			sort_order INTEGER NOT NULL DEFAULT 0
		);

		CREATE TABLE IF NOT EXISTS mp_recipe_categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			recipe_id INTEGER NOT NULL REFERENCES mp_recipes(id) ON DELETE CASCADE,
			category_id INTEGER NOT NULL REFERENCES mp_categories(id) ON DELETE CASCADE,
			UNIQUE(recipe_id, category_id)
		);

		CREATE TABLE IF NOT EXISTS mp_meal_plan (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			date TEXT NOT NULL,
			meal_type TEXT NOT NULL,
			recipe_id INTEGER NOT NULL REFERENCES mp_recipes(id) ON DELETE CASCADE,
			UNIQUE(date, meal_type, recipe_id)
		);

		CREATE TABLE IF NOT EXISTS mp_shopping_items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			quantity TEXT,
			unit TEXT,
			is_checked INTEGER NOT NULL DEFAULT 0,
			recipe_id INTEGER REFERENCES mp_recipes(id) ON DELETE SET NULL,
			is_manual INTEGER NOT NULL DEFAULT 0,
			week_start TEXT,
			created_at TEXT DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS mp_calorie_book (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			food_name TEXT NOT NULL,
			calories_per_100g INTEGER NOT NULL,
			created_at TEXT DEFAULT (datetime('now'))
		);
	`);

	// Create indexes
	await database.execAsync(`
		CREATE INDEX IF NOT EXISTS idx_mp_ingredients_recipe ON mp_ingredients(recipe_id);
		CREATE INDEX IF NOT EXISTS idx_mp_steps_recipe ON mp_steps(recipe_id);
		CREATE INDEX IF NOT EXISTS idx_mp_recipe_tags_recipe ON mp_recipe_tags(recipe_id);
		CREATE INDEX IF NOT EXISTS idx_mp_recipe_tags_tag ON mp_recipe_tags(tag_id);
		CREATE INDEX IF NOT EXISTS idx_mp_recipe_categories_recipe ON mp_recipe_categories(recipe_id);
		CREATE INDEX IF NOT EXISTS idx_mp_recipe_categories_cat ON mp_recipe_categories(category_id);
		CREATE INDEX IF NOT EXISTS idx_mp_meal_plan_date ON mp_meal_plan(date);
		CREATE INDEX IF NOT EXISTS idx_mp_meal_plan_recipe ON mp_meal_plan(recipe_id);
		CREATE INDEX IF NOT EXISTS idx_mp_shopping_items_week ON mp_shopping_items(week_start);
		CREATE INDEX IF NOT EXISTS idx_mp_calorie_book_name ON mp_calorie_book(food_name);
	`);

	// Seed default meal tags
	const tagCount = await database.getFirstAsync<{ cnt: number }>("SELECT COUNT(*) as cnt FROM mp_meal_tags");
	if (tagCount && tagCount.cnt === 0) {
		for (const tag of DEFAULT_MEAL_TAGS) {
			await database.runAsync(
				"INSERT INTO mp_meal_tags (name, icon, color) VALUES (?, ?, ?)",
				tag.name, tag.icon, tag.color
			);
		}
	}
}

// ── Recipe Queries ─────────────────────────────────────

const RECIPE_WITH_DETAILS_QUERY = `
	SELECT r.*,
		(SELECT GROUP_CONCAT(t.name, '|||') FROM mp_recipe_tags rt JOIN mp_meal_tags t ON rt.tag_id = t.id WHERE rt.recipe_id = r.id) as tag_names,
		(SELECT GROUP_CONCAT(t.icon, '|||') FROM mp_recipe_tags rt JOIN mp_meal_tags t ON rt.tag_id = t.id WHERE rt.recipe_id = r.id) as tag_icons,
		(SELECT GROUP_CONCAT(t.color, '|||') FROM mp_recipe_tags rt JOIN mp_meal_tags t ON rt.tag_id = t.id WHERE rt.recipe_id = r.id) as tag_colors,
		(SELECT GROUP_CONCAT(rt.tag_id) FROM mp_recipe_tags rt WHERE rt.recipe_id = r.id) as tag_ids,
		(SELECT GROUP_CONCAT(c.name, '|||') FROM mp_recipe_categories rc JOIN mp_categories c ON rc.category_id = c.id WHERE rc.recipe_id = r.id) as category_names,
		(SELECT GROUP_CONCAT(c.icon, '|||') FROM mp_recipe_categories rc JOIN mp_categories c ON rc.category_id = c.id WHERE rc.recipe_id = r.id) as category_icons,
		(SELECT GROUP_CONCAT(c.color, '|||') FROM mp_recipe_categories rc JOIN mp_categories c ON rc.category_id = c.id WHERE rc.recipe_id = r.id) as category_colors,
		(SELECT GROUP_CONCAT(rc.category_id) FROM mp_recipe_categories rc WHERE rc.recipe_id = r.id) as category_ids,
		(SELECT SUM(CASE WHEN i.quantity_grams IS NOT NULL AND i.calories_per_100g IS NOT NULL THEN (i.quantity_grams / 100.0) * i.calories_per_100g ELSE 0 END) FROM mp_ingredients i WHERE i.recipe_id = r.id) as total_calories
	FROM mp_recipes r
`;

export async function getAllRecipes(searchQuery?: string, tagIds?: number[], categoryIds?: number[]): Promise<RecipeWithDetails[]> {
	const database = await getDatabase();
	let query = RECIPE_WITH_DETAILS_QUERY;
	const conditions: string[] = [];
	const params: (string | number)[] = [];

	if (searchQuery && searchQuery.trim()) {
		conditions.push("r.name LIKE ?");
		params.push(`%${searchQuery.trim()}%`);
	}

	if (tagIds && tagIds.length > 0) {
		const placeholders = tagIds.map(() => "?").join(",");
		conditions.push(`r.id IN (SELECT recipe_id FROM mp_recipe_tags WHERE tag_id IN (${placeholders}))`);
		params.push(...tagIds);
	}

	if (categoryIds && categoryIds.length > 0) {
		const placeholders = categoryIds.map(() => "?").join(",");
		conditions.push(`r.id IN (SELECT recipe_id FROM mp_recipe_categories WHERE category_id IN (${placeholders}))`);
		params.push(...categoryIds);
	}

	if (conditions.length > 0) {
		query += " WHERE " + conditions.join(" AND ");
	}

	query += " ORDER BY r.created_at DESC";
	return database.getAllAsync<RecipeWithDetails>(query, params);
}

export async function getRecipe(id: number): Promise<RecipeWithDetails | null> {
	const database = await getDatabase();
	return database.getFirstAsync<RecipeWithDetails>(
		RECIPE_WITH_DETAILS_QUERY + " WHERE r.id = ?",
		id
	);
}

export async function getRecipeIngredients(recipeId: number): Promise<Ingredient[]> {
	const database = await getDatabase();
	return database.getAllAsync<Ingredient>(
		"SELECT * FROM mp_ingredients WHERE recipe_id = ? ORDER BY sort_order ASC",
		recipeId
	);
}

export async function getRecipeSteps(recipeId: number): Promise<Step[]> {
	const database = await getDatabase();
	return database.getAllAsync<Step>(
		"SELECT * FROM mp_steps WHERE recipe_id = ? ORDER BY sort_order ASC",
		recipeId
	);
}

export async function getRecipeTagIds(recipeId: number): Promise<number[]> {
	const database = await getDatabase();
	const rows = await database.getAllAsync<{ tag_id: number }>(
		"SELECT tag_id FROM mp_recipe_tags WHERE recipe_id = ?",
		recipeId
	);
	return rows.map((r) => r.tag_id);
}

export async function getRecipeCategoryIds(recipeId: number): Promise<number[]> {
	const database = await getDatabase();
	const rows = await database.getAllAsync<{ category_id: number }>(
		"SELECT category_id FROM mp_recipe_categories WHERE recipe_id = ?",
		recipeId
	);
	return rows.map((r) => r.category_id);
}

export async function createRecipe(data: CreateRecipeData): Promise<number> {
	const database = await getDatabase();
	const result = await database.runAsync(
		"INSERT INTO mp_recipes (name, image_url, prep_time, cook_time, servings, notes) VALUES (?, ?, ?, ?, ?, ?)",
		data.name,
		data.image_url ?? null,
		data.prep_time ?? null,
		data.cook_time ?? null,
		data.servings ?? 1,
		data.notes ?? null
	);
	const recipeId = result.lastInsertRowId;

	// Insert ingredients
	if (data.ingredients) {
		for (let i = 0; i < data.ingredients.length; i++) {
			const ing = data.ingredients[i];
			await database.runAsync(
				"INSERT INTO mp_ingredients (recipe_id, name, quantity, unit, calories_per_100g, quantity_grams, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
				recipeId, ing.name, ing.quantity ?? null, ing.unit ?? null, ing.calories_per_100g ?? null, ing.quantity_grams ?? null, i
			);
		}
	}

	// Insert steps
	if (data.steps) {
		for (let i = 0; i < data.steps.length; i++) {
			await database.runAsync(
				"INSERT INTO mp_steps (recipe_id, step_number, instruction, sort_order) VALUES (?, ?, ?, ?)",
				recipeId, i + 1, data.steps[i].instruction, i
			);
		}
	}

	// Insert tag links
	if (data.tag_ids) {
		for (const tagId of data.tag_ids) {
			await database.runAsync(
				"INSERT OR IGNORE INTO mp_recipe_tags (recipe_id, tag_id) VALUES (?, ?)",
				recipeId, tagId
			);
		}
	}

	// Insert category links
	if (data.category_ids) {
		for (const catId of data.category_ids) {
			await database.runAsync(
				"INSERT OR IGNORE INTO mp_recipe_categories (recipe_id, category_id) VALUES (?, ?)",
				recipeId, catId
			);
		}
	}

	return recipeId;
}

export async function updateRecipe(id: number, data: UpdateRecipeData): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		"UPDATE mp_recipes SET name = ?, image_url = ?, prep_time = ?, cook_time = ?, servings = ?, notes = ?, updated_at = datetime('now') WHERE id = ?",
		data.name,
		data.image_url ?? null,
		data.prep_time ?? null,
		data.cook_time ?? null,
		data.servings ?? 1,
		data.notes ?? null,
		id
	);

	// Replace ingredients
	await database.runAsync("DELETE FROM mp_ingredients WHERE recipe_id = ?", id);
	if (data.ingredients) {
		for (let i = 0; i < data.ingredients.length; i++) {
			const ing = data.ingredients[i];
			await database.runAsync(
				"INSERT INTO mp_ingredients (recipe_id, name, quantity, unit, calories_per_100g, quantity_grams, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
				id, ing.name, ing.quantity ?? null, ing.unit ?? null, ing.calories_per_100g ?? null, ing.quantity_grams ?? null, i
			);
		}
	}

	// Replace steps
	await database.runAsync("DELETE FROM mp_steps WHERE recipe_id = ?", id);
	if (data.steps) {
		for (let i = 0; i < data.steps.length; i++) {
			await database.runAsync(
				"INSERT INTO mp_steps (recipe_id, step_number, instruction, sort_order) VALUES (?, ?, ?, ?)",
				id, i + 1, data.steps[i].instruction, i
			);
		}
	}

	// Replace tag links
	await database.runAsync("DELETE FROM mp_recipe_tags WHERE recipe_id = ?", id);
	if (data.tag_ids) {
		for (const tagId of data.tag_ids) {
			await database.runAsync(
				"INSERT OR IGNORE INTO mp_recipe_tags (recipe_id, tag_id) VALUES (?, ?)",
				id, tagId
			);
		}
	}

	// Replace category links
	await database.runAsync("DELETE FROM mp_recipe_categories WHERE recipe_id = ?", id);
	if (data.category_ids) {
		for (const catId of data.category_ids) {
			await database.runAsync(
				"INSERT OR IGNORE INTO mp_recipe_categories (recipe_id, category_id) VALUES (?, ?)",
				id, catId
			);
		}
	}
}

export async function deleteRecipe(id: number): Promise<void> {
	const database = await getDatabase();
	await database.runAsync("DELETE FROM mp_recipes WHERE id = ?", id);
}

// ── Meal Tags ──────────────────────────────────────────

export async function getAllMealTags(): Promise<MealTag[]> {
	const database = await getDatabase();
	return database.getAllAsync<MealTag>("SELECT * FROM mp_meal_tags ORDER BY id ASC");
}

// ── Categories ─────────────────────────────────────────

export async function getAllCategories(): Promise<Category[]> {
	const database = await getDatabase();
	return database.getAllAsync<Category>("SELECT * FROM mp_categories ORDER BY sort_order ASC, id ASC");
}

export async function createCategory(name: string, icon: string, color: string): Promise<number> {
	const database = await getDatabase();
	const result = await database.runAsync(
		"INSERT INTO mp_categories (name, icon, color) VALUES (?, ?, ?)",
		name, icon, color
	);
	return result.lastInsertRowId;
}

export async function updateCategory(id: number, name: string, icon: string, color: string): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		"UPDATE mp_categories SET name = ?, icon = ?, color = ? WHERE id = ?",
		name, icon, color, id
	);
}

export async function deleteCategory(id: number): Promise<void> {
	const database = await getDatabase();
	await database.runAsync("DELETE FROM mp_categories WHERE id = ?", id);
}

// ── Meal Plan ──────────────────────────────────────────

export async function getMealPlanForWeek(weekStart: string): Promise<MealPlanEntryWithRecipe[]> {
	const database = await getDatabase();
	return database.getAllAsync<MealPlanEntryWithRecipe>(
		`SELECT mp.*, r.name as recipe_name, r.image_url as recipe_image_url,
			(SELECT SUM(CASE WHEN i.quantity_grams IS NOT NULL AND i.calories_per_100g IS NOT NULL THEN (i.quantity_grams / 100.0) * i.calories_per_100g ELSE 0 END) / MAX(r.servings, 1) FROM mp_ingredients i WHERE i.recipe_id = r.id) as recipe_calories
		FROM mp_meal_plan mp
		JOIN mp_recipes r ON mp.recipe_id = r.id
		WHERE mp.date >= ? AND mp.date < date(?, '+7 days')
		ORDER BY mp.date ASC, CASE mp.meal_type WHEN 'breakfast' THEN 1 WHEN 'lunch' THEN 2 WHEN 'dinner' THEN 3 WHEN 'snack' THEN 4 END`,
		weekStart, weekStart
	);
}

export async function addToMealPlan(date: string, mealType: string, recipeId: number): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		"INSERT OR IGNORE INTO mp_meal_plan (date, meal_type, recipe_id) VALUES (?, ?, ?)",
		date, mealType, recipeId
	);
}

export async function removeFromMealPlan(id: number): Promise<void> {
	const database = await getDatabase();
	await database.runAsync("DELETE FROM mp_meal_plan WHERE id = ?", id);
}

// ── Shopping List ──────────────────────────────────────

export async function generateShoppingList(weekStart: string): Promise<void> {
	const database = await getDatabase();

	// Remove old auto-generated items for this week
	await database.runAsync(
		"DELETE FROM mp_shopping_items WHERE week_start = ? AND is_manual = 0",
		weekStart
	);

	// Get all ingredients from planned recipes for the week
	const ingredients = await database.getAllAsync<{
		name: string;
		quantity: string | null;
		unit: string | null;
		recipe_id: number;
	}>(
		`SELECT i.name, i.quantity, i.unit, mp.recipe_id
		FROM mp_meal_plan mp
		JOIN mp_ingredients i ON i.recipe_id = mp.recipe_id
		WHERE mp.date >= ? AND mp.date < date(?, '+7 days')
		ORDER BY i.name ASC`,
		weekStart, weekStart
	);

	for (const ing of ingredients) {
		await database.runAsync(
			"INSERT INTO mp_shopping_items (name, quantity, unit, recipe_id, is_manual, week_start) VALUES (?, ?, ?, ?, 0, ?)",
			ing.name, ing.quantity, ing.unit, ing.recipe_id, weekStart
		);
	}
}

export async function getShoppingItems(weekStart: string): Promise<ShoppingItem[]> {
	const database = await getDatabase();
	return database.getAllAsync<ShoppingItem>(
		`SELECT s.*, r.name as recipe_name
		FROM mp_shopping_items s
		LEFT JOIN mp_recipes r ON s.recipe_id = r.id
		WHERE s.week_start = ?
		ORDER BY s.is_checked ASC, s.name ASC`,
		weekStart
	);
}

export async function toggleShoppingItem(id: number, checked: boolean): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		"UPDATE mp_shopping_items SET is_checked = ? WHERE id = ?",
		checked ? 1 : 0, id
	);
}

export async function addManualShoppingItem(name: string, quantity?: string | null, unit?: string | null, weekStart?: string | null): Promise<number> {
	const database = await getDatabase();
	const result = await database.runAsync(
		"INSERT INTO mp_shopping_items (name, quantity, unit, is_manual, week_start) VALUES (?, ?, ?, 1, ?)",
		name, quantity ?? null, unit ?? null, weekStart ?? null
	);
	return result.lastInsertRowId;
}

export async function deleteShoppingItem(id: number): Promise<void> {
	const database = await getDatabase();
	await database.runAsync("DELETE FROM mp_shopping_items WHERE id = ?", id);
}

export async function clearCheckedItems(weekStart: string): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		"DELETE FROM mp_shopping_items WHERE week_start = ? AND is_checked = 1",
		weekStart
	);
}

// ── Calorie Book ───────────────────────────────────────

export async function getAllCalorieEntries(searchQuery?: string): Promise<CalorieEntry[]> {
	const database = await getDatabase();
	if (searchQuery && searchQuery.trim()) {
		return database.getAllAsync<CalorieEntry>(
			"SELECT * FROM mp_calorie_book WHERE food_name LIKE ? ORDER BY food_name ASC",
			`%${searchQuery.trim()}%`
		);
	}
	return database.getAllAsync<CalorieEntry>(
		"SELECT * FROM mp_calorie_book ORDER BY food_name ASC"
	);
}

export async function searchCalorieBook(name: string): Promise<CalorieEntry[]> {
	const database = await getDatabase();
	return database.getAllAsync<CalorieEntry>(
		"SELECT * FROM mp_calorie_book WHERE food_name LIKE ? ORDER BY food_name ASC LIMIT 10",
		`%${name}%`
	);
}

export async function createCalorieEntry(foodName: string, caloriesPer100g: number): Promise<number> {
	const database = await getDatabase();
	const result = await database.runAsync(
		"INSERT INTO mp_calorie_book (food_name, calories_per_100g) VALUES (?, ?)",
		foodName, caloriesPer100g
	);
	return result.lastInsertRowId;
}

export async function updateCalorieEntry(id: number, foodName: string, caloriesPer100g: number): Promise<void> {
	const database = await getDatabase();
	await database.runAsync(
		"UPDATE mp_calorie_book SET food_name = ?, calories_per_100g = ? WHERE id = ?",
		foodName, caloriesPer100g, id
	);
}

export async function deleteCalorieEntry(id: number): Promise<void> {
	const database = await getDatabase();
	await database.runAsync("DELETE FROM mp_calorie_book WHERE id = ?", id);
}
