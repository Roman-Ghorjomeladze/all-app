import { Person, Relationship } from "../database";
import { nodeLayout } from "../theme";

const { NODE_WIDTH, NODE_HEIGHT, H_GAP, V_GAP, SPOUSE_GAP, CANVAS_PADDING } = nodeLayout;

export type LayoutNode = {
	id: number;
	person: Person;
	x: number;
	y: number;
	width: number;
	height: number;
};

export type LayoutEdge = {
	id: string;
	from: { x: number; y: number };
	to: { x: number; y: number };
	type: "parent-child" | "spouse";
};

export type TreeLayout = {
	nodes: LayoutNode[];
	edges: LayoutEdge[];
	width: number;
	height: number;
};

type AdjacencyData = {
	childrenMap: Map<number, number[]>; // parentId → childIds
	parentMap: Map<number, number[]>; // childId → parentIds
	spouseMap: Map<number, number>; // personId → spouseId
};

function buildAdjacency(relationships: Relationship[]): AdjacencyData {
	const childrenMap = new Map<number, number[]>();
	const parentMap = new Map<number, number[]>();
	const spouseMap = new Map<number, number>();

	for (const rel of relationships) {
		if (rel.relationship_type === "parent-child") {
			// person1 = parent, person2 = child
			const children = childrenMap.get(rel.person1_id) || [];
			children.push(rel.person2_id);
			childrenMap.set(rel.person1_id, children);

			const parents = parentMap.get(rel.person2_id) || [];
			parents.push(rel.person1_id);
			parentMap.set(rel.person2_id, parents);
		} else if (rel.relationship_type === "spouse") {
			spouseMap.set(rel.person1_id, rel.person2_id);
			spouseMap.set(rel.person2_id, rel.person1_id);
		}
	}

	return { childrenMap, parentMap, spouseMap };
}

function findRoots(persons: Person[], adjacency: AdjacencyData): number[] {
	const roots: number[] = [];
	for (const person of persons) {
		const parents = adjacency.parentMap.get(person.id);
		if (!parents || parents.length === 0) {
			// Check if this person isn't just a spouse of someone with parents
			const spouseId = adjacency.spouseMap.get(person.id);
			if (spouseId !== undefined) {
				const spouseParents = adjacency.parentMap.get(spouseId);
				if (spouseParents && spouseParents.length > 0) {
					// Spouse has parents, so this person is part of a lower generation via marriage
					continue;
				}
			}
			roots.push(person.id);
		}
	}

	// If no roots found (all orphans or circular), just use all persons
	if (roots.length === 0 && persons.length > 0) {
		return persons.map((p) => p.id);
	}

	return roots;
}

type GenerationGroup = {
	generation: number;
	units: GenerationUnit[]; // Each unit is a person or couple
};

type GenerationUnit = {
	primaryId: number;
	spouseId?: number;
};

export function computeLayout(persons: Person[], relationships: Relationship[]): TreeLayout {
	if (persons.length === 0) {
		return { nodes: [], edges: [], width: 0, height: 0 };
	}

	const personMap = new Map<number, Person>();
	for (const p of persons) {
		personMap.set(p.id, p);
	}

	const adjacency = buildAdjacency(relationships);
	const roots = findRoots(persons, adjacency);

	// Assign generations via BFS
	const generationOf = new Map<number, number>();
	const visited = new Set<number>();
	const queue: { id: number; gen: number }[] = [];

	// Deduplicate roots – remove spouses of roots from root list
	const rootSet = new Set(roots);
	for (const rootId of roots) {
		const spouseId = adjacency.spouseMap.get(rootId);
		if (spouseId !== undefined && rootSet.has(spouseId)) {
			rootSet.delete(spouseId);
		}
	}

	for (const rootId of rootSet) {
		if (!visited.has(rootId)) {
			queue.push({ id: rootId, gen: 0 });
			visited.add(rootId);

			// Also enqueue spouse at same generation
			const spouseId = adjacency.spouseMap.get(rootId);
			if (spouseId !== undefined && !visited.has(spouseId)) {
				queue.push({ id: spouseId, gen: 0 });
				visited.add(spouseId);
			}
		}
	}

	while (queue.length > 0) {
		const { id, gen } = queue.shift()!;
		generationOf.set(id, gen);

		// Process children
		const children = adjacency.childrenMap.get(id) || [];
		for (const childId of children) {
			if (!visited.has(childId)) {
				visited.add(childId);
				queue.push({ id: childId, gen: gen + 1 });

				// Spouse of child shares generation
				const childSpouse = adjacency.spouseMap.get(childId);
				if (childSpouse !== undefined && !visited.has(childSpouse)) {
					visited.add(childSpouse);
					queue.push({ id: childSpouse, gen: gen + 1 });
				}
			}
		}
	}

	// Handle any unvisited persons (disconnected nodes)
	for (const person of persons) {
		if (!visited.has(person.id)) {
			generationOf.set(person.id, 0);
			visited.add(person.id);
		}
	}

	// Group by generation → units (person or couple)
	const genGroups = new Map<number, GenerationUnit[]>();
	const processedInUnit = new Set<number>();

	// Sort persons by generation for consistent ordering
	const sortedPersons = [...persons].sort((a, b) => {
		const ga = generationOf.get(a.id) ?? 0;
		const gb = generationOf.get(b.id) ?? 0;
		if (ga !== gb) return ga - gb;
		return a.id - b.id;
	});

	for (const person of sortedPersons) {
		if (processedInUnit.has(person.id)) continue;

		const gen = generationOf.get(person.id) ?? 0;
		const units = genGroups.get(gen) || [];

		const spouseId = adjacency.spouseMap.get(person.id);
		if (spouseId !== undefined && generationOf.get(spouseId) === gen) {
			units.push({ primaryId: person.id, spouseId });
			processedInUnit.add(person.id);
			processedInUnit.add(spouseId);
		} else {
			units.push({ primaryId: person.id });
			processedInUnit.add(person.id);
		}

		genGroups.set(gen, units);
	}

	// Position nodes
	const positions = new Map<number, { x: number; y: number }>();
	const generations = [...genGroups.keys()].sort((a, b) => a - b);

	// First pass: position each generation row left-to-right
	for (const gen of generations) {
		const units = genGroups.get(gen)!;
		let xOffset = CANVAS_PADDING;
		const y = CANVAS_PADDING + gen * (NODE_HEIGHT + V_GAP);

		for (const unit of units) {
			positions.set(unit.primaryId, { x: xOffset, y });

			if (unit.spouseId !== undefined) {
				xOffset += NODE_WIDTH + SPOUSE_GAP;
				positions.set(unit.spouseId, { x: xOffset, y });
			}

			xOffset += NODE_WIDTH + H_GAP;
		}
	}

	// Second pass: center parents above their children (2 iterations)
	for (let iteration = 0; iteration < 2; iteration++) {
		for (const gen of generations) {
			const units = genGroups.get(gen)!;

			for (const unit of units) {
				// Get all children of this unit
				const allChildIds: number[] = [];
				const primaryChildren = adjacency.childrenMap.get(unit.primaryId) || [];
				allChildIds.push(...primaryChildren);
				if (unit.spouseId !== undefined) {
					const spouseChildren = adjacency.childrenMap.get(unit.spouseId) || [];
					for (const cid of spouseChildren) {
						if (!allChildIds.includes(cid)) {
							allChildIds.push(cid);
						}
					}
				}

				if (allChildIds.length === 0) continue;

				// Find the x-range of children
				let minChildX = Infinity;
				let maxChildX = -Infinity;
				for (const childId of allChildIds) {
					const childPos = positions.get(childId);
					if (childPos) {
						minChildX = Math.min(minChildX, childPos.x);
						maxChildX = Math.max(maxChildX, childPos.x + NODE_WIDTH);
					}
				}

				if (minChildX === Infinity) continue;

				const childrenCenter = (minChildX + maxChildX) / 2;

				if (unit.spouseId !== undefined) {
					// Center the couple above children
					const coupleWidth = NODE_WIDTH * 2 + SPOUSE_GAP;
					const coupleStartX = childrenCenter - coupleWidth / 2;
					positions.set(unit.primaryId, {
						x: coupleStartX,
						y: positions.get(unit.primaryId)!.y,
					});
					positions.set(unit.spouseId, {
						x: coupleStartX + NODE_WIDTH + SPOUSE_GAP,
						y: positions.get(unit.spouseId)!.y,
					});
				} else {
					// Center single parent above children
					const parentX = childrenCenter - NODE_WIDTH / 2;
					positions.set(unit.primaryId, {
						x: parentX,
						y: positions.get(unit.primaryId)!.y,
					});
				}
			}
		}

		// Resolve overlaps within each generation after centering
		for (const gen of generations) {
			const units = genGroups.get(gen)!;
			const sortedUnits = [...units].sort((a, b) => {
				const ax = positions.get(a.primaryId)?.x ?? 0;
				const bx = positions.get(b.primaryId)?.x ?? 0;
				return ax - bx;
			});

			for (let i = 1; i < sortedUnits.length; i++) {
				const prev = sortedUnits[i - 1];
				const curr = sortedUnits[i];

				const prevEndX =
					prev.spouseId !== undefined
						? (positions.get(prev.spouseId)?.x ?? 0) + NODE_WIDTH
						: (positions.get(prev.primaryId)?.x ?? 0) + NODE_WIDTH;

				const currStartX = positions.get(curr.primaryId)?.x ?? 0;

				if (currStartX < prevEndX + H_GAP) {
					const shift = prevEndX + H_GAP - currStartX;
					// Shift current unit and all subsequent units
					for (let j = i; j < sortedUnits.length; j++) {
						const u = sortedUnits[j];
						const pos = positions.get(u.primaryId)!;
						positions.set(u.primaryId, { x: pos.x + shift, y: pos.y });
						if (u.spouseId !== undefined) {
							const spos = positions.get(u.spouseId)!;
							positions.set(u.spouseId, { x: spos.x + shift, y: spos.y });
						}
					}
				}
			}
		}
	}

	// Ensure no negative positions
	let minX = Infinity;
	for (const pos of positions.values()) {
		minX = Math.min(minX, pos.x);
	}
	if (minX < CANVAS_PADDING) {
		const shiftX = CANVAS_PADDING - minX;
		for (const [id, pos] of positions) {
			positions.set(id, { x: pos.x + shiftX, y: pos.y });
		}
	}

	// Build layout nodes
	const nodes: LayoutNode[] = [];
	for (const person of persons) {
		const pos = positions.get(person.id);
		if (pos) {
			nodes.push({
				id: person.id,
				person,
				x: pos.x,
				y: pos.y,
				width: NODE_WIDTH,
				height: NODE_HEIGHT,
			});
		}
	}

	// Build edges
	const edges: LayoutEdge[] = [];

	for (const rel of relationships) {
		const pos1 = positions.get(rel.person1_id);
		const pos2 = positions.get(rel.person2_id);
		if (!pos1 || !pos2) continue;

		if (rel.relationship_type === "parent-child") {
			// Parent bottom center → child top center
			const fromX = pos1.x + NODE_WIDTH / 2;
			const fromY = pos1.y + NODE_HEIGHT;
			const toX = pos2.x + NODE_WIDTH / 2;
			const toY = pos2.y;

			edges.push({
				id: `pc-${rel.id}`,
				from: { x: fromX, y: fromY },
				to: { x: toX, y: toY },
				type: "parent-child",
			});
		} else if (rel.relationship_type === "spouse") {
			// Horizontal line between spouse nodes
			const leftPerson = pos1.x < pos2.x ? pos1 : pos2;
			const rightPerson = pos1.x < pos2.x ? pos2 : pos1;

			edges.push({
				id: `sp-${rel.id}`,
				from: { x: leftPerson.x + NODE_WIDTH, y: leftPerson.y + NODE_HEIGHT / 2 },
				to: { x: rightPerson.x, y: rightPerson.y + NODE_HEIGHT / 2 },
				type: "spouse",
			});
		}
	}

	// Calculate total canvas size
	let maxX = 0;
	let maxY = 0;
	for (const node of nodes) {
		maxX = Math.max(maxX, node.x + node.width);
		maxY = Math.max(maxY, node.y + node.height);
	}

	return {
		nodes,
		edges,
		width: maxX + CANVAS_PADDING,
		height: maxY + CANVAS_PADDING,
	};
}
