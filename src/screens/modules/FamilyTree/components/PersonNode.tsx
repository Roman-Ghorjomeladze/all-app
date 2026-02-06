import React from "react";
import { G, Rect, Text as SvgText, Circle, Line } from "react-native-svg";
import { LayoutNode } from "../utils/treeLayout";
import { useColors, nodeLayout } from "../theme";

type PersonNodeProps = {
	node: LayoutNode;
	onPress: (id: number) => void;
	onAddChild: (id: number) => void;
};

const { ADD_CHILD_SIZE } = nodeLayout;

export default function PersonNode({ node, onPress, onAddChild }: PersonNodeProps) {
	const colors = useColors();

	const genderBorderColor: Record<string, string> = {
		male: colors.male,
		female: colors.female,
		other: colors.other,
	};

	const { person, x, y, width, height } = node;
	const borderColor = genderBorderColor[person.gender] || colors.other;

	const fullName = person.first_name + (person.last_name ? ` ${person.last_name.charAt(0)}.` : "");
	const displayName = fullName.length > 14 ? fullName.substring(0, 13) + "\u2026" : fullName;

	// Birth year
	const birthYear = person.birth_date ? new Date(person.birth_date).getFullYear().toString() : "";
	const deathYear = person.death_date ? new Date(person.death_date).getFullYear().toString() : "";
	const yearText = birthYear
		? deathYear
			? `${birthYear}\u2013${deathYear}`
			: `b. ${birthYear}`
		: "";

	// Add child button position (bottom center of node)
	const addBtnX = x + width / 2;
	const addBtnY = y + height + 2;

	return (
		<G>
			{/* Node shadow */}
			<Rect
				x={x + 2}
				y={y + 2}
				width={width}
				height={height}
				rx={12}
				fill={colors.shadow}
				opacity={0.08}
			/>

			{/* Node background */}
			<Rect
				x={x}
				y={y}
				width={width}
				height={height}
				rx={12}
				fill={colors.nodeBackground}
				stroke={borderColor}
				strokeWidth={2.5}
				onPress={() => onPress(person.id)}
			/>

			{/* Gender indicator dot */}
			<Circle
				cx={x + 16}
				cy={y + 16}
				r={5}
				fill={borderColor}
			/>

			{/* Name text */}
			<SvgText
				x={x + width / 2}
				y={y + 36}
				textAnchor="middle"
				fontSize={13}
				fontWeight="600"
				fill={colors.textPrimary}
				onPress={() => onPress(person.id)}
			>
				{displayName}
			</SvgText>

			{/* Year text */}
			{yearText ? (
				<SvgText
					x={x + width / 2}
					y={y + 52}
					textAnchor="middle"
					fontSize={11}
					fill={colors.textSecondary}
				>
					{yearText}
				</SvgText>
			) : null}

			{/* Add child button */}
			<Circle
				cx={addBtnX}
				cy={addBtnY + ADD_CHILD_SIZE / 2}
				r={ADD_CHILD_SIZE / 2}
				fill={colors.accent}
				onPress={() => onAddChild(person.id)}
			/>
			{/* Plus sign on add button */}
			<Line
				x1={addBtnX - 5}
				y1={addBtnY + ADD_CHILD_SIZE / 2}
				x2={addBtnX + 5}
				y2={addBtnY + ADD_CHILD_SIZE / 2}
				stroke={colors.white}
				strokeWidth={2}
				strokeLinecap="round"
			/>
			<Line
				x1={addBtnX}
				y1={addBtnY + ADD_CHILD_SIZE / 2 - 5}
				x2={addBtnX}
				y2={addBtnY + ADD_CHILD_SIZE / 2 + 5}
				stroke={colors.white}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</G>
	);
}
