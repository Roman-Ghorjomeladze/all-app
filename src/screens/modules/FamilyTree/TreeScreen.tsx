import React, { useState, useCallback, useRef, useMemo } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Modal,
	TextInput,
	Alert,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FamilyTreeStackParamList } from "../../../types/navigation";
import { useColors, Colors, spacing, typography } from "./theme";
import { useLanguage } from "../../../i18n";
import { getTreeData, renameTree, deleteTree, initDatabase } from "./database";
import { computeLayout, TreeLayout } from "./utils/treeLayout";
import TreeCanvas, { TreeCanvasHandle } from "./components/TreeCanvas";

type Props = NativeStackScreenProps<FamilyTreeStackParamList, "FamilyTreeMain">;

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		safeArea: {
			flex: 1,
			backgroundColor: colors.canvasBackground,
		},
		header: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			paddingHorizontal: spacing.lg,
			paddingVertical: spacing.md,
		},
		headerTitle: {
			...typography.largeTitle,
			color: colors.textPrimary,
			flex: 1,
			marginRight: spacing.sm,
		},
		headerButtons: {
			flexDirection: "row",
			alignItems: "center",
			gap: spacing.xs,
		},
		headerButton: {
			padding: spacing.xs,
		},
		emptyContainer: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
			padding: spacing.xl,
		},
		emptyEmoji: {
			fontSize: 72,
			marginBottom: spacing.lg,
		},
		emptyTitle: {
			fontSize: 22,
			fontWeight: "600",
			color: colors.textPrimary,
			marginBottom: spacing.sm,
		},
		emptyHint: {
			fontSize: 15,
			color: colors.textSecondary,
			textAlign: "center",
		},
		backButton: {
			position: "absolute",
			bottom: 60,
			left: 24,
			width: 44,
			height: 44,
			borderRadius: 22,
			backgroundColor: colors.cardBackground,
			justifyContent: "center",
			alignItems: "center",
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.2,
			shadowRadius: 4,
			elevation: 4,
			borderWidth: 1,
			borderColor: colors.border,
		},
		recenterButton: {
			position: "absolute",
			bottom: 60,
			right: 24,
			width: 44,
			height: 44,
			borderRadius: 22,
			backgroundColor: colors.cardBackground,
			justifyContent: "center",
			alignItems: "center",
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.2,
			shadowRadius: 4,
			elevation: 4,
			borderWidth: 1,
			borderColor: colors.border,
		},
		recenterIcon: {
			fontSize: 22,
			color: colors.accent,
		},
		// Settings Menu
		menuOverlay: {
			flex: 1,
			backgroundColor: "rgba(0,0,0,0.4)",
			justifyContent: "flex-start",
			alignItems: "flex-end",
			paddingTop: 100,
			paddingRight: spacing.md,
		},
		menuContent: {
			backgroundColor: colors.cardBackground,
			borderRadius: 14,
			minWidth: 200,
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.15,
			shadowRadius: 12,
			elevation: 8,
			overflow: "hidden",
		},
		menuItem: {
			flexDirection: "row",
			alignItems: "center",
			paddingVertical: 14,
			paddingHorizontal: 18,
		},
		menuItemIcon: {
			fontSize: 18,
			marginRight: 12,
		},
		menuItemText: {
			fontSize: 16,
			color: colors.textPrimary,
		},
		menuItemDanger: {
			color: colors.danger,
		},
		menuDivider: {
			height: 1,
			backgroundColor: colors.border,
			marginHorizontal: 14,
		},
		// Rename Modal
		renameOverlay: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
			backgroundColor: "rgba(0,0,0,0.5)",
		},
		renameContent: {
			backgroundColor: colors.cardBackground,
			borderRadius: 16,
			padding: spacing.lg,
			width: "85%",
			maxWidth: 360,
		},
		renameTitle: {
			fontSize: 18,
			fontWeight: "600",
			color: colors.textPrimary,
			marginBottom: spacing.md,
			textAlign: "center",
		},
		renameInput: {
			backgroundColor: colors.background,
			padding: spacing.md,
			borderRadius: 12,
			borderWidth: 1,
			borderColor: colors.border,
			fontSize: 16,
			color: colors.textPrimary,
			marginBottom: spacing.md,
		},
		renameButtons: {
			flexDirection: "row",
			gap: spacing.sm,
		},
		renameBtnCancel: {
			flex: 1,
			padding: 14,
			borderRadius: 12,
			backgroundColor: colors.background,
			alignItems: "center",
		},
		renameBtnCancelText: {
			fontSize: 16,
			fontWeight: "500",
			color: colors.textSecondary,
		},
		renameBtnSave: {
			flex: 1,
			padding: 14,
			borderRadius: 12,
			backgroundColor: colors.accent,
			alignItems: "center",
		},
		renameBtnDisabled: {
			opacity: 0.5,
		},
		renameBtnSaveText: {
			fontSize: 16,
			fontWeight: "600",
			color: colors.white,
		},
	}), [colors]);
}

export default function TreeScreen({ navigation, route }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const { treeId } = route.params;
	const canvasRef = useRef<TreeCanvasHandle>(null);
	const [treeLayout, setTreeLayout] = useState<TreeLayout>({ nodes: [], edges: [], familyEdges: [], width: 0, height: 0 });
	const [isEmpty, setIsEmpty] = useState(true);
	const [showMenu, setShowMenu] = useState(false);
	const [showRenameModal, setShowRenameModal] = useState(false);
	const [treeName, setTreeName] = useState("");
	const [editName, setEditName] = useState("");

	useFocusEffect(
		useCallback(() => {
			loadTree();
		}, [treeId]),
	);

	const loadTree = async () => {
		const data = await getTreeData(treeId);
		const layout = computeLayout(data.persons, data.relationships);
		setTreeLayout(layout);
		setIsEmpty(data.persons.length === 0);
	};

	const handlePersonPress = (id: number) => {
		navigation.navigate("FamilyTreePerson", { mode: "edit", treeId, personId: id });
	};

	const handleAddChild = (parentId: number) => {
		navigation.navigate("FamilyTreePerson", { mode: "create", treeId, parentId });
	};

	const handleAddPerson = () => {
		navigation.navigate("FamilyTreePerson", { mode: "create", treeId });
	};

	const handleListPress = () => {
		setShowMenu(false);
		navigation.navigate("FamilyTreeList", { treeId });
	};

	const handleRecenter = () => {
		canvasRef.current?.recenter();
	};

	const handleRenamePress = () => {
		setShowMenu(false);
		setEditName(treeName);
		setShowRenameModal(true);
	};

	const handleRenameSave = async () => {
		if (!editName.trim()) return;
		await renameTree(treeId, editName.trim());
		setTreeName(editName.trim());
		setShowRenameModal(false);
	};

	const handleDeletePress = () => {
		setShowMenu(false);
		Alert.alert(t("ftDeleteTree"), t("ftDeleteTreeConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("delete"),
				style: "destructive",
				onPress: async () => {
					await deleteTree(treeId);
					navigation.goBack();
				},
			},
		]);
	};

	// Load tree name on mount
	useFocusEffect(
		useCallback(() => {
			const loadName = async () => {
				const db = await initDatabase();
				const row = await db.getFirstAsync<{ name: string }>("SELECT name FROM ft_trees WHERE id = ?", [treeId]);
				if (row) setTreeName(row.name);
			};
			loadName();
		}, [treeId]),
	);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.headerTitle} numberOfLines={1}>
					{treeName || t("ftModuleName")}
				</Text>
				<View style={styles.headerButtons}>
					<TouchableOpacity style={styles.headerButton} onPress={handleAddPerson} activeOpacity={0.7}>
						<Ionicons name="add-circle" size={32} color={colors.accent} />
					</TouchableOpacity>
					<TouchableOpacity style={styles.headerButton} onPress={() => setShowMenu(true)} activeOpacity={0.7}>
						<Ionicons name="ellipsis-vertical" size={24} color={colors.accent} />
					</TouchableOpacity>
				</View>
			</View>

			{/* Canvas or Empty State */}
			{isEmpty ? (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyEmoji}>🌳</Text>
					<Text style={styles.emptyTitle}>{t("ftEmptyTree")}</Text>
					<Text style={styles.emptyHint}>{t("ftEmptyTreeHint")}</Text>
				</View>
			) : (
				<TreeCanvas
					ref={canvasRef}
					layout={treeLayout}
					onPersonPress={handlePersonPress}
					onAddChild={handleAddChild}
				/>
			)}

			{/* Back Button */}
			<TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
				<Ionicons name="chevron-back" size={24} color={colors.accent} />
			</TouchableOpacity>

			{/* Recenter Button */}
			{!isEmpty && (
				<TouchableOpacity style={styles.recenterButton} onPress={handleRecenter} activeOpacity={0.8}>
					<Text style={styles.recenterIcon}>⊕</Text>
				</TouchableOpacity>
			)}

			{/* Settings Menu Modal */}
			<Modal visible={showMenu} transparent animationType="fade" supportedOrientations={["portrait", "landscape"]} onRequestClose={() => setShowMenu(false)}>
				<TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
					<View style={styles.menuContent}>
						{/* List */}
						<TouchableOpacity style={styles.menuItem} onPress={handleListPress}>
							<Text style={styles.menuItemIcon}>☰</Text>
							<Text style={styles.menuItemText}>{t("ftList")}</Text>
						</TouchableOpacity>

						<View style={styles.menuDivider} />

						{/* Rename */}
						<TouchableOpacity style={styles.menuItem} onPress={handleRenamePress}>
							<Text style={styles.menuItemIcon}>✏️</Text>
							<Text style={styles.menuItemText}>{t("ftRenameTree")}</Text>
						</TouchableOpacity>

						<View style={styles.menuDivider} />

						{/* Delete */}
						<TouchableOpacity style={styles.menuItem} onPress={handleDeletePress}>
							<Text style={styles.menuItemIcon}>🗑️</Text>
							<Text style={[styles.menuItemText, styles.menuItemDanger]}>{t("ftDeleteTree")}</Text>
						</TouchableOpacity>
					</View>
				</TouchableOpacity>
			</Modal>

			{/* Rename Modal */}
			<Modal visible={showRenameModal} transparent animationType="fade" supportedOrientations={["portrait", "landscape"]} onRequestClose={() => setShowRenameModal(false)}>
				<KeyboardAvoidingView style={styles.renameOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
					<View style={styles.renameContent}>
						<Text style={styles.renameTitle}>{t("ftRenameTree")}</Text>
						<TextInput
							style={styles.renameInput}
							value={editName}
							onChangeText={setEditName}
							placeholder={t("ftTreeNamePlaceholder")}
							placeholderTextColor={colors.textSecondary}
							autoFocus
						/>
						<View style={styles.renameButtons}>
							<TouchableOpacity
								style={styles.renameBtnCancel}
								onPress={() => setShowRenameModal(false)}
							>
								<Text style={styles.renameBtnCancelText}>{t("cancel")}</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.renameBtnSave, !editName.trim() && styles.renameBtnDisabled]}
								onPress={handleRenameSave}
								disabled={!editName.trim()}
							>
								<Text style={styles.renameBtnSaveText}>{t("save")}</Text>
							</TouchableOpacity>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>
		</SafeAreaView>
	);
}
