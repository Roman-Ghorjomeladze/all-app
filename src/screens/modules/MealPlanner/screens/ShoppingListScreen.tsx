import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
	initDatabase,
	getShoppingItems,
	generateShoppingList,
	toggleShoppingItem,
	addManualShoppingItem,
	deleteShoppingItem,
	clearCheckedItems,
	ShoppingItem,
} from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import ShoppingItemRow from "../components/ShoppingItem";

function getMonday(d: Date): Date {
	const date = new Date(d);
	const day = date.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	date.setDate(date.getDate() + diff);
	date.setHours(0, 0, 0, 0);
	return date;
}

function formatDateISO(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export default function ShoppingListScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const [weekStart] = useState(() => formatDateISO(getMonday(new Date())));
	const [items, setItems] = useState<ShoppingItem[]>([]);
	const [newItemName, setNewItemName] = useState("");

	const loadData = useCallback(async () => {
		await initDatabase();
		const data = await getShoppingItems(weekStart);
		setItems(data);
	}, [weekStart]);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData])
	);

	const handleGenerate = useCallback(async () => {
		await generateShoppingList(weekStart);
		loadData();
	}, [weekStart, loadData]);

	const handleToggle = useCallback(async (id: number, checked: boolean) => {
		await toggleShoppingItem(id, checked);
		loadData();
	}, [loadData]);

	const handleDelete = useCallback(async (id: number) => {
		await deleteShoppingItem(id);
		loadData();
	}, [loadData]);

	const handleAddItem = useCallback(async () => {
		const name = newItemName.trim();
		if (!name) return;
		await addManualShoppingItem(name, null, null, weekStart);
		setNewItemName("");
		loadData();
	}, [newItemName, weekStart, loadData]);

	const handleClearChecked = useCallback(() => {
		Alert.alert(t("mpClearChecked"), t("mpClearCheckedConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("mpClear"),
				style: "destructive",
				onPress: async () => {
					await clearCheckedItems(weekStart);
					loadData();
				},
			},
		]);
	}, [weekStart, t, loadData]);

	const checkedCount = useMemo(() => items.filter((i) => i.is_checked === 1).length, [items]);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.title}>{t("mpShopping")}</Text>
				<TouchableOpacity onPress={handleGenerate} activeOpacity={0.7}>
					<Ionicons name="refresh" size={24} color={colors.accent} />
				</TouchableOpacity>
			</View>

			{/* List */}
			<FlatList
				data={items}
				keyExtractor={(item) => item.id.toString()}
				renderItem={({ item }) => (
					<ShoppingItemRow
						item={item}
						onToggle={handleToggle}
						onDelete={handleDelete}
						colors={colors}
					/>
				)}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyText}>{t("mpNoShoppingItems")}</Text>
						<TouchableOpacity style={styles.generateButton} onPress={handleGenerate} activeOpacity={0.7}>
							<Ionicons name="cart-outline" size={20} color={colors.accent} />
							<Text style={styles.generateButtonText}>{t("mpGenerateList")}</Text>
						</TouchableOpacity>
					</View>
				}
				contentContainerStyle={items.length === 0 ? { flexGrow: 1, justifyContent: "center" } : undefined}
			/>

			{/* Bottom bar */}
			<View style={styles.bottomBar}>
				{checkedCount > 0 && (
					<TouchableOpacity style={styles.clearButton} onPress={handleClearChecked} activeOpacity={0.7}>
						<Text style={styles.clearButtonText}>{t("mpClearChecked")} ({checkedCount})</Text>
					</TouchableOpacity>
				)}
				<View style={styles.addItemRow}>
					<TextInput
						style={styles.addInput}
						value={newItemName}
						onChangeText={setNewItemName}
						placeholder={t("mpAddItem")}
						placeholderTextColor={colors.textSecondary}
						onSubmitEditing={handleAddItem}
						returnKeyType="done"
					/>
					<TouchableOpacity
						onPress={handleAddItem}
						activeOpacity={0.7}
						disabled={!newItemName.trim()}
						style={[styles.addButton, !newItemName.trim() && { opacity: 0.4 }]}
					>
						<Ionicons name="add-circle" size={32} color={colors.accent} />
					</TouchableOpacity>
				</View>
			</View>
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
				emptyContainer: {
					alignItems: "center",
					gap: spacing.lg,
				},
				emptyText: {
					...typography.body,
					color: colors.textSecondary,
					textAlign: "center",
				},
				generateButton: {
					flexDirection: "row",
					alignItems: "center",
					gap: spacing.sm,
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.md,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: colors.accent,
				},
				generateButtonText: {
					...typography.headline,
					color: colors.accent,
				},
				bottomBar: {
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.md,
					borderTopWidth: 0.5,
					borderTopColor: colors.border,
					backgroundColor: colors.cardBackground,
				},
				clearButton: {
					alignSelf: "center",
					marginBottom: spacing.sm,
				},
				clearButtonText: {
					...typography.subhead,
					color: colors.danger,
					fontWeight: "600",
				},
				addItemRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: spacing.sm,
				},
				addInput: {
					flex: 1,
					...typography.body,
					color: colors.textPrimary,
					backgroundColor: colors.inputBackground,
					borderRadius: 12,
					paddingHorizontal: spacing.md,
					paddingVertical: 10,
					borderWidth: 1,
					borderColor: colors.border,
				},
				addButton: {
					padding: 2,
				},
			}),
		[colors]
	);
}
