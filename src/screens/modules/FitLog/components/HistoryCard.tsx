import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HistoryEntry } from "../database";
import { Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";

type HistoryCardProps = {
	entry: HistoryEntry;
	onDelete: (entry: HistoryEntry) => void;
	colors: Colors;
};

export default function HistoryCard({ entry, onDelete, colors }: HistoryCardProps) {
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const formattedDate = useMemo(() => {
		const d = new Date(entry.completed_at);
		return d.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	}, [entry.completed_at]);

	const formattedTime = useMemo(() => {
		const d = new Date(entry.completed_at);
		return d.toLocaleTimeString(undefined, {
			hour: "2-digit",
			minute: "2-digit",
		});
	}, [entry.completed_at]);

	const formattedDuration = useMemo(() => {
		const total = entry.total_duration_seconds;
		const minutes = Math.floor(total / 60);
		const seconds = total % 60;
		if (minutes > 0 && seconds > 0) return `${minutes}${t("fitMin")} ${seconds}${t("fitSec")}`;
		if (minutes > 0) return `${minutes}${t("fitMin")}`;
		return `${seconds}${t("fitSec")}`;
	}, [entry.total_duration_seconds, t]);

	return (
		<View style={styles.card}>
			<View style={styles.topRow}>
				<View style={styles.info}>
					<Text style={styles.name} numberOfLines={1}>{entry.workout_name}</Text>
					<Text style={styles.dateTime}>
						{formattedDate} {"\u00B7"} {formattedTime}
					</Text>
				</View>
				<TouchableOpacity
					onPress={() => onDelete(entry)}
					activeOpacity={0.7}
					hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
				>
					<Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
				</TouchableOpacity>
			</View>
			<View style={styles.statsRow}>
				<View style={styles.stat}>
					<Ionicons name="time-outline" size={14} color={colors.textSecondary} />
					<Text style={styles.statText}>{formattedDuration}</Text>
				</View>
				<View style={styles.stat}>
					<Ionicons name="barbell-outline" size={14} color={colors.textSecondary} />
					<Text style={styles.statText}>
						{entry.exercises_completed} {t("fitExercises")}
					</Text>
				</View>
			</View>
		</View>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				card: {
					backgroundColor: colors.cardBackground,
					borderRadius: 12,
					padding: spacing.md,
					marginBottom: spacing.sm,
					shadowColor: colors.shadow,
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.08,
					shadowRadius: 4,
					elevation: 2,
				},
				topRow: {
					flexDirection: "row",
					alignItems: "flex-start",
					justifyContent: "space-between",
					marginBottom: spacing.sm,
				},
				info: {
					flex: 1,
					marginRight: spacing.sm,
				},
				name: {
					...typography.headline,
					color: colors.textPrimary,
					marginBottom: 2,
				},
				dateTime: {
					...typography.footnote,
					color: colors.textSecondary,
				},
				statsRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: spacing.md,
				},
				stat: {
					flexDirection: "row",
					alignItems: "center",
					gap: spacing.xs,
				},
				statText: {
					...typography.footnote,
					color: colors.textSecondary,
				},
			}),
		[colors]
	);
}
