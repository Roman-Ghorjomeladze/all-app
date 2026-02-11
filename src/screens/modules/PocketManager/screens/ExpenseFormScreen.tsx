import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	View,
	Text,
	TextInput,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	Alert,
	Platform,
	KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { PocketManagerStackParamList } from "../../../../types/navigation";
import {
	initDatabase,
	createExpense,
	updateExpense,
	deleteExpense,
	getExpense,
	getGlobalCategories,
	getActiveProjects,
	getProjectCategories,
	GlobalCategory,
	ProjectCategory,
	ProjectWithStats,
} from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import AmountInput from "../components/AmountInput";
import CategoryPicker from "../components/CategoryPicker";
import ProjectPicker from "../components/ProjectPicker";

type Nav = NativeStackNavigationProp<PocketManagerStackParamList>;
type Route = RouteProp<PocketManagerStackParamList, "PMExpenseForm">;

export default function ExpenseFormScreen() {
	const navigation = useNavigation<Nav>();
	const route = useRoute<Route>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const isEdit = route.params.mode === "edit";
	const expenseId = isEdit ? (route.params as { mode: "edit"; expenseId: number }).expenseId : null;
	const preselectedProjectId = !isEdit ? (route.params as { mode: "create"; projectId?: number }).projectId ?? null : null;

	const [amount, setAmount] = useState("");
	const [date, setDate] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [notes, setNotes] = useState("");
	const [selectedProjectId, setSelectedProjectId] = useState<number | null>(preselectedProjectId);
	const [selectedGlobalCategoryId, setSelectedGlobalCategoryId] = useState<number | null>(null);
	const [selectedProjectCategoryId, setSelectedProjectCategoryId] = useState<number | null>(null);

	const [globalCategories, setGlobalCategories] = useState<GlobalCategory[]>([]);
	const [projectCategories, setProjectCategories] = useState<ProjectCategory[]>([]);
	const [projects, setProjects] = useState<ProjectWithStats[]>([]);

	useEffect(() => {
		async function load() {
			await initDatabase();
			const [gc, projs] = await Promise.all([
				getGlobalCategories(),
				getActiveProjects(),
			]);
			setGlobalCategories(gc);
			setProjects(projs);

			if (isEdit && expenseId) {
				const expense = await getExpense(expenseId);
				if (expense) {
					setAmount(expense.amount.toString());
					setDate(new Date(expense.date + "T00:00:00"));
					setNotes(expense.notes || "");
					setSelectedProjectId(expense.project_id);
					setSelectedGlobalCategoryId(expense.global_category_id);
					setSelectedProjectCategoryId(expense.project_category_id);
					if (expense.project_id) {
						const pc = await getProjectCategories(expense.project_id);
						setProjectCategories(pc);
					}
				}
			} else if (preselectedProjectId) {
				const pc = await getProjectCategories(preselectedProjectId);
				setProjectCategories(pc);
			}
		}
		load();
	}, [isEdit, expenseId, preselectedProjectId]);

	// When project changes, load its categories
	const handleProjectSelect = useCallback(async (projectId: number | null) => {
		setSelectedProjectId(projectId);
		setSelectedProjectCategoryId(null);
		setSelectedGlobalCategoryId(null);
		if (projectId) {
			const pc = await getProjectCategories(projectId);
			setProjectCategories(pc);
		} else {
			setProjectCategories([]);
		}
	}, []);

	const handleCategorySelect = useCallback((id: number) => {
		if (selectedProjectId) {
			setSelectedProjectCategoryId(id);
			setSelectedGlobalCategoryId(null);
		} else {
			setSelectedGlobalCategoryId(id);
			setSelectedProjectCategoryId(null);
		}
	}, [selectedProjectId]);

	const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
		if (Platform.OS === "android") setShowDatePicker(false);
		if (selectedDate) setDate(selectedDate);
	};

	const formatDate = (d: Date) => {
		return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
	};

	const toISODate = (d: Date) => {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
	};

	const handleSave = useCallback(async () => {
		const numAmount = parseFloat(amount);
		if (!amount || isNaN(numAmount) || numAmount <= 0) {
			Alert.alert(t("error"), t("pmAmountRequired"));
			return;
		}

		const data = {
			amount: numAmount,
			date: toISODate(date),
			notes: notes.trim() || null,
			project_id: selectedProjectId,
			global_category_id: selectedProjectId ? null : selectedGlobalCategoryId,
			project_category_id: selectedProjectId ? selectedProjectCategoryId : null,
		};

		if (isEdit && expenseId) {
			await updateExpense(expenseId, data);
		} else {
			await createExpense(data);
		}
		navigation.goBack();
	}, [amount, date, notes, selectedProjectId, selectedGlobalCategoryId, selectedProjectCategoryId, isEdit, expenseId, navigation, t]);

	const handleDelete = useCallback(async () => {
		if (!expenseId) return;
		Alert.alert(t("pmDeleteExpense"), t("pmDeleteExpenseConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("pmDelete"),
				style: "destructive",
				onPress: async () => {
					await deleteExpense(expenseId);
					navigation.goBack();
				},
			},
		]);
	}, [expenseId, navigation, t]);

	const currentCategories = selectedProjectId ? projectCategories : globalCategories;
	const currentCategoryId = selectedProjectId ? selectedProjectCategoryId : selectedGlobalCategoryId;

	return (
		<SafeAreaView style={styles.safeArea}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
					<Ionicons name="close" size={28} color={colors.textPrimary} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>
					{isEdit ? t("pmEditExpense") : t("pmAddExpense")}
				</Text>
				<TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
					<Text style={styles.saveButton}>{t("pmSave")}</Text>
				</TouchableOpacity>
			</View>

			<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
				{/* Amount */}
				<Text style={styles.label}>{t("pmAmount")}</Text>
				<AmountInput value={amount} onChangeText={setAmount} colors={colors} />

				{/* Date */}
				<Text style={styles.label}>{t("pmDate")}</Text>
				<TouchableOpacity
					style={styles.dateButton}
					onPress={() => setShowDatePicker(!showDatePicker)}
					activeOpacity={0.7}
				>
					<Ionicons name="calendar-outline" size={20} color={colors.accent} />
					<Text style={styles.dateButtonText}>{formatDate(date)}</Text>
				</TouchableOpacity>
				{showDatePicker && (
					<DateTimePicker
						value={date}
						mode="date"
						display={Platform.OS === "ios" ? "spinner" : "default"}
						onChange={handleDateChange}
					/>
				)}

				{/* Project */}
				{projects.length > 0 && (
					<>
						<Text style={styles.label}>{t("pmProject")}</Text>
						<ProjectPicker
							projects={projects}
							selectedId={selectedProjectId}
							onSelect={handleProjectSelect}
							colors={colors}
						/>
					</>
				)}

				{/* Category */}
				<Text style={styles.label}>{t("pmCategory")}</Text>
				{currentCategories.length > 0 ? (
					<CategoryPicker
						categories={currentCategories}
						selectedId={currentCategoryId}
						onSelect={handleCategorySelect}
						colors={colors}
					/>
				) : (
					<Text style={styles.noCategoryText}>{t("pmNoCategory")}</Text>
				)}

				{/* Notes */}
				<Text style={styles.label}>{t("pmNotes")}</Text>
				<TextInput
					style={[styles.textInput, styles.notesInput]}
					value={notes}
					onChangeText={setNotes}
					placeholder={t("pmNotesPlaceholder")}
					placeholderTextColor={colors.textSecondary}
					multiline
					textAlignVertical="top"
				/>

				{/* Delete Button */}
				{isEdit && (
					<TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.7}>
						<Ionicons name="trash-outline" size={20} color={colors.danger} />
						<Text style={styles.deleteButtonText}>{t("pmDelete")}</Text>
					</TouchableOpacity>
				)}
			</ScrollView>
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
				header: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.md,
					borderBottomWidth: 0.5,
					borderBottomColor: colors.border,
				},
				headerTitle: {
					...typography.headline,
					color: colors.textPrimary,
				},
				saveButton: {
					...typography.headline,
					color: colors.accent,
				},
				content: {
					padding: spacing.lg,
					paddingBottom: spacing.xl * 2,
				},
				label: {
					...typography.subhead,
					color: colors.textSecondary,
					marginBottom: spacing.sm,
					marginTop: spacing.lg,
				},
				textInput: {
					...typography.body,
					color: colors.textPrimary,
					backgroundColor: colors.cardBackground,
					borderRadius: 12,
					paddingHorizontal: spacing.md,
					paddingVertical: spacing.md,
					borderWidth: 1,
					borderColor: colors.border,
				},
				notesInput: {
					height: 80,
					paddingTop: spacing.md,
				},
				dateButton: {
					flexDirection: "row",
					alignItems: "center",
					backgroundColor: colors.cardBackground,
					borderRadius: 12,
					paddingHorizontal: spacing.md,
					paddingVertical: spacing.md,
					borderWidth: 1,
					borderColor: colors.border,
				},
				dateButtonText: {
					...typography.body,
					color: colors.textPrimary,
					marginLeft: spacing.sm,
				},
				noCategoryText: {
					...typography.subhead,
					color: colors.textSecondary,
					fontStyle: "italic",
				},
				deleteButton: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					marginTop: spacing.xl,
					paddingVertical: spacing.md,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: colors.danger,
				},
				deleteButtonText: {
					...typography.headline,
					color: colors.danger,
					marginLeft: spacing.sm,
				},
			}),
		[colors]
	);
}
