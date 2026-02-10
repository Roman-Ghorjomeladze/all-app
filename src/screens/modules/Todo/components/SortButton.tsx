import React, { useMemo } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SortMode } from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";

const SORT_CYCLE: SortMode[] = ["due_date", "priority", "created", "alpha"];

const SORT_I18N: Record<SortMode, string> = {
	due_date: "tdSortDueDate",
	priority: "tdSortPriority",
	created: "tdSortCreated",
	alpha: "tdSortAlpha",
};

type Props = {
	current: SortMode;
	onChange: (sort: SortMode) => void;
};

export default function SortButton({ current, onChange }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const handlePress = () => {
		const idx = SORT_CYCLE.indexOf(current);
		const next = SORT_CYCLE[(idx + 1) % SORT_CYCLE.length];
		onChange(next);
	};

	return (
		<TouchableOpacity style={styles.button} onPress={handlePress} activeOpacity={0.7}>
			<Ionicons name="swap-vertical" size={14} color={colors.textSecondary} />
			<Text style={styles.label}>{t(SORT_I18N[current])}</Text>
		</TouchableOpacity>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				button: {
					flexDirection: "row",
					alignItems: "center",
					paddingHorizontal: 10,
					paddingVertical: 5,
					borderRadius: 12,
					backgroundColor: colors.chipBackground,
					alignSelf: "flex-end",
					marginRight: spacing.md,
					marginBottom: spacing.xs,
					gap: 4,
				},
				label: {
					...typography.caption1,
					color: colors.textSecondary,
				},
			}),
		[colors]
	);
}
