import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { typography } from "../theme";

type Props = {
	name: string;
	color: string;
};

export default function CategoryChip({ name, color }: Props) {
	return (
		<View style={[styles.chip, { backgroundColor: color + "18", borderColor: color + "40" }]}>
			<View style={[styles.dot, { backgroundColor: color }]} />
			<Text style={[styles.label, { color }]} numberOfLines={1}>{name}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	chip: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 10,
		borderWidth: 1,
		alignSelf: "flex-start",
	},
	dot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		marginRight: 4,
	},
	label: {
		...typography.caption2,
		fontWeight: "500",
		maxWidth: 80,
	},
});
