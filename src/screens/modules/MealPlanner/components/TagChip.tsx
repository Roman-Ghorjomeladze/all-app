import React from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { MealTag } from "../database";

type Props = {
	tag: MealTag;
	selected?: boolean;
	onPress?: (tag: MealTag) => void;
};

export default function TagChip({ tag, selected, onPress }: Props) {
	return (
		<TouchableOpacity
			style={[styles.chip, { backgroundColor: selected ? tag.color : tag.color + "20" }]}
			onPress={() => onPress?.(tag)}
			activeOpacity={0.7}
		>
			<Text style={styles.icon}>{tag.icon}</Text>
			<Text style={[styles.label, { color: selected ? "#FFFFFF" : tag.color }]}>{tag.name}</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	chip: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		gap: 4,
	},
	icon: {
		fontSize: 14,
	},
	label: {
		fontSize: 13,
		fontWeight: "600",
	},
});
