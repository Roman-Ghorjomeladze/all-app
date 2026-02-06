import React, { useMemo } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useColors, Colors, spacing } from "../theme";
import { useLanguage } from "../../../../i18n";

type Mood = "happy" | "neutral" | "sad" | "irritated" | "tired";

type MoodSelectorProps = {
	selectedMood: Mood | null;
	onSelect: (mood: Mood) => void;
};

const MOODS: { key: Mood; emoji: string; labelKey: string }[] = [
	{ key: "happy", emoji: "😊", labelKey: "moodHappy" },
	{ key: "neutral", emoji: "😐", labelKey: "moodNeutral" },
	{ key: "sad", emoji: "😢", labelKey: "moodSad" },
	{ key: "irritated", emoji: "😤", labelKey: "moodIrritated" },
	{ key: "tired", emoji: "😴", labelKey: "moodTired" },
];

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		container: {
			flexDirection: "row",
			justifyContent: "space-between",
		},
		moodButton: {
			alignItems: "center",
			padding: spacing.sm,
			borderRadius: 12,
			backgroundColor: colors.cardBackground,
			borderWidth: 1,
			borderColor: colors.border,
			minWidth: 60,
		},
		moodButtonSelected: {
			backgroundColor: colors.period + "20",
			borderColor: colors.period,
		},
		emoji: {
			fontSize: 28,
			marginBottom: 4,
		},
		label: {
			fontSize: 11,
			color: colors.textSecondary,
		},
		labelSelected: {
			color: colors.period,
			fontWeight: "600",
		},
	}), [colors]);
}

export default function MoodSelector({ selectedMood, onSelect }: MoodSelectorProps) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	return (
		<View style={styles.container}>
			{MOODS.map((mood) => (
				<TouchableOpacity
					key={mood.key}
					style={[styles.moodButton, selectedMood === mood.key && styles.moodButtonSelected]}
					onPress={() => onSelect(mood.key)}
					activeOpacity={0.7}
				>
					<Text style={styles.emoji}>{mood.emoji}</Text>
					<Text style={[styles.label, selectedMood === mood.key && styles.labelSelected]}>
						{t(mood.labelKey)}
					</Text>
				</TouchableOpacity>
			))}
		</View>
	);
}
