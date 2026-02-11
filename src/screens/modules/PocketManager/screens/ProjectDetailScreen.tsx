import React, { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PocketManagerStackParamList } from "../../../../types/navigation";
import {
	initDatabase,
	getProject,
	getProjectCategoriesWithTotals,
	getExpensesForProject,
	archiveProject,
	unarchiveProject,
	deleteExpense,
	ProjectWithStats,
	ProjectCategoryWithTotal,
	ExpenseWithDetails,
} from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import BudgetBar from "../components/BudgetBar";
import ExpenseListItem from "../components/ExpenseListItem";

type Nav = NativeStackNavigationProp<PocketManagerStackParamList>;
type Route = RouteProp<PocketManagerStackParamList, "PMProjectDetail">;

export default function ProjectDetailScreen() {
	const navigation = useNavigation<Nav>();
	const route = useRoute<Route>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const { projectId } = route.params;
	const [project, setProject] = useState<ProjectWithStats | null>(null);
	const [categories, setCategories] = useState<ProjectCategoryWithTotal[]>([]);
	const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
	const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

	const loadData = useCallback(async () => {
		await initDatabase();
		const [proj, cats, exps] = await Promise.all([
			getProject(projectId),
			getProjectCategoriesWithTotals(projectId),
			getExpensesForProject(projectId),
		]);
		setProject(proj);
		setCategories(cats);
		setExpenses(exps);
	}, [projectId]);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData])
	);

	const handleEdit = useCallback(() => {
		navigation.navigate("PMProjectForm", { mode: "edit", projectId });
	}, [navigation, projectId]);

	const handleAddExpense = useCallback(() => {
		navigation.navigate("PMExpenseForm", { mode: "create", projectId });
	}, [navigation, projectId]);

	const handleExpensePress = useCallback((expense: ExpenseWithDetails) => {
		navigation.navigate("PMExpenseForm", { mode: "edit", expenseId: expense.id });
	}, [navigation]);

	const handleExpenseDelete = useCallback((expense: ExpenseWithDetails) => {
		Alert.alert(t("pmDeleteExpense"), t("pmDeleteExpenseConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("pmDelete"),
				style: "destructive",
				onPress: async () => {
					await deleteExpense(expense.id);
					loadData();
				},
			},
		]);
	}, [t, loadData]);

	const handleArchiveToggle = useCallback(async () => {
		if (!project) return;
		const isArchived = project.is_archived === 1;
		if (isArchived) {
			await unarchiveProject(projectId);
		} else {
			Alert.alert(t("pmArchive"), t("pmArchiveConfirm"), [
				{ text: t("cancel"), style: "cancel" },
				{
					text: t("pmArchive"),
					onPress: async () => {
						await archiveProject(projectId);
						navigation.goBack();
					},
				},
			]);
			return;
		}
		loadData();
	}, [project, projectId, navigation, t, loadData]);

	const filteredExpenses = useMemo(() => {
		if (selectedCategoryId === null) return expenses;
		return expenses.filter((e) => {
			const ids = e.linked_project_category_ids?.split(",") || [];
			return ids.includes(String(selectedCategoryId));
		});
	}, [expenses, selectedCategoryId]);

	const selectedCategoryTotal = useMemo(() => {
		if (selectedCategoryId === null) return null;
		const cat = categories.find((c) => c.id === selectedCategoryId);
		return cat ? cat.total_amount : 0;
	}, [selectedCategoryId, categories]);

	if (!project) return null;

	const renderHeader = () => (
		<View>
			{/* Budget */}
			{project.budget != null && (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{t("pmBudgetProgress")}</Text>
					<BudgetBar spent={project.total_spent} budget={project.budget} colors={colors} />
				</View>
			)}

			{/* Total Spent */}
			<View style={styles.totalSection}>
				<Text style={styles.totalLabel}>{t("pmSpent")}</Text>
				<Text style={styles.totalAmount}>{"\u{20BE}"}{project.total_spent.toFixed(2)}</Text>
			</View>

			{/* Category Filter Chips */}
			{categories.length > 0 && (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.filterChipsContainer}
					style={styles.filterChipsScroll}
				>
					<TouchableOpacity
						style={[styles.filterChip, selectedCategoryId === null && styles.filterChipActive]}
						onPress={() => setSelectedCategoryId(null)}
						activeOpacity={0.7}
					>
						<Text style={[styles.filterChipText, selectedCategoryId === null && styles.filterChipTextActive]}>
							{t("pmAll")}
						</Text>
					</TouchableOpacity>
					{categories.map((cat) => (
						<TouchableOpacity
							key={cat.id}
							style={[styles.filterChip, selectedCategoryId === cat.id && styles.filterChipActive]}
							onPress={() => setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)}
							activeOpacity={0.7}
						>
							<Text style={styles.filterChipIcon}>{cat.icon}</Text>
						</TouchableOpacity>
					))}
				</ScrollView>
			)}

			{/* Expenses header */}
			<View style={styles.expenseHeader}>
				<Text style={styles.sectionTitle}>
					{t("pmExpenses")}
					{selectedCategoryTotal !== null && (
						<Text style={styles.filterTotal}>{" · "}{"\u{20BE}"}{selectedCategoryTotal.toFixed(2)}</Text>
					)}
				</Text>
				<TouchableOpacity onPress={handleAddExpense} activeOpacity={0.7}>
					<Ionicons name="add-circle" size={28} color={colors.accent} />
				</TouchableOpacity>
			</View>
		</View>
	);

	const renderFooter = () => (
		<View style={styles.footer}>
			{expenses.length === 0 && (
				<Text style={styles.emptyText}>{t("pmNoExpenses")}</Text>
			)}
			<TouchableOpacity style={styles.archiveButton} onPress={handleArchiveToggle} activeOpacity={0.7}>
				<Ionicons
					name={project.is_archived ? "arrow-undo-outline" : "archive-outline"}
					size={20}
					color={colors.accent}
				/>
				<Text style={styles.archiveButtonText}>
					{project.is_archived ? t("pmUnarchive") : t("pmArchive")}
				</Text>
			</TouchableOpacity>
		</View>
	);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backButton}>
					<Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
				</TouchableOpacity>
				<Text style={styles.title} numberOfLines={1}>{project.name}</Text>
				<TouchableOpacity onPress={handleEdit} activeOpacity={0.7} style={styles.editButton}>
					<Ionicons name="pencil" size={22} color={colors.accent} />
				</TouchableOpacity>
			</View>

			<FlatList
				data={filteredExpenses}
				keyExtractor={(item) => item.id.toString()}
				renderItem={({ item }) => (
					<ExpenseListItem
						expense={item}
						onPress={handleExpensePress}
						onDelete={handleExpenseDelete}
						colors={colors}
					/>
				)}
				ListHeaderComponent={renderHeader}
				ListFooterComponent={renderFooter}
				contentContainerStyle={styles.listContent}
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
					paddingHorizontal: spacing.sm,
					paddingVertical: spacing.md,
				},
				backButton: {
					padding: spacing.xs,
				},
				title: {
					...typography.largeTitle,
					color: colors.textPrimary,
					flex: 1,
					marginHorizontal: spacing.sm,
				},
				editButton: {
					padding: spacing.xs,
				},
				listContent: {
					paddingBottom: spacing.xl,
				},
				section: {
					paddingHorizontal: spacing.lg,
					marginTop: spacing.lg,
				},
				sectionTitle: {
					...typography.title3,
					color: colors.textPrimary,
					marginBottom: spacing.sm,
				},
				totalSection: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.md,
					marginTop: spacing.sm,
				},
				totalLabel: {
					...typography.headline,
					color: colors.textSecondary,
				},
				totalAmount: {
					...typography.title2,
					color: colors.accent,
				},
				filterChipsScroll: {
					marginTop: spacing.md,
				},
				filterChipsContainer: {
					paddingHorizontal: spacing.lg,
					gap: spacing.sm,
				},
				filterChip: {
					height: 36,
					minWidth: 36,
					borderRadius: 18,
					justifyContent: "center",
					alignItems: "center",
					paddingHorizontal: spacing.sm,
					backgroundColor: colors.cardBackground,
					borderWidth: 1,
					borderColor: colors.border,
				},
				filterChipActive: {
					backgroundColor: colors.accent,
					borderColor: colors.accent,
				},
				filterChipText: {
					...typography.subhead,
					color: colors.textSecondary,
					fontWeight: "600",
				},
				filterChipTextActive: {
					color: colors.white,
				},
				filterChipIcon: {
					fontSize: 18,
				},
				filterTotal: {
					...typography.subhead,
					color: colors.accent,
					fontWeight: "400",
				},
				expenseHeader: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingHorizontal: spacing.lg,
					marginTop: spacing.lg,
					marginBottom: spacing.sm,
				},
				emptyText: {
					...typography.body,
					color: colors.textSecondary,
					textAlign: "center",
					paddingVertical: spacing.lg,
				},
				footer: {
					paddingHorizontal: spacing.lg,
					paddingTop: spacing.md,
				},
				archiveButton: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					paddingVertical: spacing.md,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: colors.accent,
					marginTop: spacing.lg,
				},
				archiveButtonText: {
					...typography.headline,
					color: colors.accent,
					marginLeft: spacing.sm,
				},
			}),
		[colors]
	);
}
