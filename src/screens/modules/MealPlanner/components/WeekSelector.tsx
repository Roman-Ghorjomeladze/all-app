import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";

type Props = {
	weekStart: Date;
	onPrev: () => void;
	onNext: () => void;
	colors: Colors;
};

function formatWeekRange(start: Date, t: (key: string) => string): string {
	const end = new Date(start);
	end.setDate(end.getDate() + 6);
	const months = [
		"january", "february", "march", "april", "may", "june",
		"july", "august", "september", "october", "november", "december",
	];
	const startMonth = t(months[start.getMonth()]).slice(0, 3);
	const endMonth = t(months[end.getMonth()]).slice(0, 3);
	if (start.getMonth() === end.getMonth()) {
		return `${startMonth} ${start.getDate()} - ${end.getDate()}`;
	}
	return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
}

export default function WeekSelector({ weekStart, onPrev, onNext, colors }: Props) {
	const styles = useStyles(colors);
	const { t } = useLanguage();

	return (
		<View style={styles.container}>
			<TouchableOpacity onPress={onPrev} activeOpacity={0.7} style={styles.arrow}>
				<Ionicons name="chevron-back" size={24} color={colors.accent} />
			</TouchableOpacity>
			<Text style={styles.label}>{formatWeekRange(weekStart, t)}</Text>
			<TouchableOpacity onPress={onNext} activeOpacity={0.7} style={styles.arrow}>
				<Ionicons name="chevron-forward" size={24} color={colors.accent} />
			</TouchableOpacity>
		</View>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					paddingVertical: spacing.md,
					gap: spacing.md,
				},
				arrow: {
					padding: spacing.xs,
				},
				label: {
					...typography.headline,
					color: colors.textPrimary,
					minWidth: 160,
					textAlign: "center",
				},
			}),
		[colors]
	);
}
