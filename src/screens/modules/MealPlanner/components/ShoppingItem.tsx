import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ShoppingItem as ShoppingItemType } from "../database";
import { Colors, spacing, typography } from "../theme";

type Props = {
	item: ShoppingItemType;
	onToggle: (id: number, checked: boolean) => void;
	onDelete: (id: number) => void;
	colors: Colors;
};

export default function ShoppingItemRow({ item, onToggle, onDelete, colors }: Props) {
	const styles = useStyles(colors);
	const isChecked = item.is_checked === 1;

	return (
		<View style={styles.container}>
			<TouchableOpacity
				onPress={() => onToggle(item.id, !isChecked)}
				activeOpacity={0.7}
				style={styles.checkbox}
			>
				<Ionicons
					name={isChecked ? "checkbox" : "square-outline"}
					size={22}
					color={isChecked ? colors.checked : colors.textSecondary}
				/>
			</TouchableOpacity>
			<View style={styles.info}>
				<Text style={[styles.name, isChecked && styles.nameChecked]} numberOfLines={1}>
					{item.name}
				</Text>
				{(item.quantity || item.recipe_name) && (
					<Text style={styles.detail}>
						{item.quantity && `${item.quantity}`}
						{item.quantity && item.unit && ` ${item.unit}`}
						{item.recipe_name && ` • ${item.recipe_name}`}
					</Text>
				)}
			</View>
			<TouchableOpacity onPress={() => onDelete(item.id)} activeOpacity={0.7} style={styles.deleteButton}>
				<Ionicons name="trash-outline" size={18} color={colors.danger} />
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
					backgroundColor: colors.cardBackground,
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.md,
					borderBottomWidth: 0.5,
					borderBottomColor: colors.border,
				},
				checkbox: {
					marginRight: spacing.sm,
				},
				info: {
					flex: 1,
				},
				name: {
					...typography.body,
					color: colors.textPrimary,
				},
				nameChecked: {
					textDecorationLine: "line-through",
					color: colors.textSecondary,
				},
				detail: {
					...typography.caption1,
					color: colors.textSecondary,
					marginTop: 2,
				},
				deleteButton: {
					padding: spacing.xs,
				},
			}),
		[colors]
	);
}
