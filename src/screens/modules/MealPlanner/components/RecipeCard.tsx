import React, { useMemo } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RecipeWithDetails } from "../database";
import { Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";

type Props = {
	recipe: RecipeWithDetails;
	onPress: (recipe: RecipeWithDetails) => void;
	colors: Colors;
};

export default function RecipeCard({ recipe, onPress, colors }: Props) {
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const tagNames = recipe.tag_names?.split("|||") || [];
	const tagIcons = recipe.tag_icons?.split("|||") || [];
	const tagColors = recipe.tag_colors?.split("|||") || [];

	const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
	const caloriesPerServing = recipe.total_calories
		? Math.round(recipe.total_calories / Math.max(recipe.servings, 1))
		: null;

	return (
		<TouchableOpacity style={styles.card} onPress={() => onPress(recipe)} activeOpacity={0.7}>
			{recipe.image_url ? (
				<Image source={{ uri: recipe.image_url }} style={styles.image} resizeMode="cover" />
			) : (
				<View style={styles.imagePlaceholder}>
					<Text style={styles.placeholderEmoji}>{"\u{1F37D}\u{FE0F}"}</Text>
				</View>
			)}
			<View style={styles.content}>
				<Text style={styles.name} numberOfLines={1}>{recipe.name}</Text>

				{/* Tags */}
				{tagNames.length > 0 && (
					<View style={styles.tagsRow}>
						{tagNames.map((name, i) => (
							<View key={i} style={[styles.tagChip, { backgroundColor: (tagColors[i] || "#999") + "20" }]}>
								<Text style={styles.tagIcon}>{tagIcons[i]}</Text>
								<Text style={[styles.tagText, { color: tagColors[i] || "#999" }]}>{name}</Text>
							</View>
						))}
					</View>
				)}

				{/* Info row */}
				<View style={styles.infoRow}>
					{totalTime > 0 && (
						<View style={styles.infoItem}>
							<Ionicons name="time-outline" size={14} color={colors.textSecondary} />
							<Text style={styles.infoText}>{totalTime} {t("mpMin")}</Text>
						</View>
					)}
					{caloriesPerServing !== null && caloriesPerServing > 0 && (
						<View style={styles.infoItem}>
							<Ionicons name="flame-outline" size={14} color={colors.calorieAccent} />
							<Text style={[styles.infoText, { color: colors.calorieAccent }]}>
								{caloriesPerServing} {t("mpKcal")}
							</Text>
						</View>
					)}
				</View>
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
					borderRadius: 16,
					marginHorizontal: spacing.lg,
					marginBottom: spacing.md,
					overflow: "hidden",
					shadowColor: colors.shadow,
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.1,
					shadowRadius: 4,
					elevation: 3,
				},
				image: {
					width: "100%",
					height: 140,
				},
				imagePlaceholder: {
					width: "100%",
					height: 100,
					backgroundColor: colors.chipBackground,
					justifyContent: "center",
					alignItems: "center",
				},
				placeholderEmoji: {
					fontSize: 40,
				},
				content: {
					padding: spacing.md,
				},
				name: {
					...typography.headline,
					color: colors.textPrimary,
					marginBottom: spacing.xs,
				},
				tagsRow: {
					flexDirection: "row",
					flexWrap: "wrap",
					gap: spacing.xs,
					marginBottom: spacing.sm,
				},
				tagChip: {
					flexDirection: "row",
					alignItems: "center",
					paddingHorizontal: 8,
					paddingVertical: 3,
					borderRadius: 10,
					gap: 3,
				},
				tagIcon: {
					fontSize: 11,
				},
				tagText: {
					fontSize: 11,
					fontWeight: "600",
				},
				infoRow: {
					flexDirection: "row",
					gap: spacing.md,
				},
				infoItem: {
					flexDirection: "row",
					alignItems: "center",
					gap: 3,
				},
				infoText: {
					...typography.caption1,
					color: colors.textSecondary,
				},
			}),
		[colors]
	);
}
