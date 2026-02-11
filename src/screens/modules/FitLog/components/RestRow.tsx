import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";

type RestRowItem = {
	duration_seconds: number;
};

type RestRowProps = {
	item: RestRowItem;
	index: number;
	onDurationChange: (index: number, seconds: number) => void;
	onRemove: (index: number) => void;
	colors: Colors;
};

export default function RestRow({ item, index, onDurationChange, onRemove, colors }: RestRowProps) {
	const styles = useStyles(colors);
	const { t } = useLanguage();

	return (
		<View style={styles.container}>
			<View style={[styles.accentDot, { backgroundColor: colors.restColor }]} />
			<View style={styles.leftSection}>
				<Text style={styles.label}>{t("fitRest")}</Text>
				<View style={styles.durationRow}>
					<TextInput
						style={styles.durationInput}
						value={String(item.duration_seconds)}
						onChangeText={(text) => {
							const num = parseInt(text, 10);
							if (!isNaN(num) && num >= 0) onDurationChange(index, num);
						}}
						keyboardType="number-pad"
						selectTextOnFocus
					/>
					<Text style={styles.durationLabel}>{t("fitSeconds")}</Text>
				</View>
			</View>
			<TouchableOpacity
				onPress={() => onRemove(index)}
				activeOpacity={0.7}
				hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
			>
				<Ionicons name="trash-outline" size={18} color={colors.danger} />
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
					backgroundColor: colors.cardBackground,
					borderRadius: 12,
					padding: spacing.sm,
					marginBottom: spacing.sm,
					borderWidth: 0.5,
					borderColor: colors.border,
				},
				accentDot: {
					width: 8,
					height: 8,
					borderRadius: 4,
					marginRight: spacing.sm,
				},
				leftSection: {
					flexDirection: "row",
					alignItems: "center",
					flex: 1,
				},
				label: {
					...typography.callout,
					color: colors.restColor,
					fontWeight: "600",
					marginRight: spacing.md,
				},
				durationRow: {
					flexDirection: "row",
					alignItems: "center",
				},
				durationInput: {
					...typography.footnote,
					color: colors.textPrimary,
					backgroundColor: colors.inputBackground,
					borderRadius: 6,
					paddingHorizontal: spacing.sm,
					paddingVertical: 2,
					minWidth: 48,
					textAlign: "center",
				},
				durationLabel: {
					...typography.footnote,
					color: colors.textSecondary,
					marginLeft: spacing.xs,
				},
			}),
		[colors]
	);
}
