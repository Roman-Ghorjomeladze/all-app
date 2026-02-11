import React, { useMemo } from "react";
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, spacing, typography } from "../theme";

type InlineCategoryEditorProps = {
	icon: string;
	name: string;
	color: string;
	onChangeName: (name: string) => void;
	onDelete: () => void;
	colors: Colors;
	placeholder?: string;
};

export default function InlineCategoryEditor({
	icon,
	name,
	color,
	onChangeName,
	onDelete,
	colors,
	placeholder = "Category name...",
}: InlineCategoryEditorProps) {
	const styles = useStyles(colors);

	return (
		<View style={styles.row}>
			<Text style={styles.icon}>{icon}</Text>
			<View style={[styles.colorDot, { backgroundColor: color }]} />
			<TextInput
				style={styles.input}
				value={name}
				onChangeText={onChangeName}
				placeholder={placeholder}
				placeholderTextColor={colors.textSecondary}
			/>
			<TouchableOpacity onPress={onDelete} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
				<Ionicons name="close-circle" size={20} color={colors.danger} />
			</TouchableOpacity>
		</View>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				row: {
					flexDirection: "row",
					alignItems: "center",
					backgroundColor: colors.cardBackground,
					borderRadius: 10,
					paddingHorizontal: spacing.sm,
					paddingVertical: spacing.sm,
					marginBottom: spacing.sm,
					borderWidth: 1,
					borderColor: colors.border,
				},
				icon: {
					fontSize: 20,
					marginRight: spacing.sm,
				},
				colorDot: {
					width: 12,
					height: 12,
					borderRadius: 6,
					marginRight: spacing.sm,
				},
				input: {
					flex: 1,
					...typography.body,
					color: colors.textPrimary,
					padding: 0,
					paddingVertical: spacing.xs,
				},
			}),
		[colors]
	);
}
