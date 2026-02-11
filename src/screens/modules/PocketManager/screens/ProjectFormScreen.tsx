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
	createProject,
	updateProject,
	deleteProject,
	archiveProject,
	getProject,
	getProjectCategories,
	createProjectCategory,
	updateProjectCategory,
	deleteProjectCategory,
	ProjectCategory,
} from "../database";
import { useColors, Colors, spacing, typography, CATEGORY_COLORS } from "../theme";
import { useLanguage } from "../../../../i18n";
import InlineCategoryEditor from "../components/InlineCategoryEditor";

type Nav = NativeStackNavigationProp<PocketManagerStackParamList>;
type Route = RouteProp<PocketManagerStackParamList, "PMProjectForm">;

const DEFAULT_ICONS = ["\u{1F527}", "\u{1F3D7}\u{FE0F}", "\u{1F4E6}", "\u{1F3A8}", "\u{26A1}", "\u{2699}\u{FE0F}", "\u{1F4CB}", "\u{1F6E0}\u{FE0F}"];

type LocalCategory = {
	id?: number;
	name: string;
	icon: string;
	color: string;
	isNew?: boolean;
	deleted?: boolean;
};

export default function ProjectFormScreen() {
	const navigation = useNavigation<Nav>();
	const route = useRoute<Route>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const isEdit = route.params.mode === "edit";
	const projectId = isEdit ? (route.params as { mode: "edit"; projectId: number }).projectId : null;

	const [name, setName] = useState("");
	const [budget, setBudget] = useState("");
	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [showStartPicker, setShowStartPicker] = useState(false);
	const [showEndPicker, setShowEndPicker] = useState(false);
	const [categories, setCategories] = useState<LocalCategory[]>([]);

	useEffect(() => {
		async function load() {
			await initDatabase();
			if (isEdit && projectId) {
				const project = await getProject(projectId);
				if (project) {
					setName(project.name);
					setBudget(project.budget != null ? project.budget.toString() : "");
					if (project.start_date) setStartDate(new Date(project.start_date + "T00:00:00"));
					if (project.end_date) setEndDate(new Date(project.end_date + "T00:00:00"));
				}
				const cats = await getProjectCategories(projectId);
				setCategories(cats.map((c) => ({ id: c.id, name: c.name, icon: c.icon, color: c.color })));
			}
		}
		load();
	}, [isEdit, projectId]);

	const toISODate = (d: Date) => {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
	};

	const handleStartDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
		if (Platform.OS === "android") setShowStartPicker(false);
		if (selectedDate) setStartDate(selectedDate);
	};

	const handleEndDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
		if (Platform.OS === "android") setShowEndPicker(false);
		if (selectedDate) setEndDate(selectedDate);
	};

	const handleAddCategory = () => {
		const colorIndex = categories.length % CATEGORY_COLORS.length;
		const iconIndex = categories.length % DEFAULT_ICONS.length;
		setCategories([...categories, {
			name: "",
			icon: DEFAULT_ICONS[iconIndex],
			color: CATEGORY_COLORS[colorIndex],
			isNew: true,
		}]);
	};

	const handleCategoryNameChange = (index: number, newName: string) => {
		const updated = [...categories];
		updated[index] = { ...updated[index], name: newName };
		setCategories(updated);
	};

	const handleCategoryIconChange = (index: number, newIcon: string) => {
		const updated = [...categories];
		updated[index] = { ...updated[index], icon: newIcon };
		setCategories(updated);
	};

	const handleCategoryDelete = (index: number) => {
		const updated = [...categories];
		if (updated[index].id) {
			updated[index] = { ...updated[index], deleted: true };
		} else {
			updated.splice(index, 1);
		}
		setCategories(updated);
	};

	const handleSave = useCallback(async () => {
		if (!name.trim()) {
			Alert.alert(t("error"), t("pmProjectNameRequired"));
			return;
		}

		const budgetNum = budget ? parseFloat(budget) : null;

		if (isEdit && projectId) {
			await updateProject(projectId, {
				name: name.trim(),
				budget: budgetNum,
				start_date: startDate ? toISODate(startDate) : null,
				end_date: endDate ? toISODate(endDate) : null,
			});

			// Sync categories
			for (const cat of categories) {
				if (cat.deleted && cat.id) {
					await deleteProjectCategory(cat.id);
				} else if (cat.isNew && !cat.deleted && cat.name.trim()) {
					await createProjectCategory(projectId, cat.name.trim(), cat.icon, cat.color);
				} else if (cat.id && !cat.deleted && cat.name.trim()) {
					await updateProjectCategory(cat.id, cat.name.trim(), cat.icon, cat.color);
				}
			}
		} else {
			const newId = await createProject(
				name.trim(),
				budgetNum,
				startDate ? toISODate(startDate) : null,
				endDate ? toISODate(endDate) : null
			);
			// Create categories
			for (const cat of categories) {
				if (!cat.deleted && cat.name.trim()) {
					await createProjectCategory(newId, cat.name.trim(), cat.icon, cat.color);
				}
			}
		}
		navigation.goBack();
	}, [name, budget, startDate, endDate, categories, isEdit, projectId, navigation, t]);

	const handleDelete = useCallback(async () => {
		if (!projectId) return;
		Alert.alert(t("pmDeleteProject"), t("pmDeleteProjectConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("pmDelete"),
				style: "destructive",
				onPress: async () => {
					await deleteProject(projectId);
					navigation.goBack();
				},
			},
		]);
	}, [projectId, navigation, t]);

	const handleArchive = useCallback(async () => {
		if (!projectId) return;
		Alert.alert(t("pmArchive"), t("pmArchiveConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("pmArchive"),
				onPress: async () => {
					await archiveProject(projectId);
					navigation.goBack();
				},
			},
		]);
	}, [projectId, navigation, t]);

	const formatDate = (d: Date | null) => {
		if (!d) return t("pmNotSet");
		return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
	};

	const visibleCategories = categories.filter((c) => !c.deleted);

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
					{isEdit ? t("pmEditProject") : t("pmAddProject")}
				</Text>
				<TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
					<Text style={styles.saveButton}>{t("pmSave")}</Text>
				</TouchableOpacity>
			</View>

			<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
				{/* Name */}
				<Text style={styles.label}>{t("pmProjectName")}</Text>
				<TextInput
					style={styles.textInput}
					value={name}
					onChangeText={setName}
					placeholder={t("pmProjectNamePlaceholder")}
					placeholderTextColor={colors.textSecondary}
				/>

				{/* Budget */}
				<Text style={styles.label}>{t("pmBudget")}</Text>
				<TextInput
					style={styles.textInput}
					value={budget}
					onChangeText={(text) => {
						const cleaned = text.replace(/[^0-9.]/g, "");
						setBudget(cleaned);
					}}
					placeholder={t("pmNoBudget")}
					placeholderTextColor={colors.textSecondary}
					keyboardType="decimal-pad"
				/>

				{/* Start Date */}
				<Text style={styles.label}>{t("pmStartDate")}</Text>
				<TouchableOpacity
					style={styles.dateButton}
					onPress={() => setShowStartPicker(!showStartPicker)}
					activeOpacity={0.7}
				>
					<Ionicons name="calendar-outline" size={20} color={colors.accent} />
					<Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
					{startDate && (
						<TouchableOpacity
							onPress={() => { setStartDate(null); setShowStartPicker(false); }}
							hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
						>
							<Ionicons name="close-circle" size={18} color={colors.textSecondary} />
						</TouchableOpacity>
					)}
				</TouchableOpacity>
				{showStartPicker && (
					<>
						{Platform.OS === "ios" && (
							<View style={styles.pickerContainer}>
								<TouchableOpacity onPress={() => setShowStartPicker(false)} activeOpacity={0.7}>
									<Text style={styles.pickerDone}>{t("done")}</Text>
								</TouchableOpacity>
							</View>
						)}
						<DateTimePicker
							value={startDate || new Date()}
							mode="date"
							display={Platform.OS === "ios" ? "spinner" : "default"}
							onChange={handleStartDateChange}
						/>
					</>
				)}

				{/* End Date */}
				<Text style={styles.label}>{t("pmEndDate")}</Text>
				<TouchableOpacity
					style={styles.dateButton}
					onPress={() => setShowEndPicker(!showEndPicker)}
					activeOpacity={0.7}
				>
					<Ionicons name="calendar-outline" size={20} color={colors.accent} />
					<Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
					{endDate && (
						<TouchableOpacity
							onPress={() => { setEndDate(null); setShowEndPicker(false); }}
							hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
						>
							<Ionicons name="close-circle" size={18} color={colors.textSecondary} />
						</TouchableOpacity>
					)}
				</TouchableOpacity>
				{showEndPicker && (
					<>
						{Platform.OS === "ios" && (
							<View style={styles.pickerContainer}>
								<TouchableOpacity onPress={() => setShowEndPicker(false)} activeOpacity={0.7}>
									<Text style={styles.pickerDone}>{t("done")}</Text>
								</TouchableOpacity>
							</View>
						)}
						<DateTimePicker
							value={endDate || new Date()}
							mode="date"
							display={Platform.OS === "ios" ? "spinner" : "default"}
							onChange={handleEndDateChange}
						/>
					</>
				)}

				{/* Categories */}
				<Text style={styles.label}>{t("pmProjectCategories")}</Text>
				{visibleCategories.map((cat, index) => {
					const realIndex = categories.indexOf(cat);
					return (
						<InlineCategoryEditor
							key={cat.id || `new-${index}`}
							icon={cat.icon}
							name={cat.name}
							color={cat.color}
							onChangeName={(n) => handleCategoryNameChange(realIndex, n)}
							onChangeIcon={(ic) => handleCategoryIconChange(realIndex, ic)}
							onDelete={() => handleCategoryDelete(realIndex)}
							colors={colors}
							placeholder={t("pmCategoryNamePlaceholder")}
						/>
					);
				})}
				<TouchableOpacity style={styles.addCategoryButton} onPress={handleAddCategory} activeOpacity={0.7}>
					<Ionicons name="add-circle-outline" size={20} color={colors.accent} />
					<Text style={styles.addCategoryText}>{t("pmAddCategory")}</Text>
				</TouchableOpacity>

				{/* Archive & Delete */}
				{isEdit && (
					<View style={styles.dangerSection}>
						<TouchableOpacity style={styles.archiveButton} onPress={handleArchive} activeOpacity={0.7}>
							<Ionicons name="archive-outline" size={20} color={colors.accent} />
							<Text style={styles.archiveButtonText}>{t("pmArchive")}</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.7}>
							<Ionicons name="trash-outline" size={20} color={colors.danger} />
							<Text style={styles.deleteButtonText}>{t("pmDelete")}</Text>
						</TouchableOpacity>
					</View>
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
					paddingBottom: spacing.xl * 6,
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
				dateButton: {
					flexDirection: "row",
					alignItems: "center",
					backgroundColor: colors.cardBackground,
					borderRadius: 12,
					paddingHorizontal: spacing.md,
					paddingVertical: spacing.md,
					borderWidth: 1,
					borderColor: colors.border,
					gap: spacing.sm,
				},
				dateButtonText: {
					...typography.body,
					color: colors.textPrimary,
					flex: 1,
				},
				addCategoryButton: {
					flexDirection: "row",
					alignItems: "center",
					paddingVertical: spacing.sm,
				},
				addCategoryText: {
					...typography.subhead,
					color: colors.accent,
					marginLeft: spacing.xs,
					fontWeight: "600",
				},
				dangerSection: {
					marginTop: spacing.xl,
					gap: spacing.sm,
				},
				archiveButton: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					paddingVertical: spacing.md,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: colors.accent,
				},
				archiveButtonText: {
					...typography.headline,
					color: colors.accent,
					marginLeft: spacing.sm,
				},
				deleteButton: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
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
				pickerContainer: {
					alignItems: "flex-end",
					paddingTop: spacing.xs,
					paddingBottom: spacing.xs,
				},
				pickerDone: {
					...typography.headline,
					color: colors.accent,
				},
			}),
		[colors]
	);
}
