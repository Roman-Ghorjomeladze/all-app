import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ExpenseWithDetails } from "../database";
import { Colors, spacing, typography } from "../theme";

type ExpenseListItemProps = {
	expense: ExpenseWithDetails;
	onPress: (expense: ExpenseWithDetails) => void;
	onDelete: (expense: ExpenseWithDetails) => void;
	colors: Colors;
};

export default function ExpenseListItem({ expense, onPress, onDelete, colors }: ExpenseListItemProps) {
	const styles = useStyles(colors);

	const formattedDate = useMemo(() => {
		const d = new Date(expense.date + "T00:00:00");
		return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
	}, [expense.date]);

	const icons = expense.category_icons ? expense.category_icons.split("|||") : [];
	const names = expense.category_names ? expense.category_names.split("|||") : [];
	const colorsList = expense.category_colors ? expense.category_colors.split("|||") : [];
	const firstIcon = icons[0] || null;
	const firstColor = colorsList[0] || colors.accent;
	const firstName = names[0] || null;
	const extraCount = icons.length > 1 ? icons.length - 1 : 0;

	return (
		<TouchableOpacity style={styles.card} onPress={() => onPress(expense)} activeOpacity={0.7}>
			<View style={styles.row}>
				<View style={styles.left}>
					{firstIcon && (
						<View style={styles.iconContainer}>
							<View style={[styles.categoryDot, { backgroundColor: firstColor }]}>
								<Text style={styles.categoryIcon}>{firstIcon}</Text>
							</View>
							{extraCount > 0 && (
								<View style={[styles.extraBadge, { backgroundColor: colors.accent }]}>
									<Text style={styles.extraBadgeText}>+{extraCount}</Text>
								</View>
							)}
						</View>
					)}
					<View style={styles.info}>
						<View style={styles.topRow}>
							<Text style={styles.amount}>{expense.amount.toFixed(2)}</Text>
							{expense.project_name && (
								<View style={styles.projectBadge}>
									<Text style={styles.projectBadgeText}>{expense.project_name}</Text>
								</View>
							)}
						</View>
						<View style={styles.bottomRow}>
							{firstName && (
								<Text style={styles.categoryName} numberOfLines={1}>
									{names.length > 1 ? `${firstName} +${extraCount}` : firstName}
								</Text>
							)}
							<Text style={styles.date}>{formattedDate}</Text>
						</View>
						{expense.notes ? (
							<Text style={styles.notes} numberOfLines={1}>{expense.notes}</Text>
						) : null}
					</View>
				</View>
				<TouchableOpacity
					onPress={() => onDelete(expense)}
					activeOpacity={0.7}
					hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
				>
					<Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
				</TouchableOpacity>
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
					borderRadius: 12,
					marginHorizontal: spacing.lg,
					marginBottom: spacing.sm,
					padding: spacing.md,
					shadowColor: colors.shadow,
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.08,
					shadowRadius: 4,
					elevation: 2,
				},
				row: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				left: {
					flexDirection: "row",
					alignItems: "center",
					flex: 1,
				},
				iconContainer: {
					marginRight: spacing.sm,
				},
				categoryDot: {
					width: 36,
					height: 36,
					borderRadius: 18,
					justifyContent: "center",
					alignItems: "center",
				},
				categoryIcon: {
					fontSize: 16,
				},
				extraBadge: {
					position: "absolute",
					top: -4,
					right: -8,
					minWidth: 18,
					height: 18,
					borderRadius: 9,
					justifyContent: "center",
					alignItems: "center",
					paddingHorizontal: 4,
				},
				extraBadgeText: {
					fontSize: 10,
					fontWeight: "700",
					color: colors.white,
				},
				info: {
					flex: 1,
				},
				topRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: spacing.sm,
				},
				amount: {
					...typography.headline,
					color: colors.textPrimary,
				},
				projectBadge: {
					backgroundColor: colors.accent + "20",
					paddingHorizontal: spacing.sm,
					paddingVertical: 2,
					borderRadius: 8,
				},
				projectBadgeText: {
					...typography.caption2,
					color: colors.accent,
					fontWeight: "600",
				},
				bottomRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: spacing.sm,
					marginTop: 2,
				},
				categoryName: {
					...typography.footnote,
					color: colors.textSecondary,
					flexShrink: 1,
				},
				date: {
					...typography.footnote,
					color: colors.textSecondary,
				},
				notes: {
					...typography.caption1,
					color: colors.textSecondary,
					marginTop: 2,
				},
			}),
		[colors]
	);
}
