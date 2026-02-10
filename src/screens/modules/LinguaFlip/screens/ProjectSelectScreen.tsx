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
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinguaFlipStackParamList } from "../../../../types/navigation";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../i18n";
import { getAllProjects, createProject, renameProject, deleteProject, ProjectWithCount } from "../database";

type Props = NativeStackScreenProps<LinguaFlipStackParamList, "LLProjectSelect">;

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
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
		},
		headerTitle: {
			...typography.largeTitle,
			color: colors.textPrimary,
			flex: 1,
			marginRight: spacing.sm,
		},
		addButton: {
			padding: spacing.xs,
		},
		listContent: {
			padding: spacing.md,
			paddingBottom: 40,
		},
		projectCard: {
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
		projectIcon: {
			width: 48,
			height: 48,
			borderRadius: 24,
			backgroundColor: colors.accent + "15",
			justifyContent: "center",
			alignItems: "center",
			marginRight: 14,
		},
		projectEmoji: {
			fontSize: 24,
		},
		projectInfo: {
			flex: 1,
		},
		projectName: {
			fontSize: 18,
			fontWeight: "600",
			color: colors.textPrimary,
			marginBottom: 2,
		},
		projectCount: {
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
			backgroundColor: colors.overlay,
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
	}), [colors]);
}

export default function ProjectSelectScreen({ navigation }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const [projects, setProjects] = useState<ProjectWithCount[]>([]);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showRenameModal, setShowRenameModal] = useState(false);
	const [newName, setNewName] = useState("");
	const [renameId, setRenameId] = useState<number | null>(null);
	const [renameName, setRenameName] = useState("");

	useFocusEffect(
		useCallback(() => {
			loadProjects();
		}, []),
	);

	const loadProjects = async () => {
		const all = await getAllProjects();
		setProjects(all);
	};

	const handleCreate = async () => {
		if (!newName.trim()) return;
		await createProject(newName.trim());
		setNewName("");
		setShowCreateModal(false);
		loadProjects();
	};

	const handleRename = async () => {
		if (!renameName.trim() || !renameId) return;
		await renameProject(renameId, renameName.trim());
		setRenameName("");
		setRenameId(null);
		setShowRenameModal(false);
		loadProjects();
	};

	const handleDelete = (project: ProjectWithCount) => {
		Alert.alert(t("llDeleteProject"), t("llDeleteProjectConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("delete"),
				style: "destructive",
				onPress: async () => {
					await deleteProject(project.id);
					loadProjects();
				},
			},
		]);
	};

	const handleLongPress = (project: ProjectWithCount) => {
		Alert.alert(project.name, undefined, [
			{
				text: t("llRenameProject"),
				onPress: () => {
					setRenameId(project.id);
					setRenameName(project.name);
					setShowRenameModal(true);
				},
			},
			{
				text: t("llDeleteProject"),
				style: "destructive",
				onPress: () => handleDelete(project),
			},
			{ text: t("cancel"), style: "cancel" },
		]);
	};

	const handlePress = (project: ProjectWithCount) => {
		navigation.navigate("LLTabs", { projectId: project.id });
	};

	const renderCard = ({ item }: { item: ProjectWithCount }) => (
		<TouchableOpacity
			style={styles.projectCard}
			onPress={() => handlePress(item)}
			onLongPress={() => handleLongPress(item)}
			activeOpacity={0.7}
		>
			<View style={styles.projectIcon}>
				<Text style={styles.projectEmoji}>{"\u{1F30E}"}</Text>
			</View>
			<View style={styles.projectInfo}>
				<Text style={styles.projectName} numberOfLines={1}>
					{item.name}
				</Text>
				<Text style={styles.projectCount}>
					{t("llCardCount", { count: String(item.card_count) })}
				</Text>
			</View>
			<Text style={styles.chevron}>{"\u203A"}</Text>
		</TouchableOpacity>
	);

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.headerTitle} numberOfLines={1}>{t("llProjects")}</Text>
				<TouchableOpacity onPress={() => setShowCreateModal(true)} activeOpacity={0.7} style={styles.addButton}>
					<Ionicons name="add-circle" size={32} color={colors.accent} />
				</TouchableOpacity>
			</View>

			{/* Project List */}
			<FlatList
				data={projects}
				keyExtractor={(item) => String(item.id)}
				contentContainerStyle={styles.listContent}
				renderItem={renderCard}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyEmoji}>{"\u{1F30E}"}</Text>
						<Text style={styles.emptyTitle}>{t("llNoProjects")}</Text>
						<Text style={styles.emptyHint}>{t("llNoProjectsHint")}</Text>
					</View>
				}
			/>

			{/* Create Modal */}
			<Modal visible={showCreateModal} transparent animationType="fade" supportedOrientations={["portrait", "landscape"]} onRequestClose={() => setShowCreateModal(false)}>
				<KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>{t("llCreateProject")}</Text>
						<TextInput
							style={styles.modalInput}
							value={newName}
							onChangeText={setNewName}
							placeholder={t("llProjectNamePlaceholder")}
							placeholderTextColor={colors.textSecondary}
							autoFocus
						/>
						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={styles.modalButtonCancel}
								onPress={() => {
									setNewName("");
									setShowCreateModal(false);
								}}
							>
								<Text style={styles.modalButtonCancelText}>{t("cancel")}</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.modalButtonSave, !newName.trim() && styles.modalButtonDisabled]}
								onPress={handleCreate}
								disabled={!newName.trim()}
							>
								<Text style={styles.modalButtonSaveText}>{t("save")}</Text>
							</TouchableOpacity>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>

			{/* Rename Modal */}
			<Modal visible={showRenameModal} transparent animationType="fade" supportedOrientations={["portrait", "landscape"]} onRequestClose={() => setShowRenameModal(false)}>
				<KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>{t("llRenameProject")}</Text>
						<TextInput
							style={styles.modalInput}
							value={renameName}
							onChangeText={setRenameName}
							placeholder={t("llProjectNamePlaceholder")}
							placeholderTextColor={colors.textSecondary}
							autoFocus
						/>
						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={styles.modalButtonCancel}
								onPress={() => {
									setRenameName("");
									setRenameId(null);
									setShowRenameModal(false);
								}}
							>
								<Text style={styles.modalButtonCancelText}>{t("cancel")}</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.modalButtonSave, !renameName.trim() && styles.modalButtonDisabled]}
								onPress={handleRename}
								disabled={!renameName.trim()}
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
