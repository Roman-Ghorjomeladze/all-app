import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CategoryWithCount } from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";

type Props = {
	category: CategoryWithCount;
	onPress: (category: CategoryWithCount) => void;
	onLongPress: (category: CategoryWithCount) => void;
};

export default function CategoryCard({ category, onPress, onLongPress }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const progress = category.task_count > 0 ? category.completed_count / category.task_count : 0;

	return (
		<TouchableOpacity
			style={styles.card}
			onPress={() => onPress(category)}
			onLongPress={() => onLongPress(category)}
			activeOpacity={0.7}
		>
			<View style={[styles.iconContainer, { backgroundColor: category.color + "20" }]}>
				<Text style={styles.icon}>{category.icon}</Text>
			</View>
			<View style={styles.info}>
				<Text style={styles.name} numberOfLines={1}>{category.name}</Text>
				<Text style={styles.count}>
					{t("tdTaskCount", { count: String(category.task_count) })}
				</Text>
				{category.task_count > 0 && (
					<View style={styles.progressBar}>
						<View
							style={[
								styles.progressFill,
								{
									width: `${Math.round(progress * 100)}%`,
									backgroundColor: category.color,
								},
							]}
						/>
					</View>
				)}
			</View>
			<Text style={styles.chevron}>{"\u203A"}</Text>
		</TouchableOpacity>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				card: {
					flexDirection: "row",
					alignItems: "center",
					backgroundColor: colors.cardBackground,
					padding: spacing.md,
					borderRadius: 16,
					marginBottom: spacing.sm,
					marginHorizontal: spacing.md,
					borderWidth: 0.5,
					borderColor: colors.border,
				},
				iconContainer: {
					width: 44,
					height: 44,
					borderRadius: 12,
					justifyContent: "center",
					alignItems: "center",
					marginRight: 12,
				},
				icon: {
					fontSize: 22,
				},
				info: {
					flex: 1,
				},
				name: {
					...typography.headline,
					color: colors.textPrimary,
					marginBottom: 2,
				},
				count: {
					...typography.caption1,
					color: colors.textSecondary,
					marginBottom: 4,
				},
				progressBar: {
					height: 3,
					backgroundColor: colors.chipBackground,
					borderRadius: 1.5,
					overflow: "hidden",
				},
				progressFill: {
					height: "100%",
					borderRadius: 1.5,
				},
				chevron: {
					fontSize: 24,
					color: colors.textSecondary,
					fontWeight: "300",
					marginLeft: spacing.sm,
				},
			}),
		[colors]
	);
}
