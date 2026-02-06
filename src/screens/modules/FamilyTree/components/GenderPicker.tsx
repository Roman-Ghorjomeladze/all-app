import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useColors, Colors, spacing } from "../theme";
import { useLanguage } from "../../../../i18n";

type GenderPickerProps = {
	value: "male" | "female" | "other";
	onChange: (gender: "male" | "female" | "other") => void;
};

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		container: {
			marginBottom: spacing.md,
		},
		label: {
			fontSize: 14,
			fontWeight: "500",
			color: colors.textSecondary,
			marginBottom: spacing.sm,
		},
		optionsRow: {
			flexDirection: "row",
			gap: spacing.sm,
		},
		option: {
			flex: 1,
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
			paddingVertical: 12,
			borderRadius: 12,
			borderWidth: 1.5,
			borderColor: colors.border,
			backgroundColor: colors.cardBackground,
			gap: 6,
		},
		emoji: {
			fontSize: 18,
			color: colors.textSecondary,
		},
		optionText: {
			fontSize: 14,
			color: colors.textPrimary,
		},
	}), [colors]);
}

export default function GenderPicker({ value, onChange }: GenderPickerProps) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const genderOptions: { key: "male" | "female" | "other"; emoji: string; i18nKey: string; color: string }[] = [
		{ key: "male", emoji: "\u2642", i18nKey: "ftMale", color: colors.male },
		{ key: "female", emoji: "\u2640", i18nKey: "ftFemale", color: colors.female },
		{ key: "other", emoji: "\u26A5", i18nKey: "ftOther", color: colors.other },
	];

	return (
		<View style={styles.container}>
			<Text style={styles.label}>{t("ftGender")}</Text>
			<View style={styles.optionsRow}>
				{genderOptions.map((option) => {
					const isSelected = value === option.key;
					return (
						<TouchableOpacity
							key={option.key}
							style={[
								styles.option,
								isSelected && { backgroundColor: option.color + "20", borderColor: option.color },
							]}
							onPress={() => onChange(option.key)}
							activeOpacity={0.7}
						>
							<Text style={[styles.emoji, isSelected && { color: option.color }]}>{option.emoji}</Text>
							<Text style={[styles.optionText, isSelected && { color: option.color, fontWeight: "600" }]}>
								{t(option.i18nKey)}
							</Text>
						</TouchableOpacity>
					);
				})}
			</View>
		</View>
	);
}
