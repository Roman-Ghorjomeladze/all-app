import React, { useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";

type ReadOnlyProps = {
	mode: "read";
	stepNumber: number;
	instruction: string;
	colors: Colors;
};

type EditProps = {
	mode: "edit";
	stepNumber: number;
	instruction: string;
	onChange: (instruction: string) => void;
	onRemove: () => void;
	colors: Colors;
};

type Props = ReadOnlyProps | EditProps;

export default function StepRow(props: Props) {
	const { colors, stepNumber } = props;
	const styles = useStyles(colors);
	const { t } = useLanguage();

	if (props.mode === "read") {
		return (
			<View style={styles.readContainer}>
				<View style={styles.numberBadge}>
					<Text style={styles.numberText}>{stepNumber}</Text>
				</View>
				<Text style={styles.instruction}>{props.instruction}</Text>
			</View>
		);
	}

	return (
		<View style={styles.editContainer}>
			<View style={styles.numberBadge}>
				<Text style={styles.numberText}>{stepNumber}</Text>
			</View>
			<TextInput
				style={styles.editInput}
				value={props.instruction}
				onChangeText={props.onChange}
				placeholder={`${t("mpStep")} ${stepNumber}`}
				placeholderTextColor={colors.textSecondary}
				multiline
			/>
			<TouchableOpacity onPress={props.onRemove} activeOpacity={0.7} style={styles.removeButton}>
				<Ionicons name="close-circle" size={22} color={colors.danger} />
			</TouchableOpacity>
		</View>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				readContainer: {
					flexDirection: "row",
					gap: spacing.md,
					paddingVertical: spacing.sm,
				},
				numberBadge: {
					width: 28,
					height: 28,
					borderRadius: 14,
					backgroundColor: colors.accent,
					justifyContent: "center",
					alignItems: "center",
				},
				numberText: {
					...typography.subhead,
					color: colors.white,
					fontWeight: "700",
				},
				instruction: {
					...typography.body,
					color: colors.textPrimary,
					flex: 1,
					lineHeight: 24,
				},
				editContainer: {
					flexDirection: "row",
					gap: spacing.sm,
					alignItems: "flex-start",
					marginBottom: spacing.sm,
				},
				editInput: {
					flex: 1,
					...typography.subhead,
					color: colors.textPrimary,
					backgroundColor: colors.inputBackground,
					borderRadius: 8,
					paddingHorizontal: spacing.sm,
					paddingVertical: 8,
					borderWidth: 1,
					borderColor: colors.border,
					minHeight: 40,
				},
				removeButton: {
					padding: 2,
					marginTop: 4,
				},
			}),
		[colors]
	);
}
