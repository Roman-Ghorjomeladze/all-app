import React, { useState, useEffect, useMemo } from "react";
import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	TouchableOpacity,
	TextInput,
	ScrollView,
	Alert,
	KeyboardAvoidingView,
	Platform,
	Modal,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinguaFlipStackParamList } from "../../../../types/navigation";
import { useColors, Colors, spacing } from "../theme";
import { useLanguage } from "../i18n";
import {
	createCard,
	updateCard,
	deleteCard,
	getCard,
	getTagsByProject,
	getTagsForCard,
	addTagToCard,
	removeTagFromCard,
	createTag,
	Tag,
} from "../database";

type Props = NativeStackScreenProps<LinguaFlipStackParamList, "LLCardForm">;

const TAG_COLORS = ["#008B8B", "#E74C3C", "#3498DB", "#9B59B6", "#E67E22", "#2ECC71", "#F1C40F", "#1ABC9C"];

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
			paddingHorizontal: spacing.md,
			paddingVertical: 12,
			backgroundColor: colors.cardBackground,
			borderBottomWidth: 1,
			borderBottomColor: colors.border,
		},
		headerButton: {
			padding: 8,
			margin: -8,
		},
		cancelText: {
			fontSize: 16,
			color: colors.textSecondary,
		},
		headerTitle: {
			fontSize: 17,
			fontWeight: "600",
			color: colors.textPrimary,
		},
		saveText: {
			fontSize: 16,
			fontWeight: "600",
			color: colors.accent,
		},
		content: {
			padding: spacing.lg,
			paddingBottom: 60,
		},
		label: {
			fontSize: 15,
			fontWeight: "600",
			color: colors.textPrimary,
			marginBottom: spacing.sm,
		},
		input: {
			backgroundColor: colors.cardBackground,
			padding: spacing.md,
			borderRadius: 12,
			borderWidth: 1,
			borderColor: colors.border,
			fontSize: 16,
			color: colors.textPrimary,
			marginBottom: spacing.lg,
		},
		tagsHeader: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			marginBottom: spacing.sm,
		},
		addTagText: {
			fontSize: 14,
			fontWeight: "600",
			color: colors.accent,
		},
		tagsContainer: {
			flexDirection: "row",
			flexWrap: "wrap",
			gap: spacing.sm,
			marginBottom: spacing.xl,
		},
		tagChip: {
			paddingHorizontal: 14,
			paddingVertical: 8,
			borderRadius: 20,
			backgroundColor: colors.chipBackground,
			borderWidth: 1.5,
			borderColor: colors.border,
		},
		tagChipText: {
			fontSize: 13,
			fontWeight: "600",
			color: colors.textSecondary,
		},
		deleteButton: {
			padding: 16,
			borderRadius: 14,
			backgroundColor: colors.danger + "10",
			alignItems: "center",
			marginTop: spacing.lg,
		},
		deleteButtonText: {
			fontSize: 16,
			fontWeight: "600",
			color: colors.danger,
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
		colorPicker: {
			flexDirection: "row",
			justifyContent: "center",
			gap: spacing.sm,
			marginBottom: spacing.md,
		},
		colorDot: {
			width: 30,
			height: 30,
			borderRadius: 15,
		},
		colorDotSelected: {
			borderWidth: 3,
			borderColor: colors.textPrimary,
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

export default function CardFormScreen({ navigation, route }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const params = route.params;
	const isEdit = params.mode === "edit";
	const projectId = params.projectId;
	const cardId = isEdit ? (params as { cardId: number }).cardId : null;

	const [frontText, setFrontText] = useState("");
	const [backText, setBackText] = useState("");
	const [allTags, setAllTags] = useState<Tag[]>([]);
	const [cardTagIds, setCardTagIds] = useState<Set<number>>(new Set());
	const [showNewTagModal, setShowNewTagModal] = useState(false);
	const [newTagName, setNewTagName] = useState("");
	const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		const tags = await getTagsByProject(projectId);
		setAllTags(tags);

		if (isEdit && cardId) {
			const card = await getCard(cardId);
			if (card) {
				setFrontText(card.front_text);
				setBackText(card.back_text);
			}
			const cardTags = await getTagsForCard(cardId);
			setCardTagIds(new Set(cardTags.map((t) => t.id)));
		}
	};

	const handleSave = async () => {
		if (!frontText.trim() || !backText.trim()) return;

		if (isEdit && cardId) {
			await updateCard(cardId, frontText.trim(), backText.trim());
			// Sync tags
			const existingTags = await getTagsForCard(cardId);
			const existingIds = new Set(existingTags.map((t) => t.id));

			// Add new tags
			for (const tagId of cardTagIds) {
				if (!existingIds.has(tagId)) {
					await addTagToCard(cardId, tagId);
				}
			}
			// Remove old tags
			for (const tagId of existingIds) {
				if (!cardTagIds.has(tagId)) {
					await removeTagFromCard(cardId, tagId);
				}
			}
		} else {
			const newCardId = await createCard(projectId, frontText.trim(), backText.trim());
			for (const tagId of cardTagIds) {
				await addTagToCard(newCardId, tagId);
			}
		}

		navigation.goBack();
	};

	const handleDelete = () => {
		if (!cardId) return;
		Alert.alert(t("llDeleteCard"), t("llDeleteCardConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("delete"),
				style: "destructive",
				onPress: async () => {
					await deleteCard(cardId);
					navigation.goBack();
				},
			},
		]);
	};

	const toggleTag = (tagId: number) => {
		setCardTagIds((prev) => {
			const next = new Set(prev);
			if (next.has(tagId)) {
				next.delete(tagId);
			} else {
				next.add(tagId);
			}
			return next;
		});
	};

	const handleCreateTag = async () => {
		if (!newTagName.trim()) return;
		const tagId = await createTag(projectId, newTagName.trim(), newTagColor);
		setNewTagName("");
		setShowNewTagModal(false);
		const tags = await getTagsByProject(projectId);
		setAllTags(tags);
		// Auto-select new tag
		setCardTagIds((prev) => new Set(prev).add(tagId));
	};

	const canSave = frontText.trim().length > 0 && backText.trim().length > 0;

	return (
		<SafeAreaView style={styles.safeArea}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
						<Text style={styles.cancelText}>{t("cancel")}</Text>
					</TouchableOpacity>
					<Text style={styles.headerTitle}>
						{isEdit ? t("llEditCard") : t("llAddCard")}
					</Text>
					<TouchableOpacity
						style={styles.headerButton}
						onPress={handleSave}
						disabled={!canSave}
					>
						<Text style={[styles.saveText, !canSave && { opacity: 0.4 }]}>
							{t("save")}
						</Text>
					</TouchableOpacity>
				</View>

				<ScrollView contentContainerStyle={styles.content}>
					{/* Front text */}
					<Text style={styles.label}>{t("llFrontText")}</Text>
					<TextInput
						style={styles.input}
						value={frontText}
						onChangeText={setFrontText}
						placeholder={t("llFrontText")}
						placeholderTextColor={colors.textSecondary}
						autoFocus={!isEdit}
					/>

					{/* Back text */}
					<Text style={styles.label}>{t("llBackText")}</Text>
					<TextInput
						style={styles.input}
						value={backText}
						onChangeText={setBackText}
						placeholder={t("llBackText")}
						placeholderTextColor={colors.textSecondary}
					/>

					{/* Tags */}
					<View style={styles.tagsHeader}>
						<Text style={styles.label}>{t("llTags")}</Text>
						<TouchableOpacity onPress={() => setShowNewTagModal(true)}>
							<Text style={styles.addTagText}>+ {t("llAddTag")}</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.tagsContainer}>
						{allTags.map((tag) => {
							const isSelected = cardTagIds.has(tag.id);
							return (
								<TouchableOpacity
									key={tag.id}
									style={[
										styles.tagChip,
										isSelected && { backgroundColor: tag.color, borderColor: tag.color },
									]}
									onPress={() => toggleTag(tag.id)}
									activeOpacity={0.7}
								>
									<Text
										style={[
											styles.tagChipText,
											isSelected && { color: colors.white },
										]}
									>
										{tag.name}
									</Text>
								</TouchableOpacity>
							);
						})}
					</View>

					{/* Delete button (edit mode only) */}
					{isEdit && (
						<TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
							<Text style={styles.deleteButtonText}>{t("llDeleteCard")}</Text>
						</TouchableOpacity>
					)}
				</ScrollView>
			</KeyboardAvoidingView>

			{/* New Tag Modal */}
			<Modal visible={showNewTagModal} transparent animationType="fade" supportedOrientations={["portrait", "landscape"]} onRequestClose={() => setShowNewTagModal(false)}>
				<KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>{t("llAddTag")}</Text>
						<TextInput
							style={styles.modalInput}
							value={newTagName}
							onChangeText={setNewTagName}
							placeholder={t("llTagName")}
							placeholderTextColor={colors.textSecondary}
							autoFocus
						/>
						<View style={styles.colorPicker}>
							{TAG_COLORS.map((color) => (
								<TouchableOpacity
									key={color}
									style={[
										styles.colorDot,
										{ backgroundColor: color },
										newTagColor === color && styles.colorDotSelected,
									]}
									onPress={() => setNewTagColor(color)}
								/>
							))}
						</View>
						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={styles.modalButtonCancel}
								onPress={() => {
									setNewTagName("");
									setShowNewTagModal(false);
								}}
							>
								<Text style={styles.modalButtonCancelText}>{t("cancel")}</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.modalButtonSave, !newTagName.trim() && styles.modalButtonDisabled]}
								onPress={handleCreateTag}
								disabled={!newTagName.trim()}
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
