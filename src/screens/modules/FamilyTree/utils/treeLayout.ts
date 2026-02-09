import { Person, Relationship } from "../database";
import { nodeLayout } from "../theme";

const { NODE_WIDTH, NODE_HEIGHT, H_GAP, V_GAP, SPOUSE_GAP, CANVAS_PADDING } = nodeLayout;

// Extra gap between sibling groups from different parents
const FAMILY_GAP = 80;

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

// Family group edge: parent drops to a horizontal rail, children hang from it
export type FamilyEdge = {
	id: string;
	parentPoint: { x: number; y: number }; // bottom-center of parent (or couple midpoint)
	railY: number; // y of horizontal rail
	childPoints: { x: number; y: number }[]; // top-center of each child
	siblingIndex: number; // index among sibling families (0, 1, 2...) — for visual stagger
};

export type TreeLayout = {
	nodes: LayoutNode[];
	edges: LayoutEdge[]; // spouse edges only now
	familyEdges: FamilyEdge[]; // grouped parent-child connectors
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
			const spouseId = adjacency.spouseMap.get(person.id);
			if (spouseId !== undefined) {
				const spouseParents = adjacency.parentMap.get(spouseId);
				if (spouseParents && spouseParents.length > 0) {
					continue;
				}
			}
			roots.push(person.id);
		}
	}

	if (roots.length === 0 && persons.length > 0) {
		return persons.map((p) => p.id);
	}

	return roots;
}

type GenerationUnit = {
	primaryId: number;
	spouseId?: number;
};

/**
 * Get the unified set of children for a unit (person or couple).
 * Deduplicates children that appear under both parents.
 */
function getUnitChildren(unit: GenerationUnit, adjacency: AdjacencyData): number[] {
	const allChildIds: number[] = [];
	const seen = new Set<number>();
	const primaryChildren = adjacency.childrenMap.get(unit.primaryId) || [];
	for (const cid of primaryChildren) {
		if (!seen.has(cid)) {
			seen.add(cid);
			allChildIds.push(cid);
		}
	}
	if (unit.spouseId !== undefined) {
		const spouseChildren = adjacency.childrenMap.get(unit.spouseId) || [];
		for (const cid of spouseChildren) {
			if (!seen.has(cid)) {
				seen.add(cid);
				allChildIds.push(cid);
			}
		}
	}
	return allChildIds;
}

export function computeLayout(persons: Person[], relationships: Relationship[]): TreeLayout {
	if (persons.length === 0) {
		return { nodes: [], edges: [], familyEdges: [], width: 0, height: 0 };
	}

	const personMap = new Map<number, Person>();
	for (const p of persons) {
		personMap.set(p.id, p);
	}

	const adjacency = buildAdjacency(relationships);
	const roots = findRoots(persons, adjacency);

	// ── Assign generations via BFS ──
	const generationOf = new Map<number, number>();
	const visited = new Set<number>();
	const queue: { id: number; gen: number }[] = [];

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

		const children = adjacency.childrenMap.get(id) || [];
		for (const childId of children) {
			if (!visited.has(childId)) {
				visited.add(childId);
				queue.push({ id: childId, gen: gen + 1 });

				const childSpouse = adjacency.spouseMap.get(childId);
				if (childSpouse !== undefined && !visited.has(childSpouse)) {
					visited.add(childSpouse);
					queue.push({ id: childSpouse, gen: gen + 1 });
				}
			}
		}
	}

	for (const person of persons) {
		if (!visited.has(person.id)) {
			generationOf.set(person.id, 0);
			visited.add(person.id);
		}
	}

	// ── Group by generation → units (person or couple) ──
	// Use a recursive DFS ordering: for each unit, first place its children
	// (in order), which ensures siblings from the same parent are adjacent
	// and the child order matches the parent's left-to-right order.

	const genGroups = new Map<number, GenerationUnit[]>();
	const processedInUnit = new Set<number>();

	function getOrCreateGenUnits(gen: number): GenerationUnit[] {
		let units = genGroups.get(gen);
		if (!units) {
			units = [];
			genGroups.set(gen, units);
		}
		return units;
	}

	/**
	 * Recursively place a unit and all its descendants in DFS order.
	 * This ensures that at every generation level, children of the same
	 * parent are adjacent, and the order follows the tree structure.
	 */
	function placeUnitAndDescendants(personId: number) {
		if (processedInUnit.has(personId)) return;

		const gen = generationOf.get(personId) ?? 0;
		const units = getOrCreateGenUnits(gen);

		const spouseId = adjacency.spouseMap.get(personId);
		let unit: GenerationUnit;
		if (spouseId !== undefined && generationOf.get(spouseId) === gen && !processedInUnit.has(spouseId)) {
			unit = { primaryId: personId, spouseId };
			processedInUnit.add(personId);
			processedInUnit.add(spouseId);
		} else {
			unit = { primaryId: personId };
			processedInUnit.add(personId);
		}

		units.push(unit);

		// Now recursively place children
		const childIds = getUnitChildren(unit, adjacency);
		for (const childId of childIds) {
			if (!processedInUnit.has(childId)) {
				placeUnitAndDescendants(childId);
			}
		}
	}

	// Start DFS from roots (sorted by id for determinism)
	const sortedRoots = [...rootSet].sort((a, b) => a - b);
	for (const rootId of sortedRoots) {
		placeUnitAndDescendants(rootId);
	}

	// Handle any remaining unprocessed persons (disconnected)
	const allByGen = [...persons].sort((a, b) => {
		const ga = generationOf.get(a.id) ?? 0;
		const gb = generationOf.get(b.id) ?? 0;
		return ga !== gb ? ga - gb : a.id - b.id;
	});
	for (const person of allByGen) {
		if (!processedInUnit.has(person.id)) {
			placeUnitAndDescendants(person.id);
		}
	}

	// ── Position nodes using recursive subtree layout ──
	// Each unit is treated as a subtree: we compute the subtree width
	// bottom-up, then position children left-to-right within the
	// parent's allocated space, and center the parent above them.
	const positions = new Map<number, { x: number; y: number }>();
	const generations = [...genGroups.keys()].sort((a, b) => a - b);

	// Build unit lookup by person id
	const unitOfPerson = new Map<number, GenerationUnit>();
	for (const gen of generations) {
		const units = genGroups.get(gen)!;
		for (const unit of units) {
			unitOfPerson.set(unit.primaryId, unit);
			if (unit.spouseId !== undefined) {
				unitOfPerson.set(unit.spouseId, unit);
			}
		}
	}

	/** Width of just the unit node(s), without children. */
	function unitWidth(unit: GenerationUnit): number {
		return unit.spouseId !== undefined
			? NODE_WIDTH * 2 + SPOUSE_GAP
			: NODE_WIDTH;
	}

	/** Cache for subtree widths. Key = "primaryId" */
	const subtreeWidthCache = new Map<number, number>();

	/**
	 * Compute the total width needed by a unit's subtree.
	 * = max(unit's own node width, total width of child subtrees + gaps)
	 */
	function subtreeWidth(unit: GenerationUnit): number {
		const cached = subtreeWidthCache.get(unit.primaryId);
		if (cached !== undefined) return cached;

		const selfW = unitWidth(unit);
		const childIds = getUnitChildren(unit, adjacency);

		if (childIds.length === 0) {
			subtreeWidthCache.set(unit.primaryId, selfW);
			return selfW;
		}

		// Sum of child subtree widths + gaps between them
		let childrenTotalWidth = 0;
		for (let i = 0; i < childIds.length; i++) {
			const childUnit = unitOfPerson.get(childIds[i]);
			if (!childUnit) {
				childrenTotalWidth += NODE_WIDTH;
			} else {
				childrenTotalWidth += subtreeWidth(childUnit);
			}
			if (i < childIds.length - 1) {
				childrenTotalWidth += H_GAP;
			}
		}

		const w = Math.max(selfW, childrenTotalWidth);
		subtreeWidthCache.set(unit.primaryId, w);
		return w;
	}

	/**
	 * Recursively position a unit and all descendants.
	 * The unit's subtree is allocated the horizontal band [left, left + allocatedWidth].
	 * The unit is centered within that band.
	 * Children are positioned left-to-right within the band, each getting
	 * their own subtree width as allocation.
	 */
	function positionSubtree(unit: GenerationUnit, left: number, gen: number) {
		const y = CANVAS_PADDING + gen * (NODE_HEIGHT + V_GAP);
		const allocated = subtreeWidth(unit);
		const selfW = unitWidth(unit);
		const childIds = getUnitChildren(unit, adjacency);

		if (childIds.length === 0) {
			// Leaf unit: center within allocated space
			const startX = left + (allocated - selfW) / 2;
			positions.set(unit.primaryId, { x: startX, y });
			if (unit.spouseId !== undefined) {
				positions.set(unit.spouseId, { x: startX + NODE_WIDTH + SPOUSE_GAP, y });
			}
			return;
		}

		// Compute total children width
		let childrenTotalWidth = 0;
		const childAllocations: { unit: GenerationUnit; width: number }[] = [];
		for (let i = 0; i < childIds.length; i++) {
			const childUnit = unitOfPerson.get(childIds[i]);
			const cw = childUnit ? subtreeWidth(childUnit) : NODE_WIDTH;
			childAllocations.push({ unit: childUnit ?? { primaryId: childIds[i] }, width: cw });
			childrenTotalWidth += cw;
			if (i < childIds.length - 1) {
				childrenTotalWidth += H_GAP;
			}
		}

		// Center the children block within the allocated space
		const childrenStartX = left + (allocated - childrenTotalWidth) / 2;

		// Position each child subtree
		let cx = childrenStartX;
		for (const ca of childAllocations) {
			const childGen = generationOf.get(ca.unit.primaryId) ?? gen + 1;
			positionSubtree(ca.unit, cx, childGen);
			cx += ca.width + H_GAP;
		}

		// Center parent above children span
		// Find actual leftmost and rightmost child positions
		let minChildX = Infinity;
		let maxChildX = -Infinity;
		for (const childId of childIds) {
			const cp = positions.get(childId);
			if (cp) {
				minChildX = Math.min(minChildX, cp.x);
				const childSpouse = adjacency.spouseMap.get(childId);
				const csp = childSpouse ? positions.get(childSpouse) : undefined;
				if (csp) {
					maxChildX = Math.max(maxChildX, csp.x + NODE_WIDTH);
				} else {
					maxChildX = Math.max(maxChildX, cp.x + NODE_WIDTH);
				}
			}
		}

		const childrenCenter = (minChildX + maxChildX) / 2;
		const parentStartX = childrenCenter - selfW / 2;

		positions.set(unit.primaryId, { x: parentStartX, y });
		if (unit.spouseId !== undefined) {
			positions.set(unit.spouseId, { x: parentStartX + NODE_WIDTH + SPOUSE_GAP, y });
		}
	}

	// Find root-level units (generation 0) and position each tree
	const rootUnits = genGroups.get(generations[0]) || [];
	let globalX = CANVAS_PADDING;

	for (let i = 0; i < rootUnits.length; i++) {
		const rootUnit = rootUnits[i];
		const rootGen = generations[0];
		positionSubtree(rootUnit, globalX, rootGen);
		globalX += subtreeWidth(rootUnit) + FAMILY_GAP;
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

	// ── Build layout nodes ──
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

	// ── Build spouse edges ──
	const edges: LayoutEdge[] = [];
	for (const rel of relationships) {
		const pos1 = positions.get(rel.person1_id);
		const pos2 = positions.get(rel.person2_id);
		if (!pos1 || !pos2) continue;

		if (rel.relationship_type === "spouse") {
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

	// ── Build family edges: grouped parent-to-children connectors ──
	// Each parent unit gets its own separate rail and child drops.
	// Adjacent sibling families get staggered rail Y positions so their
	// horizontal rails don't merge into one visual line.
	const familyEdges: FamilyEdge[] = [];
	const processedFamilies = new Set<string>();

	for (const gen of generations) {
		const units = genGroups.get(gen)!;
		let siblingIdx = 0;
		for (const unit of units) {
			const allChildIds = getUnitChildren(unit, adjacency);
			if (allChildIds.length === 0) continue;

			const familyKey = unit.spouseId
				? `fam-${Math.min(unit.primaryId, unit.spouseId)}-${Math.max(unit.primaryId, unit.spouseId)}`
				: `fam-${unit.primaryId}`;
			if (processedFamilies.has(familyKey)) continue;
			processedFamilies.add(familyKey);

			const primaryPos = positions.get(unit.primaryId)!;
			let parentX: number;
			if (unit.spouseId !== undefined) {
				const spousePos = positions.get(unit.spouseId)!;
				parentX = (primaryPos.x + spousePos.x + NODE_WIDTH) / 2;
			} else {
				parentX = primaryPos.x + NODE_WIDTH / 2;
			}
			const parentY = primaryPos.y + NODE_HEIGHT;

			// Collect child attachment points
			const childPoints: { x: number; y: number }[] = [];
			for (const childId of allChildIds) {
				const childPos = positions.get(childId);
				if (childPos) {
					childPoints.push({
						x: childPos.x + NODE_WIDTH / 2,
						y: childPos.y,
					});
				}
			}

			if (childPoints.length === 0) continue;

			// Rail Y: midpoint between parent bottom and first child top,
			// staggered by ±10px for even/odd sibling families so adjacent
			// rails don't merge into one visual line.
			const baseMidY = parentY + (childPoints[0].y - parentY) / 2;
			const stagger = siblingIdx % 2 === 0 ? -8 : 8;
			const railY = baseMidY + stagger;

			familyEdges.push({
				id: familyKey,
				parentPoint: { x: parentX, y: parentY },
				railY,
				childPoints,
				siblingIndex: siblingIdx,
			});
			siblingIdx++;
		}
	}

	// ── Calculate total canvas size ──
	let maxX = 0;
	let maxY = 0;
	for (const node of nodes) {
		maxX = Math.max(maxX, node.x + node.width);
		maxY = Math.max(maxY, node.y + node.height);
	}

	return {
		nodes,
		edges,
		familyEdges,
		width: maxX + CANVAS_PADDING,
		height: maxY + CANVAS_PADDING,
	};
}
