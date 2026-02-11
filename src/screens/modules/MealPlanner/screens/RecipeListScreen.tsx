import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MealPlannerStackParamList } from "../../../../types/navigation";
import { initDatabase, getAllRecipes, getAllMealTags, RecipeWithDetails, MealTag } from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import RecipeCard from "../components/RecipeCard";
import TagChip from "../components/TagChip";

type Nav = NativeStackNavigationProp<MealPlannerStackParamList>;

export default function RecipeListScreen() {
	const navigation = useNavigation<Nav>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const [recipes, setRecipes] = useState<RecipeWithDetails[]>([]);
	const [tags, setTags] = useState<MealTag[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

	const loadData = useCallback(async () => {
		await initDatabase();
		const [recipesData, tagsData] = await Promise.all([
			getAllRecipes(
				searchQuery || undefined,
				selectedTagIds.length > 0 ? selectedTagIds : undefined
			),
			getAllMealTags(),
		]);
		setRecipes(recipesData);
		setTags(tagsData);
	}, [searchQuery, selectedTagIds]);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData])
	);

	const handleTagToggle = useCallback((tag: MealTag) => {
		setSelectedTagIds((prev) =>
			prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
		);
	}, []);

	const handleRecipePress = useCallback((recipe: RecipeWithDetails) => {
		navigation.navigate("MPRecipeDetail", { recipeId: recipe.id });
	}, [navigation]);

	const handleAdd = useCallback(() => {
		navigation.navigate("MPRecipeForm", { mode: "create" });
	}, [navigation]);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.title}>{t("mpRecipes")}</Text>
				<TouchableOpacity onPress={handleAdd} activeOpacity={0.7}>
					<Ionicons name="add-circle" size={28} color={colors.accent} />
				</TouchableOpacity>
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

			{/* Tag filter */}
			{tags.length > 0 && (
				<View style={styles.tagFilterContainer}>
					{tags.map((tag) => (
						<TagChip
							key={tag.id}
							tag={tag}
							selected={selectedTagIds.includes(tag.id)}
							onPress={handleTagToggle}
						/>
					))}
				</View>
			)}

			{/* Recipe list */}
			<FlatList
				data={recipes}
				keyExtractor={(item) => item.id.toString()}
				renderItem={({ item }) => (
					<RecipeCard recipe={item} onPress={handleRecipePress} colors={colors} />
				)}
				ListEmptyComponent={
					<Text style={styles.emptyText}>{t("mpNoRecipes")}</Text>
				}
				contentContainerStyle={recipes.length === 0 ? styles.emptyContainer : styles.listContent}
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
					justifyContent: "space-between",
					alignItems: "center",
					paddingHorizontal: spacing.lg,
					paddingTop: spacing.md,
					paddingBottom: spacing.sm,
				},
				title: {
					...typography.largeTitle,
					color: colors.textPrimary,
				},
				searchContainer: {
					flexDirection: "row",
					alignItems: "center",
					backgroundColor: colors.cardBackground,
					marginHorizontal: spacing.lg,
					marginBottom: spacing.sm,
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
				tagFilterContainer: {
					flexDirection: "row",
					flexWrap: "wrap",
					paddingHorizontal: spacing.lg,
					gap: spacing.sm,
					marginBottom: spacing.md,
				},
				listContent: {
					paddingTop: spacing.sm,
					paddingBottom: spacing.xl,
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
