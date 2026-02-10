import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Subtask } from "../database";
import { useColors, Colors, spacing, typography } from "../theme";

type Props = {
	subtask: Subtask;
	onToggle: (id: number, completed: boolean) => void;
	onDelete: (id: number) => void;
};

export default function SubtaskItem({ subtask, onToggle, onDelete }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const isDone = subtask.is_completed === 1;

	return (
		<View style={styles.container}>
			<TouchableOpacity
				onPress={() => onToggle(subtask.id, !isDone)}
				activeOpacity={0.7}
				style={styles.checkbox}
			>
				<Ionicons
					name={isDone ? "checkbox" : "square-outline"}
					size={20}
					color={isDone ? colors.checkboxFilled : colors.checkboxBorder}
				/>
			</TouchableOpacity>
			<Text
				style={[
					styles.title,
					isDone && styles.titleDone,
				]}
				numberOfLines={1}
			>
				{subtask.title}
			</Text>
			<TouchableOpacity onPress={() => onDelete(subtask.id)} activeOpacity={0.7} style={styles.deleteBtn}>
				<Ionicons name="close-circle-outline" size={18} color={colors.textSecondary} />
			</TouchableOpacity>
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
					paddingVertical: 6,
				},
				checkbox: {
					marginRight: spacing.sm,
				},
				title: {
					...typography.body,
					color: colors.textPrimary,
					flex: 1,
				},
				titleDone: {
					textDecorationLine: "line-through",
					color: colors.completed,
				},
				deleteBtn: {
					padding: 4,
					marginLeft: spacing.xs,
				},
			}),
		[colors]
	);
}
