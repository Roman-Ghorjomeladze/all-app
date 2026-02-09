import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { EventType } from "../database";
import { useColors, Colors, spacing, typography } from "../theme";

type Props = {
	selected: EventType;
	onSelect: (type: EventType) => void;
};

const EVENT_TYPES: { type: EventType; emoji: string; label: string }[] = [
	{ type: "birthday", emoji: "\u{1F382}", label: "Birthday" },
	{ type: "anniversary", emoji: "\u{1F48D}", label: "Anniversary" },
	{ type: "reminder", emoji: "\u{1F514}", label: "Reminder" },
	{ type: "other", emoji: "\u{1F4CC}", label: "Other" },
];

export default function EventTypeSelector({ selected, onSelect }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
			{EVENT_TYPES.map(({ type, emoji, label }) => {
				const isSelected = type === selected;
				const typeColor = colors[type as keyof Colors] as string || colors.accent;
				return (
					<TouchableOpacity
						key={type}
						style={[
							styles.chip,
							isSelected && { backgroundColor: typeColor + "25", borderColor: typeColor },
						]}
						onPress={() => onSelect(type)}
						activeOpacity={0.7}
					>
						<Text style={styles.emoji}>{emoji}</Text>
						<Text style={[styles.label, isSelected && { color: typeColor, fontWeight: "600" }]}>
							{label}
						</Text>
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
					paddingVertical: spacing.sm,
				},
				chip: {
					flexDirection: "row",
					alignItems: "center",
					paddingHorizontal: spacing.md,
					paddingVertical: spacing.sm,
					borderRadius: 20,
					backgroundColor: colors.chipBackground,
					borderWidth: 1.5,
					borderColor: "transparent",
					marginRight: spacing.sm,
				},
				emoji: {
					fontSize: 18,
					marginRight: spacing.xs,
				},
				label: {
					...typography.subhead,
					color: colors.textSecondary,
				},
			}),
		[colors]
	);
}
