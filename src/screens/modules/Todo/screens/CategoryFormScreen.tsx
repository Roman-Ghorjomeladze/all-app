import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TodoStackParamList } from "../../../../types/navigation";
import { initDatabase, getCategory, createCategory, updateCategory, deleteCategory } from "../database";
import { useColors, Colors, spacing, typography, CATEGORY_COLORS } from "../theme";
import { useLanguage } from "../../../../i18n";
import ColorPicker from "../components/ColorPicker";
import EmojiPicker from "../components/EmojiPicker";

type Nav = NativeStackNavigationProp<TodoStackParamList>;
type Route = RouteProp<TodoStackParamList, "TodoCategoryForm">;

export default function CategoryFormScreen() {
	const navigation = useNavigation<Nav>();
	const route = useRoute<Route>();
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const isEdit = route.params.mode === "edit";
	const categoryId = isEdit ? (route.params as { categoryId: number }).categoryId : undefined;

	const [name, setName] = useState("");
	const [color, setColor] = useState(CATEGORY_COLORS[0]);
	const [icon, setIcon] = useState("\u{1F4C1}");

	useEffect(() => {
		const load = async () => {
			await initDatabase();
			if (isEdit && categoryId) {
				const cat = await getCategory(categoryId);
				if (cat) {
					setName(cat.name);
					setColor(cat.color);
					setIcon(cat.icon);
				}
			}
		};
		load();
	}, [isEdit, categoryId]);

	const canSave = name.trim().length > 0;

	const handleSave = useCallback(async () => {
		if (!canSave) return;
		if (isEdit && categoryId) {
			await updateCategory(categoryId, name.trim(), color, icon);
		} else {
			await createCategory(name.trim(), color, icon);
		}
		navigation.goBack();
	}, [canSave, isEdit, categoryId, name, color, icon, navigation]);

	const handleDelete = useCallback(() => {
		if (!isEdit || !categoryId) return;
		Alert.alert(t("tdDeleteCategory"), t("tdDeleteCategoryConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("tdDelete"),
				style: "destructive",
				onPress: async () => {
					await deleteCategory(categoryId);
					navigation.goBack();
				},
			},
		]);
	}, [isEdit, categoryId, t, navigation]);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.headerBtn}>
					<Ionicons name="close" size={28} color={colors.textPrimary} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>{isEdit ? t("tdEditCategory") : t("tdAddCategory")}</Text>
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
				{/* Preview */}
				<View style={styles.preview}>
					<View style={[styles.previewIcon, { backgroundColor: color + "20" }]}>
						<Text style={styles.previewEmoji}>{icon}</Text>
					</View>
					<Text style={[styles.previewName, { color: name.trim() ? colors.textPrimary : colors.textSecondary }]}>
						{name.trim() || t("tdCategoryNamePlaceholder")}
					</Text>
				</View>

				{/* Name */}
				<Text style={styles.sectionLabel}>{t("tdCategoryName")}</Text>
				<TextInput
					style={styles.input}
					value={name}
					onChangeText={setName}
					placeholder={t("tdCategoryNamePlaceholder")}
					placeholderTextColor={colors.textSecondary}
					autoFocus={!isEdit}
				/>

				{/* Icon */}
				<Text style={styles.sectionLabel}>{t("tdCategoryIcon")}</Text>
				<EmojiPicker selected={icon} onSelect={setIcon} />

				{/* Color */}
				<Text style={styles.sectionLabel}>{t("tdCategoryColor")}</Text>
				<ColorPicker selected={color} onSelect={setColor} />

				{/* Delete */}
				{isEdit && (
					<TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.7}>
						<Ionicons name="trash-outline" size={20} color={colors.danger} />
						<Text style={styles.deleteText}>{t("tdDelete")}</Text>
					</TouchableOpacity>
				)}

				<View style={{ height: 40 }} />
			</ScrollView>
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
				preview: {
					alignItems: "center",
					paddingVertical: spacing.lg,
				},
				previewIcon: {
					width: 72,
					height: 72,
					borderRadius: 20,
					justifyContent: "center",
					alignItems: "center",
					marginBottom: spacing.md,
				},
				previewEmoji: {
					fontSize: 36,
				},
				previewName: {
					...typography.title2,
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
