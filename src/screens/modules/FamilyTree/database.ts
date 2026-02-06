import * as SQLite from "expo-sqlite";

// Types
export type FamilyTreeRecord = {
	id: number;
	name: string;
	created_at: string;
};

export type Person = {
	id: number;
	tree_id: number;
	first_name: string;
	last_name: string;
	birth_date: string | null;
	death_date: string | null;
	bio: string | null;
	image_url: string | null;
	gender: "male" | "female" | "other";
	created_at: string;
};

export type Relationship = {
	id: number;
	person1_id: number;
	person2_id: number;
	relationship_type: "parent-child" | "spouse";
	created_at: string;
};

export type TreeData = {
	persons: Person[];
	relationships: Relationship[];
};

// Singleton
let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
	if (db) return db;

	db = await SQLite.openDatabaseAsync("familytree.db");

	// Enable foreign keys
	await db.execAsync("PRAGMA foreign_keys = ON;");

	// Create ft_trees table
	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS ft_trees (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
		);
	`);

	// Create ft_persons table (without tree_id initially for migration)
	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS ft_persons (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			first_name TEXT NOT NULL,
			last_name TEXT NOT NULL DEFAULT '',
			birth_date TEXT,
			death_date TEXT,
			bio TEXT,
			image_url TEXT,
			gender TEXT NOT NULL DEFAULT 'other',
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS ft_relationships (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			person1_id INTEGER NOT NULL,
			person2_id INTEGER NOT NULL,
			relationship_type TEXT NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (person1_id) REFERENCES ft_persons(id) ON DELETE CASCADE,
			FOREIGN KEY (person2_id) REFERENCES ft_persons(id) ON DELETE CASCADE,
			UNIQUE(person1_id, person2_id, relationship_type)
		);
	`);

	// Migration: add tree_id column if it doesn't exist
	const tableInfo = await db.getAllAsync<{ name: string }>("PRAGMA table_info(ft_persons)");
	const hasTreeId = tableInfo.some((col) => col.name === "tree_id");

	if (!hasTreeId) {
		await db.execAsync("ALTER TABLE ft_persons ADD COLUMN tree_id INTEGER REFERENCES ft_trees(id)");

		// Migrate existing data: create a default tree and assign orphaned persons
		const existingCount = await db.getFirstAsync<{ cnt: number }>("SELECT COUNT(*) as cnt FROM ft_persons");
		if (existingCount && existingCount.cnt > 0) {
			await db.runAsync("INSERT INTO ft_trees (name) VALUES (?)", ["My Family Tree"]);
			const defaultTree = await db.getFirstAsync<{ id: number }>("SELECT id FROM ft_trees ORDER BY id ASC LIMIT 1");
			if (defaultTree) {
				await db.runAsync("UPDATE ft_persons SET tree_id = ? WHERE tree_id IS NULL", [defaultTree.id]);
			}
		}
	}

	// Create index on tree_id
	await db.execAsync("CREATE INDEX IF NOT EXISTS idx_ft_persons_tree_id ON ft_persons(tree_id)");

	return db;
}

// ─── Tree CRUD ────────────────────────────────────────────

export async function createTree(name: string): Promise<number> {
	const database = await initDatabase();
	const result = await database.runAsync("INSERT INTO ft_trees (name) VALUES (?)", [name]);
	return result.lastInsertRowId;
}

export async function getAllTrees(): Promise<FamilyTreeRecord[]> {
	const database = await initDatabase();
	return database.getAllAsync<FamilyTreeRecord>("SELECT * FROM ft_trees ORDER BY created_at DESC");
}

export async function renameTree(id: number, name: string): Promise<void> {
	const database = await initDatabase();
	await database.runAsync("UPDATE ft_trees SET name = ? WHERE id = ?", [name, id]);
}

export async function deleteTree(id: number): Promise<void> {
	const database = await initDatabase();
	// Delete relationships for persons in this tree
	await database.runAsync(
		"DELETE FROM ft_relationships WHERE person1_id IN (SELECT id FROM ft_persons WHERE tree_id = ?) OR person2_id IN (SELECT id FROM ft_persons WHERE tree_id = ?)",
		[id, id],
	);
	// Delete persons in this tree
	await database.runAsync("DELETE FROM ft_persons WHERE tree_id = ?", [id]);
	// Delete the tree itself
	await database.runAsync("DELETE FROM ft_trees WHERE id = ?", [id]);
}

export async function getTreeMemberCount(treeId: number): Promise<number> {
	const database = await initDatabase();
	const result = await database.getFirstAsync<{ cnt: number }>(
		"SELECT COUNT(*) as cnt FROM ft_persons WHERE tree_id = ?",
		[treeId],
	);
	return result?.cnt ?? 0;
}

// ─── Person CRUD ───────────────────────────────────────────

export async function createPerson(
	treeId: number,
	firstName: string,
	lastName: string,
	gender: "male" | "female" | "other",
	birthDate?: string | null,
	deathDate?: string | null,
	bio?: string | null,
	imageUrl?: string | null,
): Promise<number> {
	const database = await initDatabase();
	const result = await database.runAsync(
		"INSERT INTO ft_persons (tree_id, first_name, last_name, gender, birth_date, death_date, bio, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		[treeId, firstName, lastName, gender, birthDate ?? null, deathDate ?? null, bio ?? null, imageUrl ?? null],
	);
	return result.lastInsertRowId;
}

export async function updatePerson(
	id: number,
	firstName: string,
	lastName: string,
	gender: "male" | "female" | "other",
	birthDate?: string | null,
	deathDate?: string | null,
	bio?: string | null,
	imageUrl?: string | null,
): Promise<void> {
	const database = await initDatabase();
	await database.runAsync(
		"UPDATE ft_persons SET first_name = ?, last_name = ?, gender = ?, birth_date = ?, death_date = ?, bio = ?, image_url = ? WHERE id = ?",
		[firstName, lastName, gender, birthDate ?? null, deathDate ?? null, bio ?? null, imageUrl ?? null, id],
	);
}

export async function deletePerson(id: number): Promise<void> {
	const database = await initDatabase();
	// Delete all relationships involving this person first
	await database.runAsync("DELETE FROM ft_relationships WHERE person1_id = ? OR person2_id = ?", [id, id]);
	await database.runAsync("DELETE FROM ft_persons WHERE id = ?", [id]);
}

export async function getPersonById(id: number): Promise<Person | null> {
	const database = await initDatabase();
	const result = await database.getFirstAsync<Person>("SELECT * FROM ft_persons WHERE id = ?", [id]);
	return result ?? null;
}

export async function getAllPersons(treeId: number): Promise<Person[]> {
	const database = await initDatabase();
	return database.getAllAsync<Person>(
		"SELECT * FROM ft_persons WHERE tree_id = ? ORDER BY first_name, last_name",
		[treeId],
	);
}

// ─── Relationship CRUD ────────────────────────────────────

export async function addRelationship(
	person1Id: number,
	person2Id: number,
	type: "parent-child" | "spouse",
): Promise<number> {
	const database = await initDatabase();

	// For spouse, check if either person already has a spouse
	if (type === "spouse") {
		const existingSpouse = await database.getFirstAsync<Relationship>(
			"SELECT * FROM ft_relationships WHERE (person1_id = ? OR person2_id = ? OR person1_id = ? OR person2_id = ?) AND relationship_type = 'spouse'",
			[person1Id, person1Id, person2Id, person2Id],
		);
		if (existingSpouse) {
			throw new Error("One of the persons already has a spouse relationship");
		}
	}

	// For parent-child, person1 = parent, person2 = child
	const result = await database.runAsync(
		"INSERT OR IGNORE INTO ft_relationships (person1_id, person2_id, relationship_type) VALUES (?, ?, ?)",
		[person1Id, person2Id, type],
	);
	return result.lastInsertRowId;
}

export async function removeRelationship(id: number): Promise<void> {
	const database = await initDatabase();
	await database.runAsync("DELETE FROM ft_relationships WHERE id = ?", [id]);
}

export async function getAllRelationships(treeId: number): Promise<Relationship[]> {
	const database = await initDatabase();
	return database.getAllAsync<Relationship>(
		"SELECT r.* FROM ft_relationships r INNER JOIN ft_persons p ON r.person1_id = p.id WHERE p.tree_id = ?",
		[treeId],
	);
}

// ─── Relationship Queries ─────────────────────────────────

export async function getSpouse(personId: number): Promise<Person | null> {
	const database = await initDatabase();
	const rel = await database.getFirstAsync<Relationship>(
		"SELECT * FROM ft_relationships WHERE (person1_id = ? OR person2_id = ?) AND relationship_type = 'spouse'",
		[personId, personId],
	);
	if (!rel) return null;
	const spouseId = rel.person1_id === personId ? rel.person2_id : rel.person1_id;
	return getPersonById(spouseId);
}

export async function getChildren(personId: number): Promise<Person[]> {
	const database = await initDatabase();
	return database.getAllAsync<Person>(
		"SELECT p.* FROM ft_persons p INNER JOIN ft_relationships r ON p.id = r.person2_id WHERE r.person1_id = ? AND r.relationship_type = 'parent-child' ORDER BY p.birth_date, p.first_name",
		[personId],
	);
}

export async function getParents(personId: number): Promise<Person[]> {
	const database = await initDatabase();
	return database.getAllAsync<Person>(
		"SELECT p.* FROM ft_persons p INNER JOIN ft_relationships r ON p.id = r.person1_id WHERE r.person2_id = ? AND r.relationship_type = 'parent-child' ORDER BY p.first_name",
		[personId],
	);
}

// ─── Relationships for a person (with details) ───────────

export type PersonRelationship = {
	relationshipId: number;
	person: Person;
	type: "parent" | "child" | "spouse";
};

export async function getPersonRelationships(personId: number): Promise<PersonRelationship[]> {
	const database = await initDatabase();
	const results: PersonRelationship[] = [];

	// Get parents (where this person is person2 in parent-child)
	const parentRels = await database.getAllAsync<Relationship & Person>(
		`SELECT r.id as rel_id, r.relationship_type, p.* FROM ft_relationships r
		 INNER JOIN ft_persons p ON p.id = r.person1_id
		 WHERE r.person2_id = ? AND r.relationship_type = 'parent-child'`,
		[personId],
	);
	for (const row of parentRels) {
		results.push({
			relationshipId: (row as any).rel_id,
			person: {
				id: row.id,
				tree_id: (row as any).tree_id,
				first_name: row.first_name,
				last_name: row.last_name,
				birth_date: row.birth_date,
				death_date: row.death_date,
				bio: row.bio,
				image_url: row.image_url,
				gender: row.gender,
				created_at: row.created_at,
			},
			type: "parent",
		});
	}

	// Get children (where this person is person1 in parent-child)
	const childRels = await database.getAllAsync<Relationship & Person>(
		`SELECT r.id as rel_id, r.relationship_type, p.* FROM ft_relationships r
		 INNER JOIN ft_persons p ON p.id = r.person2_id
		 WHERE r.person1_id = ? AND r.relationship_type = 'parent-child'`,
		[personId],
	);
	for (const row of childRels) {
		results.push({
			relationshipId: (row as any).rel_id,
			person: {
				id: row.id,
				tree_id: (row as any).tree_id,
				first_name: row.first_name,
				last_name: row.last_name,
				birth_date: row.birth_date,
				death_date: row.death_date,
				bio: row.bio,
				image_url: row.image_url,
				gender: row.gender,
				created_at: row.created_at,
			},
			type: "child",
		});
	}

	// Get spouse
	const spouseRels = await database.getAllAsync<Relationship & Person>(
		`SELECT r.id as rel_id, p.* FROM ft_relationships r
		 INNER JOIN ft_persons p ON (p.id = CASE WHEN r.person1_id = ? THEN r.person2_id ELSE r.person1_id END)
		 WHERE (r.person1_id = ? OR r.person2_id = ?) AND r.relationship_type = 'spouse'`,
		[personId, personId, personId],
	);
	for (const row of spouseRels) {
		results.push({
			relationshipId: (row as any).rel_id,
			person: {
				id: row.id,
				tree_id: (row as any).tree_id,
				first_name: row.first_name,
				last_name: row.last_name,
				birth_date: row.birth_date,
				death_date: row.death_date,
				bio: row.bio,
				image_url: row.image_url,
				gender: row.gender,
				created_at: row.created_at,
			},
			type: "spouse",
		});
	}

	return results;
}

// ─── Tree Data ────────────────────────────────────────────

export async function getTreeData(treeId: number): Promise<TreeData> {
	const [persons, relationships] = await Promise.all([getAllPersons(treeId), getAllRelationships(treeId)]);
	return { persons, relationships };
}

// ─── Clear All ────────────────────────────────────────────

export async function clearAllData(treeId: number): Promise<void> {
	const database = await initDatabase();
	await database.runAsync(
		"DELETE FROM ft_relationships WHERE person1_id IN (SELECT id FROM ft_persons WHERE tree_id = ?) OR person2_id IN (SELECT id FROM ft_persons WHERE tree_id = ?)",
		[treeId, treeId],
	);
	await database.runAsync("DELETE FROM ft_persons WHERE tree_id = ?", [treeId]);
}
