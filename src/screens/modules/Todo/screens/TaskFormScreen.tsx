import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	View,
	Text,
	TextInput,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	Alert,
	Platform,
	KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TodoStackParamList } from "../../../../types/navigation";
import {
	Task,
	Priority,
	ReminderType,
	RecurrenceType,
	Subtask,
	CategoryWithCount,
	initDatabase,
	getTask,
	createTask,
	updateTask,
	deleteTask,
	getAllCategories,
	getSubtasksByTask,
	createSubtask,
	deleteSubtask,
	toggleSubtaskCompleted,
} from "../database";
import { scheduleTaskNotifications, cancelTaskNotifications, rescheduleTaskNotifications } from "../utils/notifications";
import { updateTaskNotificationIds } from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import PrioritySelector from "../components/PrioritySelector";
import RecurrenceSelector from "../components/RecurrenceSelector";
import SubtaskItem from "../components/SubtaskItem";

type Nav = NativeStackNavigationProp<TodoStackParamList>;
type Route = RouteProp<TodoStackParamList, "TodoTaskForm">;

const REMINDER_TYPES: ReminderType[] = ["none", "at_time", "day_before", "both"];
const REMINDER_I18N: Record<ReminderType, string> = {
	none: "tdReminderNone",
	at_time: "tdReminderAtTime",
	day_before: "tdReminderDayBefore",
	both: "tdReminderBoth",
};

function formatDate(dateStr: string): string {
	const d = new Date(dateStr + "T00:00:00");
	return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function TaskFormScreen() {
	const navigation = useNavigation<Nav>();
	const route = useRoute<Route>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const isEdit = route.params.mode === "edit";
	const taskId = isEdit ? (route.params as { taskId: number }).taskId : undefined;
	const initialCategoryId = !isEdit ? (route.params as { categoryId?: number }).categoryId : undefined;
	const initialDueDate = !isEdit ? (route.params as { dueDate?: string }).dueDate : undefined;

	const [title, setTitle] = useState("");
	const [notes, setNotes] = useState("");
	const [priority, setPriority] = useState<Priority>("none");
	const [categoryId, setCategoryId] = useState<number | null>(initialCategoryId ?? null);
	const [dueDate, setDueDate] = useState<string | null>(initialDueDate ?? null);
	const [dueTime, setDueTime] = useState<string | null>(null);
	const [reminderType, setReminderType] = useState<ReminderType>("none");
	const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("none");
	const [recurrenceInterval, setRecurrenceInterval] = useState(1);
	const [categories, setCategories] = useState<CategoryWithCount[]>([]);
	const [subtasks, setSubtasks] = useState<Subtask[]>([]);
	const [newSubtask, setNewSubtask] = useState("");
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showTimePicker, setShowTimePicker] = useState(false);
	const [originalTask, setOriginalTask] = useState<Task | null>(null);

	useEffect(() => {
		const load = async () => {
			await initDatabase();
			const cats = await getAllCategories();
			setCategories(cats);

			if (isEdit && taskId) {
				const task = await getTask(taskId);
				if (task) {
					setOriginalTask(task);
					setTitle(task.title);
					setNotes(task.notes ?? "");
					setPriority(task.priority);
					setCategoryId(task.category_id);
					setDueDate(task.due_date);
					setDueTime(task.due_time);
					setReminderType(task.reminder_type);
					setRecurrenceType(task.recurrence_type);
					setRecurrenceInterval(task.recurrence_interval);
				}
				const subs = await getSubtasksByTask(taskId);
				setSubtasks(subs);
			}
		};
		load();
	}, [isEdit, taskId]);

	const canSave = title.trim().length > 0;

	const handleSave = useCallback(async () => {
		if (!canSave) return;

		const data = {
			title: title.trim(),
			category_id: categoryId,
			notes: notes.trim() || null,
			priority,
			due_date: dueDate,
			due_time: dueTime,
			reminder_type: reminderType,
			recurrence_type: recurrenceType,
			recurrence_interval: recurrenceInterval,
			recurrence_end_date: null as string | null,
		};

		if (isEdit && taskId) {
			await updateTask(taskId, data);
			// Reschedule notifications
			const task = await getTask(taskId);
			if (task) {
				await rescheduleTaskNotifications(task);
			}
		} else {
			const newId = await createTask(data);
			const task = await getTask(newId);
			if (task && task.reminder_type !== "none") {
				const { atTimeId, dayBeforeId } = await scheduleTaskNotifications(task);
				await updateTaskNotificationIds(newId, atTimeId, dayBeforeId);
			}
		}

		navigation.goBack();
	}, [canSave, title, categoryId, notes, priority, dueDate, dueTime, reminderType, recurrenceType, recurrenceInterval, isEdit, taskId, navigation]);

	const handleDelete = useCallback(() => {
		if (!isEdit || !taskId) return;
		Alert.alert(t("tdDelete"), t("tdDeleteTaskConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("tdDelete"),
				style: "destructive",
				onPress: async () => {
					if (originalTask) {
						await cancelTaskNotifications(originalTask.notification_id_at_time, originalTask.notification_id_day_before);
					}
					await deleteTask(taskId);
					navigation.goBack();
				},
			},
		]);
	}, [isEdit, taskId, originalTask, t, navigation]);

	const handleAddSubtask = useCallback(async () => {
		const trimmed = newSubtask.trim();
		if (!trimmed || !isEdit || !taskId) return;
		await createSubtask(taskId, trimmed);
		setNewSubtask("");
		const subs = await getSubtasksByTask(taskId);
		setSubtasks(subs);
	}, [newSubtask, isEdit, taskId]);

	const handleToggleSubtask = useCallback(async (id: number, completed: boolean) => {
		await toggleSubtaskCompleted(id, completed);
		if (taskId) {
			const subs = await getSubtasksByTask(taskId);
			setSubtasks(subs);
		}
	}, [taskId]);

	const handleDeleteSubtask = useCallback(async (id: number) => {
		await deleteSubtask(id);
		if (taskId) {
			const subs = await getSubtasksByTask(taskId);
			setSubtasks(subs);
		}
	}, [taskId]);

	const handleDateChange = useCallback((_: unknown, date?: Date) => {
		if (Platform.OS === "android") setShowDatePicker(false);
		if (date) {
			const y = date.getFullYear();
			const m = String(date.getMonth() + 1).padStart(2, "0");
			const d = String(date.getDate()).padStart(2, "0");
			setDueDate(`${y}-${m}-${d}`);
		}
	}, []);

	const handleTimeChange = useCallback((_: unknown, date?: Date) => {
		if (Platform.OS === "android") setShowTimePicker(false);
		if (date) {
			const h = String(date.getHours()).padStart(2, "0");
			const m = String(date.getMinutes()).padStart(2, "0");
			setDueTime(`${h}:${m}`);
		}
	}, []);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.headerBtn}>
					<Ionicons name="close" size={28} color={colors.textPrimary} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>{isEdit ? t("tdEditTask") : t("tdAddTask")}</Text>
				<TouchableOpacity
					onPress={handleSave}
					activeOpacity={0.7}
					style={styles.headerBtn}
					disabled={!canSave}
				>
					<Text style={[styles.saveText, !canSave && { opacity: 0.4 }]}>{t("tdSave")}</Text>
				</TouchableOpacity>
			</View>

			<ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
				{/* Title */}
				<Text style={styles.sectionLabel}>{t("tdTaskTitle")}</Text>
				<TextInput
					style={styles.input}
					value={title}
					onChangeText={setTitle}
					placeholder={t("tdTaskTitlePlaceholder")}
					placeholderTextColor={colors.textSecondary}
					autoFocus={!isEdit}
				/>

				{/* Category */}
				<Text style={styles.sectionLabel}>{t("tdCategory")}</Text>
				<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
					<TouchableOpacity
						style={[styles.catChip, categoryId === null && styles.catChipActive]}
						onPress={() => setCategoryId(null)}
						activeOpacity={0.7}
					>
						<Text style={[styles.catChipLabel, categoryId === null && styles.catChipLabelActive]}>
							{t("tdNoCategory")}
						</Text>
					</TouchableOpacity>
					{categories.map((cat) => {
						const isSelected = categoryId === cat.id;
						return (
							<TouchableOpacity
								key={cat.id}
								style={[styles.catChip, isSelected && { backgroundColor: cat.color + "25", borderColor: cat.color }]}
								onPress={() => setCategoryId(cat.id)}
								activeOpacity={0.7}
							>
								<Text style={styles.catChipEmoji}>{cat.icon}</Text>
								<Text style={[styles.catChipLabel, isSelected && { color: cat.color, fontWeight: "600" }]}>
									{cat.name}
								</Text>
							</TouchableOpacity>
						);
					})}
				</ScrollView>

				{/* Priority */}
				<Text style={styles.sectionLabel}>{t("tdPriority")}</Text>
				<PrioritySelector value={priority} onChange={setPriority} />

				{/* Due Date */}
				<Text style={styles.sectionLabel}>{t("tdDueDate")}</Text>
				<View style={styles.dateRow}>
					<TouchableOpacity
						style={styles.dateButton}
						onPress={() => setShowDatePicker(true)}
						activeOpacity={0.7}
					>
						<Ionicons name="calendar-outline" size={18} color={colors.accent} />
						<Text style={[styles.dateText, !dueDate && { color: colors.textSecondary }]}>
							{dueDate ? formatDate(dueDate) : t("tdDueDate")}
						</Text>
					</TouchableOpacity>
					{dueDate && (
						<TouchableOpacity onPress={() => { setDueDate(null); setDueTime(null); }} activeOpacity={0.7} style={styles.clearDateBtn}>
							<Ionicons name="close-circle" size={20} color={colors.textSecondary} />
						</TouchableOpacity>
					)}
				</View>
				{(showDatePicker || Platform.OS === "android") && showDatePicker && (
					<DateTimePicker
						value={dueDate ? new Date(dueDate + "T00:00:00") : new Date()}
						mode="date"
						display={Platform.OS === "ios" ? "spinner" : "default"}
						onChange={handleDateChange}
					/>
				)}

				{/* Due Time (only if date set) */}
				{dueDate && (
					<>
						<Text style={styles.sectionLabel}>{t("tdDueTime")}</Text>
						<View style={styles.dateRow}>
							<TouchableOpacity
								style={styles.dateButton}
								onPress={() => setShowTimePicker(true)}
								activeOpacity={0.7}
							>
								<Ionicons name="time-outline" size={18} color={colors.accent} />
								<Text style={[styles.dateText, !dueTime && { color: colors.textSecondary }]}>
									{dueTime ?? t("tdDueTime")}
								</Text>
							</TouchableOpacity>
							{dueTime && (
								<TouchableOpacity onPress={() => setDueTime(null)} activeOpacity={0.7} style={styles.clearDateBtn}>
									<Ionicons name="close-circle" size={20} color={colors.textSecondary} />
								</TouchableOpacity>
							)}
						</View>
						{showTimePicker && (
							<DateTimePicker
								value={dueTime ? new Date(`2000-01-01T${dueTime}:00`) : new Date()}
								mode="time"
								display={Platform.OS === "ios" ? "spinner" : "default"}
								onChange={handleTimeChange}
							/>
						)}
					</>
				)}

				{/* Reminder */}
				{dueDate && (
					<>
						<Text style={styles.sectionLabel}>{t("tdReminder")}</Text>
						<View style={styles.chipRow}>
							{REMINDER_TYPES.map((r) => {
								const isSelected = reminderType === r;
								return (
									<TouchableOpacity
										key={r}
										style={[styles.chip, isSelected && styles.chipActive]}
										onPress={() => setReminderType(r)}
										activeOpacity={0.7}
									>
										<Text style={[styles.chipLabel, isSelected && styles.chipLabelActive]}>
											{t(REMINDER_I18N[r])}
										</Text>
									</TouchableOpacity>
								);
							})}
						</View>
					</>
				)}

				{/* Recurrence */}
				<Text style={styles.sectionLabel}>{t("tdRecurrence")}</Text>
				<RecurrenceSelector
					type={recurrenceType}
					interval={recurrenceInterval}
					onTypeChange={setRecurrenceType}
					onIntervalChange={setRecurrenceInterval}
				/>

				{/* Notes */}
				<Text style={styles.sectionLabel}>{t("tdNotes")}</Text>
				<TextInput
					style={[styles.input, styles.notesInput]}
					value={notes}
					onChangeText={setNotes}
					placeholder={t("tdNotesPlaceholder")}
					placeholderTextColor={colors.textSecondary}
					multiline
					textAlignVertical="top"
				/>

				{/* Subtasks (only in edit mode) */}
				{isEdit && taskId && (
					<>
						<Text style={styles.sectionLabel}>
							{t("tdSubtasks")}
							{subtasks.length > 0 && ` (${subtasks.filter((s) => s.is_completed).length}/${subtasks.length})`}
						</Text>
						{subtasks.map((sub) => (
							<SubtaskItem
								key={sub.id}
								subtask={sub}
								onToggle={handleToggleSubtask}
								onDelete={handleDeleteSubtask}
							/>
						))}
						<View style={styles.addSubtaskRow}>
							<TextInput
								style={styles.subtaskInput}
								value={newSubtask}
								onChangeText={setNewSubtask}
								placeholder={t("tdSubtaskPlaceholder")}
								placeholderTextColor={colors.textSecondary}
								returnKeyType="done"
								onSubmitEditing={handleAddSubtask}
							/>
							<TouchableOpacity onPress={handleAddSubtask} activeOpacity={0.7} disabled={!newSubtask.trim()}>
								<Ionicons name="add-circle" size={28} color={newSubtask.trim() ? colors.accent : colors.textSecondary} />
							</TouchableOpacity>
						</View>
					</>
				)}

				{/* Delete */}
				{isEdit && (
					<TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.7}>
						<Ionicons name="trash-outline" size={20} color={colors.danger} />
						<Text style={styles.deleteText}>{t("tdDelete")}</Text>
					</TouchableOpacity>
				)}

				<View style={{ height: 40 }} />
			</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				safeArea: { flex: 1, backgroundColor: colors.background },
				header: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingHorizontal: spacing.md,
					paddingVertical: spacing.sm,
					borderBottomWidth: 0.5,
					borderBottomColor: colors.border,
				},
				headerBtn: { padding: spacing.sm },
				headerTitle: {
					...typography.headline,
					color: colors.textPrimary,
				},
				saveText: {
					...typography.headline,
					color: colors.accent,
				},
				form: {
					padding: spacing.lg,
				},
				sectionLabel: {
					...typography.footnote,
					color: colors.textSecondary,
					textTransform: "uppercase",
					letterSpacing: 0.5,
					marginTop: spacing.lg,
					marginBottom: spacing.sm,
				},
				input: {
					backgroundColor: colors.cardBackground,
					padding: spacing.md,
					borderRadius: 12,
					borderWidth: 0.5,
					borderColor: colors.border,
					...typography.body,
					color: colors.textPrimary,
				},
				notesInput: {
					minHeight: 80,
					paddingTop: spacing.md,
				},
				catChip: {
					flexDirection: "row",
					alignItems: "center",
					paddingHorizontal: 12,
					paddingVertical: 8,
					borderRadius: 16,
					backgroundColor: colors.chipBackground,
					borderWidth: 1,
					borderColor: "transparent",
					marginRight: 6,
				},
				catChipActive: {
					backgroundColor: colors.accent + "25",
					borderColor: colors.accent,
				},
				catChipEmoji: {
					fontSize: 14,
					marginRight: 4,
				},
				catChipLabel: {
					...typography.subhead,
					color: colors.textSecondary,
				},
				catChipLabelActive: {
					color: colors.accent,
					fontWeight: "600",
				},
				dateRow: {
					flexDirection: "row",
					alignItems: "center",
				},
				dateButton: {
					flexDirection: "row",
					alignItems: "center",
					backgroundColor: colors.cardBackground,
					padding: spacing.md,
					borderRadius: 12,
					borderWidth: 0.5,
					borderColor: colors.border,
					flex: 1,
					gap: spacing.sm,
				},
				dateText: {
					...typography.body,
					color: colors.textPrimary,
				},
				clearDateBtn: {
					padding: spacing.sm,
					marginLeft: spacing.xs,
				},
				chipRow: {
					flexDirection: "row",
					flexWrap: "wrap",
					gap: 6,
				},
				chip: {
					paddingHorizontal: 12,
					paddingVertical: 8,
					borderRadius: 16,
					backgroundColor: colors.chipBackground,
					borderWidth: 1,
					borderColor: "transparent",
				},
				chipActive: {
					backgroundColor: colors.accent + "25",
					borderColor: colors.accent,
				},
				chipLabel: {
					...typography.subhead,
					color: colors.textSecondary,
				},
				chipLabelActive: {
					color: colors.accent,
					fontWeight: "600",
				},
				addSubtaskRow: {
					flexDirection: "row",
					alignItems: "center",
					marginTop: spacing.sm,
				},
				subtaskInput: {
					flex: 1,
					backgroundColor: colors.cardBackground,
					padding: spacing.md,
					borderRadius: 12,
					borderWidth: 0.5,
					borderColor: colors.border,
					...typography.body,
					color: colors.textPrimary,
					marginRight: spacing.sm,
				},
				deleteButton: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					paddingVertical: spacing.md,
					marginTop: spacing.xl,
					gap: spacing.sm,
				},
				deleteText: {
					...typography.headline,
					color: colors.danger,
				},
			}),
		[colors]
	);
}
