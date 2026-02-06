import * as SQLite from "expo-sqlite";

// ==================== TYPES ====================

export type Project = {
	id: number;
	name: string;
	source_language: string;
	target_language: string;
	created_at: string;
};

export type ProjectWithCount = Project & { card_count: number };

export type Card = {
	id: number;
	project_id: number;
	front_text: string;
	back_text: string;
	mastery: number;
	times_seen: number;
	times_correct: number;
	last_reviewed: string | null;
	created_at: string;
};

export type CardWithTags = Card & { tags: Tag[] };

export type Tag = {
	id: number;
	project_id: number;
	name: string;
	color: string;
};

export type Mistake = {
	id: number;
	card_id: number;
	quiz_mode: "easy" | "medium" | "hard";
	user_answer: string | null;
	correct_answer: string;
	created_at: string;
	// Joined fields
	front_text?: string;
	back_text?: string;
};

// ==================== DATABASE INIT ====================

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
	if (db) return db;

	db = await SQLite.openDatabaseAsync("linguaflip.db");

	await db.execAsync("PRAGMA foreign_keys = ON;");
	await db.execAsync("PRAGMA journal_mode = WAL;");

	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS ll_projects (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			source_language TEXT NOT NULL DEFAULT 'en',
			target_language TEXT NOT NULL DEFAULT 'ka',
			created_at TEXT DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS ll_cards (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			project_id INTEGER NOT NULL REFERENCES ll_projects(id) ON DELETE CASCADE,
			front_text TEXT NOT NULL,
			back_text TEXT NOT NULL,
			mastery INTEGER NOT NULL DEFAULT 1,
			times_seen INTEGER NOT NULL DEFAULT 0,
			times_correct INTEGER NOT NULL DEFAULT 0,
			last_reviewed TEXT,
			created_at TEXT DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS ll_tags (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			project_id INTEGER NOT NULL REFERENCES ll_projects(id) ON DELETE CASCADE,
			name TEXT NOT NULL,
			color TEXT NOT NULL DEFAULT '#008B8B'
		);

		CREATE TABLE IF NOT EXISTS ll_card_tags (
			card_id INTEGER NOT NULL REFERENCES ll_cards(id) ON DELETE CASCADE,
			tag_id INTEGER NOT NULL REFERENCES ll_tags(id) ON DELETE CASCADE,
			PRIMARY KEY (card_id, tag_id)
		);

		CREATE TABLE IF NOT EXISTS ll_mistakes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			card_id INTEGER NOT NULL REFERENCES ll_cards(id) ON DELETE CASCADE,
			quiz_mode TEXT NOT NULL,
			user_answer TEXT,
			correct_answer TEXT NOT NULL,
			created_at TEXT DEFAULT (datetime('now'))
		);

		CREATE INDEX IF NOT EXISTS idx_ll_cards_project ON ll_cards(project_id);
		CREATE INDEX IF NOT EXISTS idx_ll_tags_project ON ll_tags(project_id);
		CREATE INDEX IF NOT EXISTS idx_ll_mistakes_card ON ll_mistakes(card_id);
	`);

	return db;
}

// ==================== PROJECT CRUD ====================

export async function createProject(name: string): Promise<number> {
	const database = await initDatabase();
	const result = await database.runAsync("INSERT INTO ll_projects (name) VALUES (?)", name);
	return result.lastInsertRowId;
}

export async function getAllProjects(): Promise<ProjectWithCount[]> {
	const database = await initDatabase();
	return database.getAllAsync<ProjectWithCount>(
		`SELECT p.*, COALESCE(c.cnt, 0) as card_count
		 FROM ll_projects p
		 LEFT JOIN (SELECT project_id, COUNT(*) as cnt FROM ll_cards GROUP BY project_id) c
		 ON p.id = c.project_id
		 ORDER BY p.created_at DESC`,
	);
}

export async function renameProject(id: number, name: string): Promise<void> {
	const database = await initDatabase();
	await database.runAsync("UPDATE ll_projects SET name = ? WHERE id = ?", name, id);
}

export async function deleteProject(id: number): Promise<void> {
	const database = await initDatabase();
	await database.runAsync("DELETE FROM ll_projects WHERE id = ?", id);
}

export async function getProject(id: number): Promise<Project | null> {
	const database = await initDatabase();
	return database.getFirstAsync<Project>("SELECT * FROM ll_projects WHERE id = ?", id);
}

// ==================== CARD CRUD ====================

export async function createCard(projectId: number, frontText: string, backText: string): Promise<number> {
	const database = await initDatabase();
	const result = await database.runAsync(
		"INSERT INTO ll_cards (project_id, front_text, back_text) VALUES (?, ?, ?)",
		projectId,
		frontText,
		backText,
	);
	return result.lastInsertRowId;
}

export async function updateCard(id: number, frontText: string, backText: string): Promise<void> {
	const database = await initDatabase();
	await database.runAsync("UPDATE ll_cards SET front_text = ?, back_text = ? WHERE id = ?", frontText, backText, id);
}

export async function deleteCard(id: number): Promise<void> {
	const database = await initDatabase();
	await database.runAsync("DELETE FROM ll_cards WHERE id = ?", id);
}

export async function getCard(id: number): Promise<Card | null> {
	const database = await initDatabase();
	return database.getFirstAsync<Card>("SELECT * FROM ll_cards WHERE id = ?", id);
}

export async function getCardsByProject(projectId: number): Promise<Card[]> {
	const database = await initDatabase();
	return database.getAllAsync<Card>(
		"SELECT * FROM ll_cards WHERE project_id = ? ORDER BY created_at DESC",
		projectId,
	);
}

export async function getCardsByTag(projectId: number, tagId: number): Promise<Card[]> {
	const database = await initDatabase();
	return database.getAllAsync<Card>(
		`SELECT c.* FROM ll_cards c
		 INNER JOIN ll_card_tags ct ON c.id = ct.card_id
		 WHERE c.project_id = ? AND ct.tag_id = ?
		 ORDER BY c.created_at DESC`,
		projectId,
		tagId,
	);
}

// ==================== TAG CRUD ====================

export async function createTag(projectId: number, name: string, color: string = "#008B8B"): Promise<number> {
	const database = await initDatabase();
	const result = await database.runAsync(
		"INSERT INTO ll_tags (project_id, name, color) VALUES (?, ?, ?)",
		projectId,
		name,
		color,
	);
	return result.lastInsertRowId;
}

export async function deleteTag(id: number): Promise<void> {
	const database = await initDatabase();
	await database.runAsync("DELETE FROM ll_tags WHERE id = ?", id);
}

export async function getTagsByProject(projectId: number): Promise<Tag[]> {
	const database = await initDatabase();
	return database.getAllAsync<Tag>("SELECT * FROM ll_tags WHERE project_id = ? ORDER BY name", projectId);
}

export async function getTagsForCard(cardId: number): Promise<Tag[]> {
	const database = await initDatabase();
	return database.getAllAsync<Tag>(
		`SELECT t.* FROM ll_tags t
		 INNER JOIN ll_card_tags ct ON t.id = ct.tag_id
		 WHERE ct.card_id = ?
		 ORDER BY t.name`,
		cardId,
	);
}

export async function addTagToCard(cardId: number, tagId: number): Promise<void> {
	const database = await initDatabase();
	await database.runAsync("INSERT OR IGNORE INTO ll_card_tags (card_id, tag_id) VALUES (?, ?)", cardId, tagId);
}

export async function removeTagFromCard(cardId: number, tagId: number): Promise<void> {
	const database = await initDatabase();
	await database.runAsync("DELETE FROM ll_card_tags WHERE card_id = ? AND tag_id = ?", cardId, tagId);
}

// ==================== MASTERY / SPACED REPETITION ====================

export async function resetCardStats(cardId: number): Promise<void> {
	const database = await initDatabase();
	await database.runAsync(
		`UPDATE ll_cards SET
			mastery = 1,
			times_seen = 0,
			times_correct = 0,
			last_reviewed = NULL
		WHERE id = ?`,
		cardId,
	);
}

export async function resetAllCardStats(projectId: number): Promise<void> {
	const database = await initDatabase();
	await database.runAsync(
		`UPDATE ll_cards SET
			mastery = 1,
			times_seen = 0,
			times_correct = 0,
			last_reviewed = NULL
		WHERE project_id = ?`,
		projectId,
	);
}

export async function updateCardMastery(cardId: number, isCorrect: boolean): Promise<void> {
	const database = await initDatabase();
	const now = new Date().toISOString();

	if (isCorrect) {
		await database.runAsync(
			`UPDATE ll_cards SET
				mastery = MIN(mastery + 1, 5),
				times_seen = times_seen + 1,
				times_correct = times_correct + 1,
				last_reviewed = ?
			WHERE id = ?`,
			now,
			cardId,
		);
	} else {
		await database.runAsync(
			`UPDATE ll_cards SET
				mastery = MAX(mastery - 1, 1),
				times_seen = times_seen + 1,
				last_reviewed = ?
			WHERE id = ?`,
			now,
			cardId,
		);
	}
}

export async function getQuizPool(projectId: number, tagId: number | null): Promise<Card[]> {
	const database = await initDatabase();

	let cards: Card[];
	if (tagId) {
		cards = await database.getAllAsync<Card>(
			`SELECT c.* FROM ll_cards c
			 INNER JOIN ll_card_tags ct ON c.id = ct.card_id
			 WHERE c.project_id = ? AND ct.tag_id = ?`,
			projectId,
			tagId,
		);
	} else {
		cards = await database.getAllAsync<Card>("SELECT * FROM ll_cards WHERE project_id = ?", projectId);
	}

	// Weighted shuffle: lower mastery = more likely to appear
	const weighted: Card[] = [];
	for (const card of cards) {
		const weight = 6 - card.mastery; // mastery 1 → weight 5, mastery 5 → weight 1
		for (let i = 0; i < weight; i++) {
			weighted.push(card);
		}
	}

	// Shuffle
	for (let i = weighted.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[weighted[i], weighted[j]] = [weighted[j], weighted[i]];
	}

	// Deduplicate (keep first occurrence of each card)
	const seen = new Set<number>();
	const result: Card[] = [];
	for (const card of weighted) {
		if (!seen.has(card.id)) {
			seen.add(card.id);
			result.push(card);
		}
	}

	return result;
}

// ==================== MISTAKES ====================

export async function saveMistake(
	cardId: number,
	quizMode: "easy" | "medium" | "hard",
	userAnswer: string | null,
	correctAnswer: string,
): Promise<void> {
	const database = await initDatabase();
	await database.runAsync(
		"INSERT INTO ll_mistakes (card_id, quiz_mode, user_answer, correct_answer) VALUES (?, ?, ?, ?)",
		cardId,
		quizMode,
		userAnswer,
		correctAnswer,
	);
}

export async function getMistakesByProject(projectId: number): Promise<Mistake[]> {
	const database = await initDatabase();
	return database.getAllAsync<Mistake>(
		`SELECT m.*, c.front_text, c.back_text
		 FROM ll_mistakes m
		 INNER JOIN ll_cards c ON m.card_id = c.id
		 WHERE c.project_id = ?
		 ORDER BY m.created_at DESC`,
		projectId,
	);
}

export async function deleteMistake(id: number): Promise<void> {
	const database = await initDatabase();
	await database.runAsync("DELETE FROM ll_mistakes WHERE id = ?", id);
}

export async function clearAllMistakes(projectId: number): Promise<void> {
	const database = await initDatabase();
	await database.runAsync(
		`DELETE FROM ll_mistakes WHERE card_id IN (SELECT id FROM ll_cards WHERE project_id = ?)`,
		projectId,
	);
}

export async function getMistakeCount(projectId: number): Promise<number> {
	const database = await initDatabase();
	const result = await database.getFirstAsync<{ count: number }>(
		`SELECT COUNT(*) as count FROM ll_mistakes m
		 INNER JOIN ll_cards c ON m.card_id = c.id
		 WHERE c.project_id = ?`,
		projectId,
	);
	return result?.count || 0;
}
