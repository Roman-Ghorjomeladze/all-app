import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Mistake } from "../database";
import { useColors, Colors, spacing } from "../theme";
import { useLanguage } from "../i18n";

type Props = {
	mistake: Mistake;
	onPress: () => void;
	onDelete: () => void;
};

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		container: {
			flexDirection: "row",
			alignItems: "center",
			marginBottom: spacing.sm,
			borderRadius: 14,
			backgroundColor: colors.cardBackground,
			borderWidth: 1,
			borderColor: colors.border,
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.06,
			shadowRadius: 4,
			elevation: 2,
		},
		content: {
			flex: 1,
			padding: spacing.md,
		},
		topRow: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			marginBottom: 4,
		},
		frontText: {
			fontSize: 16,
			fontWeight: "600",
			color: colors.textPrimary,
			flex: 1,
		},
		modeBadge: {
			paddingHorizontal: 8,
			paddingVertical: 3,
			borderRadius: 8,
			marginLeft: spacing.sm,
		},
		modeText: {
			fontSize: 11,
			fontWeight: "700",
		},
		backText: {
			fontSize: 14,
			color: colors.textSecondary,
			marginBottom: spacing.xs,
		},
		answerRow: {
			flexDirection: "row",
			alignItems: "center",
			flexWrap: "wrap",
		},
		answerLabel: {
			fontSize: 12,
			color: colors.textSecondary,
		},
		wrongAnswer: {
			fontSize: 12,
			fontWeight: "600",
			color: colors.incorrect,
		},
		correctAnswer: {
			fontSize: 12,
			fontWeight: "600",
			color: colors.correct,
		},
		deleteButton: {
			paddingHorizontal: spacing.md,
			paddingVertical: spacing.md,
			justifyContent: "center",
			alignItems: "center",
		},
	}), [colors]);
}

export default function MistakeItem({ mistake, onPress, onDelete }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const handleDelete = () => {
		Alert.alert(t("delete"), t("llDeleteMistakeConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("delete"),
				style: "destructive",
				onPress: onDelete,
			},
		]);
	};

	const modeLabel =
		mistake.quiz_mode === "easy"
			? "Easy"
			: mistake.quiz_mode === "medium"
				? "Medium"
				: "Hard";

	const modeColor =
		mistake.quiz_mode === "easy"
			? colors.correct
			: mistake.quiz_mode === "medium"
				? colors.gold
				: colors.incorrect;

	return (
		<View style={styles.container}>
			<TouchableOpacity style={styles.content} onPress={onPress} activeOpacity={0.7}>
				<View style={styles.topRow}>
					<Text style={styles.frontText} numberOfLines={1}>
						{mistake.front_text || "—"}
					</Text>
					<View style={[styles.modeBadge, { backgroundColor: modeColor + "20" }]}>
						<Text style={[styles.modeText, { color: modeColor }]}>{modeLabel}</Text>
					</View>
				</View>
				<Text style={styles.backText} numberOfLines={1}>
					{mistake.back_text || "—"}
				</Text>
				<View style={styles.answerRow}>
					<Text style={styles.answerLabel}>Your answer: </Text>
					<Text style={styles.wrongAnswer}>{mistake.user_answer || "—"}</Text>
					<Text style={styles.answerLabel}> → </Text>
					<Text style={styles.correctAnswer}>{mistake.correct_answer}</Text>
				</View>
			</TouchableOpacity>
			<TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
				<Ionicons name="trash-outline" size={24} color="red" />
			</TouchableOpacity>
		</View>
	);
}
