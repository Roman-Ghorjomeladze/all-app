import React, { useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { MealTag } from "../database";
import TagChip from "./TagChip";
import { spacing } from "../theme";

type Props = {
	tags: MealTag[];
	selectedIds: number[];
	onToggle: (tagId: number) => void;
};

export default function TagSelector({ tags, selectedIds, onToggle }: Props) {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.container}
			style={{ flexGrow: 0 }}
		>
			{tags.map((tag) => (
				<TagChip
					key={tag.id}
					tag={tag}
					selected={selectedIds.includes(tag.id)}
					onPress={() => onToggle(tag.id)}
				/>
			))}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		gap: spacing.sm,
		paddingVertical: spacing.xs,
	},
});
