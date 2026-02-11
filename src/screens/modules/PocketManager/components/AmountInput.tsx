import React, { useMemo } from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";
import { Colors, spacing, typography } from "../theme";

type AmountInputProps = {
	value: string;
	onChangeText: (text: string) => void;
	colors: Colors;
	currency?: string;
	placeholder?: string;
};

export default function AmountInput({ value, onChangeText, colors, currency = "\u{20BE}", placeholder = "0.00" }: AmountInputProps) {
	const styles = useStyles(colors);

	const handleChange = (text: string) => {
		// Allow only numbers and one decimal point
		const cleaned = text.replace(/[^0-9.]/g, "");
		const parts = cleaned.split(".");
		if (parts.length > 2) return;
		if (parts[1] && parts[1].length > 2) return;
		onChangeText(cleaned);
	};

	return (
		<View style={styles.container}>
			<Text style={styles.currency}>{currency}</Text>
			<TextInput
				style={styles.input}
				value={value}
				onChangeText={handleChange}
				placeholder={placeholder}
				placeholderTextColor={colors.textSecondary}
				keyboardType="decimal-pad"
				returnKeyType="done"
			/>
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
					borderRadius: 12,
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.md,
					borderWidth: 1,
					borderColor: colors.border,
				},
				currency: {
					fontSize: 28,
					fontWeight: "700",
					color: colors.accent,
					marginRight: spacing.sm,
				},
				input: {
					flex: 1,
					fontSize: 28,
					fontWeight: "700",
					color: colors.textPrimary,
					padding: 0,
				},
			}),
		[colors]
	);
}
