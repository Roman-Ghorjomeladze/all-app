import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";

type ExerciseRowItem = {
	exercise_name: string | null;
	exercise_icon: string | null;
	duration_seconds: number;
	exercise_youtube_url: string | null;
};

type ExerciseRowProps = {
	item: ExerciseRowItem;
	index: number;
	onDurationChange: (index: number, seconds: number) => void;
	onRemove: (index: number) => void;
	onMoveUp: (index: number) => void;
	onMoveDown: (index: number) => void;
	onYouTubePress: (url: string) => void;
	colors: Colors;
	isFirst: boolean;
	isLast: boolean;
};

export default function ExerciseRow({
	item,
	index,
	onDurationChange,
	onRemove,
	onMoveUp,
	onMoveDown,
	onYouTubePress,
	colors,
	isFirst,
	isLast,
}: ExerciseRowProps) {
	const styles = useStyles(colors);
	const { t } = useLanguage();

	return (
		<View style={styles.container}>
			<View style={styles.leftSection}>
				<Text style={styles.icon}>{item.exercise_icon || "\uD83C\uDFCB\uFE0F"}</Text>
				<View style={styles.info}>
					<Text style={styles.name} numberOfLines={1}>
						{item.exercise_name || t("fitExercise")}
					</Text>
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
			</View>
			<View style={styles.actions}>
				{item.exercise_youtube_url ? (
					<TouchableOpacity
						onPress={() => onYouTubePress(item.exercise_youtube_url!)}
						activeOpacity={0.7}
						hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
					>
						<Ionicons name="logo-youtube" size={20} color={colors.danger} />
					</TouchableOpacity>
				) : null}
				<TouchableOpacity
					onPress={() => onMoveUp(index)}
					activeOpacity={0.7}
					disabled={isFirst}
					hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
				>
					<Ionicons
						name="chevron-up"
						size={20}
						color={isFirst ? colors.border : colors.textSecondary}
					/>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => onMoveDown(index)}
					activeOpacity={0.7}
					disabled={isLast}
					hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
				>
					<Ionicons
						name="chevron-down"
						size={20}
						color={isLast ? colors.border : colors.textSecondary}
					/>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => onRemove(index)}
					activeOpacity={0.7}
					hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
				>
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
					justifyContent: "space-between",
					backgroundColor: colors.cardBackground,
					borderRadius: 12,
					padding: spacing.sm,
					marginBottom: spacing.sm,
					borderWidth: 0.5,
					borderColor: colors.border,
				},
				leftSection: {
					flexDirection: "row",
					alignItems: "center",
					flex: 1,
				},
				icon: {
					fontSize: 24,
					marginRight: spacing.sm,
				},
				info: {
					flex: 1,
				},
				name: {
					...typography.callout,
					color: colors.textPrimary,
					marginBottom: 2,
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
				actions: {
					flexDirection: "row",
					alignItems: "center",
					gap: spacing.sm,
				},
			}),
		[colors]
	);
}
