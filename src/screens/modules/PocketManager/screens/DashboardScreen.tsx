import React, { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PocketManagerStackParamList } from "../../../../types/navigation";
import {
	initDatabase,
	getMonthlyTotal,
	getMonthlyTotalByCategory,
	getActiveProjects,
	getRecentExpenses,
	CategoryBreakdownItem,
	ProjectWithStats,
	ExpenseWithDetails,
} from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import MonthSelector from "../components/MonthSelector";
import ProjectCard from "../components/ProjectCard";
import BudgetBar from "../components/BudgetBar";

type Nav = NativeStackNavigationProp<PocketManagerStackParamList>;

export default function DashboardScreen() {
	const navigation = useNavigation<Nav>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const now = new Date();
	const [year, setYear] = useState(now.getFullYear());
	const [month, setMonth] = useState(now.getMonth() + 1);
	const [total, setTotal] = useState(0);
	const [breakdown, setBreakdown] = useState<CategoryBreakdownItem[]>([]);
	const [projects, setProjects] = useState<ProjectWithStats[]>([]);
	const [recentExpenses, setRecentExpenses] = useState<ExpenseWithDetails[]>([]);

	const loadData = useCallback(async () => {
		await initDatabase();
		const [monthTotal, cats, projs, recent] = await Promise.all([
			getMonthlyTotal(year, month),
			getMonthlyTotalByCategory(year, month),
			getActiveProjects(),
			getRecentExpenses(5),
		]);
		setTotal(monthTotal);
		setBreakdown(cats);
		setProjects(projs);
		setRecentExpenses(recent);
	}, [year, month]);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData])
	);

	const handlePrevMonth = () => {
		if (month === 1) {
			setMonth(12);
			setYear(year - 1);
		} else {
			setMonth(month - 1);
		}
	};

	const handleNextMonth = () => {
		if (month === 12) {
			setMonth(1);
			setYear(year + 1);
		} else {
			setMonth(month + 1);
		}
	};

	const handleProjectPress = (project: ProjectWithStats) => {
		navigation.navigate("PMProjectDetail", { projectId: project.id });
	};

	const handleExpensePress = (expense: ExpenseWithDetails) => {
		navigation.navigate("PMExpenseForm", { mode: "edit", expenseId: expense.id });
	};

	const renderContent = () => (
		<View>
			{/* Month Selector */}
			<MonthSelector
				year={year}
				month={month}
				total={total}
				onPrev={handlePrevMonth}
				onNext={handleNextMonth}
				colors={colors}
			/>

			{/* Category Breakdown */}
			{breakdown.length > 0 && (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{t("pmCategoryBreakdown")}</Text>
					{breakdown.map((item, index) => (
						<View key={index} style={styles.breakdownRow}>
							<View style={styles.breakdownLeft}>
								<Text style={styles.breakdownIcon}>{item.category_icon}</Text>
								<Text style={styles.breakdownName} numberOfLines={1}>{item.category_name}</Text>
							</View>
							<Text style={styles.breakdownAmount}>{item.total.toFixed(2)}</Text>
						</View>
					))}
				</View>
			)}

			{/* Active Projects */}
			{projects.length > 0 && (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{t("pmActiveProjects")}</Text>
					{projects.map((project) => (
						<ProjectCard
							key={project.id}
							project={project}
							onPress={handleProjectPress}
							colors={colors}
						/>
					))}
				</View>
			)}

			{/* Recent Expenses */}
			{recentExpenses.length > 0 && (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{t("pmRecentExpenses")}</Text>
					{recentExpenses.map((expense) => (
						<TouchableOpacity
							key={expense.id}
							style={styles.recentItem}
							onPress={() => handleExpensePress(expense)}
							activeOpacity={0.7}
						>
							<View style={styles.recentLeft}>
								{expense.category_icon && (
									<Text style={styles.recentIcon}>{expense.category_icon}</Text>
								)}
								<View>
									<Text style={styles.recentCategory}>{expense.category_name || "—"}</Text>
									<Text style={styles.recentDate}>
										{new Date(expense.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
									</Text>
								</View>
							</View>
							<Text style={styles.recentAmount}>{expense.amount.toFixed(2)}</Text>
						</TouchableOpacity>
					))}
				</View>
			)}

			{/* Empty state */}
			{breakdown.length === 0 && projects.length === 0 && (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyEmoji}>{"\u{1F4B0}"}</Text>
					<Text style={styles.emptyText}>{t("pmNoExpenses")}</Text>
					<Text style={styles.emptyHint}>{t("pmNoExpensesHint")}</Text>
				</View>
			)}
		</View>
	);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.title} numberOfLines={1}>{t("pmTitle")}</Text>
			</View>

			<FlatList
				data={[]}
				renderItem={null}
				ListHeaderComponent={renderContent}
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
					justifyContent: "space-between",
					alignItems: "center",
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.md,
				},
				title: {
					...typography.largeTitle,
					color: colors.textPrimary,
					flex: 1,
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
				breakdownRow: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingVertical: spacing.sm,
					borderBottomWidth: 0.5,
					borderBottomColor: colors.border,
				},
				breakdownLeft: {
					flexDirection: "row",
					alignItems: "center",
					flex: 1,
				},
				breakdownIcon: {
					fontSize: 20,
					marginRight: spacing.sm,
				},
				breakdownName: {
					...typography.body,
					color: colors.textPrimary,
					flex: 1,
				},
				breakdownAmount: {
					...typography.headline,
					color: colors.textPrimary,
				},
				recentItem: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingVertical: spacing.sm,
					borderBottomWidth: 0.5,
					borderBottomColor: colors.border,
				},
				recentLeft: {
					flexDirection: "row",
					alignItems: "center",
				},
				recentIcon: {
					fontSize: 20,
					marginRight: spacing.sm,
				},
				recentCategory: {
					...typography.body,
					color: colors.textPrimary,
				},
				recentDate: {
					...typography.footnote,
					color: colors.textSecondary,
				},
				recentAmount: {
					...typography.headline,
					color: colors.textPrimary,
				},
				emptyContainer: {
					alignItems: "center",
					paddingTop: spacing.xl * 3,
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
