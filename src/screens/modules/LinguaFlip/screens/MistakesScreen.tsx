import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	Alert,
	Modal,
} from "react-native";
import { useFocusEffect, useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BottomTabScreenProps, BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { LinguaFlipTabParamList, LLQuizStackParamList } from "../../../../types/navigation";
import { useColors, Colors, spacing } from "../theme";
import { useLanguage } from "../i18n";
import { getMistakesByProject, deleteMistake, clearAllMistakes, Mistake } from "../database";
import MistakeItem from "../components/MistakeItem";

type Props = BottomTabScreenProps<LinguaFlipTabParamList, "LLMistakes">;

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.background,
		},
		headerButton: {
			paddingHorizontal: 12,
			paddingVertical: 4,
		},
		clearAllText: {
			fontSize: 14,
			fontWeight: "600",
			color: colors.danger,
		},
		listContent: {
			padding: spacing.md,
			paddingBottom: 40,
			flexGrow: 1,
		},
		emptyContainer: {
			flex: 1,
			justifyContent: "center",
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
			width: "90%",
			maxWidth: 400,
		},
		modalHeader: {
			alignItems: "center",
			marginBottom: spacing.md,
		},
		modalModeLabel: {
			fontSize: 13,
			fontWeight: "700",
			color: colors.accent,
			letterSpacing: 1,
			textTransform: "uppercase",
		},
		modalLabel: {
			fontSize: 12,
			fontWeight: "600",
			color: colors.textSecondary,
			marginBottom: 4,
			textTransform: "uppercase",
			letterSpacing: 0.5,
		},
		modalFrontText: {
			fontSize: 24,
			fontWeight: "700",
			color: colors.textPrimary,
			marginBottom: spacing.md,
		},
		modalBackText: {
			fontSize: 18,
			fontWeight: "600",
			color: colors.accent,
			marginBottom: spacing.lg,
		},
		answerSection: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
			marginBottom: spacing.md,
		},
		answerBox: {
			alignItems: "center",
			flex: 1,
		},
		answerLabel: {
			fontSize: 11,
			color: colors.textSecondary,
			marginBottom: 2,
		},
		wrongAnswer: {
			fontSize: 16,
			fontWeight: "600",
			color: colors.incorrect,
		},
		correctAnswer: {
			fontSize: 16,
			fontWeight: "600",
			color: colors.correct,
		},
		arrow: {
			fontSize: 20,
			color: colors.textSecondary,
			marginHorizontal: spacing.sm,
		},
		dateText: {
			fontSize: 12,
			color: colors.textSecondary,
			textAlign: "center",
			marginBottom: spacing.md,
		},
		modalButtons: {
			flexDirection: "row",
			gap: spacing.sm,
		},
		closeButton: {
			flex: 1,
			padding: 14,
			borderRadius: 12,
			backgroundColor: colors.background,
			alignItems: "center",
		},
		closeButtonText: {
			fontSize: 16,
			fontWeight: "500",
			color: colors.textSecondary,
		},
	}), [colors]);
}

export default function MistakesScreen(_props: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const route = useRoute();
	const stackNavigation = useNavigation<NativeStackNavigationProp<LLQuizStackParamList>>();
	const tabNavigation = useNavigation<BottomTabNavigationProp<LinguaFlipTabParamList>>();
	const projectId = (route.params as any)?.projectId as number;

	const [mistakes, setMistakes] = useState<Mistake[]>([]);
	const [selectedMistake, setSelectedMistake] = useState<Mistake | null>(null);

	const loadMistakes = useCallback(async () => {
		const all = await getMistakesByProject(projectId);
		setMistakes(all);
	}, [projectId]);

	useFocusEffect(
		useCallback(() => {
			loadMistakes();
		}, [loadMistakes]),
	);

	const handleClearAll = useCallback(() => {
		Alert.alert(t("llClearAll"), t("llClearAllConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("delete"),
				style: "destructive",
				onPress: async () => {
					await clearAllMistakes(projectId);
					loadMistakes();
				},
			},
		]);
	}, [t, projectId, loadMistakes]);

	// Update header with Clear All button when there are mistakes
	useEffect(() => {
		tabNavigation.setOptions({
			headerRight: mistakes.length > 0
				? () => (
					<TouchableOpacity style={styles.headerButton} onPress={handleClearAll}>
						<Text style={styles.clearAllText}>{t("llClearAll")}</Text>
					</TouchableOpacity>
				)
				: undefined,
		});
	}, [mistakes.length, t, tabNavigation, handleClearAll, styles]);

	const handleDelete = async (mistake: Mistake) => {
		await deleteMistake(mistake.id);
		loadMistakes();
	};

	const handleReQuiz = () => {
		if (!selectedMistake) return;
		setSelectedMistake(null);
		// Navigate to quiz with specific mode
		stackNavigation.navigate("LLQuizPlay", {
			projectId,
			mode: selectedMistake.quiz_mode as "easy" | "medium" | "hard",
			questionCount: 1,
			tagId: null,
		});
	};

	const modeLabel = (mode: string) =>
		mode === "easy" ? t("llEasy") : mode === "medium" ? t("llMedium") : t("llHard");

	return (
		<View style={styles.container}>
			{/* List */}
			<FlatList
				data={mistakes}
				keyExtractor={(item) => String(item.id)}
				contentContainerStyle={styles.listContent}
				renderItem={({ item }) => (
					<MistakeItem
						mistake={item}
						onPress={() => setSelectedMistake(item)}
						onDelete={() => handleDelete(item)}
					/>
				)}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyEmoji}>{"\u{1F389}"}</Text>
						<Text style={styles.emptyTitle}>{t("llNoMistakes")}</Text>
						<Text style={styles.emptyHint}>{t("llNoMistakesHint")}</Text>
					</View>
				}
			/>

			{/* Detail Modal */}
			<Modal
				visible={!!selectedMistake}
				transparent
				animationType="fade"
				supportedOrientations={["portrait", "landscape"]}
				onRequestClose={() => setSelectedMistake(null)}
			>
				<TouchableOpacity
					style={styles.modalOverlay}
					activeOpacity={1}
					onPress={() => setSelectedMistake(null)}
				>
					<View style={styles.modalContent}>
						{selectedMistake && (
							<>
								<View style={styles.modalHeader}>
									<Text style={styles.modalModeLabel}>
										{modeLabel(selectedMistake.quiz_mode)}
									</Text>
								</View>

								<Text style={styles.modalLabel}>Question</Text>
								<Text style={styles.modalFrontText}>
									{selectedMistake.front_text || "—"}
								</Text>

								<Text style={styles.modalLabel}>Translation</Text>
								<Text style={styles.modalBackText}>
									{selectedMistake.back_text || "—"}
								</Text>

								<View style={styles.answerSection}>
									<View style={styles.answerBox}>
										<Text style={styles.answerLabel}>Your answer</Text>
										<Text style={styles.wrongAnswer}>
											{selectedMistake.user_answer || "—"}
										</Text>
									</View>
									<Text style={styles.arrow}>{"\u2192"}</Text>
									<View style={styles.answerBox}>
										<Text style={styles.answerLabel}>Correct</Text>
										<Text style={styles.correctAnswer}>
											{selectedMistake.correct_answer}
										</Text>
									</View>
								</View>

								<Text style={styles.dateText}>
									{new Date(selectedMistake.created_at).toLocaleDateString()}
								</Text>

								<View style={styles.modalButtons}>
									<TouchableOpacity
										style={styles.closeButton}
										onPress={() => setSelectedMistake(null)}
									>
										<Text style={styles.closeButtonText}>{t("cancel")}</Text>
									</TouchableOpacity>
								</View>
							</>
						)}
					</View>
				</TouchableOpacity>
			</Modal>
		</View>
	);
}
