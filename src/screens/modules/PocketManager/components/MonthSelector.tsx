import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";

type MonthSelectorProps = {
	year: number;
	month: number;
	total: number;
	onPrev: () => void;
	onNext: () => void;
	colors: Colors;
};

const MONTH_KEYS = [
	"january", "february", "march", "april", "may", "june",
	"july", "august", "september", "october", "november", "december",
];

export default function MonthSelector({ year, month, total, onPrev, onNext, colors }: MonthSelectorProps) {
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const monthName = t(MONTH_KEYS[month - 1]);

	return (
		<View style={styles.container}>
			<TouchableOpacity onPress={onPrev} activeOpacity={0.7} style={styles.arrow}>
				<Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
			</TouchableOpacity>
			<View style={styles.center}>
				<Text style={styles.monthText}>{monthName} {year}</Text>
				<Text style={styles.totalText}>{"\u{20BE}"}{total.toFixed(2)}</Text>
			</View>
			<TouchableOpacity onPress={onNext} activeOpacity={0.7} style={styles.arrow}>
				<Ionicons name="chevron-forward" size={24} color={colors.textPrimary} />
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
					justifyContent: "space-between",
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.md,
				},
				arrow: {
					padding: spacing.xs,
				},
				center: {
					alignItems: "center",
				},
				monthText: {
					...typography.headline,
					color: colors.textPrimary,
				},
				totalText: {
					...typography.title2,
					color: colors.accent,
					marginTop: 2,
				},
			}),
		[colors]
	);
}
