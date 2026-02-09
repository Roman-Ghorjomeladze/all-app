import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlagsQuizStackParamList } from "../../../../types/navigation";
import { countries, continents, Continent } from "../data/countries";
import { useColors, Colors, spacing } from "../theme";
import { useLanguage } from "../i18n";
import ContinentFilter from "../components/ContinentFilter";

type Props = NativeStackScreenProps<FlagsQuizStackParamList, "FlagsQuizStart">;

const QUESTION_OPTIONS = [10, 20, 30];

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
			marginBottom: spacing.md,
		},
		title: {
			fontSize: 32,
			fontWeight: "700",
			color: colors.textPrimary,
			marginBottom: spacing.md,
		},
		subtitle: {
			fontSize: 17,
			color: colors.textSecondary,
			marginBottom: spacing.md,
			marginTop: spacing.sm,
		},
		optionsContainer: {
			flexDirection: "row",
			flexWrap: "wrap",
			justifyContent: "center",
			gap: spacing.sm,
			marginBottom: spacing.xl,
		},
		optionButton: {
			paddingHorizontal: 24,
			paddingVertical: 14,
			borderRadius: 14,
			backgroundColor: colors.cardBackground,
			borderWidth: 2,
			borderColor: colors.border,
			minWidth: 70,
			alignItems: "center",
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.06,
			shadowRadius: 4,
			elevation: 2,
		},
		optionActive: {
			borderColor: colors.accent,
			backgroundColor: colors.accent,
		},
		optionText: {
			fontSize: 18,
			fontWeight: "700",
			color: colors.textPrimary,
		},
		optionTextActive: {
			color: colors.white,
		},
		startButton: {
			backgroundColor: colors.accent,
			paddingHorizontal: 48,
			paddingVertical: 16,
			borderRadius: 16,
			shadowColor: colors.accent,
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.3,
			shadowRadius: 8,
			elevation: 6,
		},
		startButtonText: {
			fontSize: 18,
			fontWeight: "700",
			color: colors.white,
		},
	}), [colors]);
}

export default function QuizStartScreen({ navigation }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const [selectedCount, setSelectedCount] = useState(10);
	const [selectedContinent, setSelectedContinent] = useState<Continent | null>(null);

	const availableCountries = useMemo(() => {
		if (!selectedContinent) return countries;
		return countries.filter((c) => c.continent === selectedContinent);
	}, [selectedContinent]);

	const maxCount = availableCountries.length;

	// Clamp selectedCount if it exceeds available countries after filter change
	const effectiveCount = Math.min(selectedCount, maxCount);

	const handleStart = () => {
		navigation.navigate("FlagsQuizPlay", {
			questionCount: effectiveCount,
			continent: selectedContinent,
		});
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<Text style={styles.emoji}>{"\u{1F30D}"}</Text>
				<Text style={styles.title}>{t("flFlagQuiz")}</Text>

				{/* Continent Filter */}
				<ContinentFilter selected={selectedContinent} onSelect={setSelectedContinent} />

				<Text style={styles.subtitle}>{t("flSelectCount")}</Text>

				<View style={styles.optionsContainer}>
					{QUESTION_OPTIONS.filter((count) => count <= maxCount).map((count) => (
						<TouchableOpacity
							key={count}
							style={[styles.optionButton, effectiveCount === count && styles.optionActive]}
							onPress={() => setSelectedCount(count)}
							activeOpacity={0.7}
						>
							<Text
								style={[
									styles.optionText,
									effectiveCount === count && styles.optionTextActive,
								]}
							>
								{count}
							</Text>
						</TouchableOpacity>
					))}
					<TouchableOpacity
						style={[
							styles.optionButton,
							effectiveCount === maxCount && styles.optionActive,
						]}
						onPress={() => setSelectedCount(maxCount)}
						activeOpacity={0.7}
					>
						<Text
							style={[
								styles.optionText,
								effectiveCount === maxCount && styles.optionTextActive,
							]}
						>
							{t("flAllFlags")} ({maxCount})
						</Text>
					</TouchableOpacity>
				</View>

				<TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.8}>
					<Text style={styles.startButtonText}>{t("flStartQuiz")}</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}
