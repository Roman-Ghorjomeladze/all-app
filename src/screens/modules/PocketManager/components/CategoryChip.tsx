import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, spacing, typography } from "../theme";

type CategoryChipProps = {
	icon: string;
	name: string;
	color: string;
	amount?: number;
	selected?: boolean;
	onPress?: () => void;
	colors: Colors;
};

export default function CategoryChip({ icon, name, color, amount, selected, onPress, colors }: CategoryChipProps) {
	const styles = useStyles(colors, color, selected);

	const content = (
		<View style={styles.chip}>
			<Text style={styles.icon}>{icon}</Text>
			<Text style={styles.name} numberOfLines={1}>{name}</Text>
			{amount !== undefined && (
				<Text style={styles.amount}>{amount.toFixed(2)}</Text>
			)}
		</View>
	);

	if (onPress) {
		return (
			<TouchableOpacity onPress={onPress} activeOpacity={0.7}>
				{content}
			</TouchableOpacity>
		);
	}

	return content;
}

function useStyles(colors: Colors, color: string, selected?: boolean) {
	return useMemo(
		() =>
			StyleSheet.create({
				chip: {
					flexDirection: "row",
					alignItems: "center",
					paddingHorizontal: spacing.md,
					paddingVertical: spacing.sm,
					borderRadius: 20,
					backgroundColor: selected ? color + "25" : colors.chipBackground,
					borderWidth: 1.5,
					borderColor: selected ? color : "transparent",
					marginRight: spacing.sm,
					marginBottom: spacing.sm,
				},
				icon: {
					fontSize: 16,
					marginRight: spacing.xs,
				},
				name: {
					...typography.subhead,
					color: selected ? color : colors.textPrimary,
					fontWeight: selected ? "600" : "400",
					maxWidth: 100,
				},
				amount: {
					...typography.caption1,
					color: colors.textSecondary,
					marginLeft: spacing.xs,
				},
			}),
		[colors, color, selected]
	);
}
