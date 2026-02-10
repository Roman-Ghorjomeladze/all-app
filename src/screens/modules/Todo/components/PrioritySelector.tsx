import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Priority } from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";

const PRIORITIES: Priority[] = ["none", "low", "medium", "high"];

const PRIORITY_I18N: Record<Priority, string> = {
	none: "tdPriorityNone",
	low: "tdPriorityLow",
	medium: "tdPriorityMedium",
	high: "tdPriorityHigh",
};

const PRIORITY_COLOR_KEY: Record<Priority, keyof Colors> = {
	none: "priorityNone",
	low: "priorityLow",
	medium: "priorityMedium",
	high: "priorityHigh",
};

type Props = {
	value: Priority;
	onChange: (priority: Priority) => void;
};

export default function PrioritySelector({ value, onChange }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	return (
		<View style={styles.container}>
			{PRIORITIES.map((p) => {
				const isSelected = p === value;
				const pColor = colors[PRIORITY_COLOR_KEY[p]];
				return (
					<TouchableOpacity
						key={p}
						style={[
							styles.chip,
							isSelected && { backgroundColor: pColor + "25", borderColor: pColor },
						]}
						onPress={() => onChange(p)}
						activeOpacity={0.7}
					>
						{p !== "none" && (
							<View style={[styles.dot, { backgroundColor: pColor }]} />
						)}
						<Text
							style={[
								styles.label,
								isSelected && { color: pColor, fontWeight: "600" },
							]}
						>
							{t(PRIORITY_I18N[p])}
						</Text>
					</TouchableOpacity>
				);
			})}
		</View>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					flexDirection: "row",
					flexWrap: "wrap",
					gap: 6,
				},
				chip: {
					flexDirection: "row",
					alignItems: "center",
					paddingHorizontal: 12,
					paddingVertical: 8,
					borderRadius: 16,
					backgroundColor: colors.chipBackground,
					borderWidth: 1,
					borderColor: "transparent",
				},
				dot: {
					width: 8,
					height: 8,
					borderRadius: 4,
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
