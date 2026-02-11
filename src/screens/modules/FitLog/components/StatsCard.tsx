import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, spacing, typography } from "../theme";

type StatsCardProps = {
	label: string;
	value: string;
	icon: string;
	colors: Colors;
};

export default function StatsCard({ label, value, icon, colors }: StatsCardProps) {
	const styles = useStyles(colors);

	return (
		<View style={styles.card}>
			<Text style={styles.icon}>{icon}</Text>
			<Text style={styles.value}>{value}</Text>
			<Text style={styles.label}>{label}</Text>
		</View>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				card: {
					backgroundColor: colors.cardBackground,
					borderRadius: 16,
					padding: spacing.md,
					alignItems: "center",
					justifyContent: "center",
					shadowColor: colors.shadow,
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.08,
					shadowRadius: 4,
					elevation: 2,
					minWidth: 140,
				},
				icon: {
					fontSize: 28,
					marginBottom: spacing.sm,
				},
				value: {
					...typography.title2,
					color: colors.textPrimary,
					marginBottom: spacing.xs,
				},
				label: {
					...typography.footnote,
					color: colors.textSecondary,
					textAlign: "center",
				},
			}),
		[colors]
	);
}
