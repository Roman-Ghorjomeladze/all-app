import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, spacing, typography } from "../theme";

type BudgetBarProps = {
	spent: number;
	budget: number;
	colors: Colors;
	showLabel?: boolean;
};

export default function BudgetBar({ spent, budget, colors, showLabel = true }: BudgetBarProps) {
	const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
	const barColor = percentage >= 90 ? colors.budgetDanger : percentage >= 70 ? colors.budgetWarning : colors.budgetSafe;
	const styles = useStyles(colors, barColor, percentage);

	return (
		<View style={styles.container}>
			<View style={styles.barBackground}>
				<View style={styles.barFill} />
			</View>
			{showLabel && (
				<Text style={styles.label}>
					{spent.toFixed(0)} / {budget.toFixed(0)} ({percentage.toFixed(0)}%)
				</Text>
			)}
		</View>
	);
}

function useStyles(colors: Colors, barColor: string, percentage: number) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					width: "100%",
				},
				barBackground: {
					height: 8,
					backgroundColor: colors.chipBackground,
					borderRadius: 4,
					overflow: "hidden",
				},
				barFill: {
					height: "100%",
					width: `${percentage}%`,
					backgroundColor: barColor,
					borderRadius: 4,
				},
				label: {
					...typography.caption1,
					color: colors.textSecondary,
					marginTop: spacing.xs,
				},
			}),
		[colors, barColor, percentage]
	);
}
