import React, { useCallback, useMemo, useState } from "react";
import {
	View,
	Text,
	FlatList,
	TextInput,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TodoStackParamList } from "../../../../types/navigation";
import {
	TaskWithCategory,
	Priority,
	CategoryWithCount,
	initDatabase,
	searchTasks,
	getAllCategories,
	toggleTaskCompleted,
	createNextRecurrence,
	deleteTask,
} from "../database";
import { cancelTaskNotifications, rescheduleTaskNotifications } from "../utils/notifications";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import TaskListItem from "../components/TaskListItem";

type Nav = NativeStackNavigationProp<TodoStackParamList>;

const PRIORITIES: Priority[] = ["high", "medium", "low"];
const PRIORITY_I18N: Record<Priority, string> = {
	none: "tdPriorityNone",
	high: "tdPriorityHigh",
	medium: "tdPriorityMedium",
	low: "tdPriorityLow",
};
const PRIORITY_COLOR: Record<Priority, string> = {
	none: "#8E8E93",
	high: "#F44336",
	medium: "#FF9800",
	low: "#4CAF50",
};

export default function SearchScreen() {
	const navigation = useNavigation<Nav>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const [query, setQuery] = useState("");
	const [results, setResults] = useState<TaskWithCategory[]>([]);
	const [categories, setCategories] = useState<CategoryWithCount[]>([]);
	const [selectedPriorities, setSelectedPriorities] = useState<Set<Priority>>(new Set());
	const [showCompleted, setShowCompleted] = useState<boolean | undefined>(undefined);
	const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
	const [hasSearched, setHasSearched] = useState(false);

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

	const doSearch = useCallback(async () => {
		await initDatabase();
		const priorities = selectedPriorities.size > 0 ? Array.from(selectedPriorities) : undefined;
		const res = await searchTasks(query, priorities, showCompleted, selectedCategoryId);
		setResults(res);
		setHasSearched(true);
	}, [query, selectedPriorities, showCompleted, selectedCategoryId]);

	// Auto-search on any filter/query change
	useFocusEffect(
		useCallback(() => {
			doSearch();
		}, [doSearch])
	);

	const togglePriority = useCallback((p: Priority) => {
		setSelectedPriorities((prev) => {
			const next = new Set(prev);
			if (next.has(p)) next.delete(p);
			else next.add(p);
			return next;
		});
	}, []);

	const handleToggleComplete = useCallback(async (task: TaskWithCategory) => {
		const completing = task.is_completed === 0;
		const { toggleTaskCompleted: toggle } = await import("../database");
		await toggle(task.id, completing);

		if (completing && task.recurrence_type !== "none") {
			await createNextRecurrence(task);
		}
		if (completing) {
			await cancelTaskNotifications(task.notification_id_at_time, task.notification_id_day_before);
		} else if (task.reminder_type !== "none") {
			await rescheduleTaskNotifications(task);
		}
		doSearch();
	}, [doSearch]);

	const handleDelete = useCallback(async (task: TaskWithCategory) => {
		await cancelTaskNotifications(task.notification_id_at_time, task.notification_id_day_before);
		await deleteTask(task.id);
		doSearch();
	}, [doSearch]);

	const handlePress = useCallback((task: TaskWithCategory) => {
		navigation.navigate("TodoTaskForm", { mode: "edit", taskId: task.id });
	}, [navigation]);

	const handleAdd = useCallback(() => {
		navigation.navigate("TodoTaskForm", { mode: "create" });
	}, [navigation]);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			<View style={styles.header}>
				<Text style={styles.title} numberOfLines={1}>{t("tdSearch")}</Text>
				<TouchableOpacity onPress={handleAdd} activeOpacity={0.7} style={styles.addButton}>
					<Ionicons name="add-circle" size={32} color={colors.accent} />
				</TouchableOpacity>
			</View>

			{/* Search bar */}
			<View style={styles.searchContainer}>
				<Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
				<TextInput
					style={styles.searchInput}
					placeholder={t("tdSearchPlaceholder")}
					placeholderTextColor={colors.textSecondary}
					value={query}
					onChangeText={setQuery}
					autoCorrect={false}
					returnKeyType="search"
				/>
				{query.length > 0 && (
					<TouchableOpacity onPress={() => setQuery("")} activeOpacity={0.7} style={styles.clearButton}>
						<Ionicons name="close-circle" size={18} color={colors.textSecondary} />
					</TouchableOpacity>
				)}
			</View>

			{/* Filter chips */}
			<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.chipsContainer}>
				{/* Status chips */}
				<TouchableOpacity
					style={[styles.chip, showCompleted === false && styles.chipActive]}
					onPress={() => setShowCompleted(showCompleted === false ? undefined : false)}
					activeOpacity={0.7}
				>
					<Text style={[styles.chipLabel, showCompleted === false && styles.chipLabelActive]}>{t("tdActive")}</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.chip, showCompleted === true && styles.chipActive]}
					onPress={() => setShowCompleted(showCompleted === true ? undefined : true)}
					activeOpacity={0.7}
				>
					<Text style={[styles.chipLabel, showCompleted === true && styles.chipLabelActive]}>{t("tdCompleted")}</Text>
				</TouchableOpacity>

				{/* Priority chips */}
				{PRIORITIES.map((p) => {
					const isSelected = selectedPriorities.has(p);
					const pColor = PRIORITY_COLOR[p];
					return (
						<TouchableOpacity
							key={p}
							style={[styles.chip, isSelected && { backgroundColor: pColor + "25", borderColor: pColor }]}
							onPress={() => togglePriority(p)}
							activeOpacity={0.7}
						>
							<View style={[styles.chipDot, { backgroundColor: pColor }]} />
							<Text style={[styles.chipLabel, isSelected && { color: pColor, fontWeight: "600" }]}>
								{t(PRIORITY_I18N[p])}
							</Text>
						</TouchableOpacity>
					);
				})}

				{/* Category chips */}
				{categories.map((cat) => {
					const isSelected = selectedCategoryId === cat.id;
					return (
						<TouchableOpacity
							key={cat.id}
							style={[styles.chip, isSelected && { backgroundColor: cat.color + "25", borderColor: cat.color }]}
							onPress={() => setSelectedCategoryId(isSelected ? null : cat.id)}
							activeOpacity={0.7}
						>
							<Text style={styles.chipEmoji}>{cat.icon}</Text>
							<Text style={[styles.chipLabel, isSelected && { color: cat.color, fontWeight: "600" }]}>{cat.name}</Text>
						</TouchableOpacity>
					);
				})}
			</ScrollView>

			{/* Results */}
			{results.length === 0 && hasSearched ? (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyEmoji}>{"\u{1F50D}"}</Text>
					<Text style={styles.emptyText}>{t("tdNoResults")}</Text>
				</View>
			) : (
				<FlatList
					data={results}
					keyExtractor={(item) => item.id.toString()}
					renderItem={({ item }) => (
						<TaskListItem
							task={item}
							onPress={handlePress}
							onToggleComplete={handleToggleComplete}
							onDelete={handleDelete}
						/>
					)}
					contentContainerStyle={styles.listContent}
					keyboardShouldPersistTaps="handled"
				/>
			)}
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
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.md,
				},
				title: {
					...typography.largeTitle,
					color: colors.textPrimary,
					flex: 1,
					marginRight: spacing.sm,
				},
				addButton: { padding: spacing.xs },
				searchContainer: {
					flexDirection: "row",
					alignItems: "center",
					backgroundColor: colors.inputBackground,
					marginHorizontal: spacing.md,
					borderRadius: 12,
					paddingHorizontal: spacing.md,
					height: 44,
				},
				searchIcon: { marginRight: spacing.sm },
				searchInput: {
					flex: 1,
					...typography.body,
					color: colors.textPrimary,
					paddingVertical: 0,
				},
				clearButton: { padding: spacing.xs, marginLeft: spacing.xs },
				chipsContainer: {
					paddingHorizontal: spacing.md,
					paddingVertical: spacing.sm,
				},
				chip: {
					flexDirection: "row",
					alignItems: "center",
					paddingHorizontal: 10,
					paddingVertical: 6,
					minHeight: 32,
					borderRadius: 16,
					backgroundColor: colors.chipBackground,
					borderWidth: 1,
					borderColor: "transparent",
					marginRight: 6,
				},
				chipActive: {
					backgroundColor: colors.accent + "25",
					borderColor: colors.accent,
				},
				chipLabel: {
					...typography.caption1,
					color: colors.textSecondary,
				},
				chipLabelActive: {
					color: colors.accent,
					fontWeight: "600",
				},
				chipDot: {
					width: 8,
					height: 8,
					borderRadius: 4,
					marginRight: 4,
				},
				chipEmoji: {
					fontSize: 12,
					marginRight: 3,
				},
				listContent: { paddingBottom: spacing.xl },
				emptyContainer: {
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					paddingHorizontal: spacing.xl,
				},
				emptyEmoji: { fontSize: 64, marginBottom: spacing.md },
				emptyText: {
					...typography.body,
					color: colors.textSecondary,
					textAlign: "center",
				},
			}),
		[colors]
	);
}
