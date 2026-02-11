import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MealPlannerStackParamList } from "../../../../types/navigation";
import { initDatabase, getAllRecipes, addToMealPlan, RecipeWithDetails } from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";

type Nav = NativeStackNavigationProp<MealPlannerStackParamList>;
type Route = RouteProp<MealPlannerStackParamList, "MPRecipePicker">;

export default function RecipePickerScreen() {
	const navigation = useNavigation<Nav>();
	const route = useRoute<Route>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const { date, mealType } = route.params;
	const [recipes, setRecipes] = useState<RecipeWithDetails[]>([]);
	const [searchQuery, setSearchQuery] = useState("");

	const loadData = useCallback(async () => {
		await initDatabase();
		const data = await getAllRecipes(searchQuery || undefined);
		setRecipes(data);
	}, [searchQuery]);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData])
	);

	const handleSelect = useCallback(async (recipe: RecipeWithDetails) => {
		await addToMealPlan(date, mealType, recipe.id);
		navigation.goBack();
	}, [date, mealType, navigation]);

	const renderItem = useCallback(({ item }: { item: RecipeWithDetails }) => {
		const caloriesPerServing = item.total_calories
			? Math.round(item.total_calories / Math.max(item.servings, 1))
			: null;

		return (
			<TouchableOpacity style={styles.recipeItem} onPress={() => handleSelect(item)} activeOpacity={0.7}>
				<View style={styles.recipeInfo}>
					<Text style={styles.recipeName} numberOfLines={1}>{item.name}</Text>
					{caloriesPerServing != null && caloriesPerServing > 0 && (
						<Text style={styles.recipeCalories}>
							{caloriesPerServing} {t("mpKcalPerServing")}
						</Text>
					)}
				</View>
				<Ionicons name="add-circle-outline" size={24} color={colors.accent} />
			</TouchableOpacity>
		);
	}, [handleSelect, colors, styles, t]);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.closeButton}>
					<Ionicons name="close" size={28} color={colors.textPrimary} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>{t("mpPickRecipe")}</Text>
				<View style={{ width: 36 }} />
			</View>

			{/* Search */}
			<View style={styles.searchContainer}>
				<Ionicons name="search" size={18} color={colors.textSecondary} />
				<TextInput
					style={styles.searchInput}
					placeholder={t("mpSearchRecipes")}
					placeholderTextColor={colors.textSecondary}
					value={searchQuery}
					onChangeText={setSearchQuery}
					autoCapitalize="none"
					autoCorrect={false}
				/>
				{searchQuery.length > 0 && (
					<TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
						<Ionicons name="close-circle" size={18} color={colors.textSecondary} />
					</TouchableOpacity>
				)}
			</View>

			<FlatList
				data={recipes}
				keyExtractor={(item) => item.id.toString()}
				renderItem={renderItem}
				ListEmptyComponent={
					<Text style={styles.emptyText}>{t("mpNoRecipes")}</Text>
				}
				contentContainerStyle={recipes.length === 0 ? styles.emptyContainer : undefined}
			/>
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
				searchContainer: {
					flexDirection: "row",
					alignItems: "center",
					backgroundColor: colors.cardBackground,
					marginHorizontal: spacing.lg,
					marginBottom: spacing.md,
					borderRadius: 12,
					paddingHorizontal: spacing.md,
					paddingVertical: spacing.sm,
					gap: spacing.sm,
				},
				searchInput: {
					flex: 1,
					...typography.body,
					color: colors.textPrimary,
					padding: 0,
				},
				recipeItem: {
					flexDirection: "row",
					alignItems: "center",
					backgroundColor: colors.cardBackground,
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.md,
					borderBottomWidth: 0.5,
					borderBottomColor: colors.border,
				},
				recipeInfo: {
					flex: 1,
				},
				recipeName: {
					...typography.headline,
					color: colors.textPrimary,
				},
				recipeCalories: {
					...typography.caption1,
					color: colors.calorieAccent,
					marginTop: 2,
				},
				emptyText: {
					...typography.body,
					color: colors.textSecondary,
					textAlign: "center",
					paddingVertical: spacing.xl,
				},
				emptyContainer: {
					flexGrow: 1,
					justifyContent: "center",
				},
			}),
		[colors]
	);
}
