import React, { useMemo } from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { SmartFilter } from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";

const FILTERS: SmartFilter[] = ["all", "today", "upcoming", "overdue", "completed", "no_date"];

const FILTER_I18N: Record<SmartFilter, string> = {
	all: "tdAll",
	today: "tdToday",
	upcoming: "tdUpcoming",
	overdue: "tdOverdue",
	completed: "tdCompleted",
	no_date: "tdNoDate",
};

type Props = {
	active: SmartFilter;
	counts: Record<SmartFilter, number>;
	onChange: (filter: SmartFilter) => void;
};

export default function SmartFilterBar({ active, counts, onChange }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			style={{ flexGrow: 0 }}
			contentContainerStyle={styles.container}
		>
			{FILTERS.map((filter) => {
				const isActive = filter === active;
				const count = counts[filter];
				return (
					<TouchableOpacity
						key={filter}
						style={[styles.chip, isActive && styles.chipActive]}
						onPress={() => onChange(filter)}
						activeOpacity={0.7}
					>
						<Text style={[styles.label, isActive && styles.labelActive]}>
							{t(FILTER_I18N[filter])}
						</Text>
						{count > 0 && (
							<Text style={[styles.badge, isActive && styles.badgeActive]}>
								{count}
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
					paddingHorizontal: spacing.md,
					paddingVertical: spacing.sm,
				},
				chip: {
					flexDirection: "row",
					alignItems: "center",
					paddingHorizontal: 12,
					paddingVertical: 6,
					minHeight: 34,
					borderRadius: 17,
					backgroundColor: colors.chipBackground,
					marginRight: 6,
				},
				chipActive: {
					backgroundColor: colors.accent + "25",
				},
				label: {
					...typography.footnote,
					color: colors.textSecondary,
				},
				labelActive: {
					color: colors.accent,
					fontWeight: "600",
				},
				badge: {
					...typography.caption2,
					color: colors.textSecondary,
					marginLeft: 4,
					backgroundColor: colors.border,
					paddingHorizontal: 5,
					paddingVertical: 1,
					borderRadius: 8,
					overflow: "hidden",
				},
				badgeActive: {
					color: colors.accent,
					backgroundColor: colors.accent + "20",
				},
			}),
		[colors]
	);
}
