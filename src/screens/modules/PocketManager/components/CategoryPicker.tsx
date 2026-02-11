import React, { useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { GlobalCategory, ProjectCategory } from "../database";
import { Colors, spacing } from "../theme";
import CategoryChip from "./CategoryChip";

type CategoryPickerProps = {
	categories: (GlobalCategory | ProjectCategory)[];
	selectedId: number | null;
	onSelect: (id: number) => void;
	colors: Colors;
};

export default function CategoryPicker({ categories, selectedId, onSelect, colors }: CategoryPickerProps) {
	const styles = useStyles();

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.container}
			keyboardShouldPersistTaps="handled"
		>
			{categories.map((cat) => (
				<CategoryChip
					key={cat.id}
					icon={cat.icon}
					name={cat.name}
					color={cat.color}
					selected={selectedId === cat.id}
					onPress={() => onSelect(cat.id)}
					colors={colors}
				/>
			))}
		</ScrollView>
	);
}

function useStyles() {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					paddingVertical: spacing.xs,
				},
			}),
		[]
	);
}
