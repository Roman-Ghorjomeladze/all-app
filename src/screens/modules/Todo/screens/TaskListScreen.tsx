import React, { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Alert } from "react-native";
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
	deleteTask,
	deleteMultipleTasks,
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

	// Bulk selection state
	const [selectionMode, setSelectionMode] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

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

	const handleDelete = useCallback(async (task: TaskWithCategory) => {
		await cancelTaskNotifications(task.notification_id_at_time, task.notification_id_day_before);
		await deleteTask(task.id);
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

	// ── Bulk selection ──────────────────────────────
	const handleToggleSelect = useCallback((task: TaskWithCategory) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(task.id)) {
				next.delete(task.id);
			} else {
				next.add(task.id);
			}
			return next;
		});
		if (!selectionMode) {
			setSelectionMode(true);
		}
	}, [selectionMode]);

	const handleSelectAll = useCallback(() => {
		if (selectedIds.size === tasks.length) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(tasks.map((tk) => tk.id)));
		}
	}, [tasks, selectedIds.size]);

	const handleExitSelection = useCallback(() => {
		setSelectionMode(false);
		setSelectedIds(new Set());
	}, []);

	const handleBulkDelete = useCallback(() => {
		if (selectedIds.size === 0) return;
		Alert.alert(
			t("tdBulkDelete"),
			t("tdBulkDeleteConfirm", { count: String(selectedIds.size) }),
			[
				{ text: t("cancel"), style: "cancel" },
				{
					text: t("tdDelete"),
					style: "destructive",
					onPress: async () => {
						const selectedTasks = tasks.filter((tk) => selectedIds.has(tk.id));
						await Promise.all(
							selectedTasks.map((tk) =>
								cancelTaskNotifications(tk.notification_id_at_time, tk.notification_id_day_before)
							)
						);
						await deleteMultipleTasks(Array.from(selectedIds));
						setSelectionMode(false);
						setSelectedIds(new Set());
						loadData();
					},
				},
			]
		);
	}, [selectedIds, tasks, t, loadData]);

	const handleBulkComplete = useCallback(() => {
		if (selectedIds.size === 0) return;
		const selectedTasks = tasks.filter((tk) => selectedIds.has(tk.id));
		const incompleteCount = selectedTasks.filter((tk) => tk.is_completed === 0).length;
		const allDone = incompleteCount === 0;

		Alert.alert(
			allDone ? t("tdBulkMarkIncomplete") : t("tdBulkMarkComplete"),
			allDone
				? t("tdBulkMarkIncompleteConfirm", { count: String(selectedIds.size) })
				: t("tdBulkMarkCompleteConfirm", { count: String(selectedIds.size) }),
			[
				{ text: t("cancel"), style: "cancel" },
				{
					text: allDone ? t("tdMarkIncomplete") : t("tdMarkComplete"),
					onPress: async () => {
						for (const tk of selectedTasks) {
							const completing = tk.is_completed === 0;
							// Skip tasks already in the desired state
							if (allDone && completing) continue;
							if (!allDone && !completing) continue;

							await toggleTaskCompleted(tk.id, completing);

							if (completing && tk.recurrence_type !== "none") {
								await createNextRecurrence(tk);
							}

							if (completing) {
								await cancelTaskNotifications(tk.notification_id_at_time, tk.notification_id_day_before);
							} else if (tk.reminder_type !== "none") {
								await rescheduleTaskNotifications(tk);
							}
						}
						setSelectionMode(false);
						setSelectedIds(new Set());
						loadData();
					},
				},
			]
		);
	}, [selectedIds, tasks, t, loadData]);

	// ── Header rendering ────────────────────────────
	const renderNormalHeader = () => (
		<View style={styles.header}>
			<Text style={styles.title} numberOfLines={1}>{t("tdTitle")}</Text>
			<View style={styles.headerButtons}>
				<TouchableOpacity onPress={() => setSelectionMode(true)} activeOpacity={0.7} style={styles.headerButton}>
					<Ionicons name="checkmark-circle-outline" size={24} color={colors.textSecondary} />
				</TouchableOpacity>
				<TouchableOpacity onPress={handleAdd} activeOpacity={0.7} style={styles.headerButton}>
					<Ionicons name="add-circle" size={32} color={colors.accent} />
				</TouchableOpacity>
			</View>
		</View>
	);

	const renderSelectionHeader = () => (
		<View style={styles.header}>
			<TouchableOpacity onPress={handleExitSelection} activeOpacity={0.7} style={styles.headerButton}>
				<Ionicons name="close-circle" size={28} color={colors.textSecondary} />
			</TouchableOpacity>
			<Text style={styles.selectionTitle} numberOfLines={1}>
				{t("tdBulkSelectedCount", { count: String(selectedIds.size) })}
			</Text>
			<View style={styles.headerButtons}>
				<TouchableOpacity onPress={handleSelectAll} activeOpacity={0.7} style={styles.headerButton}>
					<Ionicons
						name={selectedIds.size === tasks.length && tasks.length > 0 ? "checkbox" : "square-outline"}
						size={22}
						color={colors.accent}
					/>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={handleBulkComplete}
					activeOpacity={0.7}
					style={styles.headerButton}
					disabled={selectedIds.size === 0}
				>
					<Ionicons
						name="checkmark-done"
						size={24}
						color={selectedIds.size > 0 ? colors.swipeComplete : colors.textSecondary}
					/>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={handleBulkDelete}
					activeOpacity={0.7}
					style={styles.headerButton}
					disabled={selectedIds.size === 0}
				>
					<Ionicons
						name="trash-outline"
						size={24}
						color={selectedIds.size > 0 ? colors.danger : colors.textSecondary}
					/>
				</TouchableOpacity>
			</View>
		</View>
	);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				keyboardVerticalOffset={0}
			>
				{/* Header */}
				{selectionMode ? renderSelectionHeader() : renderNormalHeader()}

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
								onDelete={handleDelete}
								selectionMode={selectionMode}
								isSelected={selectedIds.has(item.id)}
								onToggleSelect={handleToggleSelect}
							/>
						)}
						contentContainerStyle={styles.listContent}
						keyboardShouldPersistTaps="handled"
					/>
				)}

				{/* Quick Add */}
				{!selectionMode && <QuickAddBar onAdd={handleQuickAdd} />}
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
				selectionTitle: {
					...typography.headline,
					color: colors.textPrimary,
					flex: 1,
					marginLeft: spacing.sm,
				},
				headerButtons: {
					flexDirection: "row",
					alignItems: "center",
					gap: spacing.sm,
				},
				headerButton: {
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
