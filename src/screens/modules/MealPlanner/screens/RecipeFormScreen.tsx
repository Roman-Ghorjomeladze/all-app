import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MealPlannerStackParamList } from "../../../../types/navigation";
import {
	initDatabase,
	getRecipe,
	getRecipeIngredients,
	getRecipeSteps,
	getRecipeTagIds,
	getRecipeCategoryIds,
	getAllMealTags,
	getAllCategories,
	createRecipe,
	updateRecipe,
	deleteRecipe,
	MealTag,
	Category,
} from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import IngredientRow, { IngredientData } from "../components/IngredientRow";
import StepRow from "../components/StepRow";
import TagSelector from "../components/TagSelector";
import CategorySelector from "../components/CategorySelector";
import ImagePreview from "../components/ImagePreview";

type Nav = NativeStackNavigationProp<MealPlannerStackParamList>;
type Route = RouteProp<MealPlannerStackParamList, "MPRecipeForm">;

export default function RecipeFormScreen() {
	const navigation = useNavigation<Nav>();
	const route = useRoute<Route>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const isEdit = route.params.mode === "edit";
	const recipeId = isEdit ? (route.params as { recipeId: number }).recipeId : null;

	const [name, setName] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const [prepTime, setPrepTime] = useState("");
	const [cookTime, setCookTime] = useState("");
	const [servings, setServings] = useState("1");
	const [notes, setNotes] = useState("");
	const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
	const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
	const [ingredients, setIngredients] = useState<IngredientData[]>([]);
	const [steps, setSteps] = useState<string[]>([]);
	const [allTags, setAllTags] = useState<MealTag[]>([]);
	const [allCategories, setAllCategories] = useState<Category[]>([]);

	useEffect(() => {
		(async () => {
			await initDatabase();
			const [tags, cats] = await Promise.all([getAllMealTags(), getAllCategories()]);
			setAllTags(tags);
			setAllCategories(cats);

			if (isEdit && recipeId) {
				const [recipe, ings, sts, tagIds, catIds] = await Promise.all([
					getRecipe(recipeId),
					getRecipeIngredients(recipeId),
					getRecipeSteps(recipeId),
					getRecipeTagIds(recipeId),
					getRecipeCategoryIds(recipeId),
				]);
				if (recipe) {
					setName(recipe.name);
					setImageUrl(recipe.image_url || "");
					setPrepTime(recipe.prep_time != null ? String(recipe.prep_time) : "");
					setCookTime(recipe.cook_time != null ? String(recipe.cook_time) : "");
					setServings(String(recipe.servings));
					setNotes(recipe.notes || "");
					setSelectedTagIds(tagIds);
					setSelectedCategoryIds(catIds);
					setIngredients(
						ings.map((i) => ({
							name: i.name,
							quantity: i.quantity || "",
							unit: i.unit || "",
							calories_per_100g: i.calories_per_100g,
							quantity_grams: i.quantity_grams,
						}))
					);
					setSteps(sts.map((s) => s.instruction));
				}
			}
		})();
	}, [isEdit, recipeId]);

	const handleTagToggle = useCallback((tagId: number) => {
		setSelectedTagIds((prev) =>
			prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
		);
	}, []);

	const handleCategoryToggle = useCallback((catId: number) => {
		setSelectedCategoryIds((prev) =>
			prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
		);
	}, []);

	const handleAddIngredient = useCallback(() => {
		setIngredients((prev) => [...prev, { name: "", quantity: "", unit: "", calories_per_100g: null, quantity_grams: null }]);
	}, []);

	const handleIngredientChange = useCallback((index: number, data: IngredientData) => {
		setIngredients((prev) => prev.map((item, i) => (i === index ? data : item)));
	}, []);

	const handleRemoveIngredient = useCallback((index: number) => {
		setIngredients((prev) => prev.filter((_, i) => i !== index));
	}, []);

	const handleAddStep = useCallback(() => {
		setSteps((prev) => [...prev, ""]);
	}, []);

	const handleStepChange = useCallback((index: number, text: string) => {
		setSteps((prev) => prev.map((item, i) => (i === index ? text : item)));
	}, []);

	const handleRemoveStep = useCallback((index: number) => {
		setSteps((prev) => prev.filter((_, i) => i !== index));
	}, []);

	const handleSave = useCallback(async () => {
		if (!name.trim()) {
			Alert.alert(t("mpError"), t("mpNameRequired"));
			return;
		}

		const data = {
			name: name.trim(),
			image_url: imageUrl.trim() || null,
			prep_time: prepTime ? parseInt(prepTime, 10) : null,
			cook_time: cookTime ? parseInt(cookTime, 10) : null,
			servings: parseInt(servings, 10) || 1,
			notes: notes.trim() || null,
			tag_ids: selectedTagIds,
			category_ids: selectedCategoryIds,
			ingredients: ingredients
				.filter((i) => i.name.trim())
				.map((i) => ({
					name: i.name.trim(),
					quantity: i.quantity.trim() || null,
					unit: i.unit.trim() || null,
					calories_per_100g: i.calories_per_100g,
					quantity_grams: i.quantity_grams,
				})),
			steps: steps
				.filter((s) => s.trim())
				.map((s) => ({ instruction: s.trim() })),
		};

		if (isEdit && recipeId) {
			await updateRecipe(recipeId, data);
		} else {
			await createRecipe(data);
		}
		navigation.goBack();
	}, [name, imageUrl, prepTime, cookTime, servings, notes, selectedTagIds, selectedCategoryIds, ingredients, steps, isEdit, recipeId, navigation, t]);

	const handleDelete = useCallback(() => {
		if (!recipeId) return;
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

	const totalCalories = useMemo(() => {
		let total = 0;
		for (const ing of ingredients) {
			if (ing.calories_per_100g && ing.quantity_grams) {
				total += (ing.quantity_grams / 100) * ing.calories_per_100g;
			}
		}
		return Math.round(total);
	}, [ingredients]);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.closeButton}>
					<Ionicons name="close" size={28} color={colors.textPrimary} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>
					{isEdit ? t("mpEditRecipe") : t("mpNewRecipe")}
				</Text>
				<TouchableOpacity onPress={handleSave} activeOpacity={0.7} style={styles.saveButton}>
					<Text style={styles.saveButtonText}>{t("mpSave")}</Text>
				</TouchableOpacity>
			</View>

			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView contentContainerStyle={styles.scrollContent}>
					{/* Name */}
					<View style={styles.field}>
						<Text style={styles.fieldLabel}>{t("mpRecipeName")}</Text>
						<TextInput
							style={styles.input}
							value={name}
							onChangeText={setName}
							placeholder={t("mpRecipeNamePlaceholder")}
							placeholderTextColor={colors.textSecondary}
						/>
					</View>

					{/* Image URL */}
					<View style={styles.field}>
						<Text style={styles.fieldLabel}>{t("mpImageUrl")}</Text>
						<TextInput
							style={styles.input}
							value={imageUrl}
							onChangeText={setImageUrl}
							placeholder={t("mpImageUrlPlaceholder")}
							placeholderTextColor={colors.textSecondary}
							autoCapitalize="none"
							autoCorrect={false}
						/>
						{imageUrl.trim() !== "" && (
							<View style={styles.imagePreview}>
								<ImagePreview imageUrl={imageUrl.trim()} height={140} colors={colors} />
							</View>
						)}
					</View>

					{/* Time & Servings */}
					<View style={styles.rowFields}>
						<View style={styles.smallField}>
							<Text style={styles.fieldLabel}>{t("mpPrepTime")}</Text>
							<TextInput
								style={styles.input}
								value={prepTime}
								onChangeText={setPrepTime}
								placeholder={t("mpMin")}
								placeholderTextColor={colors.textSecondary}
								keyboardType="numeric"
							/>
						</View>
						<View style={styles.smallField}>
							<Text style={styles.fieldLabel}>{t("mpCookTime")}</Text>
							<TextInput
								style={styles.input}
								value={cookTime}
								onChangeText={setCookTime}
								placeholder={t("mpMin")}
								placeholderTextColor={colors.textSecondary}
								keyboardType="numeric"
							/>
						</View>
						<View style={styles.smallField}>
							<Text style={styles.fieldLabel}>{t("mpServings")}</Text>
							<TextInput
								style={styles.input}
								value={servings}
								onChangeText={setServings}
								placeholder="1"
								placeholderTextColor={colors.textSecondary}
								keyboardType="numeric"
							/>
						</View>
					</View>

					{/* Tags */}
					{allTags.length > 0 && (
						<View style={styles.field}>
							<Text style={styles.fieldLabel}>{t("mpTags")}</Text>
							<TagSelector tags={allTags} selectedIds={selectedTagIds} onToggle={handleTagToggle} />
						</View>
					)}

					{/* Categories */}
					{allCategories.length > 0 && (
						<View style={styles.field}>
							<Text style={styles.fieldLabel}>{t("mpCategories")}</Text>
							<CategorySelector categories={allCategories} selectedIds={selectedCategoryIds} onToggle={handleCategoryToggle} colors={colors} />
						</View>
					)}

					{/* Ingredients */}
					<View style={styles.field}>
						<View style={styles.sectionHeader}>
							<Text style={styles.fieldLabel}>{t("mpIngredients")}</Text>
							<TouchableOpacity onPress={handleAddIngredient} activeOpacity={0.7}>
								<Ionicons name="add-circle" size={24} color={colors.accent} />
							</TouchableOpacity>
						</View>
						{ingredients.map((ing, index) => (
							<IngredientRow
								key={index}
								mode="edit"
								data={ing}
								onChange={(data) => handleIngredientChange(index, data)}
								onRemove={() => handleRemoveIngredient(index)}
								colors={colors}
							/>
						))}
						{totalCalories > 0 && (
							<View style={styles.totalCaloriesRow}>
								<Text style={styles.totalCaloriesLabel}>{t("mpTotalCalories")}:</Text>
								<Text style={styles.totalCaloriesValue}>{totalCalories} {t("mpKcal")}</Text>
								<Text style={styles.perServingText}>
									({Math.round(totalCalories / (parseInt(servings, 10) || 1))} {t("mpKcalPerServing")})
								</Text>
							</View>
						)}
					</View>

					{/* Steps */}
					<View style={styles.field}>
						<View style={styles.sectionHeader}>
							<Text style={styles.fieldLabel}>{t("mpSteps")}</Text>
							<TouchableOpacity onPress={handleAddStep} activeOpacity={0.7}>
								<Ionicons name="add-circle" size={24} color={colors.accent} />
							</TouchableOpacity>
						</View>
						{steps.map((instruction, index) => (
							<StepRow
								key={index}
								mode="edit"
								stepNumber={index + 1}
								instruction={instruction}
								onChange={(text) => handleStepChange(index, text)}
								onRemove={() => handleRemoveStep(index)}
								colors={colors}
							/>
						))}
					</View>

					{/* Notes */}
					<View style={styles.field}>
						<Text style={styles.fieldLabel}>{t("mpNotes")}</Text>
						<TextInput
							style={[styles.input, styles.notesInput]}
							value={notes}
							onChangeText={setNotes}
							placeholder={t("mpNotesPlaceholder")}
							placeholderTextColor={colors.textSecondary}
							multiline
						/>
					</View>

					{/* Delete button (edit mode) */}
					{isEdit && (
						<TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.7}>
							<Ionicons name="trash-outline" size={20} color={colors.danger} />
							<Text style={styles.deleteButtonText}>{t("mpDeleteRecipe")}</Text>
						</TouchableOpacity>
					)}
				</ScrollView>
			</KeyboardAvoidingView>
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
					justifyContent: "space-between",
					paddingHorizontal: spacing.sm,
					paddingVertical: spacing.sm,
				},
				closeButton: {
					padding: spacing.xs,
				},
				headerTitle: {
					...typography.headline,
					color: colors.textPrimary,
				},
				saveButton: {
					paddingHorizontal: spacing.md,
					paddingVertical: spacing.sm,
				},
				saveButtonText: {
					...typography.headline,
					color: colors.accent,
				},
				scrollContent: {
					padding: spacing.lg,
					paddingBottom: spacing.xl * 3,
				},
				field: {
					marginBottom: spacing.lg,
				},
				fieldLabel: {
					...typography.subhead,
					color: colors.textSecondary,
					fontWeight: "600",
					marginBottom: spacing.xs,
				},
				input: {
					...typography.body,
					color: colors.textPrimary,
					backgroundColor: colors.inputBackground,
					borderRadius: 10,
					paddingHorizontal: spacing.md,
					paddingVertical: 12,
					borderWidth: 1,
					borderColor: colors.border,
				},
				imagePreview: {
					marginTop: spacing.sm,
					borderRadius: 12,
					overflow: "hidden",
				},
				rowFields: {
					flexDirection: "row",
					gap: spacing.sm,
					marginBottom: spacing.lg,
				},
				smallField: {
					flex: 1,
				},
				sectionHeader: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: spacing.sm,
				},
				totalCaloriesRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: spacing.sm,
					marginTop: spacing.sm,
					paddingVertical: spacing.sm,
					paddingHorizontal: spacing.md,
					backgroundColor: colors.calorieAccent + "15",
					borderRadius: 8,
				},
				totalCaloriesLabel: {
					...typography.subhead,
					color: colors.calorieAccent,
					fontWeight: "600",
				},
				totalCaloriesValue: {
					...typography.headline,
					color: colors.calorieAccent,
				},
				perServingText: {
					...typography.caption1,
					color: colors.calorieAccent,
				},
				notesInput: {
					minHeight: 80,
					textAlignVertical: "top",
				},
				deleteButton: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					paddingVertical: spacing.md,
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
