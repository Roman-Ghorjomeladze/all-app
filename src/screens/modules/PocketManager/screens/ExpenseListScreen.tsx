import React, { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PocketManagerStackParamList } from "../../../../types/navigation";
import {
	initDatabase,
	getExpensesForMonth,
	getMonthlyTotal,
	deleteExpense,
	ExpenseWithDetails,
} from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import MonthChipBar from "../components/MonthChipBar";
import ExpenseListItem from "../components/ExpenseListItem";

type Nav = NativeStackNavigationProp<PocketManagerStackParamList>;

export default function ExpenseListScreen() {
	const navigation = useNavigation<Nav>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const now = new Date();
	const [year, setYear] = useState(now.getFullYear());
	const [month, setMonth] = useState(now.getMonth() + 1);
	const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
	const [total, setTotal] = useState(0);

	const loadData = useCallback(async () => {
		await initDatabase();
		const [list, monthTotal] = await Promise.all([
			getExpensesForMonth(year, month),
			getMonthlyTotal(year, month),
		]);
		setExpenses(list);
		setTotal(monthTotal);
	}, [year, month]);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData])
	);

	const handleAdd = useCallback(() => {
		navigation.navigate("PMExpenseForm", { mode: "create" });
	}, [navigation]);

	const handlePress = useCallback((expense: ExpenseWithDetails) => {
		navigation.navigate("PMExpenseForm", { mode: "edit", expenseId: expense.id });
	}, [navigation]);

	const handleDelete = useCallback((expense: ExpenseWithDetails) => {
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

	const handleMonthSelect = useCallback((y: number, m: number) => {
		setYear(y);
		setMonth(m);
	}, []);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.title} numberOfLines={1}>{t("pmExpenses")}</Text>
				<TouchableOpacity onPress={handleAdd} activeOpacity={0.7}>
					<Ionicons name="add-circle" size={32} color={colors.accent} />
				</TouchableOpacity>
			</View>

			{/* Month Filter */}
			<MonthChipBar
				selectedYear={year}
				selectedMonth={month}
				onSelect={handleMonthSelect}
				colors={colors}
			/>

			{/* Content area - flex:1 keeps chips pinned at top */}
			<View style={styles.contentArea}>
				{/* Monthly Total */}
				<View style={styles.totalRow}>
					<Text style={styles.totalLabel}>{t("pmMonthlySpending")}</Text>
					<Text style={styles.totalAmount}>{"\u{20BE}"}{total.toFixed(2)}</Text>
				</View>

				{/* Expense List */}
				{expenses.length === 0 ? (
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyEmoji}>{"\u{1F4B3}"}</Text>
						<Text style={styles.emptyText}>{t("pmNoExpenses")}</Text>
					</View>
				) : (
					<FlatList
						style={{ flex: 1 }}
						data={expenses}
						keyExtractor={(item) => item.id.toString()}
						renderItem={({ item }) => (
							<ExpenseListItem
								expense={item}
								onPress={handlePress}
								onDelete={handleDelete}
								colors={colors}
							/>
						)}
						contentContainerStyle={styles.listContent}
					/>
				)}
			</View>
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
					paddingBottom: spacing.xs,
				},
				title: {
					...typography.largeTitle,
					color: colors.textPrimary,
					flex: 1,
					marginRight: spacing.sm,
				},
				contentArea: {
				flex: 1,
			},
			totalRow: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.xs,
				},
				totalLabel: {
					...typography.subhead,
					color: colors.textSecondary,
				},
				totalAmount: {
					...typography.headline,
					color: colors.accent,
				},
				listContent: {
					paddingBottom: spacing.md,
					paddingTop: spacing.xs,
				},
				emptyContainer: {
					flex: 1,
					alignItems: "center",
					paddingHorizontal: spacing.xl,
					paddingTop: spacing.xl * 3,
				},
				emptyEmoji: {
					fontSize: 64,
					marginBottom: spacing.md,
				},
				emptyText: {
					...typography.body,
					color: colors.textSecondary,
					textAlign: "center",
				},
			}),
		[colors]
	);
}
