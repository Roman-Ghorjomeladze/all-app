import React, { useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { RecurrenceType } from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";

const RECURRENCE_TYPES: RecurrenceType[] = ["none", "daily", "weekly", "monthly", "yearly", "custom"];

const RECURRENCE_I18N: Record<RecurrenceType, string> = {
	none: "tdRecurrenceNone",
	daily: "tdRecurrenceDaily",
	weekly: "tdRecurrenceWeekly",
	monthly: "tdRecurrenceMonthly",
	yearly: "tdRecurrenceYearly",
	custom: "tdRecurrenceCustom",
};

type Props = {
	type: RecurrenceType;
	interval: number;
	onTypeChange: (type: RecurrenceType) => void;
	onIntervalChange: (interval: number) => void;
};

export default function RecurrenceSelector({ type, interval, onTypeChange, onIntervalChange }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	return (
		<View>
			<View style={styles.chipRow}>
				{RECURRENCE_TYPES.map((r) => {
					const isSelected = r === type;
					return (
						<TouchableOpacity
							key={r}
							style={[styles.chip, isSelected && styles.chipActive]}
							onPress={() => onTypeChange(r)}
							activeOpacity={0.7}
						>
							<Text style={[styles.chipLabel, isSelected && styles.chipLabelActive]}>
								{t(RECURRENCE_I18N[r])}
							</Text>
						</TouchableOpacity>
					);
				})}
			</View>
			{type === "custom" && (
				<View style={styles.customRow}>
					<Text style={styles.customLabel}>{t("tdRecurrenceEvery")}</Text>
					<TextInput
						style={styles.customInput}
						value={String(interval)}
						onChangeText={(v) => {
							const n = parseInt(v, 10);
							if (!isNaN(n) && n > 0) onIntervalChange(n);
						}}
						keyboardType="number-pad"
						maxLength={3}
					/>
					<Text style={styles.customLabel}>{t("tdRecurrenceDays")}</Text>
				</View>
			)}
		</View>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				chipRow: {
					flexDirection: "row",
					flexWrap: "wrap",
					gap: 6,
				},
				chip: {
					paddingHorizontal: 12,
					paddingVertical: 8,
					borderRadius: 16,
					backgroundColor: colors.chipBackground,
					borderWidth: 1,
					borderColor: "transparent",
				},
				chipActive: {
					backgroundColor: colors.accent + "25",
					borderColor: colors.accent,
				},
				chipLabel: {
					...typography.subhead,
					color: colors.textSecondary,
				},
				chipLabelActive: {
					color: colors.accent,
					fontWeight: "600",
				},
				customRow: {
					flexDirection: "row",
					alignItems: "center",
					marginTop: spacing.md,
					gap: spacing.sm,
				},
				customLabel: {
					...typography.body,
					color: colors.textPrimary,
				},
				customInput: {
					...typography.body,
					color: colors.textPrimary,
					backgroundColor: colors.inputBackground,
					borderWidth: 1,
					borderColor: colors.border,
					borderRadius: 8,
					paddingHorizontal: 12,
					paddingVertical: 6,
					width: 60,
					textAlign: "center",
				},
			}),
		[colors]
	);
}
