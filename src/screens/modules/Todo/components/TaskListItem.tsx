import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TaskWithCategory } from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import PriorityIndicator from "./PriorityIndicator";
import CategoryChip from "./CategoryChip";
import { useLanguage } from "../../../../i18n";

type Props = {
	task: TaskWithCategory;
	onPress: (task: TaskWithCategory) => void;
	onToggleComplete: (task: TaskWithCategory) => void;
};

function formatDueDate(dueDate: string, t: (key: string, params?: Record<string, string>) => string): { text: string; isOverdue: boolean; isToday: boolean } {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const due = new Date(dueDate + "T00:00:00");
	due.setHours(0, 0, 0, 0);
	const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

	if (diff === 0) return { text: t("tdDueToday"), isOverdue: false, isToday: true };
	if (diff === 1) return { text: t("tdDueTomorrow"), isOverdue: false, isToday: false };
	if (diff < 0) return { text: t("tdOverdueBy", { days: String(Math.abs(diff)) }), isOverdue: true, isToday: false };

	const date = new Date(dueDate + "T00:00:00");
	return {
		text: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
		isOverdue: false,
		isToday: false,
	};
}

export default function TaskListItem({ task, onPress, onToggleComplete }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const isDone = task.is_completed === 1;

	const dueInfo = task.due_date ? formatDueDate(task.due_date, t) : null;
	const hasSubtasks = task.subtask_count > 0;

	return (
		<TouchableOpacity
			style={styles.container}
			onPress={() => onPress(task)}
			activeOpacity={0.7}
		>
			{/* Checkbox */}
			<TouchableOpacity
				onPress={() => onToggleComplete(task)}
				activeOpacity={0.7}
				style={styles.checkboxArea}
				hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
			>
				<View
					style={[
						styles.checkbox,
						isDone && { backgroundColor: colors.checkboxFilled, borderColor: colors.checkboxFilled },
					]}
				>
					{isDone && <Ionicons name="checkmark" size={14} color={colors.white} />}
				</View>
			</TouchableOpacity>

			{/* Content */}
			<View style={styles.content}>
				<View style={styles.topRow}>
					<Text
						style={[styles.title, isDone && styles.titleDone]}
						numberOfLines={2}
					>
						{task.title}
					</Text>
					<PriorityIndicator priority={task.priority} />
				</View>

				<View style={styles.metaRow}>
					{dueInfo && !isDone && (
						<Text
							style={[
								styles.dueText,
								dueInfo.isOverdue && { color: colors.overdue },
								dueInfo.isToday && { color: colors.today },
							]}
						>
							{dueInfo.text}
						</Text>
					)}
					{task.category_name && task.category_color && (
						<CategoryChip name={task.category_name} color={task.category_color} />
					)}
					{hasSubtasks && (
						<Text style={styles.subtaskText}>
							{t("tdSubtaskProgress", { done: String(task.subtask_done), total: String(task.subtask_count) })}
						</Text>
					)}
					{task.recurrence_type !== "none" && !isDone && (
						<Ionicons name="repeat" size={13} color={colors.textSecondary} />
					)}
				</View>
			</View>
		</TouchableOpacity>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					flexDirection: "row",
					alignItems: "flex-start",
					backgroundColor: colors.cardBackground,
					marginHorizontal: spacing.md,
					marginVertical: 3,
					paddingVertical: 12,
					paddingHorizontal: spacing.md,
					borderRadius: 12,
					borderWidth: 0.5,
					borderColor: colors.border,
				},
				checkboxArea: {
					paddingTop: 2,
					marginRight: 12,
				},
				checkbox: {
					width: 22,
					height: 22,
					borderRadius: 11,
					borderWidth: 2,
					borderColor: colors.checkboxBorder,
					justifyContent: "center",
					alignItems: "center",
				},
				content: {
					flex: 1,
				},
				topRow: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				title: {
					...typography.body,
					color: colors.textPrimary,
					flex: 1,
					marginRight: spacing.sm,
				},
				titleDone: {
					textDecorationLine: "line-through",
					color: colors.completed,
				},
				metaRow: {
					flexDirection: "row",
					alignItems: "center",
					flexWrap: "wrap",
					gap: 6,
					marginTop: 4,
				},
				dueText: {
					...typography.caption1,
					color: colors.textSecondary,
				},
				subtaskText: {
					...typography.caption1,
					color: colors.textSecondary,
				},
			}),
		[colors]
	);
}
