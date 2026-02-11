import React, { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useFocusEffect, useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LLQuizStackParamList } from "../../../../types/navigation";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../i18n";
import { getCardsByProject, getCardsByTag, getTagsByProject, Tag } from "../database";
import TagFilter from "../components/TagFilter";

const QUESTION_OPTIONS = [5, 10, 20];

type QuizMode = "easy" | "medium" | "hard";

type ModeOption = {
	mode: QuizMode;
	titleKey: string;
	descKey: string;
};

const MODES: ModeOption[] = [
	{ mode: "easy", titleKey: "llEasy", descKey: "llEasyDesc" },
	{ mode: "medium", titleKey: "llMedium", descKey: "llMediumDesc" },
	{ mode: "hard", titleKey: "llHard", descKey: "llHardDesc" },
];

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		safeArea: {
			flex: 1,
			backgroundColor: colors.background,
		},
		container: {
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
		scrollContent: {
			paddingHorizontal: spacing.lg,
			paddingTop: spacing.md,
			paddingBottom: spacing.md,
		},
		subtitle: {
			fontSize: 15,
			fontWeight: "600",
			color: colors.textSecondary,
			marginBottom: spacing.sm,
			marginTop: spacing.md,
		},
		modesContainer: {
			width: "100%",
			gap: spacing.sm,
		},
		modeButton: {
			padding: spacing.md,
			borderRadius: 14,
			backgroundColor: colors.cardBackground,
			borderWidth: 2,
			borderColor: colors.border,
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.06,
			shadowRadius: 4,
			elevation: 2,
		},
		modeActive: {
			borderColor: colors.accent,
			backgroundColor: colors.accent + "10",
		},
		modeTitle: {
			fontSize: 16,
			fontWeight: "700",
			color: colors.textPrimary,
			marginBottom: 2,
		},
		modeTitleActive: {
			color: colors.accent,
		},
		modeDesc: {
			fontSize: 12,
			color: colors.textSecondary,
		},
		modeDescActive: {
			color: colors.accent,
		},
		countContainer: {
			flexDirection: "row",
			flexWrap: "wrap",
			gap: spacing.sm,
		},
		countButton: {
			paddingHorizontal: 20,
			paddingVertical: 12,
			borderRadius: 12,
			backgroundColor: colors.cardBackground,
			borderWidth: 2,
			borderColor: colors.border,
			minWidth: 60,
			alignItems: "center",
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.06,
			shadowRadius: 4,
			elevation: 2,
		},
		allButton: {
			paddingHorizontal: 16,
		},
		countActive: {
			borderColor: colors.accent,
			backgroundColor: colors.accent,
		},
		countText: {
			fontSize: 16,
			fontWeight: "700",
			color: colors.textPrimary,
		},
		countTextActive: {
			color: colors.white,
		},
		warningText: {
			fontSize: 14,
			color: colors.incorrect,
			marginTop: spacing.md,
			textAlign: "center",
		},
		footer: {
			paddingHorizontal: spacing.lg,
			paddingVertical: spacing.md,
			paddingBottom: spacing.lg,
			backgroundColor: colors.background,
			borderTopWidth: 1,
			borderTopColor: colors.border,
		},
		startButton: {
			backgroundColor: colors.accent,
			paddingVertical: 16,
			borderRadius: 14,
			alignItems: "center",
			shadowColor: colors.accent,
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.3,
			shadowRadius: 8,
			elevation: 6,
		},
		startButtonDisabled: {
			opacity: 0.4,
		},
		startButtonText: {
			fontSize: 18,
			fontWeight: "700",
			color: colors.white,
		},
	}), [colors]);
}

export default function QuizStartScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const navigation = useNavigation<NativeStackNavigationProp<LLQuizStackParamList>>();
	const route = useRoute();
	const projectId = (route.params as any)?.projectId as number;

	const [selectedMode, setSelectedMode] = useState<QuizMode>("easy");
	const [selectedCount, setSelectedCount] = useState(10);
	const [tags, setTags] = useState<Tag[]>([]);
	const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
	const [cardCount, setCardCount] = useState(0);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [selectedTagId]),
	);

	const loadData = async () => {
		const allTags = await getTagsByProject(projectId);
		setTags(allTags);

		let cards;
		if (selectedTagId) {
			cards = await getCardsByTag(projectId, selectedTagId);
		} else {
			cards = await getCardsByProject(projectId);
		}
		setCardCount(cards.length);
	};

	const maxCount = cardCount;
	const effectiveCount = Math.min(selectedCount, maxCount);

	const handleStart = () => {
		if (effectiveCount < 4 && (selectedMode === "easy" || selectedMode === "medium")) {
			// Need at least 4 cards for MC
			return;
		}
		if (effectiveCount < 1) return;

		navigation.navigate("LLQuizPlay", {
			projectId,
			mode: selectedMode,
			questionCount: effectiveCount,
			tagId: selectedTagId,
		});
	};

	const needsMoreCards = (selectedMode === "easy" || selectedMode === "medium") && maxCount < 4;

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.headerTitle} numberOfLines={1}>{t("llQuiz")}</Text>
			</View>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				{/* Tag filter */}
				<TagFilter tags={tags} selectedTagId={selectedTagId} onSelect={setSelectedTagId} />

				{/* Mode selector */}
				<Text style={styles.subtitle}>{t("llSelectMode")}</Text>
				<View style={styles.modesContainer}>
					{MODES.map((m) => {
						const isActive = selectedMode === m.mode;
						return (
							<TouchableOpacity
								key={m.mode}
								style={[styles.modeButton, isActive && styles.modeActive]}
								onPress={() => setSelectedMode(m.mode)}
								activeOpacity={0.7}
							>
								<Text style={[styles.modeTitle, isActive && styles.modeTitleActive]}>
									{t(m.titleKey)}
								</Text>
								<Text style={[styles.modeDesc, isActive && styles.modeDescActive]}>
									{t(m.descKey)}
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>

				{/* Count selector */}
				<Text style={styles.subtitle}>
					{t("llSelectCount")} ({maxCount} {t("llCardCount", { count: String(maxCount) }).toLowerCase()})
				</Text>

				<View style={styles.countContainer}>
					{QUESTION_OPTIONS.filter((count) => count <= maxCount).map((count) => (
						<TouchableOpacity
							key={count}
							style={[styles.countButton, effectiveCount === count && styles.countActive]}
							onPress={() => setSelectedCount(count)}
							activeOpacity={0.7}
						>
							<Text style={[styles.countText, effectiveCount === count && styles.countTextActive]}>
								{count}
							</Text>
						</TouchableOpacity>
					))}
					{maxCount > 0 && (
						<TouchableOpacity
							style={[styles.countButton, styles.allButton, effectiveCount === maxCount && styles.countActive]}
							onPress={() => setSelectedCount(maxCount)}
							activeOpacity={0.7}
						>
							<Text style={[styles.countText, effectiveCount === maxCount && styles.countTextActive]}>
								{t("llAllTags")}
							</Text>
						</TouchableOpacity>
					)}
				</View>

				{needsMoreCards && (
					<Text style={styles.warningText}>
						Need at least 4 cards for multiple choice quiz
					</Text>
				)}
			</ScrollView>

			{/* Fixed footer with Start button */}
			<View style={styles.footer}>
				<TouchableOpacity
					style={[styles.startButton, (needsMoreCards || maxCount === 0) && styles.startButtonDisabled]}
					onPress={handleStart}
					activeOpacity={0.8}
					disabled={needsMoreCards || maxCount === 0}
				>
					<Text style={styles.startButtonText}>{t("llStartQuiz")}</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}
