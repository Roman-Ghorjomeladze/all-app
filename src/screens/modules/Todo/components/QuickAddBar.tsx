import React, { useMemo, useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";

type Props = {
	onAdd: (title: string) => void;
};

export default function QuickAddBar({ onAdd }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const [text, setText] = useState("");

	const handleSubmit = () => {
		const trimmed = text.trim();
		if (!trimmed) return;
		onAdd(trimmed);
		setText("");
	};

	return (
		<View style={styles.container}>
			<View style={styles.inputRow}>
				<Ionicons name="add-circle-outline" size={22} color={colors.accent} style={styles.icon} />
				<TextInput
					style={styles.input}
					value={text}
					onChangeText={setText}
					placeholder={t("tdQuickAddPlaceholder")}
					placeholderTextColor={colors.textSecondary}
					returnKeyType="done"
					onSubmitEditing={handleSubmit}
					blurOnSubmit={false}
				/>
				{text.trim().length > 0 && (
					<TouchableOpacity onPress={handleSubmit} activeOpacity={0.7} style={styles.sendBtn}>
						<Ionicons name="arrow-up-circle" size={28} color={colors.accent} />
					</TouchableOpacity>
				)}
			</View>
		</View>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					paddingHorizontal: spacing.md,
					paddingVertical: spacing.sm,
					backgroundColor: colors.background,
					borderTopWidth: 0.5,
					borderTopColor: colors.border,
				},
				inputRow: {
					flexDirection: "row",
					alignItems: "center",
					backgroundColor: colors.cardBackground,
					borderRadius: 12,
					paddingHorizontal: 12,
					height: 44,
					borderWidth: 0.5,
					borderColor: colors.border,
				},
				icon: {
					marginRight: spacing.sm,
				},
				input: {
					flex: 1,
					...typography.body,
					color: colors.textPrimary,
					paddingVertical: 0,
				},
				sendBtn: {
					marginLeft: spacing.xs,
				},
			}),
		[colors]
	);
}
