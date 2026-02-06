import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlagsQuizStackParamList } from "../../../../types/navigation";
import { useColors, Colors, spacing } from "../theme";
import { useLanguage } from "../i18n";

type Props = NativeStackScreenProps<FlagsQuizStackParamList, "FlagsQuizResult">;

function getResultEmoji(percentage: number): string {
	if (percentage >= 90) return "\u{1F3C6}";
	if (percentage >= 70) return "\u{1F389}";
	if (percentage >= 50) return "\u{1F44D}";
	return "\u{1F4AA}";
}

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		safeArea: {
			flex: 1,
			backgroundColor: colors.background,
		},
		container: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
			paddingHorizontal: spacing.lg,
		},
		emoji: {
			fontSize: 80,
			marginBottom: spacing.lg,
		},
		title: {
			fontSize: 28,
			fontWeight: "700",
			color: colors.textPrimary,
			marginBottom: spacing.lg,
		},
		scoreCircle: {
			width: 140,
			height: 140,
			borderRadius: 70,
			borderWidth: 5,
			justifyContent: "center",
			alignItems: "center",
			marginBottom: spacing.md,
		},
		scoreText: {
			fontSize: 42,
			fontWeight: "800",
		},
		scoreDivider: {
			width: 40,
			height: 3,
			borderRadius: 1.5,
			marginVertical: 2,
		},
		scoreTotalText: {
			fontSize: 24,
			fontWeight: "600",
			opacity: 0.7,
		},
		percentage: {
			fontSize: 24,
			fontWeight: "700",
			marginBottom: spacing.xl,
		},
		buttonsContainer: {
			width: "100%",
			gap: spacing.sm,
		},
		playAgainButton: {
			backgroundColor: colors.accent,
			paddingVertical: 16,
			borderRadius: 16,
			alignItems: "center",
			shadowColor: colors.accent,
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.3,
			shadowRadius: 8,
			elevation: 6,
		},
		playAgainText: {
			fontSize: 18,
			fontWeight: "700",
			color: colors.white,
		},
	}), [colors]);
}

export default function QuizResultScreen({ navigation, route }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const { correct, total } = route.params;
	const percentage = Math.round((correct / total) * 100);

	function getResultColor(percentage: number): string {
		if (percentage >= 90) return colors.gold;
		if (percentage >= 70) return colors.correct;
		if (percentage >= 50) return colors.accentLight;
		return colors.incorrect;
	}

	const handlePlayAgain = () => {
		navigation.popToTop();
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<Text style={styles.emoji}>{getResultEmoji(percentage)}</Text>

				<Text style={styles.title}>{t("flResult")}</Text>

				<View style={[styles.scoreCircle, { borderColor: getResultColor(percentage) }]}>
					<Text style={[styles.scoreText, { color: getResultColor(percentage) }]}>
						{correct}
					</Text>
					<View style={[styles.scoreDivider, { backgroundColor: getResultColor(percentage) }]} />
					<Text style={[styles.scoreTotalText, { color: getResultColor(percentage) }]}>
						{total}
					</Text>
				</View>

				<Text style={[styles.percentage, { color: getResultColor(percentage) }]}>
					{percentage}%
				</Text>

				<View style={styles.buttonsContainer}>
					<TouchableOpacity
						style={styles.playAgainButton}
						onPress={handlePlayAgain}
						activeOpacity={0.8}
					>
						<Text style={styles.playAgainText}>{t("flPlayAgain")}</Text>
					</TouchableOpacity>
				</View>
			</View>
		</SafeAreaView>
	);
}
