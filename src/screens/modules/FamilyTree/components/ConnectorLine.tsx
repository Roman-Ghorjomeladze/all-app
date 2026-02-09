import React from "react";
import { Line, Path } from "react-native-svg";
import { LayoutEdge, FamilyEdge } from "../utils/treeLayout";
import { useColors } from "../theme";

type ConnectorLineProps = {
	edge: LayoutEdge;
};

export default function ConnectorLine({ edge }: ConnectorLineProps) {
	const colors = useColors();

	// Horizontal dashed line between spouses
	return (
		<Line
			x1={edge.from.x}
			y1={edge.from.y}
			x2={edge.to.x}
			y2={edge.to.y}
			stroke={colors.spouse}
			strokeWidth={2}
			strokeDasharray="6,4"
			strokeLinecap="round"
		/>
	);
}

type FamilyConnectorProps = {
	edge: FamilyEdge;
};

/**
 * Draws a grouped family connector:
 * - Vertical line from parent bottom-center down to the horizontal rail
 * - Horizontal rail spanning from leftmost to rightmost child
 * - Vertical drops from the rail down to each child's top-center
 */
export function FamilyConnector({ edge }: FamilyConnectorProps) {
	const colors = useColors();

	const { parentPoint, railY, childPoints } = edge;

	// Build the SVG path
	let d = "";

	// 1. Vertical drop from parent to rail
	d += `M ${parentPoint.x} ${parentPoint.y} L ${parentPoint.x} ${railY} `;

	if (childPoints.length === 1) {
		// Single child: just continue straight down
		d += `L ${childPoints[0].x} ${railY} L ${childPoints[0].x} ${childPoints[0].y} `;
	} else {
		// Multiple children: draw horizontal rail + vertical drops
		// Sort child points by x
		const sorted = [...childPoints].sort((a, b) => a.x - b.x);
		const leftX = sorted[0].x;
		const rightX = sorted[sorted.length - 1].x;

		// Horizontal rail
		d += `M ${leftX} ${railY} L ${rightX} ${railY} `;

		// Vertical drops to each child
		for (const cp of sorted) {
			d += `M ${cp.x} ${railY} L ${cp.x} ${cp.y} `;
		}
	}

	return (
		<Path
			d={d}
			stroke={colors.parentChild}
			strokeWidth={2}
			fill="none"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	);
}
