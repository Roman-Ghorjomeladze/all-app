import React from "react";
import { View } from "react-native";
import { Priority } from "../database";
import { useColors, Colors } from "../theme";

const PRIORITY_COLOR_MAP: Record<Priority, keyof Colors> = {
	high: "priorityHigh",
	medium: "priorityMedium",
	low: "priorityLow",
	none: "priorityNone",
};

type Props = {
	priority: Priority;
	size?: number;
};

export default function PriorityIndicator({ priority, size = 10 }: Props) {
	const colors = useColors();
	if (priority === "none") return null;
	const color = colors[PRIORITY_COLOR_MAP[priority]];
	return (
		<View
			style={{
				width: size,
				height: size,
				borderRadius: size / 2,
				backgroundColor: color,
			}}
		/>
	);
}
