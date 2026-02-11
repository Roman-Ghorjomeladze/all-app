import React, { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MealPlannerStackParamList } from "../../../../types/navigation";
import { initDatabase, getRecipe, getRecipeIngredients, getRecipeSteps, deleteRecipe, RecipeWithDetails, Ingredient, Step } from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import ImagePreview from "../components/ImagePreview";
import IngredientRow from "../components/IngredientRow";
import StepRow from "../components/StepRow";

type Nav = NativeStackNavigationProp<MealPlannerStackParamList>;
type Route = RouteProp<MealPlannerStackParamList, "MPRecipeDetail">;

export default function RecipeDetailScreen() {
	const navigation = useNavigation<Nav>();
	const route = useRoute<Route>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const { recipeId } = route.params;

	const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null);
	const [ingredients, setIngredients] = useState<Ingredient[]>([]);
	const [steps, setSteps] = useState<Step[]>([]);

	useFocusEffect(
		useCallback(() => {
			(async () => {
				await initDatabase();
				const [r, ings, sts] = await Promise.all([
					getRecipe(recipeId),
					getRecipeIngredients(recipeId),
					getRecipeSteps(recipeId),
				]);
				setRecipe(r);
				setIngredients(ings);
				setSteps(sts);
			})();
		}, [recipeId])
	);

	const handleEdit = useCallback(() => {
		navigation.navigate("MPRecipeForm", { mode: "edit", recipeId });
	}, [navigation, recipeId]);

	const handleDelete = useCallback(() => {
		Alert.alert(t("mpDeleteRecipe"), t("mpDeleteRecipeConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("mpDelete"),
				style: "destructive",
				onPress: async () => {
					await deleteRecipe(recipeId);
					navigation.goBack();
				},
			},
		]);
	}, [recipeId, navigation, t]);

	if (!recipe) return null;

	const tagNames = recipe.tag_names?.split("|||") || [];
	const tagIcons = recipe.tag_icons?.split("|||") || [];
	const tagColors = recipe.tag_colors?.split("|||") || [];
	const categoryNames = recipe.category_names?.split("|||") || [];
	const categoryIcons = recipe.category_icons?.split("|||") || [];
	const categoryColors = recipe.category_colors?.split("|||") || [];

	const totalCalories = recipe.total_calories ? Math.round(recipe.total_calories) : null;
	const caloriesPerServing = totalCalories
		? Math.round(totalCalories / Math.max(recipe.servings, 1))
		: null;

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backButton}>
					<Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
				</TouchableOpacity>
				<Text style={styles.headerTitle} numberOfLines={1}>{recipe.name}</Text>
				<TouchableOpacity onPress={handleEdit} activeOpacity={0.7} style={styles.editButton}>
					<Ionicons name="pencil" size={22} color={colors.accent} />
				</TouchableOpacity>
			</View>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				{/* Image */}
				<View style={styles.imageContainer}>
					<ImagePreview imageUrl={recipe.image_url} height={220} borderRadius={0} colors={colors} />
				</View>

				{/* Tags & Categories */}
				{(tagNames.length > 0 || categoryNames.length > 0) && (
					<View style={styles.chipsContainer}>
						{tagNames.map((name, i) => (
							<View key={`tag-${i}`} style={[styles.chip, { backgroundColor: (tagColors[i] || "#999") + "20" }]}>
								<Text style={styles.chipIcon}>{tagIcons[i]}</Text>
								<Text style={[styles.chipLabel, { color: tagColors[i] || "#999" }]}>{name}</Text>
							</View>
						))}
						{categoryNames.map((name, i) => (
							<View key={`cat-${i}`} style={[styles.chip, { backgroundColor: (categoryColors[i] || "#999") + "20" }]}>
								<Text style={styles.chipIcon}>{categoryIcons[i]}</Text>
								<Text style={[styles.chipLabel, { color: categoryColors[i] || "#999" }]}>{name}</Text>
							</View>
						))}
					</View>
				)}

				{/* Info Row */}
				<View style={styles.infoRow}>
					{recipe.prep_time != null && recipe.prep_time > 0 && (
						<View style={styles.infoItem}>
							<Ionicons name="hourglass-outline" size={18} color={colors.textSecondary} />
							<Text style={styles.infoLabel}>{t("mpPrep")}</Text>
							<Text style={styles.infoValue}>{recipe.prep_time} {t("mpMin")}</Text>
						</View>
					)}
					{recipe.cook_time != null && recipe.cook_time > 0 && (
						<View style={styles.infoItem}>
							<Ionicons name="flame-outline" size={18} color={colors.textSecondary} />
							<Text style={styles.infoLabel}>{t("mpCook")}</Text>
							<Text style={styles.infoValue}>{recipe.cook_time} {t("mpMin")}</Text>
						</View>
					)}
					<View style={styles.infoItem}>
						<Ionicons name="people-outline" size={18} color={colors.textSecondary} />
						<Text style={styles.infoLabel}>{t("mpServings")}</Text>
						<Text style={styles.infoValue}>{recipe.servings}</Text>
					</View>
				</View>

				{/* Calories */}
				{caloriesPerServing != null && caloriesPerServing > 0 && (
					<View style={styles.calorieRow}>
						<View style={styles.calorieItem}>
							<Text style={styles.calorieValue}>{totalCalories}</Text>
							<Text style={styles.calorieLabel}>{t("mpTotalCalories")}</Text>
						</View>
						<View style={styles.calorieDivider} />
						<View style={styles.calorieItem}>
							<Text style={styles.calorieValue}>{caloriesPerServing}</Text>
							<Text style={styles.calorieLabel}>{t("mpKcalPerServing")}</Text>
						</View>
					</View>
				)}

				{/* Ingredients */}
				{ingredients.length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>{t("mpIngredients")}</Text>
						{ingredients.map((ing) => (
							<IngredientRow
								key={ing.id}
								mode="read"
								name={ing.name}
								quantity={ing.quantity}
								unit={ing.unit}
								calories_per_100g={ing.calories_per_100g}
								quantity_grams={ing.quantity_grams}
								colors={colors}
							/>
						))}
					</View>
				)}

				{/* Steps */}
				{steps.length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>{t("mpSteps")}</Text>
						{steps.map((step) => (
							<StepRow
								key={step.id}
								mode="read"
								stepNumber={step.step_number}
								instruction={step.instruction}
								colors={colors}
							/>
						))}
					</View>
				)}

				{/* Notes */}
				{recipe.notes ? (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>{t("mpNotes")}</Text>
						<Text style={styles.notesText}>{recipe.notes}</Text>
					</View>
				) : null}

				{/* Delete button */}
				<TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.7}>
					<Ionicons name="trash-outline" size={20} color={colors.danger} />
					<Text style={styles.deleteButtonText}>{t("mpDeleteRecipe")}</Text>
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				safeArea: {
					flex: 1,
					backgroundColor: colors.background,
				},
				header: {
					flexDirection: "row",
					alignItems: "center",
					paddingHorizontal: spacing.sm,
					paddingVertical: spacing.sm,
				},
				backButton: {
					padding: spacing.xs,
				},
				headerTitle: {
					...typography.title3,
					color: colors.textPrimary,
					flex: 1,
					marginHorizontal: spacing.sm,
				},
				editButton: {
					padding: spacing.xs,
				},
				scrollContent: {
					paddingBottom: spacing.xl * 2,
				},
				imageContainer: {
					marginBottom: spacing.md,
				},
				chipsContainer: {
					flexDirection: "row",
					flexWrap: "wrap",
					paddingHorizontal: spacing.lg,
					gap: spacing.sm,
					marginBottom: spacing.md,
				},
				chip: {
					flexDirection: "row",
					alignItems: "center",
					paddingHorizontal: 10,
					paddingVertical: 4,
					borderRadius: 12,
					gap: 4,
				},
				chipIcon: {
					fontSize: 12,
				},
				chipLabel: {
					fontSize: 12,
					fontWeight: "600",
				},
				infoRow: {
					flexDirection: "row",
					justifyContent: "space-around",
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.md,
					backgroundColor: colors.cardBackground,
					marginHorizontal: spacing.lg,
					borderRadius: 12,
					marginBottom: spacing.md,
				},
				infoItem: {
					alignItems: "center",
					gap: 2,
				},
				infoLabel: {
					...typography.caption2,
					color: colors.textSecondary,
				},
				infoValue: {
					...typography.headline,
					color: colors.textPrimary,
				},
				calorieRow: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: colors.calorieAccent + "15",
					marginHorizontal: spacing.lg,
					borderRadius: 12,
					paddingVertical: spacing.md,
					marginBottom: spacing.md,
					gap: spacing.lg,
				},
				calorieItem: {
					alignItems: "center",
				},
				calorieValue: {
					...typography.title2,
					color: colors.calorieAccent,
				},
				calorieLabel: {
					...typography.caption1,
					color: colors.calorieAccent,
				},
				calorieDivider: {
					width: 1,
					height: 30,
					backgroundColor: colors.calorieAccent + "40",
				},
				section: {
					paddingHorizontal: spacing.lg,
					marginBottom: spacing.lg,
				},
				sectionTitle: {
					...typography.title3,
					color: colors.textPrimary,
					marginBottom: spacing.sm,
				},
				notesText: {
					...typography.body,
					color: colors.textSecondary,
					lineHeight: 24,
				},
				deleteButton: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					paddingVertical: spacing.md,
					marginHorizontal: spacing.lg,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: colors.danger,
					gap: spacing.sm,
					marginTop: spacing.md,
				},
				deleteButtonText: {
					...typography.headline,
					color: colors.danger,
				},
			}),
		[colors]
	);
}
