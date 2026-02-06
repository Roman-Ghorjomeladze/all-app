import React from "react";
import { Line, Path } from "react-native-svg";
import { LayoutEdge } from "../utils/treeLayout";
import { useColors } from "../theme";

type ConnectorLineProps = {
	edge: LayoutEdge;
};

export default function ConnectorLine({ edge }: ConnectorLineProps) {
	const colors = useColors();

	if (edge.type === "spouse") {
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

	// Parent-child: vertical connector with right-angle path
	// From parent bottom center -> down to midpoint -> horizontal to child -> down to child top
	const midY = edge.from.y + (edge.to.y - edge.from.y) / 2;

	const pathData =
		edge.from.x === edge.to.x
			? // Straight vertical line if aligned
				`M ${edge.from.x} ${edge.from.y} L ${edge.to.x} ${edge.to.y}`
			: // Right-angle connector
				`M ${edge.from.x} ${edge.from.y} L ${edge.from.x} ${midY} L ${edge.to.x} ${midY} L ${edge.to.x} ${edge.to.y}`;

	return (
		<Path
			d={pathData}
			stroke={colors.parentChild}
			strokeWidth={2}
			fill="none"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	);
}
