import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ProjectWithStats } from "../database";
import { Colors, spacing, typography } from "../theme";
import BudgetBar from "./BudgetBar";
import { useLanguage } from "../../../../i18n";

type ProjectCardProps = {
	project: ProjectWithStats;
	onPress: (project: ProjectWithStats) => void;
	colors: Colors;
};

export default function ProjectCard({ project, onPress, colors }: ProjectCardProps) {
	const styles = useStyles(colors);
	const { t } = useLanguage();

	return (
		<TouchableOpacity style={styles.card} onPress={() => onPress(project)} activeOpacity={0.7}>
			<Text style={styles.name} numberOfLines={1}>{project.name}</Text>
			{project.budget != null && (
				<View style={styles.budgetSection}>
					<BudgetBar spent={project.total_spent} budget={project.budget} colors={colors} />
				</View>
			)}
			<View style={styles.statsRow}>
				<Text style={styles.stat}>
					{t("pmSpent")}: {project.total_spent.toFixed(2)}
				</Text>
				<Text style={styles.stat}>
					{project.category_count} {project.category_count === 1 ? "category" : "categories"}
				</Text>
			</View>
		</TouchableOpacity>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				card: {
					backgroundColor: colors.cardBackground,
					borderRadius: 12,
					padding: spacing.md,
					marginBottom: spacing.sm,
					shadowColor: colors.shadow,
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.08,
					shadowRadius: 4,
					elevation: 2,
				},
				name: {
					...typography.headline,
					color: colors.textPrimary,
					marginBottom: spacing.sm,
				},
				budgetSection: {
					marginBottom: spacing.sm,
				},
				statsRow: {
					flexDirection: "row",
					justifyContent: "space-between",
				},
				stat: {
					...typography.footnote,
					color: colors.textSecondary,
				},
			}),
		[colors]
	);
}
