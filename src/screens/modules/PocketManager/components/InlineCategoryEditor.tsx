import React, { useState, useMemo } from "react";
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, spacing, typography, CATEGORY_EMOJIS } from "../theme";

type InlineCategoryEditorProps = {
	icon: string;
	name: string;
	color: string;
	onChangeName: (name: string) => void;
	onChangeIcon?: (icon: string) => void;
	onDelete: () => void;
	colors: Colors;
	placeholder?: string;
};

export default function InlineCategoryEditor({
	icon,
	name,
	color,
	onChangeName,
	onChangeIcon,
	onDelete,
	colors,
	placeholder = "Category name...",
}: InlineCategoryEditorProps) {
	const styles = useStyles(colors);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);

	return (
		<View style={styles.wrapper}>
			<View style={styles.row}>
				<TouchableOpacity
					onPress={() => {
						if (onChangeIcon) setShowEmojiPicker(!showEmojiPicker);
					}}
					activeOpacity={onChangeIcon ? 0.7 : 1}
				>
					<Text style={styles.icon}>{icon}</Text>
				</TouchableOpacity>
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
			{showEmojiPicker && onChangeIcon && (
				<View style={styles.emojiGrid}>
					{CATEGORY_EMOJIS.map((emoji, idx) => (
						<TouchableOpacity
							key={idx}
							style={[styles.emojiCell, emoji === icon && styles.emojiCellActive]}
							onPress={() => {
								onChangeIcon(emoji);
								setShowEmojiPicker(false);
							}}
							activeOpacity={0.7}
						>
							<Text style={styles.emojiText}>{emoji}</Text>
						</TouchableOpacity>
					))}
				</View>
			)}
		</View>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				wrapper: {
					marginBottom: spacing.sm,
				},
				row: {
					flexDirection: "row",
					alignItems: "center",
					backgroundColor: colors.cardBackground,
					borderRadius: 10,
					paddingHorizontal: spacing.sm,
					paddingVertical: spacing.sm,
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
				emojiGrid: {
					flexDirection: "row",
					flexWrap: "wrap",
					backgroundColor: colors.cardBackground,
					borderRadius: 10,
					borderWidth: 1,
					borderColor: colors.border,
					padding: spacing.xs,
					marginTop: spacing.xs,
				},
				emojiCell: {
					width: "16.66%",
					aspectRatio: 1,
					justifyContent: "center",
					alignItems: "center",
					borderRadius: 8,
				},
				emojiCellActive: {
					backgroundColor: colors.accent + "25",
				},
				emojiText: {
					fontSize: 22,
				},
			}),
		[colors]
	);
}
