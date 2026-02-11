import React, { useMemo, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Colors, spacing, typography } from "../theme";
import { SOUND_NAMES, playSound } from "../sounds";
import { useLanguage } from "../../../../i18n";

type SoundPickerProps = {
	selectedIndex: number;
	onSelect: (index: number) => void;
	colors: Colors;
};

export default function SoundPicker({ selectedIndex, onSelect, colors }: SoundPickerProps) {
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const handlePress = useCallback(
		(index: number) => {
			onSelect(index);
			playSound(index);
		},
		[onSelect]
	);

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.scrollContent}
		>
			{SOUND_NAMES.map((name, index) => {
				const isSelected = index === selectedIndex;
				return (
					<TouchableOpacity
						key={index}
						style={styles.itemContainer}
						onPress={() => handlePress(index)}
						activeOpacity={0.7}
					>
						<View
							style={[
								styles.circle,
								isSelected && { borderColor: colors.accent, borderWidth: 3 },
							]}
						>
							<Text style={[styles.circleText, isSelected && { color: colors.accent }]}>
								{index + 1}
							</Text>
						</View>
						<Text
							style={[styles.label, isSelected && { color: colors.accent }]}
							numberOfLines={1}
						>
							{name}
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
				scrollContent: {
					paddingHorizontal: spacing.md,
					paddingVertical: spacing.sm,
				},
				itemContainer: {
					alignItems: "center",
					marginRight: spacing.md,
					width: 64,
				},
				circle: {
					width: 44,
					height: 44,
					borderRadius: 22,
					backgroundColor: colors.chipBackground,
					borderWidth: 2,
					borderColor: colors.border,
					justifyContent: "center",
					alignItems: "center",
					marginBottom: spacing.xs,
				},
				circleText: {
					...typography.headline,
					color: colors.textPrimary,
				},
				label: {
					...typography.caption2,
					color: colors.textSecondary,
					textAlign: "center",
				},
			}),
		[colors]
	);
}
