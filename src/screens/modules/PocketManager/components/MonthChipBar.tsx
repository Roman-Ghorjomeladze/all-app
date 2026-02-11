import React, { useMemo, useRef, useEffect } from "react";
import { ScrollView, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";

type MonthChipBarProps = {
	selectedYear: number;
	selectedMonth: number;
	onSelect: (year: number, month: number) => void;
	colors: Colors;
};

const SHORT_MONTH_KEYS = [
	"january",
	"february",
	"march",
	"april",
	"may",
	"june",
	"july",
	"august",
	"september",
	"october",
	"november",
	"december",
];

function generateMonths(): { year: number; month: number }[] {
	const now = new Date();
	const months: { year: number; month: number }[] = [];
	// Show last 12 months including current
	for (let i = 11; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
	}
	return months;
}

export default function MonthChipBar({ selectedYear, selectedMonth, onSelect, colors }: MonthChipBarProps) {
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const scrollRef = useRef<ScrollView>(null);
	const months = useMemo(() => generateMonths(), []);

	useEffect(() => {
		// Scroll to end (current month) on mount
		setTimeout(() => {
			scrollRef.current?.scrollToEnd({ animated: false });
		}, 100);
	}, []);

	return (
		<ScrollView
			ref={scrollRef}
			horizontal
			showsHorizontalScrollIndicator={false}
			style={{ flexGrow: 0 }}
			contentContainerStyle={styles.container}
		>
			{months.map(({ year, month }) => {
				const isSelected = year === selectedYear && month === selectedMonth;
				const label = t(SHORT_MONTH_KEYS[month - 1]).slice(0, 3);
				return (
					<TouchableOpacity
						key={`${year}-${month}`}
						style={[styles.chip, isSelected && styles.chipSelected]}
						onPress={() => onSelect(year, month)}
						activeOpacity={0.7}
					>
						<Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{label}</Text>
						{year !== new Date().getFullYear() && (
							<Text style={[styles.yearText, isSelected && styles.chipTextSelected]}>
								{String(year).slice(2)}
							</Text>
						)}
					</TouchableOpacity>
				);
			})}
		</ScrollView>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.xs,
					gap: spacing.sm,
					alignItems: "center",
				},
				chip: {
					flexDirection: "row",
					alignItems: "center",
					paddingHorizontal: spacing.md,
					paddingVertical: 10,
					borderRadius: 18,
					backgroundColor: colors.chipBackground,
				},
				chipSelected: {
					backgroundColor: colors.accent,
				},
				chipText: {
					...typography.subhead,
					fontWeight: "600",
					color: colors.textSecondary,
				},
				chipTextSelected: {
					color: colors.white,
				},
				yearText: {
					...typography.caption2,
					color: colors.textSecondary,
					marginLeft: 2,
				},
			}),
		[colors],
	);
}
