import React, { useMemo } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MealPlanEntryWithRecipe } from "../database";
import { Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";

type Props = {
	mealType: string;
	entries: MealPlanEntryWithRecipe[];
	onAddPress: () => void;
	onRemoveEntry: (id: number) => void;
	colors: Colors;
};

const MEAL_TYPE_ICONS: Record<string, string> = {
	breakfast: "\u{1F373}",
	lunch: "\u{1F96A}",
	dinner: "\u{1F35D}",
	snack: "\u{1F36A}",
};

export default function MealSlot({ mealType, entries, onAddPress, onRemoveEntry, colors }: Props) {
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const icon = MEAL_TYPE_ICONS[mealType] || "\u{1F37D}\u{FE0F}";
	const labelKey = `mp${mealType.charAt(0).toUpperCase() + mealType.slice(1)}` as string;

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.icon}>{icon}</Text>
				<Text style={styles.label}>{t(labelKey)}</Text>
			</View>

			{entries.map((entry) => (
				<View key={entry.id} style={styles.entryRow}>
					{entry.recipe_image_url ? (
						<Image source={{ uri: entry.recipe_image_url }} style={styles.thumb} />
					) : (
						<View style={[styles.thumb, styles.thumbPlaceholder]}>
							<Text style={{ fontSize: 16 }}>{"\u{1F37D}\u{FE0F}"}</Text>
						</View>
					)}
					<View style={styles.entryInfo}>
						<Text style={styles.recipeName} numberOfLines={1}>{entry.recipe_name}</Text>
						{entry.recipe_calories != null && entry.recipe_calories > 0 && (
							<Text style={styles.recipeCalories}>
								{Math.round(entry.recipe_calories)} {t("mpKcal")}
							</Text>
						)}
					</View>
					<TouchableOpacity onPress={() => onRemoveEntry(entry.id)} activeOpacity={0.7}>
						<Ionicons name="close-circle-outline" size={20} color={colors.textSecondary} />
					</TouchableOpacity>
				</View>
			))}

			<TouchableOpacity style={styles.addButton} onPress={onAddPress} activeOpacity={0.7}>
				<Ionicons name="add" size={18} color={colors.accent} />
				<Text style={styles.addText}>{t("mpAddRecipe")}</Text>
			</TouchableOpacity>
		</View>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					marginBottom: spacing.sm,
				},
				header: {
					flexDirection: "row",
					alignItems: "center",
					gap: spacing.xs,
					marginBottom: spacing.xs,
				},
				icon: {
					fontSize: 16,
				},
				label: {
					...typography.subhead,
					color: colors.textSecondary,
					fontWeight: "600",
				},
				entryRow: {
					flexDirection: "row",
					alignItems: "center",
					backgroundColor: colors.cardBackground,
					borderRadius: 10,
					padding: spacing.sm,
					marginBottom: spacing.xs,
					gap: spacing.sm,
				},
				thumb: {
					width: 36,
					height: 36,
					borderRadius: 8,
				},
				thumbPlaceholder: {
					backgroundColor: colors.chipBackground,
					justifyContent: "center",
					alignItems: "center",
				},
				entryInfo: {
					flex: 1,
				},
				recipeName: {
					...typography.subhead,
					color: colors.textPrimary,
					fontWeight: "500",
				},
				recipeCalories: {
					...typography.caption1,
					color: colors.calorieAccent,
				},
				addButton: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					paddingVertical: spacing.sm,
					borderRadius: 10,
					borderWidth: 1,
					borderColor: colors.border,
					borderStyle: "dashed",
					gap: spacing.xs,
				},
				addText: {
					...typography.caption1,
					color: colors.accent,
					fontWeight: "600",
				},
			}),
		[colors]
	);
}
