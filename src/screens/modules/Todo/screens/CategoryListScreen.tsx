import React, { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TodoStackParamList } from "../../../../types/navigation";
import { CategoryWithCount, initDatabase, getAllCategories, deleteCategory } from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import CategoryCard from "../components/CategoryCard";

type Nav = NativeStackNavigationProp<TodoStackParamList>;

export default function CategoryListScreen() {
	const navigation = useNavigation<Nav>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const [categories, setCategories] = useState<CategoryWithCount[]>([]);

	const loadCategories = useCallback(async () => {
		await initDatabase();
		const all = await getAllCategories();
		setCategories(all);
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadCategories();
		}, [loadCategories])
	);

	const handlePress = useCallback((category: CategoryWithCount) => {
		navigation.navigate("TodoCategoryForm", { mode: "edit", categoryId: category.id });
	}, [navigation]);

	const handleLongPress = useCallback((category: CategoryWithCount) => {
		Alert.alert(category.name, undefined, [
			{
				text: t("tdEditCategory"),
				onPress: () => navigation.navigate("TodoCategoryForm", { mode: "edit", categoryId: category.id }),
			},
			{
				text: t("tdDeleteCategory"),
				style: "destructive",
				onPress: () => {
					Alert.alert(t("tdDeleteCategory"), t("tdDeleteCategoryConfirm"), [
						{ text: t("cancel"), style: "cancel" },
						{
							text: t("tdDelete"),
							style: "destructive",
							onPress: async () => {
								await deleteCategory(category.id);
								loadCategories();
							},
						},
					]);
				},
			},
			{ text: t("cancel"), style: "cancel" },
		]);
	}, [navigation, loadCategories, t]);

	const handleAdd = useCallback(() => {
		navigation.navigate("TodoCategoryForm", { mode: "create" });
	}, [navigation]);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			<View style={styles.header}>
				<Text style={styles.title} numberOfLines={1}>{t("tdCategories")}</Text>
				<TouchableOpacity onPress={handleAdd} activeOpacity={0.7} style={styles.addButton}>
					<Ionicons name="add-circle" size={32} color={colors.accent} />
				</TouchableOpacity>
			</View>

			{categories.length === 0 ? (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyEmoji}>{"\u{1F4C1}"}</Text>
					<Text style={styles.emptyText}>{t("tdNoCategories")}</Text>
					<Text style={styles.emptyHint}>{t("tdNoCategoriesHint")}</Text>
				</View>
			) : (
				<FlatList
					data={categories}
					keyExtractor={(item) => item.id.toString()}
					renderItem={({ item }) => (
						<CategoryCard
							category={item}
							onPress={handlePress}
							onLongPress={handleLongPress}
						/>
					)}
					contentContainerStyle={styles.listContent}
				/>
			)}
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
					paddingVertical: spacing.md,
				},
				title: {
					...typography.largeTitle,
					color: colors.textPrimary,
					flex: 1,
					marginRight: spacing.sm,
				},
				addButton: {
					padding: spacing.xs,
				},
				listContent: {
					paddingTop: spacing.sm,
					paddingBottom: spacing.xl,
				},
				emptyContainer: {
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					paddingHorizontal: spacing.xl,
				},
				emptyEmoji: {
					fontSize: 64,
					marginBottom: spacing.md,
				},
				emptyText: {
					...typography.body,
					color: colors.textSecondary,
					textAlign: "center",
					marginBottom: spacing.sm,
				},
				emptyHint: {
					...typography.footnote,
					color: colors.textSecondary,
					textAlign: "center",
				},
			}),
		[colors]
	);
}
