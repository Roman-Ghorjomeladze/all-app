import React, { useMemo } from "react";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ProjectWithStats } from "../database";
import { Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";

type ProjectPickerProps = {
	projects: ProjectWithStats[];
	selectedId: number | null;
	onSelect: (id: number | null) => void;
	colors: Colors;
};

export default function ProjectPicker({ projects, selectedId, onSelect, colors }: ProjectPickerProps) {
	const styles = useStyles(colors);
	const { t } = useLanguage();

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.container}
			keyboardShouldPersistTaps="handled"
		>
			<TouchableOpacity
				style={[styles.chip, selectedId === null && styles.chipSelected]}
				onPress={() => onSelect(null)}
				activeOpacity={0.7}
			>
				<Text style={[styles.chipText, selectedId === null && styles.chipTextSelected]}>
					{t("pmNoProject")}
				</Text>
			</TouchableOpacity>
			{projects.map((project) => (
				<TouchableOpacity
					key={project.id}
					style={[styles.chip, selectedId === project.id && styles.chipSelected]}
					onPress={() => onSelect(project.id)}
					activeOpacity={0.7}
				>
					<Text
						style={[styles.chipText, selectedId === project.id && styles.chipTextSelected]}
						numberOfLines={1}
					>
						{project.name}
					</Text>
				</TouchableOpacity>
			))}
		</ScrollView>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					paddingVertical: spacing.xs,
				},
				chip: {
					paddingHorizontal: spacing.md,
					paddingVertical: spacing.sm,
					borderRadius: 20,
					backgroundColor: colors.chipBackground,
					borderWidth: 1.5,
					borderColor: "transparent",
					marginRight: spacing.sm,
				},
				chipSelected: {
					backgroundColor: colors.accent + "25",
					borderColor: colors.accent,
				},
				chipText: {
					...typography.subhead,
					color: colors.textSecondary,
					maxWidth: 120,
				},
				chipTextSelected: {
					color: colors.accent,
					fontWeight: "600",
				},
			}),
		[colors]
	);
}
