import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CalorieEntry } from "../database";
import { Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";

type Props = {
	entry: CalorieEntry;
	onEdit: (entry: CalorieEntry) => void;
	onDelete: (entry: CalorieEntry) => void;
	colors: Colors;
};

export default function CalorieBookItem({ entry, onEdit, onDelete, colors }: Props) {
	const styles = useStyles(colors);
	const { t } = useLanguage();

	return (
		<View style={styles.container}>
			<View style={styles.info}>
				<Text style={styles.foodName} numberOfLines={1}>{entry.food_name}</Text>
				<Text style={styles.calories}>
					{entry.calories_per_100g} {t("mpKcal")} / 100{t("mpG")}
				</Text>
			</View>
			<View style={styles.actions}>
				<TouchableOpacity onPress={() => onEdit(entry)} activeOpacity={0.7} style={styles.actionButton}>
					<Ionicons name="pencil" size={18} color={colors.accent} />
				</TouchableOpacity>
				<TouchableOpacity onPress={() => onDelete(entry)} activeOpacity={0.7} style={styles.actionButton}>
					<Ionicons name="trash-outline" size={18} color={colors.danger} />
				</TouchableOpacity>
			</View>
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
					backgroundColor: colors.cardBackground,
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.md,
					borderBottomWidth: 0.5,
					borderBottomColor: colors.border,
				},
				info: {
					flex: 1,
				},
				foodName: {
					...typography.headline,
					color: colors.textPrimary,
				},
				calories: {
					...typography.subhead,
					color: colors.calorieAccent,
					marginTop: 2,
				},
				actions: {
					flexDirection: "row",
					gap: spacing.sm,
				},
				actionButton: {
					padding: spacing.xs,
				},
			}),
		[colors]
	);
}
