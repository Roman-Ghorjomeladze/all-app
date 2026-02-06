import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Card } from "../database";
import { useColors, Colors, spacing } from "../theme";
import MasteryStars from "./MasteryStars";

type Props = {
	card: Card;
	onPress: () => void;
	onLongPress?: () => void;
};

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		container: {
			flexDirection: "row",
			alignItems: "center",
			backgroundColor: colors.cardBackground,
			padding: spacing.md,
			borderRadius: 14,
			marginBottom: spacing.sm,
			borderWidth: 1,
			borderColor: colors.border,
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.06,
			shadowRadius: 4,
			elevation: 2,
		},
		textContainer: {
			flex: 1,
		},
		frontText: {
			fontSize: 16,
			fontWeight: "600",
			color: colors.textPrimary,
			marginBottom: 2,
		},
		backText: {
			fontSize: 14,
			color: colors.textSecondary,
		},
		rightContainer: {
			marginLeft: spacing.sm,
		},
	}), [colors]);
}

export default function CardListItem({ card, onPress, onLongPress }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<TouchableOpacity
			style={styles.container}
			onPress={onPress}
			onLongPress={onLongPress}
			activeOpacity={0.7}
		>
			<View style={styles.textContainer}>
				<Text style={styles.frontText} numberOfLines={1}>
					{card.front_text}
				</Text>
				<Text style={styles.backText} numberOfLines={1}>
					{card.back_text}
				</Text>
			</View>
			<View style={styles.rightContainer}>
				<MasteryStars level={card.mastery} size={12} />
			</View>
		</TouchableOpacity>
	);
}
