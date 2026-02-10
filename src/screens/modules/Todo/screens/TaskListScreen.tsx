import React, { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TodoStackParamList } from "../../../../types/navigation";
import {
	TaskWithCategory,
	SmartFilter,
	SortMode,
	initDatabase,
	getTasksForSmartList,
	getSmartListCounts,
	toggleTaskCompleted,
	createTask,
	createNextRecurrence,
} from "../database";
import { rescheduleTaskNotifications, cancelTaskNotifications } from "../utils/notifications";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import SmartFilterBar from "../components/SmartFilterBar";
import TaskListItem from "../components/TaskListItem";
import QuickAddBar from "../components/QuickAddBar";
import SortButton from "../components/SortButton";

type Nav = NativeStackNavigationProp<TodoStackParamList>;

const EMPTY_I18N: Record<SmartFilter, string> = {
	all: "tdNoTasks",
	today: "tdNoTasksToday",
	upcoming: "tdNoTasksUpcoming",
	overdue: "tdNoOverdue",
	completed: "tdNoCompleted",
	no_date: "tdNoTasks",
};

const EMPTY_EMOJI: Record<SmartFilter, string> = {
	all: "\u{2705}",
	today: "\u{2600}\u{FE0F}",
	upcoming: "\u{1F4C5}",
	overdue: "\u{1F389}",
	completed: "\u{1F3C6}",
	no_date: "\u{1F4CB}",
};

export default function TaskListScreen() {
	const navigation = useNavigation<Nav>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const [tasks, setTasks] = useState<TaskWithCategory[]>([]);
	const [filter, setFilter] = useState<SmartFilter>("all");
	const [sort, setSort] = useState<SortMode>("due_date");
	const [counts, setCounts] = useState<Record<SmartFilter, number>>({
		all: 0, today: 0, upcoming: 0, overdue: 0, completed: 0, no_date: 0,
	});

	const loadData = useCallback(async () => {
		await initDatabase();
		const [taskList, smartCounts] = await Promise.all([
			getTasksForSmartList(filter, sort),
			getSmartListCounts(),
		]);
		setTasks(taskList);
		setCounts(smartCounts);
	}, [filter, sort]);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData])
	);

	const handleToggleComplete = useCallback(async (task: TaskWithCategory) => {
		const completing = task.is_completed === 0;
		await toggleTaskCompleted(task.id, completing);

		if (completing && task.recurrence_type !== "none") {
			const newId = await createNextRecurrence(task);
			if (newId && task.reminder_type !== "none") {
				// The new task needs notifications scheduled — but we need the full task object
				// This will be handled on next load via refreshAllTaskNotifications
			}
		}

		if (completing) {
			await cancelTaskNotifications(task.notification_id_at_time, task.notification_id_day_before);
		} else if (task.reminder_type !== "none") {
			await rescheduleTaskNotifications(task);
		}

		loadData();
	}, [loadData]);

	const handlePress = useCallback((task: TaskWithCategory) => {
		navigation.navigate("TodoTaskForm", { mode: "edit", taskId: task.id });
	}, [navigation]);

	const handleAdd = useCallback(() => {
		navigation.navigate("TodoTaskForm", { mode: "create" });
	}, [navigation]);

	const handleQuickAdd = useCallback(async (title: string) => {
		await initDatabase();
		await createTask({ title });
		loadData();
	}, [loadData]);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				keyboardVerticalOffset={0}
			>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.title} numberOfLines={1}>{t("tdTitle")}</Text>
					<TouchableOpacity onPress={handleAdd} activeOpacity={0.7} style={styles.addButton}>
						<Ionicons name="add-circle" size={32} color={colors.accent} />
					</TouchableOpacity>
				</View>

				{/* Smart Filters */}
				<SmartFilterBar active={filter} counts={counts} onChange={setFilter} />

				{/* Sort */}
				<SortButton current={sort} onChange={setSort} />

				{/* Task List */}
				{tasks.length === 0 ? (
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyEmoji}>{EMPTY_EMOJI[filter]}</Text>
						<Text style={styles.emptyText}>{t(EMPTY_I18N[filter])}</Text>
						{filter === "all" && (
							<Text style={styles.emptyHint}>{t("tdNoTasksHint")}</Text>
						)}
					</View>
				) : (
					<FlatList
						data={tasks}
						keyExtractor={(item) => item.id.toString()}
						renderItem={({ item }) => (
							<TaskListItem
								task={item}
								onPress={handlePress}
								onToggleComplete={handleToggleComplete}
							/>
						)}
						contentContainerStyle={styles.listContent}
						keyboardShouldPersistTaps="handled"
					/>
				)}

				{/* Quick Add */}
				<QuickAddBar onAdd={handleQuickAdd} />
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
				flex: {
					flex: 1,
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
					paddingBottom: spacing.md,
					paddingTop: spacing.xs,
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
