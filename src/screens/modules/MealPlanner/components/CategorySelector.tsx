import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Category } from "../database";
import { Colors, spacing, typography } from "../theme";

type Props = {
	categories: Category[];
	selectedIds: number[];
	onToggle: (categoryId: number) => void;
	colors: Colors;
};

export default function CategorySelector({ categories, selectedIds, onToggle, colors }: Props) {
	const styles = useStyles(colors);

	if (categories.length === 0) return null;

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.container}
			style={{ flexGrow: 0 }}
		>
			{categories.map((cat) => {
				const isSelected = selectedIds.includes(cat.id);
				return (
					<TouchableOpacity
						key={cat.id}
						style={[styles.chip, { backgroundColor: isSelected ? cat.color : cat.color + "20" }]}
						onPress={() => onToggle(cat.id)}
						activeOpacity={0.7}
					>
						<Text style={styles.chipIcon}>{cat.icon}</Text>
						<Text style={[styles.chipLabel, { color: isSelected ? "#FFFFFF" : cat.color }]}>
							{cat.name}
						</Text>
					</TouchableOpacity>
				);
			})}
		</ScrollView>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					gap: spacing.sm,
					paddingVertical: spacing.xs,
				},
				chip: {
					flexDirection: "row",
					alignItems: "center",
					paddingHorizontal: 12,
					paddingVertical: 6,
					borderRadius: 16,
					gap: 4,
				},
				chipIcon: {
					fontSize: 14,
				},
				chipLabel: {
					fontSize: 13,
					fontWeight: "600",
				},
			}),
		[colors]
	);
}
