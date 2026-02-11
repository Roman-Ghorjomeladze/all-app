import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { initDatabase, getAllCalorieEntries, createCalorieEntry, updateCalorieEntry, deleteCalorieEntry, CalorieEntry } from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import CalorieBookItem from "../components/CalorieBookItem";

export default function CalorieBookScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const [entries, setEntries] = useState<CalorieEntry[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [modalVisible, setModalVisible] = useState(false);
	const [editingEntry, setEditingEntry] = useState<CalorieEntry | null>(null);
	const [foodName, setFoodName] = useState("");
	const [caloriesText, setCaloriesText] = useState("");

	const loadData = useCallback(async () => {
		await initDatabase();
		const data = await getAllCalorieEntries(searchQuery || undefined);
		setEntries(data);
	}, [searchQuery]);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData])
	);

	const handleAdd = useCallback(() => {
		setEditingEntry(null);
		setFoodName("");
		setCaloriesText("");
		setModalVisible(true);
	}, []);

	const handleEdit = useCallback((entry: CalorieEntry) => {
		setEditingEntry(entry);
		setFoodName(entry.food_name);
		setCaloriesText(String(entry.calories_per_100g));
		setModalVisible(true);
	}, []);

	const handleDelete = useCallback((entry: CalorieEntry) => {
		Alert.alert(t("mpDelete"), t("mpDeleteFoodConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("mpDelete"),
				style: "destructive",
				onPress: async () => {
					await deleteCalorieEntry(entry.id);
					loadData();
				},
			},
		]);
	}, [t, loadData]);

	const handleSave = useCallback(async () => {
		const name = foodName.trim();
		const cal = parseInt(caloriesText, 10);
		if (!name || isNaN(cal) || cal <= 0) return;

		if (editingEntry) {
			await updateCalorieEntry(editingEntry.id, name, cal);
		} else {
			await createCalorieEntry(name, cal);
		}
		setModalVisible(false);
		loadData();
	}, [foodName, caloriesText, editingEntry, loadData]);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.title}>{t("mpCalorieBook")}</Text>
				<TouchableOpacity onPress={handleAdd} activeOpacity={0.7}>
					<Ionicons name="add-circle" size={28} color={colors.accent} />
				</TouchableOpacity>
			</View>

			{/* Search */}
			<View style={styles.searchContainer}>
				<Ionicons name="search" size={18} color={colors.textSecondary} />
				<TextInput
					style={styles.searchInput}
					placeholder={t("mpSearchFood")}
					placeholderTextColor={colors.textSecondary}
					value={searchQuery}
					onChangeText={setSearchQuery}
					autoCapitalize="none"
					autoCorrect={false}
				/>
				{searchQuery.length > 0 && (
					<TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
						<Ionicons name="close-circle" size={18} color={colors.textSecondary} />
					</TouchableOpacity>
				)}
			</View>

			{/* List */}
			<FlatList
				data={entries}
				keyExtractor={(item) => item.id.toString()}
				renderItem={({ item }) => (
					<CalorieBookItem
						entry={item}
						onEdit={handleEdit}
						onDelete={handleDelete}
						colors={colors}
					/>
				)}
				ListEmptyComponent={
					<Text style={styles.emptyText}>{t("mpNoFoods")}</Text>
				}
				contentContainerStyle={entries.length === 0 ? styles.emptyContainer : undefined}
			/>

			{/* Add/Edit Modal */}
			<Modal
				visible={modalVisible}
				transparent
				animationType="fade"
				onRequestClose={() => setModalVisible(false)}
			>
				<TouchableOpacity
					style={styles.modalOverlay}
					activeOpacity={1}
					onPress={() => setModalVisible(false)}
				>
					<View style={styles.modalContent} onStartShouldSetResponder={() => true}>
						<Text style={styles.modalTitle}>
							{editingEntry ? t("mpEditFood") : t("mpAddFood")}
						</Text>

						<Text style={styles.inputLabel}>{t("mpFoodName")}</Text>
						<TextInput
							style={styles.input}
							value={foodName}
							onChangeText={setFoodName}
							placeholder={t("mpFoodNamePlaceholder")}
							placeholderTextColor={colors.textSecondary}
							autoFocus
						/>

						<Text style={styles.inputLabel}>{t("mpCaloriesPer100g")}</Text>
						<TextInput
							style={styles.input}
							value={caloriesText}
							onChangeText={setCaloriesText}
							placeholder="0"
							placeholderTextColor={colors.textSecondary}
							keyboardType="numeric"
						/>

						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={styles.cancelButton}
								onPress={() => setModalVisible(false)}
								activeOpacity={0.7}
							>
								<Text style={styles.cancelButtonText}>{t("cancel")}</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.saveButton, (!foodName.trim() || !caloriesText.trim()) && styles.saveButtonDisabled]}
								onPress={handleSave}
								activeOpacity={0.7}
								disabled={!foodName.trim() || !caloriesText.trim()}
							>
								<Text style={styles.saveButtonText}>{t("mpSave")}</Text>
							</TouchableOpacity>
						</View>
					</View>
				</TouchableOpacity>
			</Modal>
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
					paddingBottom: spacing.sm,
				},
				title: {
					...typography.largeTitle,
					color: colors.textPrimary,
				},
				searchContainer: {
					flexDirection: "row",
					alignItems: "center",
					backgroundColor: colors.cardBackground,
					marginHorizontal: spacing.lg,
					marginBottom: spacing.md,
					borderRadius: 12,
					paddingHorizontal: spacing.md,
					paddingVertical: spacing.sm,
					gap: spacing.sm,
				},
				searchInput: {
					flex: 1,
					...typography.body,
					color: colors.textPrimary,
					padding: 0,
				},
				emptyText: {
					...typography.body,
					color: colors.textSecondary,
					textAlign: "center",
					paddingVertical: spacing.xl,
				},
				emptyContainer: {
					flexGrow: 1,
					justifyContent: "center",
				},
				// Modal
				modalOverlay: {
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: colors.overlay,
				},
				modalContent: {
					backgroundColor: colors.cardBackground,
					borderRadius: 20,
					padding: spacing.lg,
					width: "85%",
					maxWidth: 360,
				},
				modalTitle: {
					...typography.title3,
					color: colors.textPrimary,
					textAlign: "center",
					marginBottom: spacing.lg,
				},
				inputLabel: {
					...typography.subhead,
					color: colors.textSecondary,
					marginBottom: spacing.xs,
				},
				input: {
					...typography.body,
					color: colors.textPrimary,
					backgroundColor: colors.inputBackground,
					borderRadius: 10,
					paddingHorizontal: spacing.md,
					paddingVertical: 12,
					marginBottom: spacing.md,
					borderWidth: 1,
					borderColor: colors.border,
				},
				modalButtons: {
					flexDirection: "row",
					gap: spacing.sm,
					marginTop: spacing.sm,
				},
				cancelButton: {
					flex: 1,
					paddingVertical: 14,
					borderRadius: 12,
					alignItems: "center",
					borderWidth: 1,
					borderColor: colors.border,
				},
				cancelButtonText: {
					...typography.headline,
					color: colors.textSecondary,
				},
				saveButton: {
					flex: 1,
					paddingVertical: 14,
					borderRadius: 12,
					alignItems: "center",
					backgroundColor: colors.accent,
				},
				saveButtonDisabled: {
					opacity: 0.4,
				},
				saveButtonText: {
					...typography.headline,
					color: colors.white,
				},
			}),
		[colors]
	);
}
