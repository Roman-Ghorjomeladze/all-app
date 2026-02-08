import React, { useState, useCallback, useMemo } from "react";
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	Alert,
	Modal,
	TextInput,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FamilyTreeStackParamList } from "../../../types/navigation";
import { useColors, Colors, spacing } from "./theme";
import { useLanguage } from "../../../i18n";
import { getAllTrees, createTree, renameTree, deleteTree, getTreeMemberCount, FamilyTreeRecord } from "./database";

type Props = NativeStackScreenProps<FamilyTreeStackParamList, "FamilyTreeSelect">;

type TreeWithCount = FamilyTreeRecord & { memberCount: number };

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
					paddingHorizontal: spacing.md,
					paddingVertical: 10,
					backgroundColor: colors.cardBackground,
					borderBottomWidth: 1,
					borderBottomColor: colors.border,
				},
				backText: {
					fontSize: 32,
					color: colors.accent,
					fontWeight: "300",
					marginTop: -4,
				},
				headerTitle: {
					fontSize: 17,
					fontWeight: "600",
					color: colors.textPrimary,
				},
				addText: {
					fontSize: 28,
					color: colors.accent,
					fontWeight: "400",
				},
				listContent: {
					padding: spacing.md,
					paddingBottom: 40,
				},
				treeCard: {
					flexDirection: "row",
					alignItems: "center",
					backgroundColor: colors.cardBackground,
					padding: spacing.md,
					borderRadius: 16,
					marginBottom: spacing.md,
					borderWidth: 1,
					borderColor: colors.border,
					shadowColor: colors.shadow,
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.08,
					shadowRadius: 4,
					elevation: 2,
				},
				treeIcon: {
					width: 48,
					height: 48,
					borderRadius: 24,
					backgroundColor: colors.accent + "15",
					justifyContent: "center",
					alignItems: "center",
					marginRight: 14,
				},
				treeEmoji: {
					fontSize: 24,
				},
				treeInfo: {
					flex: 1,
				},
				treeName: {
					fontSize: 18,
					fontWeight: "600",
					color: colors.textPrimary,
					marginBottom: 2,
				},
				treeMemberCount: {
					fontSize: 14,
					color: colors.textSecondary,
				},
				chevron: {
					fontSize: 24,
					color: colors.textSecondary,
					fontWeight: "300",
				},
				emptyContainer: {
					alignItems: "center",
					paddingTop: 100,
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
					textAlign: "center",
				},
				emptyHint: {
					fontSize: 15,
					color: colors.textSecondary,
					textAlign: "center",
				},
				modalOverlay: {
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: "rgba(0,0,0,0.5)",
				},
				modalContent: {
					backgroundColor: colors.cardBackground,
					borderRadius: 16,
					padding: spacing.lg,
					width: "85%",
					maxWidth: 360,
				},
				modalTitle: {
					fontSize: 18,
					fontWeight: "600",
					color: colors.textPrimary,
					marginBottom: spacing.md,
					textAlign: "center",
				},
				modalInput: {
					backgroundColor: colors.background,
					padding: spacing.md,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: colors.border,
					fontSize: 16,
					color: colors.textPrimary,
					marginBottom: spacing.md,
				},
				modalButtons: {
					flexDirection: "row",
					gap: spacing.sm,
				},
				modalButtonCancel: {
					flex: 1,
					padding: 14,
					borderRadius: 12,
					backgroundColor: colors.background,
					alignItems: "center",
				},
				modalButtonCancelText: {
					fontSize: 16,
					fontWeight: "500",
					color: colors.textSecondary,
				},
				modalButtonSave: {
					flex: 1,
					padding: 14,
					borderRadius: 12,
					backgroundColor: colors.accent,
					alignItems: "center",
				},
				modalButtonDisabled: {
					opacity: 0.5,
				},
				modalButtonSaveText: {
					fontSize: 16,
					fontWeight: "600",
					color: colors.white,
				},
			}),
		[colors],
	);
}

export default function TreeSelectScreen({ navigation }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const [trees, setTrees] = useState<TreeWithCount[]>([]);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showRenameModal, setShowRenameModal] = useState(false);
	const [newTreeName, setNewTreeName] = useState("");
	const [renameTreeId, setRenameTreeId] = useState<number | null>(null);
	const [renameTreeName, setRenameTreeName] = useState("");

	useFocusEffect(
		useCallback(() => {
			loadTrees();
		}, []),
	);

	const loadTrees = async () => {
		const allTrees = await getAllTrees();
		const treesWithCounts = await Promise.all(
			allTrees.map(async (tree) => ({
				...tree,
				memberCount: await getTreeMemberCount(tree.id),
			})),
		);
		setTrees(treesWithCounts);
	};

	const handleCreateTree = async () => {
		if (!newTreeName.trim()) return;
		await createTree(newTreeName.trim());
		setNewTreeName("");
		setShowCreateModal(false);
		loadTrees();
	};

	const handleRenameTree = async () => {
		if (!renameTreeName.trim() || !renameTreeId) return;
		await renameTree(renameTreeId, renameTreeName.trim());
		setRenameTreeName("");
		setRenameTreeId(null);
		setShowRenameModal(false);
		loadTrees();
	};

	const handleDeleteTree = (tree: TreeWithCount) => {
		Alert.alert(t("ftDeleteTree"), t("ftDeleteTreeConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("delete"),
				style: "destructive",
				onPress: async () => {
					await deleteTree(tree.id);
					loadTrees();
				},
			},
		]);
	};

	const handleLongPress = (tree: TreeWithCount) => {
		Alert.alert(tree.name, undefined, [
			{
				text: t("ftRenameTree"),
				onPress: () => {
					setRenameTreeId(tree.id);
					setRenameTreeName(tree.name);
					setShowRenameModal(true);
				},
			},
			{
				text: t("ftDeleteTree"),
				style: "destructive",
				onPress: () => handleDeleteTree(tree),
			},
			{ text: t("cancel"), style: "cancel" },
		]);
	};

	const handleTreePress = (tree: TreeWithCount) => {
		navigation.navigate("FamilyTreeMain", { treeId: tree.id });
	};

	const renderTreeCard = ({ item }: { item: TreeWithCount }) => (
		<TouchableOpacity
			style={styles.treeCard}
			onPress={() => handleTreePress(item)}
			onLongPress={() => handleLongPress(item)}
			activeOpacity={0.7}
		>
			<View style={styles.treeIcon}>
				<Text style={styles.treeEmoji}>🌳</Text>
			</View>
			<View style={styles.treeInfo}>
				<Text style={styles.treeName} numberOfLines={1}>
					{item.name}
				</Text>
				<Text style={styles.treeMemberCount}>{t("ftPersons", { count: String(item.memberCount) })}</Text>
			</View>
			<Text style={styles.chevron}>›</Text>
		</TouchableOpacity>
	);

	return (
		<SafeAreaView style={styles.safeArea}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.getParent()?.goBack()}>
					<Text style={styles.backText}>‹</Text>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>{t("ftMyTrees")}</Text>
				<TouchableOpacity onPress={() => setShowCreateModal(true)}>
					<Text style={styles.addText}>+</Text>
				</TouchableOpacity>
			</View>

			{/* Tree List */}
			<FlatList
				data={trees}
				keyExtractor={(item) => String(item.id)}
				contentContainerStyle={styles.listContent}
				renderItem={renderTreeCard}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyEmoji}>🌳</Text>
						<Text style={styles.emptyTitle}>{t("ftNoTrees")}</Text>
						<Text style={styles.emptyHint}>{t("ftNoTreesHint")}</Text>
					</View>
				}
			/>

			{/* Create Tree Modal */}
			<Modal
				visible={showCreateModal}
				transparent
				animationType="fade"
				onRequestClose={() => setShowCreateModal(false)}
			>
				<KeyboardAvoidingView
					style={styles.modalOverlay}
					behavior={Platform.OS === "ios" ? "padding" : undefined}
				>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>{t("ftCreateTree")}</Text>
						<TextInput
							style={styles.modalInput}
							value={newTreeName}
							onChangeText={setNewTreeName}
							placeholder={t("ftTreeNamePlaceholder")}
							placeholderTextColor={colors.textSecondary}
							autoFocus
						/>
						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={styles.modalButtonCancel}
								onPress={() => {
									setNewTreeName("");
									setShowCreateModal(false);
								}}
							>
								<Text style={styles.modalButtonCancelText}>{t("cancel")}</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.modalButtonSave, !newTreeName.trim() && styles.modalButtonDisabled]}
								onPress={handleCreateTree}
								disabled={!newTreeName.trim()}
							>
								<Text style={styles.modalButtonSaveText}>{t("save")}</Text>
							</TouchableOpacity>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>

			{/* Rename Tree Modal */}
			<Modal
				visible={showRenameModal}
				transparent
				animationType="fade"
				onRequestClose={() => setShowRenameModal(false)}
			>
				<KeyboardAvoidingView
					style={styles.modalOverlay}
					behavior={Platform.OS === "ios" ? "padding" : undefined}
				>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>{t("ftRenameTree")}</Text>
						<TextInput
							style={styles.modalInput}
							value={renameTreeName}
							onChangeText={setRenameTreeName}
							placeholder={t("ftTreeNamePlaceholder")}
							placeholderTextColor={colors.textSecondary}
							autoFocus
						/>
						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={styles.modalButtonCancel}
								onPress={() => {
									setRenameTreeName("");
									setRenameTreeId(null);
									setShowRenameModal(false);
								}}
							>
								<Text style={styles.modalButtonCancelText}>{t("cancel")}</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.modalButtonSave, !renameTreeName.trim() && styles.modalButtonDisabled]}
								onPress={handleRenameTree}
								disabled={!renameTreeName.trim()}
							>
								<Text style={styles.modalButtonSaveText}>{t("save")}</Text>
							</TouchableOpacity>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>
		</SafeAreaView>
	);
}
