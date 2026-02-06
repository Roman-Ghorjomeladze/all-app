import React, { useMemo } from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Tag } from "../database";
import { useColors, Colors, spacing } from "../theme";
import { useLanguage } from "../i18n";

type Props = {
	tags: Tag[];
	selectedTagId: number | null;
	onSelect: (tagId: number | null) => void;
};

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		scrollView: {
			flexGrow: 0,
		},
		container: {
			paddingHorizontal: spacing.md,
			paddingVertical: spacing.sm,
			gap: spacing.sm,
			alignItems: "center",
		},
		chip: {
			paddingHorizontal: 14,
			paddingVertical: 8,
			borderRadius: 20,
			backgroundColor: colors.chipBackground,
		},
		chipActive: {
			backgroundColor: colors.chipActive,
		},
		chipText: {
			fontSize: 13,
			fontWeight: "600",
			color: colors.textSecondary,
		},
		chipTextActive: {
			color: colors.chipActiveText,
		},
	}), [colors]);
}

export default function TagFilter({ tags, selectedTagId, onSelect }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	if (tags.length === 0) return null;

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.container}
			style={styles.scrollView}
		>
			<TouchableOpacity
				style={[styles.chip, selectedTagId === null && styles.chipActive]}
				onPress={() => onSelect(null)}
				activeOpacity={0.7}
			>
				<Text style={[styles.chipText, selectedTagId === null && styles.chipTextActive]}>
					{t("llAllTags")}
				</Text>
			</TouchableOpacity>

			{tags.map((tag) => {
				const isActive = selectedTagId === tag.id;
				return (
					<TouchableOpacity
						key={tag.id}
						style={[
							styles.chip,
							isActive && { backgroundColor: tag.color },
						]}
						onPress={() => onSelect(tag.id)}
						activeOpacity={0.7}
					>
						<Text style={[styles.chipText, isActive && styles.chipTextActive]}>
							{tag.name}
						</Text>
					</TouchableOpacity>
				);
			})}
		</ScrollView>
	);
}
